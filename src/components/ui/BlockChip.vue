<script setup lang="ts">
// ============================================================
// BlockChip.vue
// 時間軸區塊的「純視覺無狀態元件」。
// 所有互動狀態（isHovered、isSelected、isDanger）
// 皆由父層注入，元件本身不持有任何響應式資料。
// ============================================================

interface Props {
  /** 顯示文字，例如 'A'、'3AE'、'EQ' */
  label: string
  /** 背景顏色 hex 字串，例如 '#22D3EE' */
  color: string
  /** true 時顯示青色微光邊框（游標懸停提示） */
  isHovered?: boolean
  /** true 時顯示較強的青色光暈（多選狀態） */
  isSelected?: boolean
  /** true 時疊加紅色斜條紋警告動畫（即將丟棄提示） */
  isDanger?: boolean
}

withDefaults(defineProps<Props>(), {
  isHovered: false,
  isSelected: false,
  isDanger: false,
})
</script>

<template>
  <div
    class="block-chip"
    :class="{
      'block-chip--hovered': isHovered && !isSelected && !isDanger,
      'block-chip--selected': isSelected && !isDanger,
      'block-chip--danger': isDanger,
    }"
    :style="{ '--chip-bg': color }"
    role="presentation"
  >
    <!-- 基底色層 -->
    <div class="block-chip__bg" />

    <!-- 危險斜紋遮罩層（isDanger 時才渲染以節省 GPU） -->
    <div v-if="isDanger" class="block-chip__danger-overlay" aria-hidden="true" />

    <!-- 文字層（永遠在最上層） -->
    <span class="block-chip__label">{{ label }}</span>
  </div>
</template>

<style scoped>
/* ── CSS 自訂屬性（由 :style 注入） ─────────────────────── */
.block-chip {
  --chip-bg: #22D3EE;            /* 由 Props color 覆寫 */
  --chip-height: 2.5rem;         /* 40px 固定高度 */
  --chip-px: 0.875rem;           /* 左右內距 */
  --chip-radius: 3px;
  --cyan: #22D3EE;
  --danger-red: #EF4444;
  --danger-red-dark: #DC2626;

  /* ── 佈局 ─── */
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--chip-height);
  padding: 0 var(--chip-px);
  border-radius: var(--chip-radius);
  white-space: nowrap;
  overflow: hidden;
  cursor: grab;
  user-select: none;

  /* ── 邊框：預設透明，狀態時變色 ─── */
  border: 1.5px solid transparent;

  /* ── 過渡（border、shadow、transform 三軸） ─── */
  transition:
    border-color 0.15s ease,
    box-shadow   0.15s ease,
    transform    0.12s ease;
}

/* ── 基底色層 ─────────────────────────────────────────────── */
.block-chip__bg {
  position: absolute;
  inset: 0;
  background-color: var(--chip-bg);
  /* 底部微暗漸層，模擬面板厚度感 */
  background-image: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(0, 0, 0, 0.18) 100%
  );
}

/* ── 文字層 ────────────────────────────────────────────────── */
.block-chip__label {
  position: relative;
  z-index: 2;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', ui-monospace, monospace;
  font-size: 0.8125rem;  /* 13px */
  font-weight: 700;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.93);
  /* 輕微文字陰影增強可讀性 */
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}

/* ── 狀態：懸停（isHovered）────────────────────────────────── */
.block-chip--hovered {
  border-color: rgba(34, 211, 238, 0.45);
  box-shadow:
    0 0  6px rgba(34, 211, 238, 0.15),
    inset 0 0 4px rgba(34, 211, 238, 0.06);
}

/* ── 狀態：選中（isSelected）───────────────────────────────── */
.block-chip--selected {
  border-color: rgba(34, 211, 238, 0.85);
  box-shadow:
    0 0 10px rgba(34, 211, 238, 0.30),
    0 0  3px rgba(34, 211, 238, 0.50),
    inset 0 0  8px rgba(34, 211, 238, 0.10);
}

/* ── 狀態：危險（isDanger）─────────────────────────────────── */
/* 邊框轉紅 */
.block-chip--danger {
  border-color: rgba(239, 68, 68, 0.70);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.25);
}

/* 斜紋遮罩層 */
.block-chip__danger-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: repeating-linear-gradient(
    -45deg,
    rgba(239, 68, 68, 0.72)   0px,
    rgba(239, 68, 68, 0.72)   5px,
    rgba(185, 28,  28, 0.30)  5px,
    rgba(185, 28,  28, 0.30) 11px
  );
  /* 條紋流動動畫 */
  animation: danger-march 0.55s linear infinite;
}

@keyframes danger-march {
  from { background-position: 0 0; }
  /* 11px × √2 ≈ 15.56px — 對角線週期，確保無縫循環 */
  to   { background-position: 15.56px 0; }
}

/* isDanger 時強化文字對比（條紋背景下仍可讀） */
.block-chip--danger .block-chip__label {
  color: #ffffff;
  text-shadow:
    0 0 6px rgba(0, 0, 0, 0.80),
    0 1px 3px rgba(0, 0, 0, 0.60);
}

/* ── 無障礙：減少動畫模式 ──────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .block-chip {
    transition: none;
  }
  .block-chip__danger-overlay {
    animation: none;
    /* 靜態條紋仍保留視覺警示 */
  }
}
</style>
