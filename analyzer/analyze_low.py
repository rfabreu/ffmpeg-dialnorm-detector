"""

Process all low-profile streams in batches of 10.
"""
import os, re, time, threading, subprocess, requests, argparse
from datetime import datetime
from utils import load_stream_urls, chunk_list

# Config
API_ENDPOINT = os.getenv("API_ENDPOINT")
API_TOKEN    = os.getenv("API_TOKEN")
DURATION     = 60      # seconds per stream measurement
BATCH_SIZE   = 10      # number of concurrent streams

def measure_loudness(url):
    cmd = [
        "ffmpeg", "-hide_banner", "-y",
        "-i", url,
        "-filter_complex", "ebur128=peak=true:video=0:meter=9",
        "-f", "null", "-"
    ]
    proc = subprocess.Popen(cmd, stderr=subprocess.PIPE, text=True)
    pattern = re.compile(r"M:\s*([-0-9\.]+)")
    values, start = [], time.time()
    while True:
        line = proc.stderr.readline()
        if not line or time.time() - start > DURATION:
            proc.terminate()
            break
        m = pattern.search(line)
        if m:
            values.append(float(m.group(1)))
    if not values:
        return None
    mn, mx = min(values), max(values)
    avg = sum(values) / len(values)
    status = ("low" if avg < -23.0 else
              "loud" if avg > -22.0 else
              "acceptable")
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "min_db": mn, "max_db": mx, "avg_db": avg, "status": status
    }

def send_result(stream_id, result):
    if not result:
        return
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {"stream_id": stream_id, **result}
    resp = requests.post(API_ENDPOINT, json=payload, headers=headers)
    resp.raise_for_status()

def worker(sid, url):
    res = measure_loudness(url)
    send_result(sid, res)

def main():
    p = argparse.ArgumentParser(description="Low-profile loudness analyzer")
    p.add_argument("--csv", required=False,
                   help="Path to CSV file containing streams")
    args = p.parse_args()
    csv_path = args.csv or input("CSV path: ").strip()

    urls = load_stream_urls(csv_path, col_index=2)
    sid = 1
    for batch in chunk_list(urls, BATCH_SIZE):
        threads = []
        for url in batch:
            t = threading.Thread(target=worker, args=(sid, url))
            t.start(); threads.append(t)
            sid += 1
        for t in threads:
            t.join()

if __name__ == "__main__":
    main()