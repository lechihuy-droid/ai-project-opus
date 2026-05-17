import json
import re
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime
from html import unescape
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

from .data import list_articles

router = APIRouter()

ROOT = Path(__file__).parent.parent
STATE_PATH = ROOT / "logs" / "intel_state.json"
REVIEW_DIR = ROOT / "logs" / "intel_reviews"
BUSINESS_BRIEF_DIR = ROOT / "logs" / "business_briefs"
WEEKLY_DIR = ROOT / "logs" / "weekly"

SIGNALS = [
    {
        "key": "ai_sdlc",
        "label": "AI-SDLC Productization",
        "keywords": ["sdlc", "software development", "code generation", "coding agent", "developer", "agentic"],
    },
    {
        "key": "roi",
        "label": "ROI / Proof Points",
        "keywords": ["roi", "productivity", "faster", "efficiency", "cost", "benchmark"],
    },
    {
        "key": "legacy",
        "label": "Legacy Modernization",
        "keywords": ["cobol", "legacy", "mainframe", "migration", "modernization"],
    },
    {
        "key": "partnership",
        "label": "SIer Partnership",
        "keywords": ["partnership", "alliance", "joint", "collaboration", "offshore"],
    },
    {
        "key": "sovereign",
        "label": "Sovereign / On-prem AI",
        "keywords": ["on-premise", "on-prem", "sovereign", "japanese llm", "private", "compliance"],
    },
]

ACTORS = [
    "OpenAI",
    "Anthropic",
    "Google",
    "Microsoft",
    "GitHub",
    "AWS",
    "NVIDIA",
    "Meta",
    "FPT",
    "SCSK",
    "COBOL",
    "DeepSeek",
    "Qwen",
    "Claude",
]

CATEGORY_LABELS = {
    "open_source": "Open Source",
    "funding": "Funding",
    "partnership": "Partnership",
    "product_update": "Product Update",
    "research": "Research",
    "community": "Community",
    "regulation": "Regulation",
    "market_signal": "Market Signal",
}

HOT_MARKET_SOURCES = {
    "openai-news",
    "anthropic-blog",
    "microsoft-official-blog",
    "microsoft-azure-blog",
    "google-ai-blog",
    "aws-ml-blog",
    "nvidia-blog",
    "techcrunch-ai",
    "venturebeat-ai",
}

HOT_MARKET_KEYWORDS = {
    "announce",
    "announces",
    "launch",
    "launches",
    "release",
    "released",
    "introduce",
    "introduced",
    "partnership",
    "funding",
    "raises",
    "acquires",
    "acquisition",
    "pricing",
    "enterprise",
    "customer",
    "regulation",
    "policy",
    "safety",
    "governance",
    "copilot",
    "codex",
    "claude",
    "gpt",
    "gemini",
    "openai",
    "anthropic",
    "microsoft",
    "google",
    "nvidia",
    "aws",
}

GITHUB_AI_KEYWORDS = {
    "agent": 5,
    "agents": 5,
    "ai": 4,
    "llm": 5,
    "mcp": 4,
    "rag": 5,
    "coding": 4,
    "developer": 3,
    "copilot": 5,
    "codex": 5,
    "claude": 5,
    "openai": 5,
    "workflow": 3,
    "automation": 3,
    "eval": 4,
    "benchmark": 4,
    "security": 3,
    "browser": 3,
    "desktop": 2,
    "vector": 4,
    "retrieval": 4,
    "knowledge": 3,
}


def _read_state() -> dict:
    if not STATE_PATH.exists():
        return {"articles": {}}
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {"articles": {}}


def _write_state(state: dict) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def _article_text(article: dict) -> str:
    return " ".join(
        str(article.get(k, ""))
        for k in ("title", "summary", "relevance", "source", "topic")
    ).lower()


def _signals_for(article: dict) -> list[dict]:
    text = _article_text(article)
    matched = []
    for signal in SIGNALS:
        if any(keyword in text for keyword in signal["keywords"]):
            matched.append({"key": signal["key"], "label": signal["label"]})
    return matched


def _actors_for(article: dict) -> list[str]:
    text = _article_text(article)
    return [actor for actor in ACTORS if actor.lower() in text]


def _category_for(article: dict) -> str:
    text = _article_text(article)
    url = article.get("url", "")
    source = article.get("source", "")
    if "github.com" in url or "github" in source:
        return "open_source"
    if any(k in text for k in ("funding", "raised", "series ", "investment")):
        return "funding"
    if any(k in text for k in ("partnership", "alliance", "joint venture", "collaboration")):
        return "partnership"
    if any(k in text for k in ("release", "launch", "announces", "introduced", "preview")):
        return "product_update"
    if any(k in text for k in ("paper", "benchmark", "research", "evaluation")):
        return "research"
    if any(k in text for k in ("reddit", "hacker news", "community", "discussion")):
        return "community"
    if any(k in text for k in ("regulation", "policy", "compliance", "sovereign")):
        return "regulation"
    return "market_signal"


def _market_rank(article: dict) -> int:
    score = article.get("importance", 0) * 10
    source = article.get("source", "")
    source_kind = article.get("source_kind", "")
    category = article.get("category", "")
    title = article.get("title", "").lower()
    text = _article_text(article)

    hot = _is_hot_market_item(article)

    if source_kind == "market_news":
        score += 45
    if source in HOT_MARKET_SOURCES:
        score += 40
    if hot:
        score += 30
    if category in {"product_update", "partnership", "funding", "regulation"}:
        score += 18
    if category == "community":
        score -= 14
    if any(k in text for k in ("openai", "anthropic", "microsoft", "copilot", "codex", "claude", "azure ai")):
        score += 14
    if any(k in title for k in ("launch", "announce", "release", "partnership", "codex", "copilot", "claude")):
        score += 10
    if source.startswith("arxiv") or source == "hf-papers":
        score -= 45
    if category == "research":
        score -= 25
    if source == "github-trending-ai":
        score -= 12
    return score


def _is_hot_market_item(article: dict) -> bool:
    source = article.get("source", "")
    source_kind = article.get("source_kind", "")
    category = article.get("category", "")
    text = _article_text(article)
    if source_kind == "market_news" or source in HOT_MARKET_SOURCES:
        return True
    if category in {"product_update", "partnership", "funding", "regulation"}:
        return True
    return any(keyword in text for keyword in HOT_MARKET_KEYWORDS)


def _business_impact(article: dict) -> str:
    category = article.get("category")
    signals = {s["label"] for s in article.get("signals", [])}
    source = article.get("source", "")
    title = article.get("title", "")
    if source == "openai-news":
        return f"OpenAI có động thái mới: {title}. Đọc để hiểu họ đang làm AI dễ dùng hơn ở điểm nào."
    if source == "anthropic-blog":
        return f"Anthropic có tín hiệu sản phẩm/thị trường: {title}. Đọc để so Claude với OpenAI/Microsoft."
    if source in {"microsoft-official-blog", "microsoft-azure-blog"}:
        return f"Microsoft/Copilot/Azure có thay đổi: {title}. Đọc để xem nó có ảnh hưởng tới lựa chọn platform không."
    if source in {"google-ai-blog", "aws-ml-blog", "nvidia-blog", "techcrunch-ai", "venturebeat-ai"}:
        return f"Tín hiệu thị trường AI đáng xem: {title}. Đọc để nắm thay đổi lớn, không phải đọc sâu kỹ thuật."
    if category == "open_source":
        return "Có thể là tool/pattern hữu ích cho workflow AI hiện tại của bạn."
    if "Legacy Modernization" in signals:
        return "Chỉ đáng đọc nếu nó cho bạn một pattern, rủi ro, hoặc thay đổi thị trường cụ thể."
    if "ROI / Proof Points" in signals:
        return "Đáng giữ nếu có số liệu, benchmark, hoặc claim bạn có thể dùng lại."
    if "Sovereign / On-prem AI" in signals:
        return "Hữu ích để hiểu ràng buộc privacy, compliance, hoặc triển khai."
    if category == "research":
        return "Chỉ đọc nếu nó đổi cách bạn nghĩ về capability, evaluation, hoặc agent architecture."
    return "Bối cảnh thị trường phụ; giữ lại nếu nó làm thay đổi câu hỏi hoặc việc bạn sẽ làm hôm nay."


def _recommended_action(article: dict) -> str:
    category = article.get("category")
    signals = {s["label"] for s in article.get("signals", [])}
    importance = article.get("importance", 0)
    source = article.get("source", "")
    title = article.get("title", "").lower()
    if "claude platform on aws" in title:
        return "Ưu tiên đọc. Ghi lại Claude-on-AWS giải quyết pain point gì, rồi quyết định có cần test Claude qua AWS account không."
    if "agentcore payments" in title or ("payments" in title and "agent" in title):
        return "Xem kỹ use case agent có giao dịch/thanh toán; ghi 1 kịch bản automation bạn có thể thử mô phỏng."
    if "nvidia" in title and "sap" in title:
        return "Đọc để hiểu mô hình trust cho specialized agents; lưu lại checklist trust/safety nếu nó thực tế."
    if "eu ai act" in title:
        return "Đọc phần compliance; rút 3 yêu cầu cần kiểm tra nếu fine-tune hoặc triển khai LLM trong môi trường có regulation."
    if "chatgpt adoption" in title:
        return "Đọc số liệu adoption; ghi 1 insight về hành vi người dùng AI đang thay đổi ra sao."
    if "valuation" in title or "funding" in title:
        return "Xem đây là tín hiệu thị trường hay hype; chỉ lưu nếu có dấu hiệu nhu cầu thật từ khách hàng/người dùng."
    if source == "openai-news":
        return "Đọc trước. Ghi 1 câu: OpenAI đang làm gì dễ hơn cho người dùng, và nó có đổi roadmap AI của bạn không."
    if source == "anthropic-blog":
        return "So với OpenAI/Microsoft. Quyết định tuần này có cần test Claude nhiều hơn không."
    if source in {"microsoft-official-blog", "microsoft-azure-blog"}:
        return "Kiểm tra nó có đổi giả định của bạn về Copilot, Azure AI, hoặc tốc độ adoption không."
    if source in {"google-ai-blog", "aws-ml-blog", "nvidia-blog", "techcrunch-ai", "venturebeat-ai"}:
        return "Đọc nhanh và trả lời: đây là thay đổi thị trường lớn, tool nên thử, hay chỉ là tin nền?"
    if category == "open_source":
        return "Mở README. Chỉ giữ nếu nó cải thiện research, coding, hoặc automation workflow của bạn."
    if "AI-SDLC Productization" in signals:
        return "Rút 1 workflow idea có thể test ngay hoặc so với cách bạn đang làm."
    if "Legacy Modernization" in signals:
        return "Skim để lấy 1 bài học cụ thể; nếu chỉ là buzzword thì bỏ."
    if importance >= 4:
        return "Chỉ lưu 1 câu nếu nó đổi quyết định tiếp theo của bạn; không thì đánh dấu đã skim."
    return "Skim 60 giây, rồi bỏ qua nếu nó không đổi việc bạn sẽ làm hôm nay."


def _confidence(article: dict) -> str:
    if article.get("importance", 0) >= 4 and (article.get("signals") or article.get("actors")):
        return "high"
    if article.get("importance", 0) >= 3:
        return "medium"
    return "low"


def _reader_relevance(article: dict, fallback: str) -> str:
    relevance = article.get("relevance") or ""
    blocked = ("fpt", "flezipt", "cobol park", "cto", "pitch", "presales", "khách", "doanh nghiệp nhật")
    if relevance and not any(term in relevance.lower() for term in blocked):
        return relevance
    return fallback


def _detailed_market_summary(report_date: str, articles: list[dict], hot_count: int) -> list[str]:
    if not articles:
        return ["Chưa có dữ liệu đủ mạnh để viết tóm tắt chi tiết."]

    lead = articles[0]
    sources = [a.get("source", "source") for a in articles if a.get("source")]
    source_text = ", ".join(dict.fromkeys(sources[:5]))
    paragraphs = [
        (
            f"Ngày {report_date} có {len(articles)} tín hiệu được chọn cho Market Intel, "
            f"trong đó {hot_count} tín hiệu được xem là hot market move. Điểm đáng chú ý nhất là "
            f"'{lead.get('title')}', vì nó cho thấy thay đổi đang đi vào sản phẩm, platform, "
            "partnership hoặc adoption thực tế thay vì chỉ là research."
        ),
        (
            f"Nguồn nổi bật trong top 5 gồm {source_text}. Cụm tin này nên được đọc theo câu hỏi: "
            "ai đang làm AI dễ dùng hơn, ai đang kiểm soát platform, và use case nào đã đủ gần để bạn thử."
        ),
        (
            "Cách đọc đề xuất: đọc top 1 thật kỹ, skim top 2-3 để lấy pattern, sau đó chỉ lưu lại "
            "những ý làm thay đổi quyết định tiếp theo của bạn. Nếu một bài không dẫn tới hành động "
            "đọc sâu, test, so sánh, hoặc watchlist thì bỏ qua."
        ),
    ]
    if len(articles) >= 3:
        titles = "; ".join(a.get("title", "") for a in articles[:3])
        paragraphs.append(f"Ba tín hiệu đầu cần ưu tiên: {titles}.")
    return paragraphs


def _fallback_llm_review(report_date: str, articles: list[dict]) -> dict:
    if not articles:
        return {
            "status": "fallback",
            "title": "Chưa có đủ tin để review",
            "reading_time": "0 phút",
            "sections": [],
        }
    bullets = [
        f"{i}. {a.get('title')} - {a.get('fpt_relevance') or a.get('summary') or 'Cần mở bài để đọc thêm.'}"
        for i, a in enumerate(articles, 1)
    ]
    actions = list(dict.fromkeys(a.get("recommended_action", "") for a in articles if a.get("recommended_action")))[:3]
    return {
        "status": "fallback",
        "title": f"Review nhanh top {len(articles)} tin AI market - {report_date}",
        "reading_time": "khoảng 5 phút",
        "sections": [
            {
                "heading": "Điểm chính",
                "body": "Các tin hôm nay nghiêng về platform, agent workflow và adoption thực tế. Đọc theo hướng: thay đổi nào đáng thử, thay đổi nào chỉ cần watchlist.",
            },
            {
                "heading": "Top 5 cần đọc",
                "body": "\n".join(bullets),
            },
            {
                "heading": "Action cho bạn",
                "body": "\n".join(f"- {a}" for a in actions) if actions else "- Đọc top 1 và ghi lại một quyết định tiếp theo.",
            },
        ],
    }


def _llm_market_review(report_date: str, articles: list[dict]) -> dict:
    review_path = REVIEW_DIR / f"{report_date}.json"
    if not review_path.exists():
        return _fallback_llm_review(report_date, articles)
    try:
        parsed = json.loads(review_path.read_text(encoding="utf-8"))
        parsed.setdefault("status", "current_llm")
        return parsed
    except Exception as exc:
        fallback = _fallback_llm_review(report_date, articles)
        fallback["status"] = "fallback_review_file_error"
        fallback["error"] = str(exc)[:180]
        return fallback


def _business_brief(report_date: str) -> dict:
    brief_path = BUSINESS_BRIEF_DIR / f"{report_date}.json"
    fallback = {
        "status": "fallback",
        "title": f"Business Knowledge - {report_date}",
        "topic": "Chưa có chủ đề business cho ngày này",
        "reading_time": "0 phút",
        "sections": [
            {
                "heading": "Gợi ý",
                "body": "Tạo file brief trong logs/business_briefs/YYYY-MM-DD.json để dashboard hiển thị một chủ đề business mỗi ngày.",
            }
        ],
    }
    if not brief_path.exists():
        return fallback
    try:
        parsed = json.loads(brief_path.read_text(encoding="utf-8"))
        parsed.setdefault("status", "current_llm")
        return parsed
    except Exception as exc:
        fallback["status"] = "fallback_business_file_error"
        fallback["error"] = str(exc)[:180]
        return fallback


def _enrich_article(article: dict, state: dict) -> dict:
    enriched = dict(article)
    enriched["category"] = _category_for(article)
    enriched["category_label"] = CATEGORY_LABELS.get(enriched["category"], "Market Signal")
    enriched["signals"] = _signals_for(article)
    enriched["actors"] = _actors_for(article)
    enriched["importance"] = article.get("goal_score") or 0
    enriched["business_impact"] = _business_impact(enriched)
    enriched["fpt_relevance"] = _reader_relevance(article, enriched["business_impact"])
    enriched["recommended_action"] = _recommended_action(enriched)
    enriched["confidence"] = _confidence(enriched)
    enriched["used_status"] = state.get("articles", {}).get(article["slug"], {}).get("used_status", "unused")
    return enriched


def _top_articles(articles: list[dict], n: int = 5) -> list[dict]:
    return sorted(
        articles,
        key=lambda a: (-_market_rank(a), a.get("used_status") == "used", a.get("title", "")),
    )[:n]


def _build_report(report_date: str, articles: list[dict]) -> dict:
    top = _top_articles(articles)
    signal_counts = Counter(signal["label"] for a in articles for signal in a.get("signals", []))
    category_counts = Counter(a.get("category_label", "Market Signal") for a in articles)
    actor_counts = Counter(actor for a in articles for actor in a.get("actors", []))
    used_count = sum(1 for a in articles if a.get("used_status") == "used")

    executive = [
        {
            "title": item["title"],
            "why": item.get("fpt_relevance") or item.get("summary") or "No summary yet.",
            "action": item.get("recommended_action"),
        }
        for item in top[:3]
    ]

    recommended = []
    if top:
        recommended.append({
            "label": "Start here",
            "text": top[0]["title"],
            "action": top[0]["recommended_action"],
        })
    if used_count == 0 and top:
        recommended.append({
            "label": "Capture",
            "text": "Mark one item as used after it becomes a pitch point, wiki note, or research follow-up.",
            "action": "Use the status action on the top item after reviewing it.",
        })

    return {
        "date": report_date,
        "summary": {
            "article_count": len(articles),
            "used_count": used_count,
            "top_importance": max((a.get("importance") or 0 for a in articles), default=0),
        },
        "executive_brief": executive,
        "strategic_signals": [
            {"label": label, "count": count}
            for label, count in signal_counts.most_common()
        ],
        "category_mix": [
            {"label": label, "count": count}
            for label, count in category_counts.most_common()
        ],
        "actor_map": [
            {"label": label, "count": count}
            for label, count in actor_counts.most_common(8)
        ],
        "top_items": top,
        "recommended_actions": recommended,
    }


def _report_markdown(report: dict) -> str:
    lines = [
        f"# Daily AI / Competitor Report - {report['date']}",
        "",
        "## Executive Brief",
    ]
    if report["executive_brief"]:
        for item in report["executive_brief"]:
            lines.append(f"- {item['title']} - {item['why']}")
    else:
        lines.append("- No articles for this date.")

    lines.extend(["", "## Strategic Signals"])
    for item in report["strategic_signals"] or [{"label": "No strategic signal detected yet", "count": 0}]:
        suffix = f": {item['count']}" if item["count"] else ""
        lines.append(f"- {item['label']}{suffix}")

    lines.extend(["", "## Top 5 Intelligence Items"])
    for i, item in enumerate(report["top_items"], 1):
        lines.append(f"{i}. [{item['title']}]({item.get('url') or '#'})")
        lines.append(f"   - Importance: {item.get('importance') or 0}/5")
        lines.append(f"   - Why it matters: {item.get('fpt_relevance') or '-'}")
        lines.append(f"   - Action: {item.get('recommended_action')}")

    lines.extend(["", "## Recommended Action Today"])
    for item in report["recommended_actions"]:
        lines.append(f"- {item['label']}: {item['text']} -> {item['action']}")
    return "\n".join(lines)


def _articles_by_date(days_back: int) -> dict[str, list[dict]]:
    state = _read_state()
    articles = [_enrich_article(a, state) for a in list_articles(limit=500, days_back=days_back)]
    grouped = defaultdict(list)
    for article in articles:
        grouped[article["date"]].append(article)
    return dict(sorted(grouped.items(), reverse=True))


def _compact_number(text: str) -> int:
    text = (text or "").strip().lower().replace(",", "")
    if not text:
        return 0
    multiplier = 1
    if text.endswith("k"):
        multiplier = 1000
        text = text[:-1]
    try:
        return int(float(text) * multiplier)
    except Exception:
        return 0


def _github_ai_score(repo: dict) -> int:
    text = " ".join(str(repo.get(k, "")) for k in ("name", "description", "language")).lower()
    score = 0
    for keyword, weight in GITHUB_AI_KEYWORDS.items():
        if keyword in text:
            score += weight
    if repo.get("stars_this_week", 0) >= 500:
        score += 2
    return min(score, 10)


def _github_tags(repo: dict) -> list[str]:
    text = " ".join(str(repo.get(k, "")) for k in ("name", "description")).lower()
    tags = []
    tag_rules = [
        ("agent", "Agent"),
        ("coding", "AI-SDLC"),
        ("codex", "AI-SDLC"),
        ("copilot", "AI-SDLC"),
        ("rag", "RAG"),
        ("retrieval", "RAG"),
        ("vector", "RAG"),
        ("eval", "Eval"),
        ("benchmark", "Eval"),
        ("security", "Security"),
        ("browser", "Workflow"),
        ("automation", "Workflow"),
        ("mcp", "MCP"),
    ]
    for keyword, tag in tag_rules:
        if keyword in text and tag not in tags:
            tags.append(tag)
    if repo.get("language") and repo["language"] not in tags:
        tags.append(repo["language"])
    return tags[:4] or ["Watch"]


def _github_summary(repo: dict) -> str:
    description = (repo.get("description") or "").strip()
    if description:
        return description[:260]
    return "Weekly trending GitHub repository. Skim the README before deciding whether it belongs in the AI project watchlist."


def _github_action(repo: dict) -> str:
    text = " ".join(str(repo.get(k, "")) for k in ("name", "description")).lower()
    if any(k in text for k in ("coding", "codex", "copilot", "developer", "devtool", "ide")):
        return "Test whether it can improve your coding-agent workflow, review loop, or automation setup."
    if any(k in text for k in ("agent", "workflow", "automation", "browser", "mcp")):
        return "Map to FDE workflow: see whether it can automate one repeatable research/build step for the current AI project."
    if any(k in text for k in ("rag", "retrieval", "vector", "knowledge", "memory")):
        return "Evaluate for the knowledge layer: could it improve market-intel retrieval, source grounding, or wiki ingestion?"
    if any(k in text for k in ("eval", "benchmark", "security", "guardrail", "audit")):
        return "Use as governance material: turn it into one benchmark/security question for Japanese enterprise AI discussions."
    if repo.get("ai_score", 0) >= 5:
        return "Open the README and extract one practical pattern you can reuse in your current AI workflow."
    return "Watch only: keep it in the weekly scan unless it directly supports your current research or build work."


def _week_key(date_text: str | None = None) -> str:
    if date_text:
        try:
            dt = datetime.strptime(date_text[:10], "%Y-%m-%d")
        except Exception:
            dt = datetime.now()
    else:
        dt = datetime.now()
    iso = dt.isocalendar()
    return f"{iso.year}-W{iso.week:02d}"


def _scrape_github_trending_weekly(limit: int = 30) -> tuple[list[dict], str | None]:
    url = "https://github.com/trending?since=weekly"
    headers = {
        "User-Agent": "opus-consilium-intel/1.0",
        "Accept": "text/html,application/xhtml+xml",
    }
    try:
        request = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(request, timeout=20) as response:
            html = response.read().decode("utf-8", errors="replace")
    except Exception as exc:
        return [], str(exc)

    repos = []
    articles = re.findall(r"<article\b[^>]*class=\"[^\"]*Box-row[^\"]*\"[^>]*>(.*?)</article>", html, re.S)
    for article in articles[: max(limit, 10)]:
        link_match = re.search(r"<h2\b.*?<a\b[^>]*href=\"([^\"]+)\"[^>]*>(.*?)</a>", article, re.S)
        if not link_match:
            continue
        href, link_html = link_match.groups()
        link_text = re.sub(r"<[^>]+>", " ", link_html)
        name = " ".join(unescape(link_text).split()).replace(" / ", "/")
        repo_url = "https://github.com" + href.strip()
        description_match = re.search(r"<p\b[^>]*>(.*?)</p>", article, re.S)
        language_match = re.search(r"itemprop=\"programmingLanguage\"[^>]*>(.*?)</span>", article, re.S)
        stars_week_match = re.search(r"<span\b[^>]*class=\"[^\"]*float-sm-right[^\"]*\"[^>]*>(.*?)</span>", article, re.S)
        star_matches = re.findall(r"<a\b[^>]*class=\"[^\"]*Link--muted[^\"]*\"[^>]*>(.*?)</a>", article, re.S)
        stars_total = 0
        if star_matches:
            stars_total_text = re.sub(r"<[^>]+>", " ", star_matches[0])
            stars_total = _compact_number(" ".join(unescape(stars_total_text).split()))
        stars_this_week_text = ""
        if stars_week_match:
            stars_this_week_text = " ".join(unescape(re.sub(r"<[^>]+>", " ", stars_week_match.group(1))).split())
        stars_this_week = 0
        if stars_this_week_text:
            stars_this_week = _compact_number(stars_this_week_text.split()[0])
        repo = {
            "name": name,
            "url": repo_url,
            "description": " ".join(unescape(re.sub(r"<[^>]+>", " ", description_match.group(1))).split()) if description_match else "",
            "language": " ".join(unescape(re.sub(r"<[^>]+>", " ", language_match.group(1))).split()) if language_match else "",
            "stars_total": stars_total,
            "stars_this_week": stars_this_week,
            "week": _week_key(),
        }
        repo["ai_score"] = _github_ai_score(repo)
        repo["tags"] = _github_tags(repo)
        repo["summary"] = _github_summary(repo)
        repo["suggested_action"] = _github_action(repo)
        repos.append(repo)
    return repos, None


def _github_repos_from_articles(limit: int = 10, week: str | None = None, days_back: int = 90) -> list[dict]:
    repos = []
    for article in list_articles(limit=500, days_back=days_back):
        if "github" not in (article.get("source", "") + article.get("url", "")).lower():
            continue
        article_week = _week_key(article.get("date"))
        if week and article_week != week:
            continue
        repo = {
            "name": article.get("title", "").replace("GitHub: ", ""),
            "url": article.get("url"),
            "description": article.get("summary") or article.get("relevance") or "",
            "language": "",
            "stars_total": 0,
            "stars_this_week": 0,
            "source": article.get("source"),
            "week": article_week,
            "date": article.get("date"),
        }
        repo["ai_score"] = _github_ai_score(repo)
        repo["tags"] = _github_tags(repo)
        repo["summary"] = _github_summary(repo)
        repo["suggested_action"] = _github_action(repo)
        repos.append(repo)
    return repos[:limit]


def _github_available_weeks(days_back: int = 90) -> list[dict]:
    grouped = defaultdict(int)
    for article in list_articles(limit=500, days_back=days_back):
        if "github" not in (article.get("source", "") + article.get("url", "")).lower():
            continue
        grouped[_week_key(article.get("date"))] += 1
    current = _week_key()
    grouped.setdefault(current, 0)
    return [
        {"week": week, "count": count, "label": week}
        for week, count in sorted(grouped.items(), reverse=True)
    ]


@router.get("/intel/reports")
def list_reports(days_back: int = 14):
    grouped = _articles_by_date(days_back)
    return {
        "reports": [
            {
                "date": report_date,
                "count": len(items),
                "used_count": sum(1 for item in items if item.get("used_status") == "used"),
                "top_title": max(items, key=lambda a: a.get("importance") or 0)["title"] if items else "",
            }
            for report_date, items in grouped.items()
        ]
    }


@router.get("/intel/report")
def get_report(date_: str | None = Query(default=None, alias="date"), days_back: int = 14):
    if not isinstance(date_, str):
        date_ = None
    grouped = _articles_by_date(days_back)
    if not grouped:
        report = _build_report("", [])
        return {"date": None, "articles": [], "report": report, "markdown": _report_markdown(report)}

    report_date = date_ or next(iter(grouped))
    if report_date not in grouped:
        raise HTTPException(404, f"No Intel report for date: {report_date}")

    articles = grouped[report_date]
    report = _build_report(report_date, articles)
    return {
        "date": report_date,
        "articles": articles,
        "report": report,
        "markdown": _report_markdown(report),
    }


@router.get("/intel/simple")
def get_simple_intel(date_: str | None = Query(default=None, alias="date"), days_back: int = 14):
    if not isinstance(date_, str):
        date_ = None
    grouped = _articles_by_date(days_back)
    if not grouped:
        return {
            "date": None,
            "available_dates": [],
            "latest_changes": [],
            "summary": ["No AI market articles yet. Run Test Collect first."],
            "suggested_actions": ["Run Test Collect, then refresh Intel."],
        }

    report_date = date_ or next(iter(grouped))
    if report_date not in grouped:
        raise HTTPException(404, f"No Intel summary for date: {report_date}")

    articles = grouped[report_date]
    market_pool = [
        a for a in articles
        if a.get("category") not in {"community", "research", "open_source"}
        and not str(a.get("source", "")).startswith("arxiv")
        and a.get("source") != "hf-papers"
    ]
    hot_pool = [a for a in market_pool if _is_hot_market_item(a)]
    top_pool = hot_pool if len(hot_pool) >= 3 else market_pool if market_pool else articles
    top = _top_articles(top_pool, n=5)
    signal_counts = Counter(signal["label"] for a in articles for signal in a.get("signals", []))
    category_counts = Counter(a.get("category_label", "Market Signal") for a in articles)

    latest_changes = [
        {
            "title": item["title"],
            "url": item.get("url"),
            "source": item.get("source"),
            "score": item.get("importance") or 0,
            "market_rank": _market_rank(item),
            "category": item.get("category_label", "Market Signal"),
            "why": item.get("fpt_relevance") or item.get("summary") or "",
        }
        for item in top
    ]

    summary = []
    if top:
        summary.append(f"Có {len(articles)} item trong ngày {report_date}; đã ưu tiên {len(hot_pool)} tin có dấu hiệu hot market move.")
        summary.append(f"Tín hiệu đáng đọc trước: {top[0]['title']}.")
    if signal_counts:
        label, count = signal_counts.most_common(1)[0]
        summary.append(f"Chủ đề nổi bật: {label} ({count} item liên quan).")
    if category_counts:
        label, count = category_counts.most_common(1)[0]
        summary.append(f"Loại nội dung nhiều nhất: {label} ({count}).")
    if not summary:
        summary.append("Chưa thấy pattern thị trường đủ mạnh; xem đây là danh sách skim nhanh.")

    suggested_actions = []
    for item in top[:3]:
        suggested_actions.append(item["recommended_action"])
    if not suggested_actions:
        suggested_actions.append("Chạy Collect rồi đọc 3 thay đổi lớn nhất trước.")

    return {
        "date": report_date,
        "available_dates": [
            {"date": d, "count": len(items)}
            for d, items in grouped.items()
        ],
        "latest_changes": latest_changes,
        "summary": summary,
        "detailed_summary": _detailed_market_summary(report_date, top, len(hot_pool)),
        "llm_review": _llm_market_review(report_date, top),
        "business_brief": _business_brief(report_date),
        "suggested_actions": list(dict.fromkeys(suggested_actions))[:3],
    }


@router.get("/intel/github-repos")
def get_github_repos(week: str | None = None, limit: int = 10):
    limit = max(1, min(limit, 20))
    week = week if isinstance(week, str) and week else None
    current_week = _week_key()
    available_weeks = _github_available_weeks()
    target_week = week or current_week
    repos = []
    error = None
    source = "local_collected_github_articles"

    if target_week == current_week:
        repos, error = _scrape_github_trending_weekly(limit=max(limit * 3, 30))
        source = "github_trending_weekly_live"
    if not repos:
        repos = _github_repos_from_articles(limit=limit, week=target_week)
        source = "local_collected_github_articles"

    ranked = sorted(
        repos,
        key=lambda r: (
            -int(r.get("ai_score") or 0),
            -int(r.get("stars_this_week") or 0),
            -int(r.get("stars_total") or 0),
            r.get("name", ""),
        ),
    )[:limit]
    for i, repo in enumerate(ranked, 1):
        repo["rank"] = i

    return {
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "week": target_week,
        "available_weeks": available_weeks,
        "source": source,
        "source_note": "Weekly GitHub Trending, ranked with AI-SDLC/FDE relevance bias.",
        "error": error if source != "github_trending_weekly_live" else None,
        "repos": ranked,
    }


@router.get("/intel/weekly")
def get_weekly_report(week: str | None = None):
    """
    Trả về weekly research report từ logs/weekly/YYYY-Www.json.
    Nếu week=None → dùng tuần hiện tại.
    """
    WEEKLY_DIR.mkdir(parents=True, exist_ok=True)

    now = datetime.now()
    iso = now.isocalendar()
    current_week = f"{iso.year}-W{iso.week:02d}"
    target_week = week if isinstance(week, str) and week else current_week

    available_weeks = sorted(
        [p.stem for p in WEEKLY_DIR.glob("*.json")], reverse=True
    )

    report_path = WEEKLY_DIR / f"{target_week}.json"
    if not report_path.exists():
        return {
            "week": target_week,
            "available_weeks": available_weeks,
            "status": "no_report",
            "message": f"Chưa có weekly report cho tuần {target_week}. Chạy: python run_weekly.py",
            "sections": [],
        }

    try:
        report = json.loads(report_path.read_text(encoding="utf-8"))
        report["available_weeks"] = available_weeks
        report.setdefault("status", "ok")
        return report
    except Exception as exc:
        raise HTTPException(500, f"Error reading weekly report: {exc}")


FDE_KEYWORDS = [
    "palantir", "forward deployed", "fde", "foundry", "gotham", "delta engineer",
    "deployment strategist", "bootcamp palantir", "apollo palantir", "aip palantir",
    "karp", "ontology enterprise", "embedded engineer", "customer engineer",
    "services as software", "service as software",
]

FDE_ACTORS = [
    {
        "name": "Palantir",
        "status": "Originator",
        "level": 5,
        "summary": "Phát minh mô hình FDE. Delta (engineer) + Echo (strategist) nhúng sâu vào khách hàng. Foundry/Gotham là nền tảng. AI FDE đang tự động hóa vai trò.",
        "signals": ["Delta/Echo model", "Bootcamp sprint", "AI FDE agent", "Apollo CI/CD"],
        "url": "https://www.palantir.com/docs/foundry/ai-fde/",
    },
    {
        "name": "OpenAI",
        "status": "Adopting",
        "level": 4,
        "summary": "Tuyển FDE từ Palantir (Bob McGrew). Đang xây chương trình FDE riêng để đưa GPT/o1 vào enterprise workflow.",
        "signals": ["Enterprise deployment team", "Customer success engineers"],
        "url": None,
    },
    {
        "name": "Anthropic",
        "status": "Adopting",
        "level": 3,
        "summary": "Reuters (2026) xác nhận Anthropic tuyển FDE sau khi thấy model này hiệu quả cho enterprise AI integration.",
        "signals": ["Claude enterprise embedding", "FDE hiring push"],
        "url": None,
    },
    {
        "name": "AWS",
        "status": "Partial",
        "level": 3,
        "summary": "Customer Solutions Architects đóng vai trò tương tự FDE nhưng ít embedded hơn. Bedrock + SageMaker deployment support.",
        "signals": ["Solutions Architects", "ProServe team"],
        "url": None,
    },
    {
        "name": "Google",
        "status": "Partial",
        "level": 2,
        "summary": "Customer Engineers + Professional Services. Ít nhúng sâu hơn Palantir, tập trung vào platform adoption.",
        "signals": ["Customer Engineers", "PSO team"],
        "url": None,
    },
    {
        "name": "FPT / SIer",
        "status": "Opportunity",
        "level": 1,
        "summary": "Cơ hội: áp dụng FDE model cho AI-SDLC rollout tại khách hàng Nhật. Gap hiện tại: kỹ sư chưa được train để embedded vào quy trình khách hàng.",
        "signals": ["AI-SDLC consulting", "Japan SIer market"],
        "url": None,
    },
]

FDE_CONCEPTS = [
    {
        "id": "delta_echo",
        "title": "Delta / Echo Model",
        "icon": "⚙",
        "body": "Delta = FDE (kỹ sư code, cấu hình Foundry). Echo = Deployment Strategist (chuyên gia nghiệp vụ, không code). Cặp Delta-Echo làm việc song song để đảm bảo giải pháp đúng kỹ thuật lẫn phù hợp tổ chức.",
        "source": "Palantir Blog 2020",
    },
    {
        "id": "bootcamp",
        "title": "Bootcamp Sprint",
        "icon": "⚡",
        "body": "Sprint 1–5 ngày với dữ liệu thật của khách hàng để demo giải pháp khả thi. Khác PoC: Palantir tự build, không để khách tự làm. Mục tiêu: chứng minh giá trị trước khi ký hợp đồng dài hạn.",
        "source": "Everest Group 2023",
    },
    {
        "id": "outcomes",
        "title": "Outcome-based Contract",
        "icon": "🎯",
        "body": "Hợp đồng tied to KPI kinh doanh, không phải tính năng. Ví dụ: giảm 10% tồn kho, giảm 20% downtime. FDE không thành công nếu KPI không đạt — đây là điểm khác biệt với tư vấn truyền thống.",
        "source": "LinkedIn / Palantir",
    },
    {
        "id": "ontology",
        "title": "Ontology (Enterprise Data Model)",
        "icon": "🗂",
        "body": "FDE xây ontology phản ánh cách doanh nghiệp vận hành: objects, relationships, permissions. Đây là bước đầu tiên mọi FDE làm khi nhúng vào khách hàng, trước khi build bất cứ thứ gì.",
        "source": "Palantir Docs / Lê Huy 2026",
    },
    {
        "id": "ai_fde",
        "title": "AI FDE (Agent Layer)",
        "icon": "🤖",
        "body": "Palantir đang tự động hóa vai trò FDE bằng AI agent: dịch lệnh ngôn ngữ tự nhiên thành thao tác Foundry. AI FDE tuân thủ đúng quyền truy cập của user, có vòng kiểm tra trước khi thay đổi hệ thống.",
        "source": "Palantir Docs — AI FDE Overview 2024",
    },
    {
        "id": "flywheel",
        "title": "Services-as-Software Flywheel",
        "icon": "🔄",
        "body": "93% doanh nghiệp mắc kẹt giai đoạn thử nghiệm AI vì thiếu lớp FDE. FDE là activation layer chuyển AI từ pilot sang production. Palantir thành công vì gần gũi vận hành thực tế, không chỉ vì AI mạnh hơn.",
        "source": "HFS Research / Lê Huy 2026",
    },
]

FDE_RESEARCH_QUEUE = [
    {
        "title": "A Day in the Life of a Palantir Forward Deployed Engineer",
        "url": "https://blog.palantir.com/a-day-in-the-life-of-a-palantir-forward-deployed-software-engineer-e2a6fecd0608",
        "type": "Primary source",
        "priority": "high",
        "note": "Định nghĩa chính thức của Palantir về FDE (Delta). Đọc để hiểu baseline.",
    },
    {
        "title": "Palantir AI FDE — Official Docs",
        "url": "https://www.palantir.com/docs/foundry/ai-fde/",
        "type": "Product docs",
        "priority": "high",
        "note": "AI FDE agent điều phối Foundry qua ngôn ngữ tự nhiên — hướng tiến hóa của mô hình.",
    },
    {
        "title": "Forward Deployed Engineer — The Hottest Job in AI (Reuters 2026)",
        "url": "https://www.reuters.com/technology/artificial-intelligence/forward-deployed-engineer-hottest-job-ai-2026/",
        "type": "Market signal",
        "priority": "high",
        "note": "Demand tăng 42x (2023–2025). OpenAI và Anthropic đang tuyển FDE. Đọc để có market proof point.",
    },
    {
        "title": "Marty Cagan — The FDE Concept (SVPG 2025)",
        "url": "https://www.svpg.com/the-fde-concept/",
        "type": "Expert analysis",
        "priority": "medium",
        "note": "Cagan giải thích FDE từ góc độ Product Management — tốt cho việc explain với khách hàng.",
    },
    {
        "title": "Everest Group — Palantir as Category of One",
        "url": "https://www.everestgrp.com/",
        "type": "Analyst report",
        "priority": "medium",
        "note": "Everest xác nhận mô hình product + embedded team của Palantir. Dùng làm proof point độc lập.",
    },
]


@router.get("/intel/fde")
def get_fde_intel(days_back: int = 60):
    """FDE research tab: articles + concepts + actor adoption tracker."""
    all_articles = list_articles(limit=500, days_back=days_back)

    fde_articles = []
    for a in all_articles:
        text = " ".join([
            (a.get("title") or ""),
            (a.get("summary") or ""),
            (a.get("relevance") or ""),
            (a.get("source") or ""),
        ]).lower()
        if any(kw in text for kw in FDE_KEYWORDS):
            fde_articles.append({
                "title": a.get("title", ""),
                "url": a.get("url", ""),
                "source": a.get("source", ""),
                "date": a.get("date", ""),
                "summary": (a.get("relevance") or a.get("summary") or "")[:240],
                "goal_score": a.get("goal_score"),
            })

    fde_articles.sort(key=lambda x: (x.get("date") or ""), reverse=True)

    return {
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "article_count": len(fde_articles),
        "articles": fde_articles[:20],
        "concepts": FDE_CONCEPTS,
        "actors": FDE_ACTORS,
        "research_queue": FDE_RESEARCH_QUEUE,
    }


@router.post("/intel/articles/{slug}/mark-used")
def mark_used(slug: str):
    state = _read_state()
    article_state = state.setdefault("articles", {}).setdefault(slug, {})
    article_state["used_status"] = "used"
    article_state["used_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    _write_state(state)
    return {"slug": slug, "used_status": "used"}


@router.post("/intel/articles/{slug}/mark-unused")
def mark_unused(slug: str):
    state = _read_state()
    article_state = state.setdefault("articles", {}).setdefault(slug, {})
    article_state["used_status"] = "unused"
    article_state["unused_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    _write_state(state)
    return {"slug": slug, "used_status": "unused"}
