#!/usr/bin/env python3
"""
analyze_low.py
  Read Column C (low profile) from CSV, batch 10 at a time,
  send (name,node,profile,mcast_url + measurement) to submit.
"""
import os, re, sys, time, threading, subprocess, argparse, csv, requests
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

# --- load .env ---------------------------------------------------------------
dotenv_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path)
API_ENDPOINT = os.getenv("API_ENDPOINT")
API_TOKEN    = os.getenv("API_TOKEN")
if not API_ENDPOINT or not API_TOKEN:
    sys.exit(f"[Error] Missing API_ENDPOINT or API_TOKEN in {dotenv_path}")

# --- constants ---------------------------------------------------------------
DURATION   = 60
BATCH_SIZE = 10
FIFO_OPTS  = "?fifo_size=50000000&overrun_nonfatal=1"
IPPORT_RE  = re.compile(r"^\d+\.\d+\.\d+\.\d+:\d+$")

# --- CSV loader --------------------------------------------------------------
def load_rows(csv_path):
    rows = []
    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            ip = r.get('Lowest Profile MCAST','').strip()
            if not ip: continue
            url = ip if ip.startswith("udp://") else f"udp://{ip}"
            url = url if "?" in url else url + FIFO_OPTS
            rows.append({
                "name":     r.get('Channel Name','').strip(),
                "node":     r.get('NODE','').strip(),
                "profile":  "low",
                "mcast_url":url
            })
    if not rows:
        sys.exit("[Error] No low-profile rows found in CSV.")
    return rows

# --- measurement -------------------------------------------------------------
def measure(row):
    url = row["mcast_url"]
    cmd = [
        "ffmpeg","-hide_banner","-y","-i",url,
        "-filter_complex","ebur128=peak=true:video=0:meter=9","-f","null","-"
    ]
    proc = subprocess.Popen(cmd, stderr=subprocess.PIPE, text=True)
    meter = re.compile(r"M:\s*([-0-9\.]+)")
    vals, start = [], time.time()
    while True:
        line = proc.stderr.readline()
        if not line or time.time()-start > DURATION:
            proc.terminate(); break
        m = meter.search(line)
        if m: vals.append(float(m.group(1)))
    if not vals: return None
    mn, mx = min(vals), max(vals)
    avg = sum(vals)/len(vals)
    sts = "low" if avg < -23.0 else "loud" if avg > -22.0 else "acceptable"
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "min_db": mn, "max_db": mx, "avg_db": avg, "status": sts
    }

# --- sender -----------------------------------------------------------------
def send(payload):
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    r = requests.post(API_ENDPOINT, json=payload, headers=headers)
    if not r.ok:
        print(f"[Error] HTTP {r.status_code} → {r.text}")
    r.raise_for_status()

# --- worker & batching -------------------------------------------------------
def worker(batch):
    for row in batch:
        meas = measure(row)
        if meas:
            payload = { **row, **meas }
            send(payload)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--csv", required=True, help="path to CSV")
    args = p.parse_args()
    rows = load_rows(args.csv)
    # chunk into groups of 10
    for i in range(0, len(rows), BATCH_SIZE):
        t = threading.Thread(target=worker, args=(rows[i:i+BATCH_SIZE],))
        t.start(); t.join()

if __name__ == "__main__":
    main()
