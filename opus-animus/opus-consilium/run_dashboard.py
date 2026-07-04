"""
OPUS ANIMUS HOME — local web dashboard backend

Canonical Home UI lives at:
../apps/opus-home/index.html
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from api.dashboard import router as dashboard_router
from api.goals     import router as goals_router
from api.articles  import router as articles_router
from api.actions   import router as actions_router
from api.intel     import router as intel_router
from api.actio     import router as actio_router

app = FastAPI(title="OPUS ANIMUS HOME", docs_url=None, redoc_url=None)


@app.middleware("http")
async def no_cache_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8765"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router, prefix="/api")
app.include_router(goals_router,     prefix="/api")
app.include_router(articles_router,  prefix="/api")
app.include_router(actions_router,   prefix="/api")
app.include_router(intel_router,     prefix="/api")
app.include_router(actio_router,     prefix="/api")

# Serve Opus Animus Home last — catches everything else
home_dir = Path(__file__).parent.parent / "apps" / "opus-home"
if not home_dir.exists():
    raise RuntimeError(f"Opus Home UI directory missing: {home_dir}")
app.mount("/", StaticFiles(directory=str(home_dir), html=True), name="static")

if __name__ == "__main__":
    print("OPUS ANIMUS HOME -> http://localhost:8765")
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="warning")
