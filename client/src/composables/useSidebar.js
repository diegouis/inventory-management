import { ref, watch } from 'vue'

// Shared sidebar state (singleton pattern, same as useFilters)
const STORAGE_KEY = 'app-sidebar-collapsed'

// Must match the @media (max-width: 1023.98px) rules in the shell components
export const SIDEBAR_BREAKPOINT = 1024

const canUseDom = typeof window !== 'undefined'

const readCollapsed = () => {
  // localStorage can throw in private mode or when site data is blocked;
  // default to expanded rather than crash the app
  try {
    return canUseDom && localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

const isCollapsed = ref(readCollapsed()) // desktop icon rail, persisted
const isDrawerOpen = ref(false) // mobile overlay, intentionally never persisted
const isMobile = ref(false)

if (canUseDom) {
  // 0.02px below the breakpoint so 1024px itself stays desktop, matching the CSS
  const mq = window.matchMedia(`(max-width: ${SIDEBAR_BREAKPOINT - 0.02}px)`)
  isMobile.value = mq.matches
  mq.addEventListener('change', (e) => {
    isMobile.value = e.matches
    // Leaving mobile must never strand an open drawer or a locked body scroll
    if (!e.matches) isDrawerOpen.value = false
  })
}

watch(isCollapsed, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  } catch {
    // ignore: persistence is a convenience, not a requirement
  }
})

watch(isDrawerOpen, (open) => {
  if (canUseDom) document.body.style.overflow = open ? 'hidden' : ''
})

export function useSidebar() {
  const toggleCollapsed = () => {
    isCollapsed.value = !isCollapsed.value
  }
  const openDrawer = () => {
    isDrawerOpen.value = true
  }
  const closeDrawer = () => {
    isDrawerOpen.value = false
  }

  return {
    isCollapsed,
    isDrawerOpen,
    isMobile,
    toggleCollapsed,
    openDrawer,
    closeDrawer
  }
}
