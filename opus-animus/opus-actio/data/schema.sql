-- opus-actio · finance.db schema (v1)
-- Snapshot-based personal-finance store. Layer A data lives in data/_local/finance.db (gitignored).
-- Each monthly capture = one snapshot row; all fact tables hang off snapshot_id.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS snapshot (
  id        INTEGER PRIMARY KEY,
  as_of     TEXT NOT NULL UNIQUE,        -- 'YYYY-MM-DD'
  base_ccy  TEXT NOT NULL DEFAULT 'JPY',
  note      TEXT
);

CREATE TABLE IF NOT EXISTS fx_rate (
  snapshot_id INTEGER NOT NULL REFERENCES snapshot(id) ON DELETE CASCADE,
  pair        TEXT NOT NULL,             -- 'USDJPY'
  rate        REAL NOT NULL,
  asof        TEXT,
  PRIMARY KEY (snapshot_id, pair)
);

-- Stable dimension: cash/bank/exchange/brokerage-cash accounts (one row per real account).
CREATE TABLE IF NOT EXISTS account (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  type        TEXT,                       -- bank / exchange_cash / brokerage_cash
  institution TEXT
);

CREATE TABLE IF NOT EXISTS balance (
  snapshot_id INTEGER NOT NULL REFERENCES snapshot(id) ON DELETE CASCADE,
  account_id  INTEGER NOT NULL REFERENCES account(id),
  balance_jpy INTEGER NOT NULL,
  yield       TEXT,
  PRIMARY KEY (snapshot_id, account_id)
);

-- Portfolio holdings per snapshot. Same code can appear under multiple tax accounts.
CREATE TABLE IF NOT EXISTS holding (
  snapshot_id  INTEGER NOT NULL REFERENCES snapshot(id) ON DELETE CASCADE,
  code         TEXT NOT NULL,
  account_type TEXT NOT NULL,             -- NISA-growth / NISA-tsumitate / taxable / -
  name         TEXT,
  cls          TEXT,                      -- JP / US / FUND / CASH
  qty          REAL,
  unit         TEXT,                      -- 株 / 口 / USD
  avg_cost     REAL,
  cur_price    REAL,
  ccy          TEXT,
  value_jpy    INTEGER,
  value_ccy    REAL,
  pl_jpy       INTEGER,
  pl_pct       REAL,
  PRIMARY KEY (snapshot_id, code, account_type)
);

CREATE TABLE IF NOT EXISTS pf_summary (
  snapshot_id          INTEGER PRIMARY KEY REFERENCES snapshot(id) ON DELETE CASCADE,
  total_assets         INTEGER,
  holdings_total       INTEGER,
  jp_equity            INTEGER,
  us_equity            INTEGER,
  funds                INTEGER,
  deposits_total       INTEGER,
  cash_deposit         INTEGER,
  fx_deposit_jpy       INTEGER,
  margin_guarantee     INTEGER,
  fx_margin_net        INTEGER,
  credit_unrealized_pl INTEGER,
  unrealized_pl        INTEGER,
  unrealized_pl_pct    REAL,
  realized_pl_cum      INTEGER,
  dividends_jpy        INTEGER,
  dividends_foreign    REAL
);

CREATE TABLE IF NOT EXISTS networth (
  snapshot_id        INTEGER PRIMARY KEY REFERENCES snapshot(id) ON DELETE CASCADE,
  net_worth          INTEGER,
  cash_total         INTEGER,
  invested_total     INTEGER,
  alloc_cash_pct     REAL,
  alloc_invested_pct REAL,
  ef_buffer_12mo     INTEGER,
  idle_cash_beyond_ef INTEGER
);

-- Liabilities complete the balance sheet: assets - debt = true net worth.
CREATE TABLE IF NOT EXISTS liabilities (
  id              INTEGER PRIMARY KEY,
  snapshot_id     INTEGER REFERENCES snapshot(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL,      -- 'mortgage' | 'loan' | 'card_revolving' | 'other'
  name            TEXT,
  principal_jpy   INTEGER NOT NULL,   -- dư nợ còn lại
  rate_pct        REAL,
  term_months     INTEGER,
  monthly_payment_jpy INTEGER,
  start_date      TEXT,               -- 'YYYY-MM-DD'
  note            TEXT
);

DROP VIEW IF EXISTS v_networth_true;
CREATE VIEW v_networth_true AS
SELECT n.snapshot_id,
       n.net_worth AS assets_net_worth,
       COALESCE((SELECT SUM(principal_jpy) FROM liabilities l WHERE l.snapshot_id=n.snapshot_id),0) AS total_liabilities,
       n.net_worth - COALESCE((SELECT SUM(principal_jpy) FROM liabilities l WHERE l.snapshot_id=n.snapshot_id),0) AS true_net_worth
FROM networth n;

-- Credit-card transactions (Layer A — rebuilt from CSVs each run, idempotent)
CREATE TABLE IF NOT EXISTS card_txn (
  id           INTEGER PRIMARY KEY,
  card         TEXT NOT NULL,     -- 'rakuten-card' | 'smcc-card'
  use_date     TEXT,              -- transaction date 'YYYY-MM-DD'
  pay_date     TEXT,              -- statement/withdrawal date 'YYYY-MM-DD' (nullable)
  merchant     TEXT,
  user         TEXT,
  pay_method   TEXT,              -- e.g. '1回払い' (nullable)
  amount_jpy   INTEGER,
  fee_jpy      INTEGER,           -- nullable
  fx_note      TEXT,              -- foreign-currency / bonus annotation (nullable)
  category     TEXT,
  source_file  TEXT NOT NULL,
  source_month TEXT NOT NULL      -- 'YYYYMM' from filename
);

DROP VIEW IF EXISTS v_spending_monthly;
CREATE VIEW v_spending_monthly AS
SELECT
  card,
  source_month,
  COUNT(*) AS n,
  SUM(amount_jpy) AS total
FROM card_txn
GROUP BY card, source_month;

DROP VIEW IF EXISTS v_spending_by_category;
CREATE VIEW v_spending_by_category AS
SELECT
  source_month,
  category,
  SUM(amount_jpy) AS total,
  COUNT(*) AS n
FROM card_txn
GROUP BY source_month, category;

DROP VIEW IF EXISTS v_top_merchants;
CREATE VIEW v_top_merchants AS
SELECT
  merchant,
  category,
  COUNT(*) AS n,
  SUM(amount_jpy) AS total
FROM card_txn
GROUP BY merchant, category
ORDER BY total DESC;

DROP VIEW IF EXISTS v_uncategorized;
CREATE VIEW v_uncategorized AS
SELECT
  merchant,
  COUNT(*) AS n,
  SUM(amount_jpy) AS total
FROM card_txn
WHERE category = 'other'
GROUP BY merchant
ORDER BY total DESC;

DROP VIEW IF EXISTS v_spending_vs_budget;
CREATE VIEW v_spending_vs_budget AS
SELECT
  category,
  SUM(amount_jpy) AS actual
FROM card_txn
WHERE source_month = (SELECT MAX(source_month) FROM card_txn)
GROUP BY category;
