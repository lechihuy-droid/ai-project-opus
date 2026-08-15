from __future__ import annotations

from fastapi import APIRouter, Query

from services import cicd

router = APIRouter()


@router.get("/api/cicd/overview")
def api_cicd_overview() -> dict[str, object]:
    return cicd.get_overview_stats()


@router.get("/api/cicd/github-status")
def api_cicd_github_status() -> dict[str, object]:
    return cicd.get_github_token_status()


@router.get("/api/cicd/workflows")
def api_cicd_workflows() -> list[dict[str, object]]:
    return cicd.get_workflows()


@router.get("/api/cicd/workflow-runs")
def api_cicd_workflow_runs(
    workflow_id: str = "",
    per_page: int = Query(default=30, ge=1, le=100),
) -> list[dict[str, object]]:
    return cicd.get_workflow_runs(workflow_id, per_page)


@router.get("/api/cicd/branches")
def api_cicd_branches() -> dict[str, object]:
    return cicd.get_branches()


@router.get("/api/cicd/worktrees")
def api_cicd_worktrees() -> list[dict[str, str]]:
    return cicd.get_worktrees()


@router.get("/api/cicd/commits")
def api_cicd_commits(limit: int = Query(default=10, ge=1, le=100)) -> list[dict[str, str]]:
    return cicd.get_recent_commits(limit)


@router.get("/api/cicd/activity")
def api_cicd_activity(limit: int = Query(default=20, ge=1, le=100)) -> list[dict[str, object]]:
    return cicd.get_recent_activity(limit)


@router.get("/api/cicd/projects")
def api_cicd_projects() -> dict[str, object]:
    return cicd.get_project_health()


@router.get("/api/cicd/quality-gates")
def api_cicd_quality_gates() -> dict[str, object]:
    return cicd.get_quality_gates()


@router.get("/api/cicd/management-rules")
def api_cicd_management_rules() -> dict[str, object]:
    return cicd.get_management_rules()


@router.post("/api/cicd/refresh")
def api_cicd_refresh() -> dict[str, object]:
    return cicd.refresh_cache()
