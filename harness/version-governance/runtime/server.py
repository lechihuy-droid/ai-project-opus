import asyncio
import os
import uuid
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlsplit

import httpx
import mlflow
from fastapi import BackgroundTasks, FastAPI, HTTPException
from pydantic import BaseModel, Field

from graph import build_graph

app = FastAPI()
runs: dict[str, dict[str, Any]] = {}

# callback_url đến từ request body. Nếu nhận host tuỳ ý thì endpoint này thành SSRF: người gọi trỏ
# callback vào service nội bộ bất kỳ (postgres, mlflow, metadata endpoint) và runtime sẽ POST tới đó.
# Chỉ cho phép đúng origin của vgov-api đã cấu hình.
ALLOWED_CALLBACK_ORIGIN = os.getenv("VGOV_CALLBACK_BASE_URL", "http://vgov-api:8810")


def _assert_callback_allowed(callback_url: str) -> None:
    allowed = urlsplit(ALLOWED_CALLBACK_ORIGIN)
    target = urlsplit(callback_url)
    if (target.scheme, target.netloc) != (allowed.scheme, allowed.netloc):
        raise HTTPException(
            status_code=422,
            detail={
                "code": "CALLBACK_URL_NOT_ALLOWED",
                "message": f"callback_url must point at {allowed.scheme}://{allowed.netloc}",
            },
        )


class Prompt(BaseModel):
    node: str
    name: str
    version: int
    template: str


class StartRunRequest(BaseModel):
    correlation_id: str
    run_id: str
    entrypoint: str
    state_schema_version: str
    model_profile: str
    model_name: str
    prompts: list[Prompt]
    input_payload: str
    input_hash: str
    callback_url: str
    config: dict[str, Any] = Field(default_factory=dict)


async def _callback(request: StartRunRequest, runtime_id: str) -> None:
    item = runs[runtime_id]
    item["status"] = "running"
    try:
        mlflow.set_experiment("vgov")
        with mlflow.start_run(tags={"correlation_id": request.correlation_id}) as trace:
            result = build_graph().invoke(
                {
                    "rd_text": request.input_payload,
                    "prompts": {prompt.node: prompt.template for prompt in request.prompts},
                    "model": request.model_name,
                    "parsed": "",
                    "draft": "",
                    "reviewed": "",
                }
            )
            body = {
                "status": "SUCCEEDED",
                "output": {"content": result["reviewed"], "mime": "text/markdown"},
                "trace_id": trace.info.run_id,
            }
        terminal, extra = "success", {"trace_id": trace.info.run_id}
    except Exception as exc:
        body = {"status": "FAILED", "error": str(exc)}
        terminal, extra = "error", {"detail": str(exc)}

    # Trạng thái vẫn là "running" cho tới khi callback được nhận.
    #
    # Nếu báo terminal ngay sau khi graph xong, có một khe giữa "graph xong" và "callback tới nơi"
    # mà get_status() đã trả SUCCEEDED trong khi vgov-api chưa có row runtime_callback nào.
    # reconcile() [SD §4.1] thấy đúng điều kiện đó sẽ đóng run là CALLBACK_LOST và KHÔNG tạo
    # artifact_revision — callback tới sau chỉ sửa được status, còn client đã đọc phải run
    # "SUCCEEDED nhưng không có output". Đây là race thật, đã quan sát được khi chạy demo.
    #
    # Chỉ chuyển terminal SAU khi callback thành công => get_status() terminal kéo theo callback
    # chắc chắn đã được nhận, nên reconcile() chỉ còn kích hoạt khi callback mất thật.
    headers = {"Idempotency-Key": request.correlation_id}
    async with httpx.AsyncClient() as client:
        for attempt in range(3):
            try:
                response = await client.post(request.callback_url, json=body, headers=headers)
                if response.status_code == 200:
                    break
            except httpx.HTTPError:
                pass
            await asyncio.sleep(2**attempt)

    item.update(status=terminal, completed_at=datetime.now(timezone.utc).isoformat(), **extra)


@app.post("/runs", status_code=202)
async def start_run(request: StartRunRequest, tasks: BackgroundTasks) -> dict[str, Any]:
    _assert_callback_allowed(request.callback_url)
    runtime_id = str(uuid.uuid4())
    runs[runtime_id] = {"status": "pending"}
    tasks.add_task(_callback, request, runtime_id)
    return {
        "provider": "langgraph",
        "runtime_run_id": runtime_id,
        "runtime_thread_id": None,
        "status": {"canonical": "PENDING", "provider_status": "pending"},
    }


@app.get("/runs/{runtime_id}")
async def get_run(runtime_id: str) -> dict[str, Any]:
    if runtime_id not in runs:
        raise HTTPException(status_code=404, detail="run not found")
    item = runs[runtime_id]
    mapping = {
        "pending": "PENDING",
        "running": "RUNNING",
        "success": "SUCCEEDED",
        "error": "FAILED",
        "cancelled": "CANCELLED",
    }
    return {
        "canonical": mapping.get(item["status"], "FAILED"),
        "provider_status": item["status"],
        "detail": item.get("detail"),
    }


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
