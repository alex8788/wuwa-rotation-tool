<script setup lang="ts">
// ============================================================
// RotationBoard.vue
// 主時間軸面板：三條 Swimlane 的總容器。
//
// 職責：
//   1. 讀 useCharacterStore 三個角色槽選角狀態。
//   2. 讀 useRotationStore 1D 輸出軸陣列（entries），依 slotIndex 分配給三條泳道。
//   3. 共用 CSS Grid 欄位對齊 + 拖曳落點預覽（含多選）。
//   4. 跨三泳道矩形框選（marquee）。
//
// 拖曳本身由各 Swimlane 內的 SortableJS 處理；本元件只負責框選，
// 且框選刻意與區塊拖曳完全隔離（見下方 marquee 區註解）。
// ============================================================

import { computed, onMounted, onBeforeUnmount, nextTick, ref, watch } from 'vue'
import Swimlane from '@/components/rotation/Swimlane.vue'
import BlockChip from '@/components/ui/BlockChip.vue'
import { useCharacterStore } from '@/stores/useCharacterStore'
import { useRotationStore } from '@/stores/useRotationStore'
import { DELETE_ZONE_ATTRIBUTE, useBlockDrag } from '@/composables/useBlockDrag'
import type { SlotIndex } from '@/types/character'
import type { RotationEntry } from '@/types/rotation'

// ── Stores ───────────────────────────────────────────────────

const characterStore = useCharacterStore()
const rotationStore = useRotationStore()
const { dragState, setColumnBaseline, notifyAutoScroll } = useBlockDrag()

// ── 依 slotIndex 分配 entries ────────────────────────────────

const entriesBySlot = computed<Record<SlotIndex, RotationEntry[]>>(() => {
  const map: Record<SlotIndex, RotationEntry[]> = { 0: [], 1: [], 2: [] }
  for (const entry of rotationStore.entries) {
    map[entry.slotIndex as SlotIndex].push(entry)
  }
  return map
})

// ── 單線程欄位對齊（共用 CSS Grid）───────────────────────────

const idToColumnIndex = computed<Map<string, number>>(() => {
  const map = new Map<string, number>()
  rotationStore.entries.forEach((entry, index) => map.set(entry.id, index))
  return map
})

function measurerColor(entry: RotationEntry): string {
  return characterStore.slotCharacters[entry.slotIndex]?.themeColor ?? '#888888'
}

const measurerRef = ref<HTMLElement | null>(null)
const columnWidths = ref<number[]>([])

const gridTemplate = computed<string>(() =>
  columnWidths.value.map((w) => `${w}px`).join(' '),
)

function measure(): void {
  const el = measurerRef.value
  if (!el) return
  columnWidths.value = Array.from(el.children).map(
    (child) => (child as HTMLElement).getBoundingClientRect().width,
  )
}

async function remeasureAfterRender(): Promise<void> {
  await nextTick()
  measure()
}

watch(() => rotationStore.entries, remeasureAfterRender, { deep: true })

// 拖曳開始時，快照「靜態欄位幾何」給 useBlockDrag 做落點 hit-test。
watch(
  () => dragState.isDragging,
  (now) => {
    if (!now) return
    const centerById = new Map<string, number>()
    document.querySelectorAll<HTMLElement>('.rotation-block[data-entry-id]').forEach((el) => {
      const id = el.getAttribute('data-entry-id')
      if (!id) return
      const r = el.getBoundingClientRect()
      centerById.set(id, r.left + r.width / 2)
    })
    const baseline = rotationStore.entries.map((e) => ({
      id: e.id,
      center: centerById.get(e.id) ?? Infinity,
    }))
    setColumnBaseline(baseline)
  },
)

// ── 拖曳落點預覽（single thread 跨泳道同步擠出，含多選）─────────

const PREVIEW_PLACEHOLDER = '__preview_placeholder__'

const isPreviewing = computed<boolean>(
  () => dragState.isDragging && dragState.previewInsertAfterIndex !== null,
)

const previewLayout = computed<{
  template: string
  idToColumn: Map<string, number>
  placeholderColumn: number | null
  slotIndex: SlotIndex | null
}>(() => {
  if (!isPreviewing.value) {
    return {
      template: gridTemplate.value,
      idToColumn: idToColumnIndex.value,
      placeholderColumn: null,
      slotIndex: null,
    }
  }

  const entries = rotationStore.entries
  const widths = columnWidths.value
  const afterIn = dragState.previewInsertAfterIndex as number
  const draggingId = dragState.draggingId
  const isRotationSource = dragState.sourceType === 'rotation-instance'

  const TRACK_GAP = 6
  const draggingIds = dragState.draggingIds
  const idSet = new Set<string>(draggingIds.length ? draggingIds : draggingId ? [draggingId] : [])

  let placeholderWidth = dragState.draggingWidth
  if (isRotationSource && idSet.size > 0) {
    let sum = 0
    let cnt = 0
    entries.forEach((e, i) => {
      if (idSet.has(e.id)) {
        sum += widths[i] ?? 0
        cnt++
      }
    })
    if (cnt > 0) placeholderWidth = sum + TRACK_GAP * (cnt - 1)
  }

  const cols = entries.map((e, i) => ({ id: e.id, width: widths[i] ?? 0 }))
  const insertAt = afterIn < 0 ? 0 : Math.min(afterIn + 1, cols.length)
  cols.splice(insertAt, 0, { id: PREVIEW_PLACEHOLDER, width: placeholderWidth })
  const working = isRotationSource ? cols.filter((c) => !idSet.has(c.id)) : cols

  const idToColumn = new Map<string, number>()
  working.forEach((c, i) => idToColumn.set(c.id, i))
  const template = working.map((c) => `${c.width}px`).join(' ')

  return {
    template,
    idToColumn,
    placeholderColumn: idToColumn.get(PREVIEW_PLACEHOLDER) ?? null,
    slotIndex: dragState.previewSlotIndex,
  }
})

const previewGridTemplate = computed<string>(() => previewLayout.value.template)
const previewIdToColumn = computed<Map<string, number>>(() => previewLayout.value.idToColumn)

// ── 跨三泳道矩形框選（marquee）─────────────────────────────
//
// 與區塊拖曳徹底隔離，避免互搶事件：
//   1. 起手只在 .board__scroll 上掛「冒泡階段」mousedown（非 window capture），
//      不會搶在 SortableJS 之前；且區塊的 mousedown 一律先被 SortableJS 處理。
//   2. 按在區塊/按鈕/輸入框/選單上 → 直接 return，完全不介入，由 SortableJS
//      獨佔該次拖曳；空白處 SortableJS 本來就不啟動 → 兩者互不干擾。
//   3. 左鍵按住後，位移超過閾值才真正啟動框選（單純點擊不框選）。
//   4. 框選進行中才掛 window mousemove/mouseup，結束立即移除。

const boardScrollRef = ref<HTMLElement | null>(null)

// ── 拖曳邊緣自動捲動（4.4f）─────────────────────────────────
//
// 拖曳中游標接近 .board__scroll 左/右邊緣時，RAF 迴圈持續修改 scrollLeft。
// 只動 scrollLeft（不重開 SortableJS scroll、不動浮動分身）；落點正確性由
// notifyAutoScroll(delta) 同步補償 _columnBaseline 並重算（見 useBlockDrag）。
const EDGE = 48        // 觸發邊距（px）
const MAX_STEP = 18    // 每幀最大位移（px）
let _rafId = 0
let _edgeClientX = 0

function onDragMouseMove(event: MouseEvent): void {
  _edgeClientX = event.clientX
}

function autoScrollTick(): void {
  const el = boardScrollRef.value
  if (el) {
    const rect = el.getBoundingClientRect()
    let dir = 0
    let dist = 0
    if (_edgeClientX <= rect.left + EDGE) {
      dir = -1
      dist = _edgeClientX - rect.left
    } else if (_edgeClientX >= rect.right - EDGE) {
      dir = 1
      dist = rect.right - _edgeClientX
    }
    if (dir !== 0) {
      const step = MAX_STEP * (1 - Math.max(0, Math.min(EDGE, dist)) / EDGE)
      const before = el.scrollLeft
      el.scrollLeft += dir * step // 瀏覽器自動 clamp 到 [0, scrollWidth-clientWidth]
      const delta = el.scrollLeft - before
      if (delta !== 0) notifyAutoScroll(delta)
    }
  }
  _rafId = requestAnimationFrame(autoScrollTick)
}

function startAutoScroll(): void {
  if (_rafId) return
  _edgeClientX = 0
  window.addEventListener('mousemove', onDragMouseMove)
  _rafId = requestAnimationFrame(autoScrollTick)
}

function stopAutoScroll(): void {
  if (_rafId) cancelAnimationFrame(_rafId)
  _rafId = 0
  window.removeEventListener('mousemove', onDragMouseMove)
}

watch(
  () => dragState.isDragging,
  (now) => (now ? startAutoScroll() : stopAutoScroll()),
)

const marquee = ref<{ active: boolean; left: number; top: number; width: number; height: number }>({
  active: false, left: 0, top: 0, width: 0, height: 0,
})
let _mqStartX = 0
let _mqStartY = 0
let _mqAdditive = false
let _mqArmed = false
let _mqActive = false
let _justMarqueed = false

function onScrollMouseDown(event: MouseEvent): void {
  if (event.button !== 0) return
  if (dragState.isDragging) return
  const t = event.target as Element | null
  if (!t) return
  // 按在區塊/互動元素上 → 讓位給 SortableJS（不搶事件）
  if (t.closest('.rotation-block, button, input, textarea, [role="combobox"], .char-selector__listbox')) {
    return
  }
  _mqStartX = event.clientX
  _mqStartY = event.clientY
  _mqAdditive = event.ctrlKey || event.metaKey
  _mqArmed = true
  _mqActive = false
  window.addEventListener('mousemove', onMarqueeMove)
  window.addEventListener('mouseup', onMarqueeUp)
}

function onMarqueeMove(event: MouseEvent): void {
  if (!_mqArmed) return
  const dx = event.clientX - _mqStartX
  const dy = event.clientY - _mqStartY
  if (!_mqActive && Math.abs(dx) < 5 && Math.abs(dy) < 5) return
  _mqActive = true
  marquee.value = {
    active: true,
    left: Math.min(_mqStartX, event.clientX),
    top: Math.min(_mqStartY, event.clientY),
    width: Math.abs(dx),
    height: Math.abs(dy),
  }
}

function onMarqueeUp(): void {
  window.removeEventListener('mousemove', onMarqueeMove)
  window.removeEventListener('mouseup', onMarqueeUp)

  if (_mqActive) {
    const r = marquee.value
    const right = r.left + r.width
    const bottom = r.top + r.height
    const hit: string[] = []
    document.querySelectorAll<HTMLElement>('.rotation-block[data-entry-id]').forEach((el) => {
      const b = el.getBoundingClientRect()
      if (b.left < right && b.right > r.left && b.top < bottom && b.bottom > r.top) {
        const id = el.getAttribute('data-entry-id')
        if (id) hit.push(id)
      }
    })
    rotationStore.selectBlocks(hit, _mqAdditive)
    _justMarqueed = true
  }

  _mqArmed = false
  _mqActive = false
  marquee.value = { active: false, left: 0, top: 0, width: 0, height: 0 }
}

// 框選剛結束時，攔截緊接的 click（避免 App.vue root @click 清掉剛選取的區塊）
function onBoardClickCapture(event: MouseEvent): void {
  if (_justMarqueed) {
    event.stopPropagation()
    _justMarqueed = false
  }
}

// ── 假資料初始化（開發模式驗證用）──────────────────────────

function seedStoreWithStubData(): void {
  if (rotationStore.entries.length > 0) return

  const chars = characterStore.slotCharacters
  const stubLabels = [
    ['A', '3AE', 'E', 'R', 'A'],
    ['E', 'Z', 'A', 'EQ'],
    ['3A', 'R', 'D', 'A', 'E'],
  ] as const

  stubLabels.forEach((labels, idx) => {
    const slotIndex = idx as SlotIndex
    const char = chars[idx]
    if (!char) return
    labels.forEach((label) => {
      rotationStore.addFreeformBlock(label, char.themeColor, slotIndex, char.id)
    })
  })
}

function handleResize(): void {
  void remeasureAfterRender()
}

onMounted(async () => {
  if (import.meta.env.DEV) {
    const slots = characterStore.slots
    if (!slots[0].character) characterStore.setCharacter(0, 'jiyan')
    if (!slots[1].character) characterStore.setCharacter(1, 'verina')
    if (!slots[2].character) characterStore.setCharacter(2, 'shorekeeper')
    seedStoreWithStubData()
  }

  await remeasureAfterRender()
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => void remeasureAfterRender())
  }
  window.addEventListener('resize', handleResize)

  // 框選起手：綁在捲動容器的冒泡階段（不用 window capture，不搶 SortableJS）
  boardScrollRef.value?.addEventListener('mousedown', onScrollMouseDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  boardScrollRef.value?.removeEventListener('mousedown', onScrollMouseDown)
  stopAutoScroll()
  window.removeEventListener('mousemove', onMarqueeMove)
  window.removeEventListener('mouseup', onMarqueeUp)
})
</script>

<template>
  <section
    class="rotation-board"
    :[DELETE_ZONE_ATTRIBUTE]="true"
    aria-label="輸出軸面板"
    @click.capture="onBoardClickCapture"
  >
    <div ref="boardScrollRef" class="board__scroll">
      <div class="board__lanes">
        <Swimlane
          v-for="slot in characterStore.slots"
          :key="slot.slotIndex"
          :slot-index="slot.slotIndex"
          :character="slot.character"
          :entries="entriesBySlot[slot.slotIndex]"
          :grid-template="previewGridTemplate"
          :id-to-column-index="previewIdToColumn"
          :placeholder-column="previewLayout.placeholderColumn"
          :preview-slot-index="previewLayout.slotIndex"
        />
      </div>
    </div>

    <div ref="measurerRef" class="board__measurer" aria-hidden="true">
      <BlockChip
        v-for="entry in rotationStore.entries"
        :key="entry.id"
        :label="entry.block.label"
        :color="entry.block.color || measurerColor(entry)"
      />
    </div>

    <!-- 框選矩形（fixed，視窗座標）-->
    <div
      v-if="marquee.active"
      class="marquee-box"
      :style="{ left: marquee.left + 'px', top: marquee.top + 'px', width: marquee.width + 'px', height: marquee.height + 'px' }"
      aria-hidden="true"
    />
  </section>
</template>

<style scoped>
/* ── 三軸容器 ────────────────────────────────────────────── */
.rotation-board {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 6px;
  overflow: hidden;

  background: rgba(255, 255, 255, 0.015);

  position: relative;
}

/* ── 共用水平捲動容器 ──────────────────────────────────────── */
.board__scroll {
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}

.board__lanes {
  display: flex;
  flex-direction: column;
  width: max-content;
  min-width: 100%;
  height: 100%;
}

/* ── 隱藏量測列 ────────────────────────────────────────────── */
.board__measurer {
  position: absolute;
  top: 0;
  left: 0;
  visibility: hidden;
  pointer-events: none;
  display: flex;
  gap: 0.375rem;
}

/* ── 框選矩形（marquee） ────────────────────────────────────── */
.marquee-box {
  position: fixed;
  z-index: 900;
  pointer-events: none;
  border: 1px solid rgba(34, 211, 238, 0.7);
  background: rgba(34, 211, 238, 0.12);
  border-radius: 2px;
}
</style>
