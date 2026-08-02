from typing import TypedDict

from langgraph.graph import END, START, StateGraph


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


def generate_api(state: WorkflowState) -> dict:
    parsed = state["parsed_requirement"]
    revision_count = state.get("revision_count", 0)
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
        "responses": {
            "201": "Customer created",
            "400": "Invalid request",
            "409": "Email already exists",
        },
    }
    print("[NODE] generate_api")
    return {"api_spec": api_spec}


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
    if "409" not in api_spec["responses"]:
        issues.append("API specification is missing duplicate-email response.")
    db_columns = {column["name"]: column for column in db_spec["columns"]}
    if "email" not in db_columns:
        issues.append("Database specification is missing the email column.")
    if not screen_spec.get("success_message"):
        issues.append("Screen specification is missing the success message.")
    # Cố ý fail ở revision đầu tiên để quan sát revision loop.
    if revision_count == 0:
        issues.append("Traceability matrix has not yet been generated.")
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


def human_approval_mock(state: WorkflowState) -> dict:
    print("[NODE] human_approval_mock — automatically approved")
    return {"human_decision": "APPROVED"}


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
    builder.add_node("human_approval", human_approval_mock)

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

    builder.add_edge("human_approval", END)

    return builder.compile()


def load_requirement() -> str:
    with open("input/sample_rd.txt", "r", encoding="utf-8") as file:
        return file.read()


def main():
    graph = build_graph()
    initial_state: WorkflowState = {
        "requirement": load_requirement(),
        "revision_count": 0,
    }
    result = graph.invoke(initial_state)
    print("\n========== FINAL RESULT ==========")
    print(f'Review status: {result["review_status"]}')
    print(f'Review score: {result["review_score"]}')
    print(f'Revision count: {result["revision_count"]}')
    print(f'Human decision: {result.get("human_decision")}')
    print("==================================")


if __name__ == "__main__":
    main()
