import type { ReactElement } from 'react'
import PlaceholderPage from './PlaceholderPage'
import type { PagePhase } from './PlaceholderPage'
import ChatPage from './ChatPage'
import SessionsPage from './SessionsPage'
import RunsPage from './RunsPage'
import WorkflowsPage from './WorkflowsPage'
import AgentsPage from './AgentsPage'
import SkillsPage from './SkillsPage'

const makePage = (eyebrow: string, title: string, phase: PagePhase): ReactElement => <PlaceholderPage eyebrow={eyebrow} title={title} phase={phase} />

export const pages = [
  { path: 'chat', element: <ChatPage /> }, { path: 'sessions', element: <SessionsPage /> },
  { path: 'workflows', element: <WorkflowsPage /> }, { path: 'runs', element: <RunsPage /> }, { path: 'agents', element: <AgentsPage /> }, { path: 'skills', element: <SkillsPage /> },
  { path: 'approvals', element: makePage('GIÁM SÁT', 'Chờ duyệt', 'U4') }, { path: 'usage', element: makePage('GIÁM SÁT', 'Usage & quota', 'U4') }, { path: 'settings', element: makePage('HỆ THỐNG', 'Cài đặt', 'U4') },
]
