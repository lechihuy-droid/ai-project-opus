const interactiveSelector = '[role="button"], button, a, input'
const overflowBoundary = /(auto|scroll|hidden|clip)/

function regionName(element: Element) {
  return element.getAttribute('data-region-name')
    ?? element.getAttribute('aria-label')
    ?? element.id
    ?? element.classList.item(0)
    ?? element.tagName.toLowerCase()
}

function nearestOverflowBoundary(element: HTMLElement, shell: HTMLElement) {
  let current = element.parentElement
  while (current && current !== shell) {
    const style = getComputedStyle(current)
    if (overflowBoundary.test(`${style.overflow} ${style.overflowX} ${style.overflowY}`)) return current
    current = current.parentElement
  }
  return shell
}

function isOutsideBoundary(element: HTMLElement, boundary: HTMLElement) {
  const elementRect = element.getBoundingClientRect()
  if (!elementRect.width || !elementRect.height || getComputedStyle(element).visibility === 'hidden') return false
  const boundaryRect = boundary.getBoundingClientRect()
  const boundaryStyle = getComputedStyle(boundary)
  const left = elementRect.left - boundaryRect.left + boundary.scrollLeft
  const top = elementRect.top - boundaryRect.top + boundary.scrollTop
  const width = /(auto|scroll)/.test(boundaryStyle.overflowX) ? boundary.scrollWidth : boundary.clientWidth
  const height = /(auto|scroll)/.test(boundaryStyle.overflowY) ? boundary.scrollHeight : boundary.clientHeight
  const epsilon = 1
  return left < -epsilon
    || top < -epsilon
    || left + elementRect.width > width + epsilon
    || top + elementRect.height > height + epsilon
}

function assertResponsiveInvariants(shell: HTMLElement, route: string) {
  const workspaces = [
    ...(shell.matches('[data-workspace]') ? [shell] : []),
    ...shell.querySelectorAll<HTMLElement>('[data-workspace]'),
  ]
  workspaces.forEach(workspace => {
    const expected = Number(workspace.dataset.workspace)
    const measured = workspace.getBoundingClientRect().width
    if (Number.isFinite(expected) && measured + 0.5 < expected) {
      console.error(`[responsive-invariant] route=${route} region="${regionName(workspace)}" width=${measured.toFixed(1)}px expected>=${expected}px`)
    }
  })

  const measuredScrollWidth = document.documentElement.scrollWidth
  if (measuredScrollWidth > window.innerWidth) {
    console.error(`[responsive-invariant] route=${route} region="document" width=${measuredScrollWidth}px expected<=${window.innerWidth}px`)
  }

  shell.querySelectorAll<HTMLElement>(interactiveSelector).forEach(element => {
    const boundary = nearestOverflowBoundary(element, shell)
    if (isOutsideBoundary(element, boundary)) {
      console.error(`[responsive-invariant] route=${route} region="${regionName(element)}" clipped-by="${regionName(boundary)}" measured=outside expected=inside-scroll-container`)
    }
  })
}

export function observeResponsiveInvariants(shell: HTMLElement, route: string) {
  let frame = 0
  const run = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => assertResponsiveInvariants(shell, route))
  }
  const observer = new ResizeObserver(run)
  const observeRegistry = () => {
    observer.disconnect()
    observer.observe(shell)
    shell.querySelectorAll<HTMLElement>('[data-workspace], [data-collapsible]').forEach(element => observer.observe(element))
    run()
  }
  const mutations = new MutationObserver(observeRegistry)
  mutations.observe(shell, { childList: true, subtree: true })
  observeRegistry()
  return () => { cancelAnimationFrame(frame); mutations.disconnect(); observer.disconnect() }
}
