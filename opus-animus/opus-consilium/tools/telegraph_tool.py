import requests
import markdown as md_lib
from pathlib import Path
from crewai.tools import BaseTool
from pydantic import BaseModel, Field

TOKEN_FILE = Path(__file__).parent.parent / ".telegraph_token"
API = "https://api.telegra.ph"


def get_token() -> str:
    if TOKEN_FILE.exists():
        return TOKEN_FILE.read_text().strip()
    resp = requests.post(f"{API}/createAccount", json={
        "short_name": "PersonalAgent",
        "author_name": "Personal AI Agent"
    }, timeout=10).json()
    token = resp["result"]["access_token"]
    TOKEN_FILE.write_text(token)
    return token


def publish(title: str, html_content: str) -> str:
    token = get_token()
    resp = requests.post(f"{API}/createPage", json={
        "access_token": token,
        "title": title,
        "content": [{"tag": "p", "children": [html_content]}],
        "author_name": "Personal AI Agent",
        "return_content": False,
    }, timeout=15).json()
    if resp.get("ok"):
        return f"https://telegra.ph/{resp['result']['path']}"
    return f"[Telegraph] Error: {resp.get('error', 'unknown')}"


class PublishInput(BaseModel):
    title: str = Field(description="Page title")
    content: str = Field(description="Markdown content to publish")


class TelegraphTool(BaseTool):
    name: str = "Publish to Telegraph"
    description: str = "Publish markdown content to Telegraph and return the public URL."
    args_schema: type[BaseModel] = PublishInput

    def _run(self, title: str, content: str) -> str:
        try:
            html = md_lib.markdown(content, extensions=["tables"])
            return publish(title, html)
        except Exception as e:
            return f"[Telegraph] Error: {e}"
