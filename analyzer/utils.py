import csv
import sys

def load_stream_urls(csv_path, col_index):
    urls = []
    try:
        with open(csv_path, newline='') as f:
            reader = csv.reader(f)
            next(reader, None)  # skip header
            for row in reader:
                if len(row) <= col_index:
                    continue
                url = row[col_index].strip()
                if url.startswith("udp://"):
                    urls.append(url)
    except FileNotFoundError:
        sys.exit(f"[Error] CSV file not found: {csv_path}")
    if not urls:
        sys.exit(f"[Error] No valid URLs in column {col_index+1}")
    return urls

def chunk_list(lst, size):
    """Yield successive chunks of length `size`."""
    for i in range(0, len(lst), size):
        yield lst[i : i + size]