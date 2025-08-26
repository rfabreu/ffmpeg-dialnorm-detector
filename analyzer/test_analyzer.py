#!/usr/bin/env python3
"""
test_analyzer.py
  Test script to verify CSV loading and data processing without running FFmpeg
"""
import csv
import sys
from pathlib import Path

def test_csv_loading(csv_path):
    """Test CSV loading functionality"""
    print(f"Testing CSV loading from: {csv_path}")
    
    try:
        with open(csv_path, newline="") as f:
            reader = csv.DictReader(f)
            rows = []
            
            for r in reader:
                # Process low profile
                low_ip = r.get("Lowest Profile MCAST", "").strip()
                high_ip = r.get("Highest Profile MCAST", "").strip()
                
                if low_ip:
                    rows.append({
                        "name": r.get("Channel Name", "").strip(),
                        "node": r.get("NODE", "").strip(),
                        "profile": "low",
                        "mcast_url": low_ip
                    })
                
                if high_ip:
                    rows.append({
                        "name": r.get("Channel Name", "").strip(),
                        "node": r.get("NODE", "").strip(),
                        "profile": "high",
                        "mcast_url": high_ip
                    })
            
            print(f"✓ Successfully loaded {len(rows)} streams")
            print("\nSample data:")
            for i, row in enumerate(rows[:3]):  # Show first 3
                print(f"  {i+1}. {row['name']} ({row['profile']}) - {row['mcast_url']}")
            
            if len(rows) > 3:
                print(f"  ... and {len(rows) - 3} more streams")
                
            return True
            
    except FileNotFoundError:
        print(f"✗ Error: CSV file not found: {csv_path}")
        return False
    except Exception as e:
        print(f"✗ Error loading CSV: {e}")
        return False

def main():
    if len(sys.argv) != 2:
        print("Usage: python test_analyzer.py <csv_file>")
        print("Example: python test_analyzer.py channels.csv")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    if not Path(csv_path).exists():
        print(f"Error: File {csv_path} does not exist")
        sys.exit(1)
    
    success = test_csv_loading(csv_path)
    if success:
        print("\n✓ CSV loading test passed!")
    else:
        print("\n✗ CSV loading test failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()