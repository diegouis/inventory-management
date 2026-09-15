---
name: saas-sidebar-redesign
description: Use when converting a Vue 3 + vue-router app from a top navigation bar to a SaaS-style left sidebar shell, or when asked for a collapsible sidebar, responsive drawer navigation, CSS design tokens, consistent spacing, or a more polished admin/dashboard look in a Vue app.
---

# SaaS Sidebar Redesign for Vue 3 Apps

## Overview

**The shell owns layout; views own content.** Every view gets its width, padding and scroll behavior from the app shell, never from itself. Every magic number the shell depends on (header height, container width, sidebar width, z-index order, palette, spacing) becomes a `:root` token, so the sidebar, topbar, sticky offsets and dropdown menus agree with each other by construction instead of by coincidence.

The result of this skill:

- A left sidebar with brand, icon + label navigation, and a footer for account and settings widgets.
- The sidebar collapses to a 64px icon rail on desktop (persisted) and becomes an overlay drawer with backdrop below 1024px.
- A slim sticky topbar with the page title and a hamburger on mobile; existing filter bars sit as a second sticky row beneath it.
- One `tokens.css` file that the global stylesheet and every component consume.
- View content unchanged except for spacing literals and grids that could not shrink.

## When to Use

- The app has a `<header>` with `<router-link>`s and the user asks for a sidebar, admin layout, dashboard layout, or "SaaS look".
- Spacing is inconsistent because rem/px literals are scattered across scoped styles with no tokens.
- The layout has hardcoded `position: sticky; top: <px>` offsets, repeated `max-width` containers, or no `@media` queries at all.

**Do not use when:**

- The app already runs on a UI framework shell (Vuetify, Quasar, PrimeVue, Element Plus layout components). Configure that framework instead.
- There are fewer than three routes. A sidebar is heavier than the navigation it replaces.
- The request is only a color or typography refresh. Do Phase B (tokens) alone and stop.

## Target Layout

```
Desktop >= 1024px                      Collapsed rail              Mobile < 1024px
+----------+----------------------+    +----+------------------+    +------------------------+
| Brand    | Topbar: Page title   |    | B  | Topbar           |    | [=] Page title         |
|----------|----------------------|    |----|------------------|    |------------------------|
| > Overview | FilterBar (sticky) |    | o  | FilterBar        |    | Filters (2x2, static)  |
|   Inventory|--------------------|    | o  |------------------|    |------------------------|
|   Orders   |                    |    | o  |                  |    |                        |
|   Finance  |   <router-view>    |    | o  |  <router-view>   |    |    <router-view>       |
|   Demand   |   max-width,       |    | o  |                  |    |                        |
|   Reports  |   centered         |    | o  |                  |    |  drawer slides over    |
|----------|                      |    |----|                  |    |  content with backdrop |
| [Lang]   |                      |    | L  |                  |    |  when [=] is pressed   |
| [Profile]|                      |    | P  |                  |    |                        |
| [<] Collapse                    |    | >  |                  |    +------------------------+
+----------+----------------------+    +----+------------------+
```

| Region | Component | Responsibility |
|---|---|---|
| Sidebar | `AppSidebar.vue` | Brand, nav items, footer slot, collapse toggle, drawer open/close, Escape, focus |
| Backdrop | `App.vue` | Dims content while the drawer is open, click closes |
| Topbar | `AppTopbar.vue` | Hamburger (mobile), current page title, shares content gutters |
| Filter row | existing filter component | Sticky under the topbar via `var(--topbar-height)` |
| Content | `.main-content` in `App.vue` | `max-width`, padding, the only place views get width from |
| Modals | `App.vue` root | Unchanged, stay outside the grid so z-index is simple |

## Procedure

Work the phases in order. Each phase leaves the app running. Any `.vue` file edit goes to the project's designated frontend subagent when its CLAUDE.md mandates one; `.css`, `.js` and locale files can be edited directly.

### Phase A: Audit the shell

Run these greps from the client `src/` directory and write down every hit as `file:line -> issue -> phase that fixes it` before changing anything.

```bash
grep -rn "position: sticky" .                     # offsets coupled to header height -> Phase F
grep -rn "max-width:" .                            # container width repeated -> Phase E
grep -rn "top: calc(100%" .                        # dropdowns open downward -> Phase F
grep -n "> \." App.vue                             # global CSS reaching into a child component -> Phase F
grep -rnE "repeat\(2, ?1fr\)|1fr 1fr|minmax\([4-9][0-9]{2}px" views   # fixed grids -> Phase F
grep -rn "z-index" .                               # collect literals -> Phase B z scale
grep -rn "@media" .                                # existing breakpoints (often none)
grep -n "router-link" App.vue | grep -v "t("       # hardcoded nav labels -> Phase H
grep -n "font-family" App.vue; grep -n "fonts\|@font-face" ../index.html   # declared font never loaded
grep -lE "<style scoped>" views/*.vue | xargs grep -nE "^\.(stats-grid|stat-card|stat-label|stat-value|badge|loading|error|page-header|card)\b"   # scoped copies of global classes -> Phase G
```

Also record: the list of routes and their labels, which dropdown components will move into the sidebar footer, whether `App.vue` uses Options API or `<script setup>` (decides where new state is returned), and the tablet breakpoint (default 1024px).

**Done when:** the audit table exists and every row names a phase.

### Phase B: Introduce design tokens

Create `src/styles/tokens.css` and import it as the first line of `main.js`:

```js
import './styles/tokens.css'
```

Keep the palette identical to the literals already in use so this phase changes no colors. Snap spacing to a 4px grid.

```css
:root {
  /* Palette (slate) */
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-muted: #f1f5f9;
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;
  --color-heading: #0f172a;
  --color-text: #1e293b;
  --color-text-secondary: #475569;
  --color-text-muted: #64748b;
  --color-primary: #2563eb;
  --color-primary-soft: #eff6ff;

  /* Status */
  --color-success: #059669;  --color-success-soft: #d1fae5;
  --color-info: #2563eb;     --color-info-soft: #dbeafe;
  --color-warning: #ea580c;  --color-warning-soft: #fed7aa;
  --color-danger: #dc2626;   --color-danger-soft: #fecaca;

  /* Spacing, 4px base */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px; --space-5: 20px;
  --space-6: 24px; --space-8: 32px; --space-10: 40px; --space-12: 48px;

  /* Type */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --text-xs: 0.75rem; --text-sm: 0.875rem; --text-base: 1rem;
  --text-lg: 1.125rem; --text-xl: 1.375rem; --text-2xl: 1.875rem;

  /* Radii and elevation */
  --radius-sm: 6px; --radius-md: 8px; --radius-lg: 10px;
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.05);
  --shadow-md: 0 4px 12px rgba(15, 23, 42, 0.06);
  --shadow-lg: 0 10px 25px rgba(15, 23, 42, 0.10);

  /* Shell geometry */
  --sidebar-width: 240px;
  --sidebar-width-collapsed: 64px;
  --sidebar-drawer-width: 280px;
  --topbar-height: 56px;
  --content-max-width: 1600px;
  --content-pad-x: var(--space-8);
  --content-pad-y: var(--space-6);

  /* Motion */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;

  /* Z scale: sticky rows < sidebar < backdrop < drawer < dropdown < modal */
  --z-filterbar: 90;
  --z-topbar: 100;
  --z-sidebar: 120;
  --z-backdrop: 190;
  --z-drawer: 200;
  --z-dropdown: 1000;

  /* Breakpoints are documentation only: custom properties cannot be used inside @media.
     Keep these literals in sync with every @media rule and with SIDEBAR_BREAKPOINT in useSidebar.js.
     tablet: 1024px   mobile: 768px */
}

@media (prefers-reduced-motion: reduce) {
  :root { --transition-fast: 0ms; --transition-base: 0ms; }
}
```

Then replace literals in the global stylesheet only (views come in Phase G):

| Old literal | Token |
|---|---|
| `#0f172a` headings | `var(--color-heading)` |
| `#64748b` | `var(--color-text-muted)` |
| `#e2e8f0` borders | `var(--color-border)` |
| `1.25rem` card padding | `var(--space-5)` |
| `10px` card radius | `var(--radius-lg)` |
| `z-index: 90 / 100 / 1000` | `var(--z-filterbar) / var(--z-topbar) / var(--z-dropdown)` |

**Done when:** `tokens.css` is imported, the app renders identically, and `grep -rn "var(--" App.vue` returns hits.

### Phase C: Build the sidebar

**C1. Shared state.** `src/composables/useSidebar.js`, module-level singleton so the topbar hamburger and the sidebar share it (same pattern as a shared filters composable):

```js
import { ref, watch } from 'vue'

const STORAGE_KEY = 'app-sidebar-collapsed'
export const SIDEBAR_BREAKPOINT = 1024   // keep in sync with @media (max-width: 1023.98px)

const canUseDom = typeof window !== 'undefined'

const readCollapsed = () => {
  // localStorage can throw in private mode or when site data is blocked
  try { return canUseDom && localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
}

const isCollapsed = ref(readCollapsed())     // desktop rail, persisted
const isDrawerOpen = ref(false)              // mobile overlay, never persisted
const isMobile = ref(false)

if (canUseDom) {
  const mq = window.matchMedia(`(max-width: ${SIDEBAR_BREAKPOINT - 0.02}px)`)
  isMobile.value = mq.matches
  mq.addEventListener('change', (e) => {
    isMobile.value = e.matches
    // leaving mobile must never strand an open drawer or a locked body
    if (!e.matches) isDrawerOpen.value = false
  })
}

watch(isCollapsed, (value) => {
  try { localStorage.setItem(STORAGE_KEY, value ? '1' : '0') } catch { /* ignore */ }
})

watch(isDrawerOpen, (open) => {
  if (canUseDom) document.body.style.overflow = open ? 'hidden' : ''
})

export function useSidebar() {
  const toggleCollapsed = () => { isCollapsed.value = !isCollapsed.value }
  const openDrawer = () => { isDrawerOpen.value = true }
  const closeDrawer = () => { isDrawerOpen.value = false }
  return { isCollapsed, isDrawerOpen, isMobile, toggleCollapsed, openDrawer, closeDrawer }
}
```

**Optional: rail by default on medium screens.** If the sidebar should start as an icon rail between the drawer breakpoint and a second breakpoint (1280px works well), add a second `matchMedia` for that band and a session-only `mediumExpanded` ref. Expose one computed, `isRail`, as the single answer to "is it a rail right now": `false` on mobile, `!mediumExpanded` on medium, the persisted `isCollapsed` on large. The toggle flips `mediumExpanded` while medium and `isCollapsed` otherwise, and the medium listener resets `mediumExpanded` when the width leaves the band. Components read `isRail` and never combine the flags themselves.

**C2. Icons.** Create `src/icons.js` and `src/components/NavIcon.vue` from [icons.md](icons.md).

**C3. The component.** `src/components/AppSidebar.vue`. It reads the singleton, takes the nav list as a prop, and exposes a `footer` slot that receives `rail` so footer widgets can switch to compact mode (scoped CSS cannot reach into them).

```vue
<template>
  <aside
    id="app-sidebar"
    class="app-sidebar"
    :class="{ 'is-rail': rail, 'is-open': isDrawerOpen }"
    :aria-label="t('nav.mainNavigation')"
  >
    <div class="sidebar-brand">
      <router-link to="/" class="brand-link">
        <span class="brand-mark" aria-hidden="true">{{ brandInitials }}</span>
        <span class="brand-text">
          <span class="brand-name">{{ t('nav.companyName') }}</span>
          <span class="brand-subtitle">{{ t('nav.subtitle') }}</span>
        </span>
      </router-link>
      <button type="button" class="sidebar-close" :aria-label="t('nav.closeMenu')" @click="closeDrawer">
        <NavIcon name="close" class="icon" />
      </button>
    </div>

    <nav class="sidebar-nav">
      <router-link
        v-for="item in items"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        exact-active-class="active"
        :title="rail ? t(item.labelKey) : undefined"
      >
        <NavIcon :name="item.icon" class="icon" />
        <span class="nav-label">{{ t(item.labelKey) }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <slot name="footer" :rail="rail" />
      <button
        type="button"
        class="collapse-toggle"
        :aria-expanded="!isCollapsed"
        :aria-label="isCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')"
        @click="toggleCollapsed"
      >
        <NavIcon name="chevron-left" class="icon collapse-icon" />
        <span class="nav-label">{{ t('nav.collapseSidebar') }}</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import { useSidebar } from '../composables/useSidebar'
import NavIcon from './NavIcon.vue'

defineProps({
  // [{ path: '/inventory', labelKey: 'nav.inventory', icon: 'box' }]
  items: { type: Array, required: true }
})

const route = useRoute()
const { t } = useI18n()
const { isCollapsed, isDrawerOpen, isMobile, toggleCollapsed, closeDrawer } = useSidebar()

// The drawer is never a rail: collapsed only applies on desktop
const rail = computed(() => isCollapsed.value && !isMobile.value)

const brandInitials = computed(() =>
  t('nav.companyName').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
)

// Escape closes the drawer; focus returns to whatever opened it
let opener = null
const onKeydown = (e) => { if (e.key === 'Escape' && isDrawerOpen.value) closeDrawer() }

watch(isDrawerOpen, async (open) => {
  if (open) {
    opener = document.activeElement
    window.addEventListener('keydown', onKeydown)
    await nextTick()
    document.querySelector('#app-sidebar .nav-item')?.focus()
  } else {
    window.removeEventListener('keydown', onKeydown)
    opener?.focus?.()
    opener = null
  }
})

// Navigating closes the drawer
watch(() => route.path, closeDrawer)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.app-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width);
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  z-index: var(--z-sidebar);
  transition: width var(--transition-base), transform var(--transition-base);
  /* No overflow: hidden here. It would clip the footer dropdowns. Only .sidebar-nav scrolls. */
}
.app-sidebar.is-rail { width: var(--sidebar-width-collapsed); }

.sidebar-brand {
  display: flex; align-items: center; gap: var(--space-3);
  height: var(--topbar-height); padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.brand-link { display: flex; align-items: center; gap: var(--space-3); min-width: 0; color: var(--color-heading); text-decoration: none; }
.brand-mark {
  flex: none; display: grid; place-items: center; width: 32px; height: 32px;
  border-radius: var(--radius-sm); background: var(--color-heading); color: #fff;
  font-size: var(--text-sm); font-weight: 700;
}
.brand-text { display: flex; flex-direction: column; min-width: 0; }
.brand-name { font-size: var(--text-sm); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.brand-subtitle { font-size: var(--text-xs); color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar-close { display: none; }

.sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-3) var(--space-2); overflow-y: auto; }

.nav-item, .collapse-toggle {
  display: flex; align-items: center; gap: var(--space-3);
  height: 40px; padding: 0 var(--space-3);
  border: 0; border-radius: var(--radius-sm); background: none;
  color: var(--color-text-muted); font: inherit; font-size: var(--text-sm); font-weight: 500;
  text-decoration: none; white-space: nowrap; cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}
.nav-item:hover, .collapse-toggle:hover { background: var(--color-surface-muted); color: var(--color-heading); }
.nav-item.active { background: var(--color-primary-soft); color: var(--color-primary); }
.nav-item:focus-visible, .collapse-toggle:focus-visible, .sidebar-close:focus-visible { outline: 2px solid var(--color-primary); outline-offset: -2px; }
.icon { flex: none; width: 20px; height: 20px; }

.sidebar-footer { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-3) var(--space-2); border-top: 1px solid var(--color-border); }
.collapse-icon { transition: transform var(--transition-base); }
.is-rail .collapse-icon { transform: rotate(180deg); }

/* Rail: hide labels with CSS, not v-if, so title tooltips and DOM stay stable */
.is-rail .nav-label, .is-rail .brand-text { display: none; }
.is-rail .nav-item, .is-rail .collapse-toggle { justify-content: center; padding: 0; }
.is-rail .sidebar-brand { justify-content: center; padding: 0; }

@media (max-width: 1023.98px) {
  .app-sidebar {
    position: fixed; inset: 0 auto 0 0;
    width: var(--sidebar-drawer-width);
    transform: translateX(-100%);
    box-shadow: var(--shadow-lg);
    z-index: var(--z-drawer);
  }
  .app-sidebar.is-open { transform: translateX(0); }
  .collapse-toggle { display: none; }
  .sidebar-close {
    display: inline-flex; align-items: center; justify-content: center;
    margin-left: auto; width: 32px; height: 32px;
    border: 0; border-radius: var(--radius-sm); background: none; color: var(--color-text-muted); cursor: pointer;
  }
}

@media print {
  .app-sidebar { display: none; }
}
</style>
```

**Done when:** the component compiles (`npm run build`) even though nothing mounts it yet.

### Phase D: Build the topbar

`src/components/AppTopbar.vue`. Title comes from route meta so no router lookup is duplicated; each route gets `meta: { titleKey: 'nav.<key>' }` in the router config.

```vue
<template>
  <header class="app-topbar">
    <div class="topbar-inner">
      <button
        type="button"
        class="hamburger"
        :aria-label="t('nav.openMenu')"
        aria-controls="app-sidebar"
        :aria-expanded="isDrawerOpen"
        @click="openDrawer"
      >
        <NavIcon name="menu" class="icon" />
      </button>
      <span class="topbar-title">{{ title }}</span>
      <div class="topbar-actions"><slot /></div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import { useSidebar } from '../composables/useSidebar'
import NavIcon from './NavIcon.vue'

const route = useRoute()
const { t } = useI18n()
const { isDrawerOpen, openDrawer } = useSidebar()

const title = computed(() => (route.meta.titleKey ? t(route.meta.titleKey) : ''))
</script>

<style scoped>
.app-topbar {
  position: sticky; top: 0; z-index: var(--z-topbar);
  background: var(--color-surface); border-bottom: 1px solid var(--color-border);
}
.topbar-inner {
  display: flex; align-items: center; gap: var(--space-3);
  height: var(--topbar-height); max-width: var(--content-max-width);
  margin: 0 auto; padding: 0 var(--content-pad-x);
}
.hamburger {
  display: none; align-items: center; justify-content: center;
  width: 36px; height: 36px; border: 0; border-radius: var(--radius-sm);
  background: none; color: var(--color-text-muted); cursor: pointer;
}
.hamburger:hover { background: var(--color-surface-muted); color: var(--color-heading); }
.icon { width: 20px; height: 20px; }
.topbar-title { font-size: var(--text-base); font-weight: 600; color: var(--color-heading); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.topbar-actions { margin-left: auto; display: flex; align-items: center; gap: var(--space-2); }

@media (max-width: 1023.98px) {
  .hamburger { display: inline-flex; }
}
@media print {
  .app-topbar { display: none; }
}
</style>
```

**Done when:** the component compiles.

### Phase E: Rewrite the App.vue shell

Template:

```vue
<div class="app">
  <AppSidebar :items="navItems">
    <template #footer="{ rail }">
      <LanguageSwitcher placement="up" :compact="rail" />
      <ProfileMenu placement="up" :compact="rail" @show-profile-details="..." @show-tasks="..." />
    </template>
  </AppSidebar>
  <div v-if="isDrawerOpen" class="sidebar-backdrop" @click="closeDrawer" />
  <div class="app-main">
    <AppTopbar />
    <FilterBar />
    <main class="main-content"><router-view /></main>
  </div>
  <!-- modals stay here at app root -->
</div>
```

`navItems` lives in the script (`setup()` return for Options API, a `const` for `<script setup>`):

```js
const navItems = [
  { path: '/',          labelKey: 'nav.overview',       icon: 'dashboard' },
  { path: '/inventory', labelKey: 'nav.inventory',      icon: 'box' },
  { path: '/orders',    labelKey: 'nav.orders',         icon: 'clipboard' },
  { path: '/spending',  labelKey: 'nav.finance',        icon: 'chart-bar' },
  { path: '/demand',    labelKey: 'nav.demandForecast', icon: 'trending-up' },
  { path: '/reports',   labelKey: 'nav.reports',        icon: 'document' }
]
```

Global CSS:

```css
body { font-family: var(--font-sans); background: var(--color-bg); color: var(--color-text); }

.app { display: grid; grid-template-columns: auto minmax(0, 1fr); min-height: 100vh; }
/* auto: the sidebar's own animated width drives the track, so one transition animates the whole layout.
   minmax(0, 1fr): a wide table can never push the content column past the viewport. */
.app-main { display: flex; flex-direction: column; min-width: 0; }
.main-content { flex: 1; width: 100%; max-width: var(--content-max-width); margin: 0 auto; padding: var(--content-pad-y) var(--content-pad-x); }
.sidebar-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); z-index: var(--z-backdrop); }

@media (max-width: 1023.98px) {
  .app { grid-template-columns: minmax(0, 1fr); }   /* fixed-position drawer takes no track */
}
@media (max-width: 767.98px) {
  .app-main { --content-pad-x: var(--space-4); --content-pad-y: var(--space-4); }
}
@media print {
  .app { display: block; }
  .sidebar-backdrop { display: none; }
}
```

Delete the old header rules in the same edit: `.top-nav`, `.nav-container` and every `.nav-container > *` rule, `.logo`, `.logo h1`, `.subtitle`, `.nav-tabs`, `.nav-tabs a`, `.nav-tabs a:hover`, `.nav-tabs a.active`, `.nav-tabs a.active::after`. Remove the old header component imports that moved into the sidebar footer.

Keep the centered `max-width` on `.main-content`. It is invisible at 1440px and only matters on ultrawide monitors where full-bleed stat cards look wrong.

**Done when:** every route renders inside the new shell and `grep -n "top-nav\|nav-tabs" App.vue` returns nothing.

### Phase F: Migrate dependents

1. **Sticky offsets.** Anything with `top: <old header px>` becomes `top: var(--topbar-height)`. Replace its private `max-width`/padding with `var(--content-max-width)` and `var(--content-pad-x)` so gutters line up with the topbar and content.

2. **Dropdowns moved into the sidebar footer.** Add two props to each and keep defaults identical to current behavior, so this edit is safe before the shell swap:

   ```js
   defineProps({
     placement: { type: String, default: 'down', validator: (v) => ['down', 'up'].includes(v) },
     compact: { type: Boolean, default: false }
   })
   ```

   Root element: `:class="{ 'placement-up': placement === 'up', 'is-compact': compact }"`. CSS:

   ```css
   .dropdown-menu { position: absolute; top: calc(100% + var(--space-2)); right: 0; z-index: var(--z-dropdown); }
   /* Expanded sidebar footer: open upward, span the footer width */
   .placement-up .dropdown-menu { top: auto; bottom: calc(100% + var(--space-2)); left: 0; right: 0; min-width: 0; }
   /* Rail: hide text, square the trigger, fly the menu out to the right of the rail */
   .is-compact .trigger-label, .is-compact .chevron { display: none; }
   .is-compact .trigger { width: 40px; height: 40px; padding: 0; justify-content: center; }
   .is-compact .dropdown-menu { top: auto; bottom: 0; left: calc(100% + var(--space-2)); right: auto; min-width: 240px; }
   ```

   In the footer the trigger should be `width: 100%`. Add `:title` and `aria-label` with the name/locale in compact mode. The fly-out works only because the sidebar root has `overflow: visible` and `--z-sidebar` is above the topbar and filter row.

3. **Global rules reaching into children.** Delete any `.parent > .child-component-root-class` rule in the global sheet. The sidebar footer's `gap` handles spacing now.

4. **Fixed grids.** Replace with container-aware auto-fit; the `min(100%, N)` guard collapses to one column when the container is narrower than N, which is correct whether the sidebar is expanded, railed, or hidden (viewport media queries cannot know sidebar state).

   ```css
   /* before */  grid-template-columns: repeat(2, 1fr);
   /* after  */  grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
   /* before */  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
   /* after  */  grid-template-columns: repeat(auto-fit, minmax(min(100%, 450px), 1fr));
   ```

5. **z-index literals** in shell-adjacent components become tokens from the scale. Modals keep their values as long as they exceed `--z-drawer`.

6. **Filter rows below 768px.** A four-select sticky strip eats a phone viewport. Make it `position: static` and lay the groups out as a 2x2 grid with stacked labels.

**Done when:** the Phase A audit table has no open rows for F.

### Phase G: Consistent spacing pass

Rewrite the global component classes once with tokens, then delete scoped copies in views so they inherit. Keep a scoped override only when it changes structure (a flex header with meta on the right), never when it only changes color or spacing.

| Element | Rule |
|---|---|
| Card padding, card radius | `var(--space-5)`, `var(--radius-lg)` |
| Gap between cards / stat cards | `var(--space-5)` |
| Section spacing (`.page-header`, grids) | `margin-bottom: var(--space-6)` |
| Table cell padding | `var(--space-2) var(--space-3)` |
| Badge padding, radius | `var(--space-1) var(--space-3)`, `var(--radius-sm)` |
| Controls (select, button) radius | `var(--radius-sm)` |
| Hover elevation | `var(--shadow-md)` |
| Loading block padding | `var(--space-12)` |

View wrapper divs get no CSS. Do not touch SVG chart internals, colors, or font sizes in this pass.

**Done when:** `grep -rnE "^\.(stats-grid|stat-card|badge|loading|error)\b" views/*.vue` returns only structural overrides you can justify in one line each.

### Phase H: i18n keys

Every locale file needs, under `nav`: the key for any link that was hardcoded, plus `mainNavigation`, `openMenu`, `closeMenu`, `collapseSidebar`, `expandSidebar`. Diff used keys against each locale:

```bash
grep -rhoE "t\('nav\.[a-zA-Z]+'\)" . | sort -u
```

**Done when:** every key resolves in every locale (no raw key strings visible after switching language).

### Phase I: Verify with Playwright MCP

Servers running, browser tools pointed at the dev URL. Fix and re-screenshot before claiming done.

| Viewport | Actions | Assert |
|---|---|---|
| 1440x900 | Visit every route | `aside[aria-label]` visible, exactly one `.nav-item.active[aria-current="page"]`, topbar title equals the nav label, old header class absent, console has no errors |
| 1440x900 | Click collapse, reload | Sidebar computed width equals `--sidebar-width-collapsed`, labels hidden, tooltips on hover, `localStorage` key persisted |
| 1440x900 rail | Open each footer menu | Menu `getBoundingClientRect()` fully inside the viewport and to the right of the rail |
| 1440x900 expanded | Open each footer menu | Menu bottom is above the trigger top (opens upward), left edge >= 0 |
| 1024x768 | Load | Still the docked desktop layout |
| 1023x768 | Hamburger, Escape, hamburger, backdrop click, hamburger, click a nav item | Drawer and backdrop appear; Escape closes and focus returns to the hamburger; backdrop closes; navigation closes; `body.style.overflow` is `hidden` only while open |
| 390x844 | Visit every route | `document.documentElement.scrollWidth <= 390`, filter row is static and 2x2 |
| any | Change a filter, navigate | Network request carries the filter, table rows change, filter persists across routes, reset clears |

Snippets for `browser_evaluate`:

```js
getComputedStyle(document.querySelector('.app-sidebar')).width
localStorage.getItem('app-sidebar-collapsed')
document.documentElement.scrollWidth <= window.innerWidth
(() => { const r = document.querySelector('.dropdown-menu').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight })()
```

Finish with `npm run build` and the project's existing test command.

**If the Playwright MCP server cannot launch a browser** (it defaults to the `chrome` channel and Google Chrome is not installed, and installing it needs sudo), do not stop. Install the `playwright` package in a scratch directory with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`, then drive any installed Chromium-based browser (Brave, Edge, Chromium) through `chromium.launch({ executablePath })` with a script that runs the same table of checks. Say in the report that the checks ran through the library instead of the MCP server.

**What the 390px measurement usually catches** that reading the CSS does not: a search box or input with a hard `min-width`, a legend or header row without `flex-wrap`, and bar charts whose bars have fixed widths. Fix the first two by letting the element shrink (`flex: 1 1 200px; min-width: 0`, `flex-wrap: wrap`) and the last by giving the chart container `overflow-x: auto`.

## Icon Set

Rules: 20x20 viewBox, `fill="none" stroke="currentColor" stroke-width="1.5"`, sized by CSS on the `<svg>`, never emoji or unicode arrows. Path data and the `NavIcon` component are in [icons.md](icons.md).

## Quick Reference

| Audit finding | Fix |
|---|---|
| `position: sticky; top: 70px` | `top: var(--topbar-height)` |
| `max-width: 1600px` repeated in header, filters, content | One `--content-max-width`; only `.main-content`, topbar inner and filter container use it |
| `.parent > .child-component` in global CSS | Delete; container `gap` instead |
| Dropdown `top: calc(100% + x); right: 0` now in a sidebar footer | `placement="up"` variant with `bottom:` and `left: 0` |
| Dropdown in a 64px rail | `compact` variant flying out to the right; sidebar root `overflow: visible` |
| `grid-template-columns: repeat(2, 1fr)` | `repeat(auto-fit, minmax(min(100%, 420px), 1fr))` |
| `minmax(450px, 1fr)` | `minmax(min(100%, 450px), 1fr)` |
| Hardcoded nav label | `t('nav.<key>')` plus the key in every locale |
| Scoped view redefines a global class | Delete the scoped copy; tokenize the global one |
| z-index literals 90, 100, 1000 | `--z-*` scale in tokens |
| Tables widen the page | `minmax(0, 1fr)` column and `min-width: 0` on the content wrapper |
| Font declared but not loaded | Load it in `index.html` or remove it from the stack; do not leave it ambiguous |

## Common Mistakes

1. **`var()` inside `@media`.** Custom properties do not work there. Use the literal (`1023.98px`) and document it next to the tokens.
2. **`overflow: hidden` on the `<aside>`.** Clips the footer dropdowns. Put `overflow-y: auto` on the nav list only.
3. **`1fr` instead of `minmax(0, 1fr)`** for the content column. One wide table and the whole page scrolls horizontally.
4. **Persisting drawer state.** The drawer reopens on every reload. Persist only the desktop collapsed flag.
5. **Hiding rail labels with `v-if`.** Loses `title` tooltips and remounts on every toggle. Hide with CSS.
6. **Letting the drawer inherit rail styles.** On mobile the drawer must always be full width with labels.
7. **Leaving the old top-nav CSS behind.** It keeps matching stray classes and confuses the next reader. Delete it in the same edit.
8. **Forgetting to reset `document.body.style.overflow`** on unmount or on resize from mobile to desktop.
9. **Rewriting the shell before tokens exist.** Every offset then needs a second pass.
10. **Editing `.vue` files directly** when the project's CLAUDE.md assigns them to a subagent.
11. **Emoji or unicode arrows as icons.** Inline SVG only.
12. **Not rechecking scoped view styles after the token pass.** They silently keep old colors and radii; the app looks inconsistent and nobody knows why.
13. **Skipping the 390px overflow check.** The most common regression is a horizontal scrollbar from one fixed grid.
14. **Matching the active route with `$route.path ===`** in the template. `exact-active-class` does it and sets `aria-current` for free.
15. **Building the whole shell inside `App.vue`.** A 400-line template with tokens, sidebar, topbar and drawer logic inline cannot be reused or reviewed. Split into `tokens.css`, `useSidebar.js`, `AppSidebar.vue`, `AppTopbar.vue` even when it costs a few more edits.
16. **Claiming overflow is "fixed by construction".** `min-width: 0` and `overflow-x: clip` hide symptoms. Measure `scrollWidth` at 390px on every route; only a number counts.
17. **Deleting scoped duplicates from memory.** One always survives (a `.page-header` copy in a view you did not open). Run the Phase G grep after the pass, not before.
18. **Inventing i18n key names per component.** Use the fixed set from Phase H so every locale file can be diffed against one list.

## Worked Example: inventory-management

Vue 3 + Vite client in `client/`, one unscoped `<style>` in `client/src/App.vue`, no tokens and no media queries, six routes, `useI18n` with `en` and `ja`. Filters live in a sticky `FilterBar.vue` under the header. CLAUDE.md mandates the `vue-expert` subagent for `.vue` edits.

Audit findings and where they were fixed:

| File | Finding | Change | Owner |
|---|---|---|---|
| `client/src/styles/tokens.css` (new) | no tokens anywhere | Phase B block | main agent |
| `client/src/main.js` | no route meta | `import './styles/tokens.css'` first; `meta: { titleKey }` per route | main agent |
| `client/src/composables/useSidebar.js`, `client/src/icons.js` (new) | | Phase C1, C2 | main agent |
| `client/src/locales/en.js`, `ja.js` | no `nav.reports`, no menu keys | Phase H keys, plus `reports.title` / `reports.description` | main agent |
| `client/src/components/ProfileMenu.vue`, `LanguageSwitcher.vue` | `.dropdown-menu` opens down-right | `placement` and `compact` props, `.placement-up`, `.is-compact` | vue-expert |
| `client/src/components/NavIcon.vue`, `AppSidebar.vue`, `AppTopbar.vue` (new) | | Phase C3, D verbatim | vue-expert |
| `client/src/App.vue` | flex column shell, 70px header, `.nav-tabs a.active::after` underline, `.nav-container > .language-switcher` | Phase E; `"Reports"` literal becomes `t('nav.reports')` | vue-expert |
| `client/src/components/FilterBar.vue` | `position: sticky; top: 70px`, repeated 1600px container | `top: var(--topbar-height)`, tokens, `flex-wrap`, static 2x2 grid below 768px | vue-expert |
| `client/src/views/Reports.vue` | scoped copies of `.stats-grid .stat-card .stat-label .stat-value .badge .loading .error` | delete the copies; title and description through `t('reports.*')` | vue-expert |
| `client/src/views/Inventory.vue` | scoped copy of `.page-header` | delete | vue-expert |
| `client/src/views/Dashboard.vue` | `.charts-grid repeat(2, 1fr)`, `.order-health-container 1fr 1fr` | `minmax(min(100%, 420px), 1fr)`, `minmax(min(100%, 260px), 1fr)`; keep its flex `.page-header` (structural) | vue-expert |
| `client/src/views/Spending.vue` | `.two-column-grid minmax(450px, 1fr)` | `minmax(min(100%, 450px), 1fr)` | vue-expert |

Dispatch pattern: one vue-expert task per commit (dropdown props; new components; App.vue + FilterBar; views). Each prompt pastes the exact component code from this skill and the file:line rows above, and asks the subagent to run the Phase I checks it can (it has Playwright MCP tools). The main agent runs `npm run build` between commits.

What to screenshot at the end: `/` at 1440 (becomes the README screenshot), `/reports` at 1440 (the page that changes most after deleting scoped overrides), `/spending` at 390 (the page most likely to overflow).

## Key Reminders

- Shell owns layout; views own content.
- Tokens first, components second, shell third, dependents fourth.
- `grid-template-columns: auto minmax(0, 1fr)` on the shell; `min-width: 0` on the content wrapper.
- No `overflow: hidden` on the sidebar root.
- Breakpoint literals in `@media`; keep them in sync with the composable.
- The drawer is never a rail.
- Delete the old header CSS in the same change that adds the sidebar.
- Delegate `.vue` edits when the project's CLAUDE.md says so.
- No emoji, no unicode arrows, inline SVG only.
- Verify at 1440, 1024, 1023 and 390 with Playwright MCP before claiming done.
