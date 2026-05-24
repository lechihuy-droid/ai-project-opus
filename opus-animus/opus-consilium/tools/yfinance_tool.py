from datetime import date
import yfinance as yf
from crewai.tools import BaseTool
from pydantic import BaseModel, Field


class YFinanceInput(BaseModel):
    symbols: str = Field(description="Comma-separated ticker symbols, e.g. '^N225,^TOPIX'")


class YFinanceTool(BaseTool):
    name: str = "Fetch Stock Data"
    description: str = "Fetch latest stock/index price data from Yahoo Finance. Input: comma-separated symbols."
    args_schema: type[BaseModel] = YFinanceInput

    def _run(self, symbols: str) -> str:
        symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]
        results = []
        for sym in symbol_list:
            try:
                ticker = yf.Ticker(sym)
                hist = ticker.history(period="2d")
                if hist.empty:
                    results.append(f"{sym}: No data")
                    continue

                latest = hist.iloc[-1]
                prev = hist.iloc[-2] if len(hist) > 1 else hist.iloc[-1]
                price = latest["Close"]
                change = price - prev["Close"]
                pct = (change / prev["Close"]) * 100
                date = hist.index[-1].strftime("%Y-%m-%d")
                results.append(
                    f"{sym}: {price:,.2f} ({'+' if change >= 0 else ''}{change:.2f} / {pct:+.2f}%) — {date} close"
                )
            except Exception as e:
                results.append(f"{sym}: Error — {e}")

        output = "[Stock Data]\n" + "\n".join(results)
        _save_raw_stock(symbol_list, results)
        return output


def _save_raw_stock(symbols: list[str], lines: list[str]):
    try:
        from utils.config import raw_dir
        sym_slug = "_".join(s.replace("^", "") for s in symbols)
        path = raw_dir("articles") / f"{date.today()}-yfinance-{sym_slug}.md"
        if not path.exists():
            content = f"# Stock Data — {date.today()}\n\nSymbols: {', '.join(symbols)}\n\n"
            content += "\n".join(lines)
            path.write_text(content, encoding="utf-8")
    except Exception:
        pass
