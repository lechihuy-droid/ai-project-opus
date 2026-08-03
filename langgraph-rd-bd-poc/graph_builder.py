from typing import Any, Callable, TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import interrupt

MAX_NODES = 30

REQUIRED_CONFIG_KEYS = {
    "mock": ["output_key", "value"],
    "merge": ["output_key", "input_keys"],
    "human_approval": ["question", "decision_key"],
}


def _make_mock_node(config: dict) -> Callable:
    output_key = config["output_key"]
    value = config["value"]

    def node_fn(state: dict) -> dict:
        return {output_key: value}

    return node_fn


def _make_merge_node(config: dict) -> Callable:
    output_key = config["output_key"]
    input_keys = config["input_keys"]

    def node_fn(state: dict) -> dict:
        return {output_key: {k: state.get(k) for k in input_keys}}

    return node_fn


def _make_human_approval_node(config: dict) -> Callable:
    question = config["question"]
    decision_key = config["decision_key"]

    def node_fn(state: dict) -> dict:
        decision = interrupt({"type": "CUSTOM_APPROVAL", "question": question})
        return {decision_key: decision}

    return node_fn


NODE_FACTORIES: dict[str, Callable[[dict], Callable]] = {
    "mock": _make_mock_node,
    "merge": _make_merge_node,
    "human_approval": _make_human_approval_node,
}


def _output_keys(node: dict) -> list[str]:
    node_type = node.get("type")
    config = node.get("config", {})
    if node_type in ("mock", "merge"):
        return [config.get("output_key")]
    if node_type == "human_approval":
        return [config.get("decision_key")]
    return []


def validate_definition(definition: dict) -> list[str]:
    errors: list[str] = []
    nodes = definition.get("nodes", [])
    edges = definition.get("edges", [])

    if len(nodes) > MAX_NODES:
        errors.append(f"Too many nodes (max {MAX_NODES}).")

    node_ids = set()
    for node in nodes:
        node_id = node.get("id")
        node_type = node.get("type")
        config = node.get("config", {})
        if not node_id:
            errors.append("A node is missing an 'id'.")
            continue
        if node_id in ("__start__", "__end__"):
            errors.append(f"Node id '{node_id}' is reserved.")
        if node_id in node_ids:
            errors.append(f"Duplicate node id '{node_id}'.")
        node_ids.add(node_id)
        if node_type not in NODE_FACTORIES:
            errors.append(f"Node '{node_id}' has unknown type '{node_type}'.")
            continue
        for key in REQUIRED_CONFIG_KEYS[node_type]:
            if key not in config or config[key] in (None, ""):
                errors.append(f"Node '{node_id}' ({node_type}) is missing config '{key}'.")

    valid_targets = node_ids | {"__end__"}
    valid_sources = node_ids | {"__start__"}

    edges_by_source: dict[str, list[dict]] = {}
    for edge in edges:
        source = edge.get("from")
        target = edge.get("to")
        if source not in valid_sources:
            errors.append(f"Edge references unknown source '{source}'.")
        if target not in valid_targets:
            errors.append(f"Edge references unknown target '{target}'.")
        edges_by_source.setdefault(source, []).append(edge)

    if "__start__" not in edges_by_source:
        errors.append("'__start__' has no outgoing edge — nothing would ever run.")

    for source, source_edges in edges_by_source.items():
        conditional_flags = [
            bool(e.get("if_field")) or bool(e.get("else")) for e in source_edges
        ]
        if any(conditional_flags) and not all(conditional_flags):
            errors.append(
                f"Node '{source}' mixes plain and conditional outgoing edges "
                "— must be all-plain or all-conditional."
            )
        elif all(conditional_flags) and conditional_flags:
            else_edges = [e for e in source_edges if e.get("else")]
            if len(else_edges) != 1:
                errors.append(
                    f"Node '{source}' must have exactly one 'else' fallback edge "
                    f"among its conditional edges (found {len(else_edges)})."
                )

    return errors


def compile_definition(definition: dict):
    nodes = definition["nodes"]
    edges = definition["edges"]

    all_keys = set()
    for node in nodes:
        for key in _output_keys(node):
            if key:
                all_keys.add(key)

    state_schema = TypedDict(
        "UserGraphState", {key: Any for key in all_keys}, total=False
    )
    builder = StateGraph(state_schema)

    for node in nodes:
        factory = NODE_FACTORIES[node["type"]]
        builder.add_node(node["id"], factory(node["config"]))

    def resolve(node_id: str):
        if node_id == "__start__":
            return START
        if node_id == "__end__":
            return END
        return node_id

    edges_by_source: dict[str, list[dict]] = {}
    for edge in edges:
        edges_by_source.setdefault(edge["from"], []).append(edge)

    for source, source_edges in edges_by_source.items():
        is_conditional = any(
            e.get("if_field") or e.get("else") for e in source_edges
        )
        if not is_conditional:
            for edge in source_edges:
                builder.add_edge(resolve(source), resolve(edge["to"]))
            continue

        route_map = {}
        conditions = []
        else_route = None
        for i, edge in enumerate(source_edges):
            route_key = f"route_{i}"
            route_map[route_key] = resolve(edge["to"])
            if edge.get("else"):
                else_route = route_key
            else:
                conditions.append((route_key, edge["if_field"], edge["if_equals"]))

        def make_router(conditions=conditions, else_route=else_route):
            def router(state: dict) -> str:
                for route_key, if_field, if_equals in conditions:
                    if state.get(if_field) == if_equals:
                        return route_key
                return else_route

            return router

        builder.add_conditional_edges(resolve(source), make_router(), route_map)

    checkpointer = InMemorySaver()
    return builder.compile(checkpointer=checkpointer)
