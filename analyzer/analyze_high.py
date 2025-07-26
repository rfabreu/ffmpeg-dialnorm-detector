"""
Process all high-profile streams in batches of 5.
"""
import argparse, threading
from utils import load_stream_urls, chunk_list
from analyze_low import measure_loudness, send_result

BATCH_SIZE   = 5      # concurrent streams
START_ID     = 1      # IDs assigned in same order as CSV rows

def main():
    p = argparse.ArgumentParser(description="High-profile loudness analyzer")
    p.add_argument("--csv", required=False, help="Path to CSV file")
    args = p.parse_args()
    csv_path = args.csv or input("CSV path: ").strip()

    urls = load_stream_urls(csv_path, col_index=3)
    sid = 1
    for batch in chunk_list(urls, BATCH_SIZE):
        threads = []
        for url in batch:
            t = threading.Thread(target=lambda i,u: send_result(i, measure_loudness(u)),
                                 args=(sid, url))
            t.start(); threads.append(t)
            sid += 1
        for t in threads:
            t.join()

if __name__ == "__main__":
    main()