import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout() { const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('hub-v3-sidebar-collapsed') === 'true'); useEffect(() => { localStorage.setItem('hub-v3-sidebar-collapsed', String(sidebarCollapsed)) }, [sidebarCollapsed]); return <div className={`app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}><Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(value => !value)} /><main className="main"><Topbar /><section className="content"><Outlet /></section></main></div> }
