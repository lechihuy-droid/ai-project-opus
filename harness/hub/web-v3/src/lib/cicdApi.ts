import { api } from './api'

const base = '/api/cicd'

export type GithubStatus = { available: boolean; reason: string }

export type OverviewStats = {
  active_workflows: number
  total_projects: number
  test_files: number
  local_branches: number
  remote_branches: number
  worktrees: number
  recent_commits: number
  github_available: boolean
}

export type Workflow = { id: string; name: string; path: string; state: string; updated_at: string }

export type WorkflowRun = {
  id: string
  name: string
  status: string
  conclusion: string
  branch: string
  duration_seconds: number | null
  created_at: string
  html_url: string
}

export type BranchInfo = { name: string; last_commit_date: string; last_commit_subject: string }
export type BranchesData = { local: BranchInfo[]; remote: BranchInfo[]; current: string }
export type WorktreeInfo = { path: string; head: string; branch: string }
export type CommitInfo = { sha: string; author_name: string; date: string; subject: string }
export type ActivityItem = { kind: 'commit' | 'run'; title: string; detail: string; status: string; date: string }

export type ProjectHealth = {
  name: string
  path: string
  test_count: number
  file_count: number
  last_modified: string
  has_git: boolean
  has_readme: boolean
}
export type ProjectsData = { projects: ProjectHealth[] }

export type QualityGate = { name: string; description: string; enabled: boolean; source: string }
export type GateHistoryItem = { gate: string; result: string; branch: string; timestamp: string }
export type EnforcementStatus = { enforced: boolean; gate_count: number; failed_runs: number; detail: string }
export type QualityGatesData = { gates: QualityGate[]; history: GateHistoryItem[]; enforcement: EnforcementStatus }

export type RuleItem = { rule: string; detail: string; enforced: boolean }
export type ManagementRulesData = {
  branch_naming: RuleItem[]
  merge_rules: RuleItem[]
  lifecycle: RuleItem[]
  age_policy: RuleItem[]
  deployment: RuleItem[]
  data_safety: RuleItem[]
}

export const cicd = {
  overview: () => api<OverviewStats>(`${base}/overview`),
  githubStatus: () => api<GithubStatus>(`${base}/github-status`),
  workflows: () => api<Workflow[]>(`${base}/workflows`),
  workflowRuns: (workflowId = '', perPage = 30) =>
    api<WorkflowRun[]>(
      `${base}/workflow-runs?${workflowId ? `workflow_id=${encodeURIComponent(workflowId)}&` : ''}per_page=${perPage}`,
    ),
  branches: () => api<BranchesData>(`${base}/branches`),
  worktrees: () => api<WorktreeInfo[]>(`${base}/worktrees`),
  commits: (limit = 10) => api<CommitInfo[]>(`${base}/commits?limit=${limit}`),
  activity: (limit = 20) => api<ActivityItem[]>(`${base}/activity?limit=${limit}`),
  projects: () => api<ProjectsData>(`${base}/projects`),
  qualityGates: () => api<QualityGatesData>(`${base}/quality-gates`),
  managementRules: () => api<ManagementRulesData>(`${base}/management-rules`),
  refresh: () => api<{ ok: boolean }>(`${base}/refresh`, { method: 'POST' }),
}
