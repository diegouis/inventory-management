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
    // The drawer can close again before this tick resolves (open then
    // immediately navigate or Escape). Focusing then would pull focus into
    // an off-screen element, so re-check before touching focus.
    if (!isDrawerOpen.value) return
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
  /* No overflow: hidden here. It would clip footer dropdowns that fly out of the
     rail (see .is-compact .dropdown-menu in dependent components). Only
     .sidebar-nav scrolls, so the brand/footer stay pinned without clipping. */
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

/* Rail: hide labels with CSS, not v-if. v-if would unmount/remount the nav
   items on every toggle (losing focus and re-triggering enter transitions)
   and would drop the `title` tooltip attribute along with the label text. */
.is-rail .nav-label, .is-rail .brand-text { display: none; }
.is-rail .nav-item, .is-rail .collapse-toggle { justify-content: center; padding: 0; }
.is-rail .sidebar-brand { justify-content: center; padding: 0; }

@media (max-width: 1023.98px) {
  /* Below the breakpoint the sidebar is always a full-width off-canvas drawer,
     never a rail: `rail` is forced false by `!isMobile` in the computed above,
     so there is no collapsed/expanded distinction to preserve here. */
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
