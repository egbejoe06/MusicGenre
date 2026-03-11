<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <RouterView />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e293b 100%);
  background-attachment: fixed;
}
</style>

