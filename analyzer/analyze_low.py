#!/usr/bin/env python3
"""
analyze_low.py
  Read both low and high profile columns from CSV, process in parallel batches of 10,
  60 s each (with a hard timeout), then move to the next batch.
"""
import os
import re
import sys
import subprocess
import argparse
import csv
import requests

from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed

# ─── Load .env ───────────────────────────────────────────────────────────────
dotenv_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path)
API_ENDPOINT = os.getenv("API_ENDPOINT")
API_TOKEN    = os.getenv("API_TOKEN")
if not API_ENDPOINT or not API_TOKEN:
    sys.exit(f"[Error] Missing API_ENDPOINT or API_TOKEN in {dotenv_path}")

# ─── Constants ───────────────────────────────────────────────────────────────
DURATION    = 60                          # hard timeout in seconds
BATCH_SIZE  = 10
FIFO_OPTS   = "?fifo_size=50000000&overrun_nonfatal=1"
IPPORT_RE   = re.compile(r"^\d+\.\d+\.\d+\.\d+:\d+$")

# ─── CSV Loader ───────────────────────────────────────────────────────────────
def load_rows(csv_path):
    rows = []
    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            # Process low profile
            low_ip = r.get("Lowest Profile MCAST", "").strip()
            if low_ip:
                url = low_ip if low_ip.startswith("udp://") else f"udp://{low_ip}"
                if "?" not in url:
                    url += FIFO_OPTS
                rows.append({
                    "name":      r.get("Channel Name", "").strip(),
                    "node":      r.get("NODE", "").strip(),
                    "profile":   "low",
                    "mcast_url": url
                })
            
            # Process high profile
            high_ip = r.get("Highest Profile MCAST", "").strip()
            if high_ip:
                url = high_ip if high_ip.startswith("udp://") else f"udp://{high_ip}"
                if "?" not in url:
                    url += FIFO_OPTS
                rows.append({
                    "name":      r.get("Channel Name", "").strip(),
                    "node":      r.get("NODE", "").strip(),
                    "profile":   "high",
                    "mcast_url": url
                })
    
    if not rows:
        sys.exit("[Error] No valid multicast IPs found in CSV.")
    return rows

# ─── Measure & Send ──────────────────────────────────────────────────────────
METER_RE = re.compile(r"M:\s*([-0-9\.]+)")

def measure_and_send(row):
    cmd = [
        "ffmpeg", "-hide_banner", "-y", "-i", row["mcast_url"],
        "-filter_complex", "ebur128=peak=true:video=0:meter=9",
        "-f", "null", "-"
    ]
    proc = subprocess.Popen(cmd, stderr=subprocess.PIPE, text=True)
    try:
        _, stderr = proc.communicate(timeout=DURATION)
    except subprocess.TimeoutExpired:
        proc.kill()
        _, stderr = proc.communicate()

    # parse all M: values
    vals = [float(m.group(1)) for m in METER_RE.finditer(stderr)]
    if not vals:
        return

    mn, mx = min(vals), max(vals)
    avg    = sum(vals) / len(vals)
    
    # Enhanced status classification based on EBU R128 standards
    if avg < -23.0:
        status = "too_low"
    elif avg > -18.0:
        status = "too_loud"
    else:
        status = "normal"

    payload = {
        **row,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "min_db":    mn,
        "max_db":    mx,
        "avg_db":    avg,
        "status":    status
    }

    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type":  "application/json"
    }
    resp = requests.post(API_ENDPOINT, json=payload, headers=headers)
    if not resp.ok:
        print(f"[Error] HTTP {resp.status_code} → {resp.text}")
    resp.raise_for_status()

# ─── Main ────────────────────────────────────────────────────────────────────
def main():
    p = argparse.ArgumentParser(description="Loudness analyzer for both low and high profiles")
    p.add_argument("--csv", required=True, help="Path to CSV file")
    args = p.parse_args()

    rows = load_rows(args.csv)
    total = len(rows)
    progress = tqdm(total=total, desc="Analyzing streams", unit="stream")

    with ThreadPoolExecutor(max_workers=BATCH_SIZE) as exe:
        for i in range(0, total, BATCH_SIZE):
            batch = rows[i : i + BATCH_SIZE]
            futures = [exe.submit(measure_and_send, r) for r in batch]
            for _ in as_completed(futures):
                progress.update(1)

    progress.close()

if __name__ == "__main__":
    main()
