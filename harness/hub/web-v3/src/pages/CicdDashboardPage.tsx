import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../lib/api'
import {
  cicd,
  type ActivityItem, type BranchesData, type CommitInfo, type GithubStatus,
  type ManagementRulesData, type OverviewStats, type ProjectsData,
  type QualityGatesData, type RuleItem, type Workflow, type WorkflowRun, type WorktreeInfo,
} from '../lib/cicdApi'
import { t } from '../lib/i18n'
import Table, { TableCell, TableRow } from '../lib/Table'
import { Alert, Button, EmptyState, Panel, RunStatusBadge, Status, Tabs } from '../lib/ui'

type TabValue = 'overview' | 'pipelines' | 'projects' | 'quality' | 'rules'

type DashboardData = {
  overview: OverviewStats | null
  github: GithubStatus | null
  workflows: Workflow[]
  runs: WorkflowRun[]
  branches: BranchesData | null
  worktrees: WorktreeInfo[]
  commits: CommitInfo[]
  activity: ActivityItem[]
  projects: ProjectsData | null
  gates: QualityGatesData | null
  rules: ManagementRulesData | null
}

const emptyData: DashboardData = {
  overview: null, github: null, workflows: [], runs: [], branches: null, worktrees: [],
  commits: [], activity: [], projects: null, gates: null, rules: null,
}

/** Named awaits, so no call site depends on the order of a results array. */
async function loadAll(): Promise<DashboardData> {
  const [
    overview, github, workflows, runs, branches, worktrees, commits, activity, projects, gates, rules,
  ] = await Promise.all([
    cicd.overview(), cicd.githubStatus(), cicd.workflows(), cicd.workflowRuns(),
    cicd.branches(), cicd.worktrees(), cicd.commits(20), cicd.activity(20),
    cicd.projects(), cicd.qualityGates(), cicd.managementRules(),
  ])
  return { overview, github, workflows, runs, branches, worktrees, commits, activity, projects, gates, rules }
}

const runStatusKind = (conclusion: string, status: string) =>
  conclusion === 'success' ? 'success'
    : conclusion === 'failure' ? 'error'
    : conclusion === 'cancelled' ? 'interrupted'
    : status === 'in_progress' ? 'running'
    : status === 'queued' ? 'queued'
    : 'neutral'

const formatDate = (value: string) => (value ? new Date(value).toLocaleString() : t('cicd.none'))
const formatDuration = (seconds: number | null) =>
  seconds === null ? t('cicd.none') : `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
const yesNo = (value: boolean) => (value ? t('cicd.yes') : t('cicd.no'))

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <Panel className="min-w-0">
      <div className="text-caption text-muted">{label}</div>
      <div className="mt-space-1 text-heading font-semibold text-primary">{value}</div>
    </Panel>
  )
}

function RuleTable({ title, items }: { title: string; items: RuleItem[] }) {
  return (
    <Panel className="min-w-0" header={<span className="text-label font-semibold text-primary">{title}</span>}>
      <Table headers={[t('cicd.rules.rule'), t('cicd.rules.detail'), t('cicd.rules.enforced')]}>
        {items.map(item => (
          <TableRow key={item.rule}>
            <TableCell>{item.rule}</TableCell>
            <TableCell className="text-secondary">{item.detail}</TableCell>
            <TableCell>{yesNo(item.enforced)}</TableCell>
          </TableRow>
        ))}
      </Table>
    </Panel>
  )
}

export default function CicdDashboardPage() {
  const [tab, setTab] = useState<TabValue>('overview')
  const [data, setData] = useState<DashboardData>(emptyData)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    let cancelled = false
    loadAll()
      .then(next => { if (!cancelled) { setData(next); setError('') } })
      .catch(reason => {
        if (!cancelled) setError(reason instanceof ApiError ? reason.message : t('cicd.loadFailed'))
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => load(), [load])

  const refresh = () => { void cicd.refresh().catch(() => undefined).then(() => load()) }

  const tabs: { value: TabValue; label: string }[] = [
    { value: 'overview', label: t('cicd.tab.overview') },
    { value: 'pipelines', label: t('cicd.tab.pipelines') },
    { value: 'projects', label: t('cicd.tab.projects') },
    { value: 'quality', label: t('cicd.tab.quality') },
    { value: 'rules', label: t('cicd.tab.rules') },
  ]

  const github = data.github
  const overview = data.overview

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-space-4 p-space-6">
      <header className="flex items-center gap-space-3">
        <h1 className="text-heading font-semibold text-primary">{t('cicd.title')}</h1>
        <Status
          kind={github?.available ? 'ready' : 'offline'}
          label={github?.available ? t('cicd.githubConnected') : t('cicd.githubUnavailable')}
        />
        <div className="flex-1" />
        <Button onClick={refresh} disabled={loading}>
          {loading ? t('cicd.refreshing') : t('cicd.refresh')}
        </Button>
      </header>

      {error ? <Alert variant="error" title={t('cicd.loadFailed')}>{error}</Alert> : null}
      {github && !github.available
        ? <Alert variant="warning" title={t('cicd.githubUnavailable')}>{t('cicd.githubReason', { reason: github.reason })}</Alert>
        : null}

      <Tabs options={tabs} value={tab} onChange={value => setTab(value as TabValue)} aria-label={t('cicd.tabsLabel')} />

      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        {tab === 'overview' ? (
          <div className="flex min-w-0 flex-col gap-space-4">
            <div className="grid grid-cols-2 gap-space-3 md:grid-cols-3 xl:grid-cols-6">
              <StatTile label={t('cicd.overview.activeWorkflows')} value={overview?.active_workflows ?? 0} />
              <StatTile label={t('cicd.overview.projects')} value={overview?.total_projects ?? 0} />
              <StatTile label={t('cicd.overview.tests')} value={overview?.test_files ?? 0} />
              <StatTile label={t('cicd.overview.localBranches')} value={overview?.local_branches ?? 0} />
              <StatTile label={t('cicd.overview.remoteBranches')} value={overview?.remote_branches ?? 0} />
              <StatTile label={t('cicd.overview.worktrees')} value={overview?.worktrees ?? 0} />
            </div>
            <Panel className="min-w-0" header={<span className="text-label font-semibold text-primary">{t('cicd.overview.recentActivity')}</span>}>
              {data.activity.length ? (
                <Table headers={[t('cicd.activity.kind'), t('cicd.activity.title'), t('cicd.activity.detail'), t('cicd.activity.status'), t('cicd.activity.date')]}>
                  {data.activity.map((item, index) => (
                    <TableRow key={`${item.kind}-${item.date}-${index}`}>
                      <TableCell>{item.kind === 'run' ? t('cicd.activity.run') : t('cicd.activity.commit')}</TableCell>
                      <TableCell>{item.title}</TableCell>
                      <TableCell className="text-secondary">{item.detail}</TableCell>
                      <TableCell>{item.status ? <RunStatusBadge kind={runStatusKind(item.status, '')} label={item.status} /> : t('cicd.none')}</TableCell>
                      <TableCell className="text-secondary">{formatDate(item.date)}</TableCell>
                    </TableRow>
                  ))}
                </Table>
              ) : <EmptyState title={t('cicd.overview.noActivity')} />}
            </Panel>
          </div>
        ) : null}

        {tab === 'pipelines' ? (
          <div className="flex min-w-0 flex-col gap-space-4">
            <Panel className="min-w-0" header={<span className="text-label font-semibold text-primary">{t('cicd.pipelines.workflows')}</span>}>
              {data.workflows.length ? (
                <Table headers={[t('cicd.pipelines.name'), t('cicd.pipelines.state'), t('cicd.pipelines.path')]}>
                  {data.workflows.map(workflow => (
                    <TableRow key={workflow.id}>
                      <TableCell>{workflow.name}</TableCell>
                      <TableCell>{workflow.state}</TableCell>
                      <TableCell className="text-secondary">{workflow.path}</TableCell>
                    </TableRow>
                  ))}
                </Table>
              ) : <EmptyState title={t('cicd.pipelines.noWorkflows')} />}
            </Panel>
            <Panel className="min-w-0" header={<span className="text-label font-semibold text-primary">{t('cicd.pipelines.runs')}</span>}>
              {data.runs.length ? (
                <Table headers={[t('cicd.pipelines.name'), t('cicd.pipelines.conclusion'), t('cicd.pipelines.branch'), t('cicd.pipelines.duration'), t('cicd.pipelines.started')]}>
                  {data.runs.map(run => (
                    <TableRow key={run.id}>
                      <TableCell>{run.name}</TableCell>
                      <TableCell><RunStatusBadge kind={runStatusKind(run.conclusion, run.status)} label={run.conclusion || run.status} /></TableCell>
                      <TableCell>{run.branch}</TableCell>
                      <TableCell className="text-secondary">{formatDuration(run.duration_seconds)}</TableCell>
                      <TableCell className="text-secondary">{formatDate(run.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </Table>
              ) : <EmptyState title={t('cicd.pipelines.noRuns')} />}
            </Panel>
          </div>
        ) : null}

        {tab === 'projects' ? (
          <div className="flex min-w-0 flex-col gap-space-4">
            <Panel className="min-w-0" header={<span className="text-label font-semibold text-primary">{t('cicd.projects.health')}</span>}>
              {data.projects?.projects.length ? (
                <Table headers={[t('cicd.projects.name'), t('cicd.projects.tests'), t('cicd.projects.files'), t('cicd.projects.lastModified'), t('cicd.projects.hasGit'), t('cicd.projects.hasReadme')]}>
                  {data.projects.projects.map(project => (
                    <TableRow key={project.name}>
                      <TableCell>{project.name}</TableCell>
                      <TableCell>{project.test_count}</TableCell>
                      <TableCell>{project.file_count}</TableCell>
                      <TableCell className="text-secondary">{formatDate(project.last_modified)}</TableCell>
                      <TableCell>{yesNo(project.has_git)}</TableCell>
                      <TableCell>{yesNo(project.has_readme)}</TableCell>
                    </TableRow>
                  ))}
                </Table>
              ) : <EmptyState title={t('cicd.projects.noProjects')} />}
            </Panel>
            <Panel className="min-w-0" header={<span className="text-label font-semibold text-primary">{t('cicd.projects.branches')}</span>}>
              <p className="mb-space-2 text-caption text-muted">{t('cicd.projects.current', { branch: data.branches?.current || t('cicd.none') })}</p>
              <Table headers={[t('cicd.projects.branchName'), t('cicd.projects.lastCommit'), t('cicd.projects.lastCommitDate')]}>
                {[...(data.branches?.local ?? []), ...(data.branches?.remote ?? [])].map(branch => (
                  <TableRow key={branch.name}>
                    <TableCell>{branch.name}</TableCell>
                    <TableCell className="text-secondary">{branch.last_commit_subject}</TableCell>
                    <TableCell className="text-secondary">{formatDate(branch.last_commit_date)}</TableCell>
                  </TableRow>
                ))}
              </Table>
            </Panel>
            <Panel className="min-w-0" header={<span className="text-label font-semibold text-primary">{t('cicd.projects.worktrees')}</span>}>
              <Table headers={[t('cicd.projects.worktreePath'), t('cicd.projects.branchName'), t('cicd.projects.worktreeHead')]}>
                {data.worktrees.map(worktree => (
                  <TableRow key={worktree.path}>
                    <TableCell>{worktree.path}</TableCell>
                    <TableCell>{worktree.branch || t('cicd.none')}</TableCell>
                    <TableCell className="text-secondary">{worktree.head.slice(0, 7)}</TableCell>
                  </TableRow>
                ))}
              </Table>
            </Panel>
          </div>
        ) : null}

        {tab === 'quality' ? (
          <div className="flex min-w-0 flex-col gap-space-4">
            <Panel className="min-w-0" header={<span className="text-label font-semibold text-primary">{t('cicd.quality.gates')}</span>}>
              <p className="mb-space-2 text-caption text-muted">{t('cicd.quality.gatesNote')}</p>
              {data.gates?.gates.length ? (
                <Table headers={[t('cicd.quality.name'), t('cicd.quality.description'), t('cicd.quality.enabled'), t('cicd.quality.source')]}>
                  {data.gates.gates.map(gate => (
                    <TableRow key={gate.source}>
                      <TableCell>{gate.name}</TableCell>
                      <TableCell className="text-secondary">{gate.description}</TableCell>
                      <TableCell>{yesNo(gate.enabled)}</TableCell>
                      <TableCell className="text-secondary">{gate.source}</TableCell>
                    </TableRow>
                  ))}
                </Table>
              ) : <EmptyState title={t('cicd.quality.noGates')} />}
            </Panel>
            <Panel className="min-w-0" header={<span className="text-label font-semibold text-primary">{t('cicd.quality.enforcement')}</span>}>
              <Status kind={data.gates?.enforcement.enforced ? 'ready' : 'offline'} label={data.gates?.enforcement.detail ?? t('cicd.none')} />
            </Panel>
            <Panel className="min-w-0" header={<span className="text-label font-semibold text-primary">{t('cicd.quality.history')}</span>}>
              <p className="mb-space-2 text-caption text-muted">{t('cicd.quality.historyNote')}</p>
              {data.gates?.history.length ? (
                <Table headers={[t('cicd.quality.name'), t('cicd.quality.result'), t('cicd.pipelines.branch'), t('cicd.quality.timestamp')]}>
                  {data.gates.history.map((item, index) => (
                    <TableRow key={`${item.gate}-${item.timestamp}-${index}`}>
                      <TableCell>{item.gate}</TableCell>
                      <TableCell><RunStatusBadge kind={runStatusKind(item.result, '')} label={item.result} /></TableCell>
                      <TableCell>{item.branch}</TableCell>
                      <TableCell className="text-secondary">{formatDate(item.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </Table>
              ) : <EmptyState title={t('cicd.quality.noHistory')} />}
            </Panel>
          </div>
        ) : null}

        {tab === 'rules' && data.rules ? (
          <div className="flex min-w-0 flex-col gap-space-4">
            <p className="text-caption text-muted">{t('cicd.rules.note')}</p>
            <RuleTable title={t('cicd.rules.branchNaming')} items={data.rules.branch_naming} />
            <RuleTable title={t('cicd.rules.mergeRules')} items={data.rules.merge_rules} />
            <RuleTable title={t('cicd.rules.lifecycle')} items={data.rules.lifecycle} />
            <RuleTable title={t('cicd.rules.agePolicy')} items={data.rules.age_policy} />
            <RuleTable title={t('cicd.rules.deployment')} items={data.rules.deployment} />
            <RuleTable title={t('cicd.rules.dataSafety')} items={data.rules.data_safety} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
