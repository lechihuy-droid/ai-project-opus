import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { t } from '../lib/i18n'

// Keep the rail usable at the low end and leave the content pane a real share
// of the window at the high end.
const MIN_WIDTH = 180, MAX_WIDTH = 420, DEFAULT_WIDTH = 240, KEYBOARD_STEP = 16
const clampWidth = (value: number) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(value)))

export default function Layout() {
  const location = useLocation()
  const contentRef = useRef<HTMLElement>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('hub-v3-sidebar-collapsed') === 'true')
  const [sidebarWidth, setSidebarWidth] = useState(() => clampWidth(Number(localStorage.getItem('hub-v3-sidebar-width')) || DEFAULT_WIDTH))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const resizing = useRef(false)
  useEffect(() => { localStorage.setItem('hub-v3-sidebar-collapsed', String(sidebarCollapsed)) }, [sidebarCollapsed])
  useEffect(() => { localStorage.setItem('hub-v3-sidebar-width', String(sidebarWidth)) }, [sidebarWidth])
  useEffect(() => {
    if (!import.meta.env.DEV || !contentRef.current) return
    let cancelled = false
    let stop: (() => void) | undefined
    void import('../lib/responsiveInvariant').then(({ observeResponsiveInvariants }) => {
      if (!cancelled && contentRef.current) stop = observeResponsiveInvariants(contentRef.current, location.pathname)
    })
    return () => { cancelled = true; stop?.() }
  }, [location.pathname])
  // Pointer capture on the handle would stop at the first iframe or scroll
  // container the cursor crosses, so the drag listens on the window instead and
  // releases on pointerup anywhere.
  const startResize = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault(); resizing.current = true
    const move = (moveEvent: PointerEvent) => { if (resizing.current) setSidebarWidth(clampWidth(moveEvent.clientX)) }
    const stop = () => { resizing.current = false; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop) }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', stop)
  }, [])
  const resizeByKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const delta = event.key === 'ArrowLeft' ? -KEYBOARD_STEP : event.key === 'ArrowRight' ? KEYBOARD_STEP : 0
    if (delta) { event.preventDefault(); setSidebarWidth(value => clampWidth(value + delta)) }
  }
  return <div className={`app ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${drawerOpen ? 'sidebar-drawer-open' : ''}`} style={{ '--hub-sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}>
    <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(value => !value)} />
    <button type="button" className="sidebar-resizer" role="separator" aria-orientation="vertical" aria-label={t('nav.resize')} title={t('nav.resize')} aria-valuenow={sidebarWidth} aria-valuemin={MIN_WIDTH} aria-valuemax={MAX_WIDTH} onPointerDown={startResize} onKeyDown={resizeByKey} onDoubleClick={() => setSidebarWidth(DEFAULT_WIDTH)} />
    <main className="main"><Topbar onOpenNavigation={() => setDrawerOpen(true)} /><section ref={contentRef} className="content" data-workspace="360" data-region-name="page shell"><Outlet /></section></main>
    <button type="button" className="app-drawer-scrim" aria-label={t('common.close')} onClick={() => setDrawerOpen(false)} />
  </div>
}
