"""
ingest_cards.py — Credit-card transaction ingester for opus-actio.

Reads every CSV in data/_local/raw/cards/, parses two formats:
  - Format A: Rakuten enavi{YYYYMM}(...).csv  (utf-8-sig)
  - Format B: SMCC {YYYYMM}.csv                (cp932)

Idempotent: DELETE FROM card_txn; then insert all rows.
Creates card_txn table from schema.sql if missing.

Run:
  PYTHONIOENCODING=utf-8 python data/ingest_cards.py
"""

import csv
import os
import re
import sqlite3
import sys

from categorize import categorize

# ---------------------------------------------------------------------------
# Paths (relative to project root, but script can be run from anywhere)
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = SCRIPT_DIR  # data/ lives next to this script's folder; SCRIPT_DIR IS data/
CARDS_DIR = os.path.join(SCRIPT_DIR, "_local", "raw", "cards")
DB_PATH = os.path.join(SCRIPT_DIR, "_local", "finance.db")
SCHEMA_PATH = os.path.join(SCRIPT_DIR, "schema.sql")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def parse_yyyymmdd_slash(s: str):
    """Convert 'YYYY/MM/DD' -> 'YYYY-MM-DD', or return None."""
    s = s.strip()
    m = re.match(r"(\d{4})/(\d{2})/(\d{2})", s)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    return None


def parse_jp_date(s: str):
    """Convert '2025年4月19日' -> '2025-04-19', or return None."""
    s = s.strip()
    m = re.match(r"(\d{4})年(\d{1,2})月(\d{1,2})日", s)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    return None


def parse_amount(s: str, source: str):
    """Strip commas/whitespace, return int or None. Logs bad values."""
    s = s.strip().replace(",", "").replace(" ", "").replace("　", "")
    if s == "" or s == "-":
        return None
    try:
        return int(s)
    except ValueError:
        print(f"  [WARN] Cannot parse amount {s!r} in {source}", file=sys.stderr)
        return None


def source_month_from_filename(filename: str):
    """Extract 6-digit YYYYMM from filename."""
    m = re.search(r"(\d{6})", filename)
    if m:
        return m.group(1)
    return "UNKNOWN"


def open_csv(path: str, encodings=("utf-8-sig", "cp932")):
    """Try encodings in order, return (file_handle, encoding_used)."""
    for enc in encodings:
        try:
            f = open(path, encoding=enc, newline="")
            # Try reading first line to validate encoding
            f.readline()
            f.seek(0)
            return f, enc
        except (UnicodeDecodeError, UnicodeError):
            try:
                f.close()
            except Exception:
                pass
    raise ValueError(f"Cannot decode {path} with encodings {encodings}")


# ---------------------------------------------------------------------------
# Format A — Rakuten enavi{YYYYMM}(...).csv
# ---------------------------------------------------------------------------
# Header: 利用日,利用店名・商品名,利用者,支払方法,利用金額,手数料/利息,支払総額,...
# - Data row: col0 non-empty -> transaction
# - FX annotation: col0 empty, col1 non-empty -> attach to previous txn as fx_note
# - Installment annotation: col0 empty, col1 starts with 'ご利用金額' -> also attach

def parse_rakuten(path: str, filename: str):
    """Parse Format A Rakuten CSV. Returns list of row dicts."""
    source_month = source_month_from_filename(filename)
    rows = []
    skipped = 0
    prev_txn = None  # index into rows of the last real transaction

    f, enc = open_csv(path, ("utf-8-sig", "cp932"))
    try:
        reader = csv.reader(f)
        for line_no, row in enumerate(reader):
            if line_no == 0:
                # Header row — skip
                continue

            # Pad row to at least 6 columns
            while len(row) < 6:
                row.append("")

            col0 = row[0].strip()
            col1 = row[1].strip() if len(row) > 1 else ""

            if col0:
                # Data row — has use_date
                use_date = parse_yyyymmdd_slash(col0)
                merchant = col1
                user = row[2].strip() if len(row) > 2 else ""
                pay_method = row[3].strip() if len(row) > 3 else ""
                amount_raw = row[4].strip() if len(row) > 4 else ""
                fee_raw = row[5].strip() if len(row) > 5 else ""

                # Amount: may be '-' for installment reference rows (amount tracked as fee/total)
                amount_jpy = parse_amount(amount_raw, filename)
                fee_jpy = parse_amount(fee_raw, filename)

                txn = {
                    "card": "rakuten-card",
                    "use_date": use_date,
                    "pay_date": None,
                    "merchant": merchant or None,
                    "user": user or None,
                    "pay_method": pay_method or None,
                    "amount_jpy": amount_jpy,
                    "fee_jpy": fee_jpy,
                    "fx_note": None,
                    "source_file": filename,
                    "source_month": source_month,
                }
                rows.append(txn)
                prev_txn = len(rows) - 1

            elif col1:
                # Annotation row (FX or installment detail) — attach to previous txn
                if prev_txn is not None:
                    # Append to fx_note (in case multiple annotations per txn)
                    existing = rows[prev_txn]["fx_note"]
                    if existing:
                        rows[prev_txn]["fx_note"] = existing + " / " + col1
                    else:
                        rows[prev_txn]["fx_note"] = col1
                else:
                    print(f"  [WARN] {filename} line {line_no+1}: annotation row with no preceding txn: {col1!r}", file=sys.stderr)
                    skipped += 1

            else:
                # Completely empty row — skip silently
                skipped += 1

    finally:
        f.close()

    if skipped:
        print(f"  [INFO] {filename}: {skipped} blank/annotation rows skipped")

    return rows


# ---------------------------------------------------------------------------
# Format B — SMCC {YYYYMM}.csv
# ---------------------------------------------------------------------------
# Header: 確定情報,お支払日,ご利用店名（...）,ご利用者,ご利用日,ご利用金額（円）,現地通貨額・通貨名称・換算レート
# Separator/section rows: contain ＊＊＊ or both pay_date and use_date empty
# Data rows: pay_date=col1, merchant=col2, user=col3, use_date=col4, amount=col5, fx_note=col6

def parse_smcc(path: str, filename: str):
    """Parse Format B SMCC CSV. Returns list of row dicts."""
    source_month = source_month_from_filename(filename)
    rows = []
    skipped = 0

    f, enc = open_csv(path, ("cp932", "utf-8-sig"))
    try:
        reader = csv.reader(f)
        for line_no, row in enumerate(reader):
            if line_no == 0:
                # Header row — skip
                continue

            # Pad to 7 columns
            while len(row) < 7:
                row.append("")

            raw_line = "".join(row)

            # Skip separator rows containing ＊＊＊
            if "＊＊＊" in raw_line or "***" in raw_line:
                skipped += 1
                continue

            col1 = row[1].strip()  # お支払日
            col4 = row[4].strip()  # ご利用日

            # Skip rows where both pay_date and use_date are empty (section headers etc.)
            if not col1 and not col4:
                skipped += 1
                continue

            pay_date = parse_jp_date(col1)
            use_date = parse_jp_date(col4)
            merchant = row[2].strip() or None
            user = row[3].strip() or None
            amount_raw = row[5].strip()
            fx_note_raw = row[6].strip() if len(row) > 6 else ""

            amount_jpy = parse_amount(amount_raw, filename)
            if amount_jpy is None:
                print(f"  [WARN] {filename} line {line_no+1}: skipping row with unparseable amount {amount_raw!r}", file=sys.stderr)
                skipped += 1
                continue

            txn = {
                "card": "smcc-card",
                "use_date": use_date,
                "pay_date": pay_date,
                "merchant": merchant,
                "user": user,
                "pay_method": None,
                "amount_jpy": amount_jpy,
                "fee_jpy": None,
                "fx_note": fx_note_raw or None,
                "source_file": filename,
                "source_month": source_month,
            }
            rows.append(txn)

    finally:
        f.close()

    if skipped:
        print(f"  [INFO] {filename}: {skipped} separator/blank rows skipped")

    return rows


# ---------------------------------------------------------------------------
# DB operations
# ---------------------------------------------------------------------------

def ensure_table(conn: sqlite3.Connection):
    """Create card_txn table if not exists, using schema.sql definition."""
    with open(SCHEMA_PATH, encoding="utf-8") as f:
        schema_sql = f.read()
    # Execute the full schema (all CREATE TABLE IF NOT EXISTS are safe to re-run)
    conn.executescript(schema_sql)
    columns = {row[1] for row in conn.execute("PRAGMA table_info(card_txn);")}
    if "category" not in columns:
        conn.execute("ALTER TABLE card_txn ADD COLUMN category TEXT;")
    conn.commit()


def ingest(conn: sqlite3.Connection, all_rows: list):
    """DELETE all card_txn rows, then bulk insert."""
    for row in all_rows:
        row["category"] = categorize(row.get("merchant") or "")

    conn.execute("DELETE FROM card_txn;")
    conn.executemany(
        """
        INSERT INTO card_txn
          (card, use_date, pay_date, merchant, user, pay_method,
           amount_jpy, fee_jpy, fx_note, category, source_file, source_month)
        VALUES
          (:card, :use_date, :pay_date, :merchant, :user, :pay_method,
           :amount_jpy, :fee_jpy, :fx_note, :category, :source_file, :source_month)
        """,
        all_rows,
    )
    conn.commit()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print(f"Cards dir : {CARDS_DIR}")
    print(f"DB        : {DB_PATH}")

    if not os.path.isdir(CARDS_DIR):
        print(f"ERROR: Cards directory not found: {CARDS_DIR}", file=sys.stderr)
        sys.exit(1)

    # Collect all CSV files
    csv_files = sorted(f for f in os.listdir(CARDS_DIR) if f.lower().endswith(".csv"))
    if not csv_files:
        print("ERROR: No CSV files found in cards directory.", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(csv_files)} CSV files\n")

    all_rows = []
    total_skipped = 0

    for filename in csv_files:
        path = os.path.join(CARDS_DIR, filename)
        try:
            if filename.startswith("enavi"):
                rows = parse_rakuten(path, filename)
            else:
                rows = parse_smcc(path, filename)
            print(f"  {filename}: {len(rows)} transactions parsed")
            all_rows.extend(rows)
        except Exception as e:
            print(f"  [ERROR] {filename}: {e}", file=sys.stderr)
            raise

    print(f"\nTotal transactions parsed: {len(all_rows)}")

    # Connect to DB and ingest
    conn = sqlite3.connect(DB_PATH)
    try:
        ensure_table(conn)
        ingest(conn, all_rows)

        # Verify
        cursor = conn.execute("SELECT COUNT(*) FROM card_txn;")
        total = cursor.fetchone()[0]
        print(f"\n--- card_txn row count: {total} ---\n")

        print("Per-card breakdown:")
        cursor = conn.execute(
            "SELECT card, COUNT(*) as n FROM card_txn GROUP BY card ORDER BY card;"
        )
        for row in cursor.fetchall():
            print(f"  {row[0]}: {row[1]} rows")

        print("\nMonthly spend per card:")
        cursor = conn.execute(
            """
            SELECT card, source_month, COUNT(*) as n, SUM(amount_jpy) as total
            FROM card_txn
            GROUP BY card, source_month
            ORDER BY card, source_month;
            """
        )
        print(f"  {'card':<16} {'month':<8} {'count':>6} {'sum_jpy':>12}")
        print(f"  {'-'*16} {'-'*8} {'-'*6} {'-'*12}")
        for row in cursor.fetchall():
            card, month, n, total_amt = row
            total_fmt = f"{total_amt:,}" if total_amt is not None else "NULL"
            print(f"  {card:<16} {month:<8} {n:>6} {total_fmt:>12}")

        print("\nCategory breakdown:")
        cursor = conn.execute(
            """
            SELECT category, COUNT(*) as n, SUM(amount_jpy) as total
            FROM card_txn
            GROUP BY category
            ORDER BY total DESC;
            """
        )
        print(f"  {'category':<16} {'count':>6} {'sum_jpy':>12}")
        print(f"  {'-'*16} {'-'*6} {'-'*12}")
        for category, n, total_amt in cursor.fetchall():
            total_fmt = f"{total_amt:,}" if total_amt is not None else "NULL"
            print(f"  {category:<16} {n:>6} {total_fmt:>12}")

        cursor = conn.execute(
            """
            SELECT
              COALESCE(SUM(CASE WHEN category = 'other' THEN amount_jpy ELSE 0 END), 0),
              COALESCE(SUM(amount_jpy), 0)
            FROM card_txn;
            """
        )
        other_total, grand_total = cursor.fetchone()
        other_pct = (other_total / grand_total * 100) if grand_total else 0
        print(f"\nOther amount ratio: {other_pct:.2f}%")

        print("\nOther merchants:")
        cursor = conn.execute(
            """
            SELECT merchant, COUNT(*) as n, SUM(amount_jpy) as total
            FROM card_txn
            WHERE category = 'other'
            GROUP BY merchant
            ORDER BY total DESC;
            """
        )
        print(f"  {'count':>6} {'sum_jpy':>12}  merchant")
        print(f"  {'-'*6} {'-'*12}  {'-'*40}")
        for merchant, n, total_amt in cursor.fetchall():
            total_fmt = f"{total_amt:,}" if total_amt is not None else "NULL"
            print(f"  {n:>6} {total_fmt:>12}  {merchant}")

        print("\nSample rows (3 per card):")
        for card_name in ("rakuten-card", "smcc-card"):
            cursor = conn.execute(
                "SELECT * FROM card_txn WHERE card=? LIMIT 3;", (card_name,)
            )
            cols = [d[0] for d in cursor.description]
            print(f"\n  [{card_name}]")
            for row in cursor.fetchall():
                print("  " + " | ".join(f"{k}={v}" for k, v in zip(cols, row)))

        print("\nPRAGMA integrity_check:")
        cursor = conn.execute("PRAGMA integrity_check;")
        for row in cursor.fetchall():
            print(f"  {row[0]}")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
