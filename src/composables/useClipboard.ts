// ============================================================
// useClipboard.ts
// 區塊剪貼簿：管理複製、剪下、貼上、向右複製的暫存狀態。
//
// 【設計說明】
// 剪貼簿使用「模組層級單例」：整個 Session 中所有元件共享同一份
// 剪貼簿緩衝區，確保跨元件的 Ctrl+C → Ctrl+V 操作語意一致。
//
// 在 v1.5 版本中，剪貼簿緩衝區改為直接儲存 RotationEntry[]，
// 並全面採用 O(N) 演算法優化排序效能，與高階拷貝機制完美對接。
// ============================================================

import { ref, readonly, nextTick } from 'vue';
import { useRotationStore } from '@/stores/useRotationStore';
import { deepClone } from '@/utils/deepClone';
import type { RotationEntry } from '@/types/rotation';

// ── 模組層級單例狀態 ──────────────────────────────────────
// 使用模組層級 ref 而非 composable 內部 ref，確保「單一剪貼簿」語意。
const _clipboardBuffer = ref<RotationEntry[]>([]);

/** 目前剪貼簿是否有內容 */
const _hasContent = ref(false);

export function useClipboard() {
  const rotationStore = useRotationStore();

  // ──────────────────────────────────────────
  // 內部工具
  // ──────────────────────────────────────────

  /**
   * _getSortedSelectedEntries：取得依照時間軸順序排列的選取區塊。
   */
  function _getSortedSelectedEntries(): RotationEntry[] {
    const { entries, selectedEntries } = rotationStore;
    // 將選取的 ID 轉為 Set，搜尋效能為 O(1)
    const selectedIds = new Set(selectedEntries.map((e) => e.id));
    // 遍歷主軸陣列一次 O(N)，自然就能得到「符合主軸順序」的選取區塊
    return entries.filter((e) => selectedIds.has(e.id));
  }

  /**
   * _buildClipboardItems：將 store 目前選取的 entries 轉為剪貼簿緩衝項目。
   */
  function _buildClipboardItems(): RotationEntry[] {
    const sortedSelected = _getSortedSelectedEntries();
    // 深拷貝：確保剪貼簿中的資料與主軸完全解耦
    return sortedSelected.map((entry) => deepClone(entry));
  }

  // ──────────────────────────────────────────
  // 公開操作方法
  // ──────────────────────────────────────────

  /**
   * copySelected：複製選取的區塊到剪貼簿（不刪除原區塊）。
   * 對應 Ctrl+C。
   */
  function copySelected(): void {
    if (rotationStore.selectedEntries.length === 0) return;

    _clipboardBuffer.value = _buildClipboardItems();
    _hasContent.value = _clipboardBuffer.value.length > 0;
  }

  /**
   * cutSelected：剪下選取的區塊（複製到剪貼簿後刪除原區塊）。
   * 對應 Ctrl+X。
   */
  function cutSelected(): void {
    if (rotationStore.selectedEntries.length === 0) return;

    _clipboardBuffer.value = _buildClipboardItems();
    _hasContent.value = _clipboardBuffer.value.length > 0;
    rotationStore.deleteSelectedBlocks();
  }

  /**
   * paste：將剪貼簿中的區塊插入到主時間軸。
   * 對應 Ctrl+V。
   */
  function paste(): void {
    if (_clipboardBuffer.value.length === 0) return;

    const { entries, selectedEntries } = rotationStore;

    // 計算插入基準點（預設追加至末尾）
    let insertAfterIndex = entries.length - 1;

    if (selectedEntries.length > 0) {
      const sortedSelected = _getSortedSelectedEntries();
      const lastSelected = sortedSelected[sortedSelected.length - 1];

      const lastIdx = entries.findIndex((e) => e.id === lastSelected.id);
      if (lastIdx !== -1) insertAfterIndex = lastIdx;
    }

    // 呼叫階段一擴充的高階影印機，保留血統並賦予新 UUID
    // 注意：為了允許多次連續貼上，每次貼上時都要從剪貼簿深拷貝一次全新副本
    const itemsToInsert = _clipboardBuffer.value.map((entry) => deepClone(entry));
    const newIds = rotationStore.insertClonedBlocks(itemsToInsert, insertAfterIndex);
    // 貼上位置可能落在主軸可視範圍外（尤其追加至末尾）→ 渲染後自動捲動到最後一個貼上的區塊
    _scrollEntryIntoView(newIds[newIds.length - 1]);
  }

  /**
   * _scrollEntryIntoView：等 DOM 更新後，把指定區塊水平捲到主軸可視範圍「正中央」。
   * 主軸橫向捲動容器為 .board__scroll，左側泳道 header 為 sticky 會覆蓋容器左緣，
   * 故不用 scrollIntoView（會把目標推到 header 底下），改手動計算：
   *   目標 scrollLeft = 區塊在內容座標的中心 − 可視軌道區（header 右側）的中心
   * 再 clamp 到 [0, maxScrollLeft]；已捲到任一邊緣時自然停在邊界（不強制置中）。
   */
  function _scrollEntryIntoView(entryId: string | undefined): void {
    if (!entryId) return;
    nextTick(() => {
      const el = document.querySelector<HTMLElement>(`.rotation-block[data-entry-id="${entryId}"]`);
      const scroll = document.querySelector<HTMLElement>('.board__scroll');
      if (!el || !scroll) return;

      const scrollRect = scroll.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      // sticky header 寬度（可視軌道區＝容器寬扣掉 header）；讀實際 DOM 較硬編碼穩。
      const headerW =
        scroll.querySelector<HTMLElement>('.swimlane__header')?.getBoundingClientRect().width ?? 0;

      // 區塊中心在「捲動內容座標系」的位置
      const elCenterInContent =
        scroll.scrollLeft + (elRect.left - scrollRect.left) + elRect.width / 2;
      // 可視軌道區（header 右側）的中心
      const visibleCenter = headerW + (scrollRect.width - headerW) / 2;

      const maxScrollLeft = scroll.scrollWidth - scroll.clientWidth;
      const target = Math.max(0, Math.min(elCenterInContent - visibleCenter, maxScrollLeft));
      scroll.scrollTo({ left: target, behavior: 'smooth' });
    });
  }

  /**
   * duplicateRight：向右複製選取的區塊，立即插入在原位置之後。
   * 對應 Ctrl+D。
   */
  function duplicateRight(): void {
    if (rotationStore.selectedEntries.length === 0) return;

    const { entries } = rotationStore;
    const sortedSelected = _getSortedSelectedEntries();

    // 插入點：目前最後一個選取區塊的全域索引
    const lastEntry = sortedSelected[sortedSelected.length - 1];
    const insertAfterIndex = entries.findIndex((e) => e.id === lastEntry.id);

    // 深拷貝後，直接進入高階影印機
    const itemsToInsert = sortedSelected.map((entry) => deepClone(entry));
    rotationStore.insertClonedBlocks(itemsToInsert, insertAfterIndex);
  }

  /**
   * clearClipboard：清空剪貼簿（保留供未來「剪下 → 復原」功能使用）。
   */
  function clearClipboard(): void {
    _clipboardBuffer.value = [];
    _hasContent.value = false;
  }

  return {
    clipboardBuffer: readonly(_clipboardBuffer),
    hasContent: readonly(_hasContent),
    copySelected,
    cutSelected,
    paste,
    duplicateRight,
    clearClipboard,
  };
}