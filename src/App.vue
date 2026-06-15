<script setup lang="ts">
// ============================================================
// App.vue
// 根元件：負責掛載全域 UI 結構。
//
// 目前為 Phase 3 測試版，成功掛載了 Toast 提示框。
// Phase 4 實作 AppLayout 後，將取代此處的佔位結構。
// ============================================================

import ToastNotification from '@/components/ui/ToastNotification.vue'

// ── 開發期測試示範（Phase 4 串接後可刪除） ─────────────
import { showToast } from '@/composables/useToast'

function demoToast(): void {
  showToast('已新增至模板庫', 'success')
}
</script>

<template>
  <div
    id="app-root"
    class="h-screen w-screen overflow-hidden bg-slate-900 text-white font-sans relative"
  >
    <main class="flex h-full flex-col items-center justify-center gap-6">
      <p class="text-gray-400 font-mono text-xl tracking-widest">
        PHASE 3: UI 基礎元件測試
      </p>
      
      <button
        class="px-6 py-2 bg-cyan-400 text-slate-900 font-bold rounded shadow-lg hover:bg-cyan-300 hover:-translate-y-0.5 transition-all active:translate-y-0"
        @click="demoToast"
      >
        測試 Toast 提示框
      </button>
    </main>

    <ToastNotification />
  </div>
</template>