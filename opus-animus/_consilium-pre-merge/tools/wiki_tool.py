from datetime import datetime
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
from utils.config import wiki_dir, raw_dir, logs_dir


class SaveWikiInput(BaseModel):
    topic: str = Field(description="Topic name: AI or JP_STOCK")
    content: str = Field(description="Full markdown content to save")


class ReadWikiInput(BaseModel):
    topic: str = Field(description="Topic name: AI or JP_STOCK")


class SaveWikiTool(BaseTool):
    name: str = "Save Wiki"
    description: str = "Save research results as a markdown file in the wiki folder."
    args_schema: type[BaseModel] = SaveWikiInput

    def _run(self, topic: str, content: str) -> str:
        stamp = datetime.now().strftime("%Y-%m-%d-%H%M")
        filename = f"{stamp}-research-{topic}.md"

        # Ephemeral output for Module B ReadWikiTool (backward compat)
        wiki_path = wiki_dir() / filename
        wiki_path.write_text(content, encoding="utf-8")

        # Save to raw/research/ — separate from articles, picked up by ingest_new_raw()
        raw_path = raw_dir("research") / filename
        raw_path.write_text(content, encoding="utf-8")

        return str(wiki_path)


class ReadWikiTool(BaseTool):
    name: str = "Read Latest Wiki"
    description: str = "Read the most recent wiki file for a given topic."
    args_schema: type[BaseModel] = ReadWikiInput

    def _run(self, topic: str) -> str:
        files = sorted(wiki_dir().glob(f"*-*{topic}.md"), reverse=True)
        if not files:
            return f"[Wiki] No file found for topic: {topic}"
        content = files[0].read_text(encoding="utf-8")
        return f"[Wiki: {files[0].name}]\n{content}"
