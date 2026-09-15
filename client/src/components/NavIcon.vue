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

defineProps({
  name: { type: String, required: true }
})
</script>
