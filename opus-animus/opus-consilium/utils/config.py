import os
import yaml
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).parent.parent


def load_config() -> dict:
    with open(ROOT / "config.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def llm_config() -> dict:
    cfg = load_config().get("llm", {})
    return {
        "provider": cfg.get("provider", "groq"),
        "model": cfg.get("model", "llama-3.3-70b-versatile"),
        "api_key": os.getenv("GROQ_API_KEY"),
    }


def get_sources(topic: str | None = None, source_type: str | None = None) -> list[dict]:
    cfg = load_config()
    sources = cfg.get("sources", [])
    if topic:
        sources = [s for s in sources if s["topic"] == topic]
    if source_type:
        sources = [s for s in sources if s["type"] == source_type]
    return [s for s in sources if s.get("enabled", True)]


def wiki_dir() -> Path:
    d = ROOT / "wiki"
    d.mkdir(exist_ok=True)
    return d


def logs_dir() -> Path:
    d = ROOT / "logs" / "daily"
    d.mkdir(parents=True, exist_ok=True)
    return d


def personal_wiki_dir() -> Path:
    d = ROOT / "personal-wiki"
    d.mkdir(exist_ok=True)
    return d


def raw_dir(category: str = "") -> Path:
    raw_assets_root = os.getenv("RAW_ASSETS_ROOT")
    base = Path(raw_assets_root) if raw_assets_root else ROOT
    d = base / "raw" / category if category else base / "raw"
    d.mkdir(parents=True, exist_ok=True)
    return d


def skills_dir(category: str = "") -> Path:
    d = ROOT / "skills" / category if category else ROOT / "skills"
    d.mkdir(parents=True, exist_ok=True)
    return d
