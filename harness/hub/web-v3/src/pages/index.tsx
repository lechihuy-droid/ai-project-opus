import type { ReactElement } from 'react'
import PlaceholderPage from './PlaceholderPage'
import type { PagePhase } from './PlaceholderPage'

const makePage = (eyebrow: string, title: string, phase: PagePhase): ReactElement => <PlaceholderPage eyebrow={eyebrow} title={title} phase={phase} />

export const pages = [
  { path: 'chat', element: makePage('TRÒ CHUYỆN', 'Chat đa cửa sổ', 'U1') }, { path: 'sessions', element: makePage('TRÒ CHUYỆN', 'Phiên đã lưu', 'U1') },
  { path: 'workflows', element: makePage('ĐIỀU PHỐI', 'Workflows', 'U3') }, { path: 'runs', element: makePage('ĐIỀU PHỐI', 'Runs', 'U2') }, { path: 'agents', element: makePage('ĐIỀU PHỐI', 'Agents', 'U3') }, { path: 'skills', element: makePage('ĐIỀU PHỐI', 'Skills', 'U3') },
  { path: 'approvals', element: makePage('GIÁM SÁT', 'Chờ duyệt', 'U4') }, { path: 'usage', element: makePage('GIÁM SÁT', 'Usage & quota', 'U4') }, { path: 'settings', element: makePage('HỆ THỐNG', 'Cài đặt', 'U4') },
]
