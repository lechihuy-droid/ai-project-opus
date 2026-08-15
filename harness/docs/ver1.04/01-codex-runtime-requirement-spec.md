# Feature Specification — Codex Execution Runtime Integration

**Feature Branch:** `001-codex-runtime-integration`  
**Created:** 2026-08-15  
**Status:** Draft  

**Input:** Integrate Codex as an external execution runtime controlled by the AI Harness while keeping workflow state, policy, validation, and orchestration authoritative in the Harness.

---

## 1. User Scenarios & Testing

### User Story 1 — Execute a Harness Task with Codex (Priority: P1)

As a Harness workflow, I want to delegate an execution task to Codex so that Codex can inspect the assigned workspace, use its coding tools, perform the requested work, and return a result without taking ownership of workflow orchestration.

**Why this priority:**  
This is the minimum capability required for Codex to act as an execution agent inside the Harness.

**Independent Test:**  
Create a simple repository containing a known defect, submit one task from the Harness, and verify that Codex executes the task and returns a traceable execution result.

**Acceptance Scenarios:**

1. **Given** the Harness has a valid task and accessible workspace, **When** the Harness delegates the task to Codex, **Then** Codex receives the task and begins an execution session.
2. **Given** Codex completes the requested work, **When** the execution finishes, **Then** the Harness receives an execution result associated with the originating run and task.
3. **Given** Codex modifies workspace artifacts, **When** the Harness receives the result, **Then** those modifications remain subject to Harness validation before workflow state is changed.

### User Story 2 — Continue Work in the Same Codex Session (Priority: P1)

As a Harness workflow, I want follow-up tasks for the same execution concern to continue in the existing Codex session so that Codex can reuse its working context instead of rebuilding context from scratch.

**Why this priority:**  
Multi-turn continuation is required for review/revise loops and significantly reduces repeated repository exploration.

**Independent Test:**  
Submit an initial coding task, capture the provider session identifier, then submit a review correction and verify that Codex continues the same execution context.

**Acceptance Scenarios:**

1. **Given** an execution has an active Codex session, **When** the Harness submits a follow-up task for that execution, **Then** the task continues using the mapped Codex session.
2. **Given** Codex previously inspected or modified relevant files, **When** a follow-up references the previous work, **Then** Codex can continue without the Harness replaying the complete historical conversation.
3. **Given** no reusable session exists, **When** a new task begins, **Then** the Harness creates a new provider session rather than referencing an unrelated session.

### User Story 3 — Keep Harness State Authoritative (Priority: P1)

As a Harness orchestrator, I need workflow state to remain authoritative even when Codex retains its own conversation memory so that stale or incorrect agent memory cannot corrupt workflow execution.

**Why this priority:**  
Without this boundary, provider memory becomes an implicit state database and workflow behavior becomes non-deterministic.

**Independent Test:**  
Create a deliberate conflict where Codex's previous context assumes `review_status=PASS` while current Harness State contains `review_status=REJECT`, then verify that the new execution follows the Harness value.

**Acceptance Scenarios:**

1. **Given** Codex session context conflicts with current Harness State, **When** the next execution is created, **Then** the current Harness State takes precedence.
2. **Given** Codex claims that a workflow stage is completed, **When** validation has not confirmed completion, **Then** the Harness MUST NOT transition the workflow.
3. **Given** Harness State changes after a previous Codex turn, **When** the next task is delegated, **Then** the relevant updated state is supplied to Codex.

### User Story 4 — Validate Agent Claims Using External Evidence (Priority: P1)

As a Harness orchestrator, I want Codex execution claims to be independently validated so that workflow decisions are based on observable evidence rather than agent-generated statements.

**Why this priority:**  
Agent output is probabilistic and cannot be treated as authoritative evidence.

**Independent Test:**  
Make Codex report that tests passed while an external test execution intentionally fails, and confirm that the Harness records the execution as failed or requiring review.

**Acceptance Scenarios:**

1. **Given** Codex reports modified files, **When** the execution finishes, **Then** the Harness derives actual file changes from the workspace or version-control evidence.
2. **Given** Codex reports tests passed, **When** the Harness evaluates execution evidence, **Then** test status is derived from the actual test result rather than the Codex statement.
3. **Given** Codex reports completion but acceptance criteria are unmet, **When** validation executes, **Then** the workflow remains incomplete.

### User Story 5 — Enforce Runtime Permissions (Priority: P2)

As a Harness operator, I want each agent role to execute under explicit permissions so that a reviewer, architect, or coder cannot perform operations outside its assigned authority.

**Acceptance Scenarios:**

1. **Given** an agent is assigned read-only execution, **When** it attempts to modify workspace content, **Then** the modification is prevented.
2. **Given** an operation requires approval, **When** Codex requests that operation, **Then** the Harness routes the request through its approval policy.
3. **Given** an operation is prohibited by Harness policy, **When** Codex requests it, **Then** the operation is denied regardless of agent reasoning.

### User Story 6 — Recover from Codex Runtime Failure (Priority: P2)

As a Harness operator, I want Codex failures to be isolated from workflow state so that runtime crashes, timeouts, or session failures do not corrupt an active workflow.

**Acceptance Scenarios:**

1. **Given** Codex becomes unavailable during execution, **When** the runtime reports failure, **Then** committed Harness State remains unchanged.
2. **Given** a task times out, **When** the timeout threshold is reached, **Then** the Harness records the execution as interrupted or failed without marking the workflow task complete.
3. **Given** the Codex runtime is restarted, **When** a previously persisted provider session can be resumed, **Then** the Harness can reconnect it to the corresponding Harness execution.

### User Story 7 — Support Isolated Concurrent Executions (Priority: P3)

As a Harness orchestrator, I want independent agents to execute concurrently without contaminating each other's working artifacts.

**Acceptance Scenarios:**

1. **Given** two independent tasks run concurrently, **When** both modify files, **Then** each execution operates within its assigned workspace boundary.
2. **Given** one task completes before another, **When** its changes are validated, **Then** those changes do not automatically overwrite artifacts used by the other active execution.
3. **Given** two executions originate from the same Harness State version, **When** one execution commits a state change first, **Then** the later execution MUST be checked for stale-state conflict before its result is accepted.

---

## 2. Edge Cases

- Codex runtime is unavailable when a task is submitted.
- Codex runtime terminates while a task is executing.
- A stored Codex session identifier no longer exists.
- Harness restarts while a Codex execution is active.
- Codex session contains stale workflow information.
- Codex claims a file was changed but no corresponding workspace change exists.
- Codex claims tests passed while external validation fails.
- Codex produces no final response but modifies workspace files.
- Codex generates a response that cannot be normalized into the expected execution result.
- A task is submitted using a stale Harness State version.
- Two concurrent executions attempt to modify the same logical artifact.
- An approval request is generated but no human response is received.
- An operation exceeds its configured execution timeout.
- Context supplied to Codex exceeds the permitted task-context budget.
- Codex attempts access outside the assigned workspace.
- A follow-up task is accidentally mapped to an unrelated Codex session.
- Runtime connection succeeds but Codex authentication is invalid or expired.
- The Harness receives duplicate completion events for the same execution.
- Codex execution succeeds but post-execution validation fails.
- A task is retried after partially modifying the workspace.

---

## 3. Requirements

### 3.1 Functional Requirements

**FR-001:** The Harness MUST be able to delegate an execution task to a Codex runtime.  
**FR-002:** Every delegated execution MUST have a unique Harness execution identifier.  
**FR-003:** Every Codex execution MUST be traceable to its originating Harness run and task.  
**FR-004:** The Harness MUST maintain a mapping between Harness executions and Codex provider sessions.  
**FR-005:** The Harness MUST support creating a new Codex session when no reusable session exists.  
**FR-006:** The Harness MUST support continuing an existing Codex session when the workflow explicitly requests continuation.  
**FR-007:** Codex session state MUST NOT be treated as authoritative workflow state.  
**FR-008:** Current Harness State MUST take precedence over conflicting information retained within Codex session context.  
**FR-009:** The Harness MUST select only task-relevant state and context for delegation rather than automatically transmitting the complete workflow state.  
**FR-010:** Each delegated task MUST identify its objective.  
**FR-011:** Each delegated task MUST identify applicable constraints.  
**FR-012:** Each delegated task MUST identify applicable acceptance criteria.  
**FR-013:** Each delegated task MUST identify relevant artifact references when artifacts are required.  
**FR-014:** Each delegated task MUST contain the Harness State version from which the task was created.  
**FR-015:** Results created from stale Harness State MUST NOT modify current Harness State without conflict evaluation.  
**FR-016:** Codex MUST NOT directly determine Harness workflow transitions.  
**FR-017:** A Codex execution result MUST be normalized into a provider-independent Harness execution result.  
**FR-018:** Agent-generated completion claims MUST be considered non-authoritative until validated.  
**FR-019:** The Harness MUST be able to collect execution evidence independently from the agent's final response.  
**FR-020:** The Harness MUST validate applicable acceptance criteria before marking a task complete.  
**FR-021:** The Harness MUST preserve the last committed workflow state when Codex execution fails.  
**FR-022:** The Harness MUST distinguish between execution statuses including at minimum: running, completed, failed, interrupted, blocked, requires-review.  
**FR-023:** The Harness MUST support cancellation or timeout of an active Codex execution.  
**FR-024:** The Harness MUST persist sufficient provider-session metadata to support workflow recovery after Harness restart.  
**FR-025:** Execution permissions MUST be determined by Harness policy rather than by Codex.  
**FR-026:** The Harness MUST support at least read-only and workspace-write execution policies.  
**FR-027:** Operations requiring approval MUST be routed to a Harness-controlled approval mechanism.  
**FR-028:** Operations prohibited by Harness policy MUST remain prohibited regardless of instructions generated by Codex.  
**FR-029:** Codex execution MUST be scoped to an explicitly assigned working directory or workspace.  
**FR-030:** The Harness MUST prevent unrelated concurrent executions from implicitly sharing mutable workspace state.  
**FR-031:** The Harness MUST record execution lifecycle events sufficient to reconstruct what occurred during a delegated task.  
**FR-032:** Runtime-specific details MUST be isolated behind an execution-runtime boundary so that the Workflow Engine does not depend directly on Codex-specific APIs.  
**FR-033:** The Harness MUST be capable of determining runtime capabilities before assigning tasks that require provider-specific features.

### 3.2 Task Context Requirements

The execution request supplied to an external agent MUST contain only information necessary to execute the current task.

The execution context SHOULD distinguish between:

- authoritative state
- task objective
- constraints
- acceptance criteria
- current findings
- artifact references
- previous execution/session reference

Repository content that can be obtained directly from the assigned workspace SHOULD be referenced rather than duplicated into the task context unless explicit injection is required.

### 3.3 Evidence Requirements

The Harness MUST distinguish between:

**Agent Report**
- summary
- implementation notes
- unresolved issues
- suggested next actions

**Execution Evidence**
- actual file changes
- version-control diff
- command exit status
- test results
- lint/static-analysis results
- generated artifact existence
- artifact checksum/version

Workflow transitions MUST use Execution Evidence where objective evidence is available.

### 3.4 Runtime Independence Requirements

The workflow domain model MUST NOT require Codex-specific identifiers or protocol structures.

Provider-specific identifiers MUST be stored within provider-session metadata.

The Harness runtime boundary MUST allow future execution providers to expose different capabilities without requiring changes to the core Workflow Engine.

The Harness SHOULD support capability discovery including, where applicable:

- persistent session
- filesystem access
- workspace write
- sandbox enforcement
- approval requests
- execution cancellation
- streaming
- session continuation

---

## 4. Key Entities

### WorkflowRun
Represents one complete Harness workflow execution.

### HarnessState
Represents the authoritative state of a workflow.

### AgentTaskEnvelope
Represents the task contract sent from the Harness to an execution runtime.

### ProviderSession
Represents execution-context continuity maintained by an external runtime.

### AgentExecution
Represents one invocation of an execution runtime.

### AgentReport
Represents the non-authoritative summary returned by the execution agent.

### ExecutionEvidence
Represents independently observed evidence associated with an execution.

### ApprovalRequest
Represents an operation that cannot proceed without a Harness policy decision or human decision.

### Workspace
Represents the filesystem scope assigned to one execution.

---

## 5. Success Criteria

**SC-001:** 100% of delegated Codex executions can be traced to a Harness `run_id`, `task_id`, and `execution_id`.  
**SC-002:** 100% of continued executions use the ProviderSession explicitly mapped by the Harness rather than relying on implicit session selection.  
**SC-003:** In conflict tests between Codex session memory and current Harness State, current Harness State wins in 100% of cases.  
**SC-004:** A Codex statement claiming task completion cannot independently transition a Harness task to completed status.  
**SC-005:** Objective claims such as changed files and test results are validated using external evidence whenever such evidence is available.  
**SC-006:** A Codex crash, timeout, or connection failure never corrupts the last committed Harness State.  
**SC-007:** Reviewer/read-only execution tests prevent unauthorized workspace modification in 100% of test cases.  
**SC-008:** Tasks created from stale state versions are detected before their results modify newer Harness State.  
**SC-009:** Concurrent execution isolation tests demonstrate no unapproved cross-workspace file contamination.  
**SC-010:** Restarting the Harness does not lose the relationship between persisted workflow executions and resumable provider sessions.  
**SC-011:** The Workflow Engine can invoke the Codex runtime without containing Codex-specific protocol or API logic.  
**SC-012:** Replacing or adding an execution provider does not require modification of the core workflow state model.

---

## 6. Scope

### In Scope for V1

- Harness-controlled Codex execution
- new Codex session creation
- Codex session continuation
- provider-session persistence
- Harness State authority
- state version tracking
- task-context selection
- runtime permission policy
- execution result normalization
- external evidence collection
- result validation
- timeout/failure handling
- execution tracing
- runtime abstraction

### Deferred

- sophisticated long-term semantic memory
- autonomous multi-agent planning
- dynamic model/provider optimization
- distributed execution across multiple machines
- automated merge arbitration between competing implementations
- advanced cost optimization
- cross-provider shared conversational memory

---

## 7. Assumptions

- Codex is installed, authenticated, and available to the Harness execution environment.
- The Harness already owns or will provide persistent workflow-state storage.
- Harness State is independent from Codex conversation/session state.
- Projects delegated to Codex are accessible through a filesystem workspace.
- Codex may retain execution context between turns, but this context is considered working memory only.
- The Harness controls the lifecycle of workflow state transitions.
- Objective evidence is preferred over agent-generated statements whenever evidence can be observed directly.
- Initial development may use a single Codex execution agent before parallel execution is introduced.
- Runtime-specific transport details are implementation concerns and do not define the workflow domain model.

---

## 8. Items Requiring Clarification

**CL-001:** What is the required lifetime of a persisted Codex session: current workflow run, project lifetime, or configurable retention?  
**CL-002:** What should happen when a stored Codex session cannot be resumed: automatically create a replacement session or require Harness/operator approval?  
**CL-003:** Which operations require explicit human approval versus automatic policy approval?  
**CL-004:** What is the default execution timeout for a Codex task?  
**CL-005:** Is concurrent workspace isolation required in V1, or may it remain disabled until multi-agent execution is introduced?  
**CL-006:** What execution evidence is mandatory before a coding task can transition to `completed`?  
**CL-007:** Should failed executions that modified files automatically revert the workspace, preserve changes for inspection, or follow a configurable rollback policy?  
**CL-008:** What persistence guarantees are required for executions that are still running when the Harness itself terminates?
