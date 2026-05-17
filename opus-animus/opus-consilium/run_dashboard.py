"""
OPUS ANIMUS HOME — local web dashboard
python run_dashboard.py
→ http://localhost:8765
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

app = FastAPI(title="OPUS ANIMUS HOME", docs_url=None, redoc_url=None)

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

# PMP Quiz — explicit routes so FastAPI doesn't swallow with the catch-all mount
pmp_dir = Path(__file__).parent.parent / "apps" / "pmp-quiz"

@app.get("/pmp", include_in_schema=False)
@app.get("/pmp/", include_in_schema=False)
def pmp_index():
    index = pmp_dir / "index.html"
    return Response(index.read_bytes(), media_type="text/html")

# Serve pmp-quiz assets: /pmp/assets/*, /pmp/data/*
if pmp_dir.exists():
    app.mount("/pmp", StaticFiles(directory=str(pmp_dir)), name="pmp")

# Serve dashboard/ last — catches everything else
dashboard_dir = Path(__file__).parent / "dashboard"
dashboard_dir.mkdir(exist_ok=True)
app.mount("/", StaticFiles(directory=str(dashboard_dir), html=True), name="static")

if __name__ == "__main__":
    print("OPUS ANIMUS HOME -> http://localhost:8765")
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="warning")
