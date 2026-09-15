<template>
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    v-html="icons[name]"
  />
</template>

<script setup>
import { icons } from '../icons'

const props = defineProps({
  name: { type: String, required: true }
})

// A typo in an icon name would otherwise render an empty <svg> with no signal
if (import.meta.env.DEV && !icons[props.name]) {
  console.warn(`NavIcon: unknown icon "${props.name}"`)
}
</script>
