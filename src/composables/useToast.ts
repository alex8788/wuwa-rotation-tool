// ============================================================
// useToast.ts
// 全局輕量提示框的狀態管理 Composable。
// 採用模組層級單例（Module-level Singleton）模式，
// 確保所有元件（含純 .ts 檔案）共享同一份狀態。
// ============================================================

import { reactive, readonly } from 'vue'

// ── 型別定義 ──────────────────────────────────────────────

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger'

interface ToastState {
  visible: boolean
  message: string
  variant: ToastVariant
}

// ── 模組層級單例（非 export，僅透過 useToast 存取）────────

const _state = reactive<ToastState>({
  visible: false,
  message: '',
  variant: 'info',
})

let _dismissTimer: ReturnType<typeof setTimeout> | null = null

// ── 核心函式（模組層級，可在任意 .ts 中直接 import）────────

/**
 * 顯示 Toast 提示。
 * @param message  顯示文字
 * @param variant  樣式變體，預設 'info'
 * @param duration 自動消失毫秒數，預設 2800ms
 */
export function showToast(
  message: string,
  variant: ToastVariant = 'info',
  duration = 2800,
): void {
  // 若上一個計時器尚在執行，先清除（防止閃爍）
  if (_dismissTimer !== null) {
    clearTimeout(_dismissTimer)
    _dismissTimer = null
  }

  _state.message = message
  _state.variant = variant
  _state.visible = true

  _dismissTimer = setTimeout(() => {
    _state.visible = false
    _dismissTimer = null
  }, duration)
}

/**
 * 立即隱藏 Toast。
 */
export function hideToast(): void {
  if (_dismissTimer !== null) {
    clearTimeout(_dismissTimer)
    _dismissTimer = null
  }
  _state.visible = false
}

// ── Composable（供 Vue 元件使用）───────────────────────────

/**
 * useToast()
 * 提供給 Vue 元件使用的 composable 介面。
 * ToastNotification.vue 透過 `toastState` 讀取狀態（唯讀）。
 * 其他元件或 .ts 檔案可直接 import { showToast } from '@/composables/useToast'。
 */
export function useToast() {
  return {
    /** 唯讀的 Toast 狀態，供 ToastNotification.vue 訂閱 */
    toastState: readonly(_state),
    showToast,
    hideToast,
  }
}
