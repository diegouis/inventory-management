import { ref, computed, watch } from 'vue'

// Shared sidebar state (singleton pattern, same as useFilters)
const STORAGE_KEY = 'app-sidebar-collapsed'

// Must match the @media rules in the shell components:
//   below SIDEBAR_BREAKPOINT the sidebar is an overlay drawer
//   between SIDEBAR_BREAKPOINT and RAIL_BREAKPOINT it defaults to the icon rail
export const SIDEBAR_BREAKPOINT = 1024
export const RAIL_BREAKPOINT = 1280

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

const isCollapsed = ref(readCollapsed()) // large-screen preference, persisted
const isDrawerOpen = ref(false) // mobile overlay, intentionally never persisted
const isMobile = ref(false)
const isMedium = ref(false) // 1024px to 1279.98px: rail by default
// Session-only override so the toggle can expand the rail on medium screens
// without touching the persisted large-screen preference
const mediumExpanded = ref(false)

if (canUseDom) {
  // 0.02px below each breakpoint so the boundary width itself stays in the wider mode, matching the CSS
  const mobileMq = window.matchMedia(`(max-width: ${SIDEBAR_BREAKPOINT - 0.02}px)`)
  const mediumMq = window.matchMedia(
    `(min-width: ${SIDEBAR_BREAKPOINT}px) and (max-width: ${RAIL_BREAKPOINT - 0.02}px)`
  )
  isMobile.value = mobileMq.matches
  isMedium.value = mediumMq.matches
  // These listeners are registered once at module load and never removed on
  // purpose: the composable is a page-lifetime singleton (same pattern as
  // useFilters), so there is no component unmount to tie cleanup to. Do not
  // move them into a component lifecycle hook, or the state stops updating
  // when that component unmounts.
  mobileMq.addEventListener('change', (e) => {
    isMobile.value = e.matches
    // Leaving mobile must never strand an open drawer or a locked body scroll
    if (!e.matches) isDrawerOpen.value = false
  })
  mediumMq.addEventListener('change', (e) => {
    isMedium.value = e.matches
    // The override only makes sense inside the medium band; leaving it resets
    // so the next visit to that band starts as a rail again
    if (!e.matches) mediumExpanded.value = false
  })
}

// Single source of truth for "is the sidebar an icon rail right now":
// never on mobile (it is a drawer), width-driven on medium, preference-driven on large
const isRail = computed(() => {
  if (isMobile.value) return false
  if (isMedium.value) return !mediumExpanded.value
  return isCollapsed.value
})

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
    // On medium screens the toggle flips the session override, not the persisted
    // preference, so a large monitor still opens with whatever the user chose there
    if (isMedium.value) {
      mediumExpanded.value = !mediumExpanded.value
    } else {
      isCollapsed.value = !isCollapsed.value
    }
  }
  const openDrawer = () => {
    isDrawerOpen.value = true
  }
  const closeDrawer = () => {
    isDrawerOpen.value = false
  }

  return {
    isCollapsed,
    isRail,
    isDrawerOpen,
    isMobile,
    isMedium,
    toggleCollapsed,
    openDrawer,
    closeDrawer
  }
}
