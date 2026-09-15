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
