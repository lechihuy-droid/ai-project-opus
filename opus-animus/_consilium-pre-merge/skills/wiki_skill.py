"""
Phase 6 — Hermes Skill wrapper for Module C Personal Wiki Agent.

Standalone usage (without Hermes runtime):
  from skills.wiki_skill import WikiSkill
  skill = WikiSkill()
  result = skill.run_from_text("save https://example.com")
  result = skill.run_from_text("what do I know about RAG?")

Hermes integration:
  Register as a Hermes skill via skill.as_hermes_skill()
  Hermes calls skill.run(intent, args, context) directly.
"""
from dataclasses import dataclass, field
from skills.intent_classifier import classify, Intent


@dataclass
class SkillResult:
    status: str                         # ok | error | empty | no_match
    response: str                       # human-readable reply
    metadata: dict = field(default_factory=dict)


@dataclass
class ConversationContext:
    """Lightweight context — Hermes passes its own richer version when available."""
    last_wiki_page: str | None = None
    last_query: str | None = None
    history: list[str] = field(default_factory=list)


class WikiSkill:
    """
    Personal Wiki Skill — wraps ingest/query/lint/digest operations.
    Can run standalone or be registered as a Hermes skill.
    """

    name = "personal_wiki"
    description = "Manage personal knowledge wiki — save sources, query knowledge, run maintenance."

    def run(self, intent: Intent, context: ConversationContext | None = None) -> SkillResult:
        ctx = context or ConversationContext()

        if intent.operation == "ingest":
            return self._ingest(intent.args, ctx)
        elif intent.operation == "query":
            return self._query(intent.args, ctx)
        elif intent.operation == "lint":
            return self._lint()
        elif intent.operation == "digest":
            return self._digest()
        elif intent.operation == "help":
            return self._help()
        else:
            return SkillResult(
                status="unknown",
                response=(
                    "Khong hieu lenh. Thu:\n"
                    "- /wiki <url> — luu bai viet\n"
                    "- /wiki ask <cau hoi> — hoi wiki\n"
                    "- /wiki digest — bao cao tuan\n"
                    "- /wiki help — huong dan"
                ),
            )

    def run_from_text(self, text: str, has_attachment: bool = False,
                      attachment_path: str | None = None,
                      context: ConversationContext | None = None) -> SkillResult:
        """
        Entry point for natural language input (Hermes or direct).
        Classifies intent then dispatches.
        """
        intent = classify(text, has_attachment=has_attachment)

        # If attachment present, override source
        if has_attachment and attachment_path and intent.operation == "ingest":
            intent.args["source"] = attachment_path
            intent.args["type"] = "file"

        # Context-aware: "this" / "cái này" refers to last page
        if intent.operation == "query" and context and context.last_wiki_page:
            q = intent.args.get("question", "")
            if any(w in q.lower() for w in ["this", "cái này", "bài này", "nó"]):
                intent.args["question"] = f"{q} (context: {context.last_wiki_page})"

        return self.run(intent, context)

    # ── private operation handlers ──────────────────────────────────────────

    def _ingest(self, args: dict, ctx: ConversationContext) -> SkillResult:
        source = args.get("source")
        if not source:
            return SkillResult("error", "No source provided. Send a URL or file.")

        try:
            from wiki_ops.ingest import run_ingest
            result = run_ingest(source, verbose=False)
        except Exception as e:
            return SkillResult("error", f"Ingest failed: {e}", {"error": str(e)})

        if result["status"] == "ok":
            ctx.last_wiki_page = result["page_path"]
            return SkillResult(
                status="ok",
                response=f"Saved to {result['page_path']}",
                metadata=result,
            )
        return SkillResult("error", f"Error: {result.get('error')}", result)

    def _query(self, args: dict, ctx: ConversationContext) -> SkillResult:
        question = args.get("question", "").strip()
        if not question:
            return SkillResult("error", "No question provided.")

        try:
            from wiki_ops.query import run_query
            result = run_query(question, verbose=False)
        except Exception as e:
            return SkillResult("error", f"Query failed: {e}")

        ctx.last_query = question
        answer = result["answer"]
        if result.get("pages_read"):
            sources = ", ".join(f"[[{p}]]" for p in result["pages_read"])
            answer += f"\n\nSources: {sources}"

        return SkillResult(
            status=result["status"],
            response=answer,
            metadata={"pages_read": result.get("pages_read", [])},
        )

    def _lint(self) -> SkillResult:
        try:
            from wiki_ops.lint import run_lint
            report = run_lint(send_telegram=False)
            return SkillResult("ok", report)
        except Exception as e:
            return SkillResult("error", f"Lint failed: {e}")

    def _digest(self) -> SkillResult:
        try:
            from wiki_ops.lint import run_lint
            report = run_lint(send_telegram=False)
            return SkillResult("ok", f"Weekly digest:\n\n{report}")
        except Exception as e:
            return SkillResult("error", f"Digest failed: {e}")

    def _help(self) -> SkillResult:
        return SkillResult(
            status="ok",
            response=(
                "Wiki commands:\n"
                "/wiki <url>        — save article/paper\n"
                "/wiki note <text>  — save plain text note\n"
                "/wiki ask <q>      — query your wiki\n"
                "/wiki digest       — weekly lint report\n"
                "/wiki help         — this message\n\n"
                "Natural language also works:\n"
                "\"save this\" + URL, \"what do I know about X?\", \"weekly summary\""
            ),
        )

    def as_hermes_skill(self) -> dict:
        """Return Hermes skill registration dict."""
        return {
            "name": self.name,
            "description": self.description,
            "handler": self.run_from_text,
            "triggers": ["/wiki", "save this", "what do I know", "weekly digest"],
        }
