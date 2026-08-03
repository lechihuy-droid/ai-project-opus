import os
from typing import TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt


class WorkflowState(TypedDict, total=False):
    requirement: str
    parsed_requirement: dict
    plan: dict
    api_spec: dict
    db_spec: dict
    screen_spec: dict
    merged_design: dict
    review_score: int
    review_status: str
    review_issues: list[str]
    revision_count: int
    human_decision: str
    api_review_status: str
    api_issues: list[str]


class APIDesignState(TypedDict, total=False):
    parsed_requirement: dict
    api_revision_count: int
    api_spec: dict
    api_structurally_valid: bool
    api_review_status: str
    api_issues: list[str]


def parse_requirement(state: WorkflowState) -> dict:
    requirement = state["requirement"]
    parsed = {
        "function_id": "FNC001",
        "function_name": "Create Customer",
        "actors": ["Operator"],
        "entities": ["Customer"],
        "business_rules": [
            "Customer name is mandatory",
            "Email must be unique",
            "Email format must be validated",
        ],
        "requested_artifacts": ["api", "database", "screen"],
        "source_text": requirement,
    }
    print("[NODE] parse_requirement")
    return {
        "parsed_requirement": parsed,
        "revision_count": state.get("revision_count", 0),
    }


def plan_design(state: WorkflowState) -> dict:
    parsed = state["parsed_requirement"]
    plan = {
        "function_id": parsed["function_id"],
        "tasks": [
            {"artifact_type": "API_SPEC", "node": "generate_api"},
            {"artifact_type": "DB_SPEC", "node": "generate_db"},
            {"artifact_type": "SCREEN_SPEC", "node": "generate_screen"},
        ],
    }
    print("[NODE] plan_design")
    return {"plan": plan}


# ---- API Design Subgraph -------------------------------------------------
# generate_api_sub -> validate_api -> review_api -> pass? -> END
#                                              \-> revise_api -> generate_api_sub
# State (APIDesignState) is private to this subgraph: the parent never sees
# api_revision_count/api_issues, only the final api_spec.


def generate_api_sub(state: APIDesignState) -> dict:
    parsed = state["parsed_requirement"]
    revision_count = state.get("api_revision_count", 0)
    responses = {
        "201": "Customer created",
        "409": "Email already exists",
    }
    # Cố ý thiếu response 400 ở lần đầu để quan sát vòng lặp nội bộ subgraph.
    if revision_count > 0:
        responses["400"] = "Invalid request"
    api_spec = {
        "artifact_id": f'{parsed["function_id"]}_API_SPEC',
        "revision": revision_count + 1,
        "endpoint": "/api/customers",
        "method": "POST",
        "request": {
            "name": "string, required",
            "email": "string, required",
            "phone": "string, optional",
        },
        "responses": responses,
    }
    print(f"[API-SUBGRAPH] generate_api_sub — revision={revision_count + 1}")
    return {"api_spec": api_spec}


def validate_api(state: APIDesignState) -> dict:
    api_spec = state["api_spec"]
    structurally_valid = (
        api_spec["endpoint"].startswith("/api/") and api_spec["method"] == "POST"
    )
    print(f"[API-SUBGRAPH] validate_api — structurally_valid={structurally_valid}")
    return {"api_structurally_valid": structurally_valid}


def review_api(state: APIDesignState) -> dict:
    api_spec = state["api_spec"]
    issues: list[str] = []
    if not state.get("api_structurally_valid", False):
        issues.append("API endpoint/method failed structural validation.")
    if "400" not in api_spec["responses"]:
        issues.append("API specification is missing the invalid-request (400) response.")
    status = "FAIL" if issues else "PASS"
    print(f"[API-SUBGRAPH] review_api — status={status}, issues={issues}")
    return {"api_review_status": status, "api_issues": issues}


def revise_api(state: APIDesignState) -> dict:
    current_revision = state.get("api_revision_count", 0)
    print(f"[API-SUBGRAPH] revise_api — revision={current_revision + 1}")
    return {"api_revision_count": current_revision + 1}


def route_after_api_review(state: APIDesignState) -> str:
    if state["api_review_status"] == "PASS":
        return "pass"
    if state.get("api_revision_count", 0) >= 2:
        return "stop"
    return "revise"


def build_api_subgraph():
    builder = StateGraph(APIDesignState)
    builder.add_node("generate_api_sub", generate_api_sub)
    builder.add_node("validate_api", validate_api)
    builder.add_node("review_api", review_api)
    builder.add_node("revise_api", revise_api)
    builder.add_edge(START, "generate_api_sub")
    builder.add_edge("generate_api_sub", "validate_api")
    builder.add_edge("validate_api", "review_api")
    builder.add_conditional_edges(
        "review_api",
        route_after_api_review,
        {
            "pass": END,
            "revise": "revise_api",
            "stop": END,
        },
    )
    builder.add_edge("revise_api", "generate_api_sub")
    return builder.compile()


api_subgraph = build_api_subgraph()


def generate_api(state: WorkflowState) -> dict:
    # Parent node = wrapper quanh subgraph. Toàn bộ vòng lặp nội bộ chạy
    # gọn trong MỘT super-step của parent graph (parent chỉ thấy 1 lần
    # invoke, không thấy các bước generate/validate/review/revise bên trong).
    print("[NODE] generate_api — delegating to API design subgraph")
    sub_result = api_subgraph.invoke(
        {
            "parsed_requirement": state["parsed_requirement"],
            "api_revision_count": 0,
        }
    )
    print(
        "[NODE] generate_api — subgraph finished "
        f"(internal revisions={sub_result.get('api_revision_count', 0)})"
    )
    return {
        "api_spec": sub_result["api_spec"],
        "api_review_status": sub_result.get("api_review_status"),
        "api_issues": sub_result.get("api_issues", []),
    }


def generate_db(state: WorkflowState) -> dict:
    parsed = state["parsed_requirement"]
    revision_count = state.get("revision_count", 0)
    db_spec = {
        "artifact_id": f'{parsed["function_id"]}_DB_SPEC',
        "revision": revision_count + 1,
        "table": "customers",
        "columns": [
            {"name": "customer_id", "type": "UUID", "constraint": "PRIMARY KEY"},
            {"name": "name", "type": "VARCHAR(200)", "constraint": "NOT NULL"},
            {"name": "email", "type": "VARCHAR(320)", "constraint": "NOT NULL UNIQUE"},
            {"name": "phone", "type": "VARCHAR(30)", "constraint": "NULL"},
        ],
    }
    print("[NODE] generate_db")
    return {"db_spec": db_spec}


def generate_screen(state: WorkflowState) -> dict:
    parsed = state["parsed_requirement"]
    revision_count = state.get("revision_count", 0)
    screen_spec = {
        "artifact_id": f'{parsed["function_id"]}_SCREEN_SPEC',
        "revision": revision_count + 1,
        "screen_name": "Customer Registration",
        "fields": [
            {"name": "Customer name", "required": True},
            {"name": "Email", "required": True},
            {"name": "Phone number", "required": False},
        ],
        "actions": ["Register", "Cancel"],
        "success_message": "Customer registered successfully.",
    }
    print("[NODE] generate_screen")
    return {"screen_spec": screen_spec}


def merge_design(state: WorkflowState) -> dict:
    merged_design = {
        "api": state["api_spec"],
        "database": state["db_spec"],
        "screen": state["screen_spec"],
    }
    print("[NODE] merge_design")
    return {"merged_design": merged_design}


def review_design(state: WorkflowState) -> dict:
    revision_count = state.get("revision_count", 0)
    design = state["merged_design"]
    issues: list[str] = []
    api_spec = design["api"]
    db_spec = design["database"]
    screen_spec = design["screen"]
    db_columns = {column["name"]: column for column in db_spec["columns"]}
    if "email" not in db_columns:
        issues.append("Database specification is missing the email column.")
    if not screen_spec.get("success_message"):
        issues.append("Screen specification is missing the success message.")
    # Cố ý fail ở revision đầu tiên để quan sát revision loop.
    if revision_count == 0:
        issues.append("Traceability matrix has not yet been generated.")
    # Subgraph tự "give up" sau khi hết retry nội bộ vẫn phải được phản ánh
    # lên review cấp cha, không được để lọt qua human_approval.
    if state.get("api_review_status") == "FAIL":
        issues.extend(state.get("api_issues", []))
    if issues:
        status = "FAIL"
        score = 75
    else:
        status = "PASS"
        score = 95
    print(f"[NODE] review_design — status={status}, score={score}")
    return {
        "review_status": status,
        "review_score": score,
        "review_issues": issues,
    }


def revise_context(state: WorkflowState) -> dict:
    current_revision = state.get("revision_count", 0)
    print(f"[NODE] revise_context — revision={current_revision + 1}")
    return {"revision_count": current_revision + 1}


def route_after_review(state: WorkflowState) -> str:
    status = state["review_status"]
    revision_count = state.get("revision_count", 0)
    if status == "PASS":
        return "approved"
    if revision_count >= 2:
        return "stop"
    return "revise"


def human_approval(state: WorkflowState) -> dict:
    # interrupt() dừng graph tại đây và lưu state vào checkpoint; khác
    # với input(), tiến trình không bị block — có thể resume sau, ở
    # process khác, miễn dùng lại đúng thread_id.
    decision = interrupt(
        {
            "type": "BD_APPROVAL_REQUEST",
            "review_score": state["review_score"],
            "review_issues": state["review_issues"],
            "design": state["merged_design"],
            "allowed_actions": ["APPROVE", "REJECT"],
        }
    )
    print(f"[NODE] human_approval — decision={decision}")
    return {"human_decision": decision}


def route_after_human(state: WorkflowState) -> str:
    if state["human_decision"] == "APPROVE":
        return "approved"
    if state.get("revision_count", 0) >= 2:
        print(
            "[NODE] route_after_human — stopped after exhausting revisions "
            "following human rejection"
        )
        return "stop"
    return "revise"


def build_graph():
    builder = StateGraph(WorkflowState)
    builder.add_node("parse_requirement", parse_requirement)
    builder.add_node("plan_design", plan_design)
    builder.add_node("generate_api", generate_api)
    builder.add_node("generate_db", generate_db)
    builder.add_node("generate_screen", generate_screen)
    builder.add_node("merge_design", merge_design)
    builder.add_node("review_design", review_design)
    builder.add_node("revise_context", revise_context)
    builder.add_node("human_approval", human_approval)

    builder.add_edge(START, "parse_requirement")
    builder.add_edge("parse_requirement", "plan_design")

    # Fan-out: chạy ba generator trong cùng super-step.
    builder.add_edge("plan_design", "generate_api")
    builder.add_edge("plan_design", "generate_db")
    builder.add_edge("plan_design", "generate_screen")

    # Fan-in: merge chỉ chạy sau khi cả ba node hoàn thành.
    builder.add_edge(
        ["generate_api", "generate_db", "generate_screen"],
        "merge_design",
    )

    builder.add_edge("merge_design", "review_design")

    builder.add_conditional_edges(
        "review_design",
        route_after_review,
        {
            "approved": "human_approval",
            "revise": "revise_context",
            "stop": END,
        },
    )

    # Revision loop.
    builder.add_edge("revise_context", "generate_api")
    builder.add_edge("revise_context", "generate_db")
    builder.add_edge("revise_context", "generate_screen")

    builder.add_conditional_edges(
        "human_approval",
        route_after_human,
        {
            "approved": END,
            "revise": "revise_context",
            "stop": END,
        },
    )

    checkpointer = InMemorySaver()
    return builder.compile(checkpointer=checkpointer)


def load_requirement() -> str:
    with open("input/sample_rd.txt", "r", encoding="utf-8") as file:
        return file.read()


def main():
    graph = build_graph()
    initial_state: WorkflowState = {
        "requirement": load_requirement(),
        "revision_count": 0,
    }
    config = {"configurable": {"thread_id": "rd-bd-run-001"}}
    result = graph.invoke(initial_state, config=config)

    while "__interrupt__" in result:
        payload = result["__interrupt__"][0].value
        print("\n[INTERRUPT] human_approval is waiting for a decision")
        print(payload)
        allowed_actions = payload["allowed_actions"]
        env_decision = os.environ.get("HUMAN_DECISION")
        if env_decision is None:
            decision = input("Decision (APPROVE/REJECT): ").strip().upper()
            while decision not in allowed_actions:
                print(f"Invalid decision '{decision}'. Allowed: {allowed_actions}")
                decision = input("Decision (APPROVE/REJECT): ").strip().upper()
        else:
            decision = env_decision
            print(f"(HUMAN_DECISION env var) -> {decision}")
            if decision not in allowed_actions:
                raise ValueError(
                    f"Invalid HUMAN_DECISION '{decision}'. Allowed: {allowed_actions}"
                )
        result = graph.invoke(Command(resume=decision), config=config)

    print("\n========== FINAL RESULT ==========")
    print(f'Review status: {result["review_status"]}')
    print(f'Review score: {result["review_score"]}')
    print(f'Revision count: {result["revision_count"]}')
    print(f'Human decision: {result.get("human_decision")}')
    print("==================================")

    checkpoints = list(graph.get_state_history(config))
    print(f"Checkpoints saved for thread rd-bd-run-001: {len(checkpoints)}")


if __name__ == "__main__":
    main()
