import { reactive, readonly } from 'vue';
import { useRotationStore } from '@/stores/useRotationStore';
import { useSidebarStore } from '@/stores/useSidebarStore';
import { useCharacterStore } from '@/stores/useCharacterStore';
import { getEntriesBySlot } from '@/utils/arrayHelpers';
import type { DefaultBlock, TemplateBlock } from '@/types/block';
import type { RotationEntry, DragSourceType } from '@/types/rotation';
import type { SlotIndex } from '@/types/character';

/**
 * 模擬 SortableJS 的事件物件結構
 * 提取出計算索引所需的屬性，方便與套件解耦
 */
export interface SortableEventLike {
  oldIndex?: number;
  newIndex?: number;
  oldDraggableIndex?: number;
  newDraggableIndex?: number;
}

/**
 * 拖曳狀態的介面定義
 * 由於 <VueDraggable> 分散在不同元件（側邊欄、三個泳道），
 * 我們需要一個「模組層級 (Module-level)」的共用狀態來追蹤整場拖曳事件。
 */
interface DragState {
  isDragging: boolean;
  sourceType: DragSourceType | null;
  draggingId: string | null;
  draggingSourceBlock: DefaultBlock | TemplateBlock | null;
  draggingSlotIndex: SlotIndex | null;
  isOverSidebar: boolean;
  dropHandled: boolean;
}

// 建立全域單例的響應式狀態，集中管理當前拖曳的資訊
const _dragState = reactive<DragState>({
  isDragging: false,
  sourceType: null,
  draggingId: null,
  draggingSourceBlock: null,
  draggingSlotIndex: null,
  isOverSidebar: false,
  dropHandled: false,
});

/**
 * 重設所有拖曳狀態（在 dragEnd 時呼叫）
 */
function _resetDragState(): void {
  _dragState.isDragging = false;
  _dragState.sourceType = null;
  _dragState.draggingId = null;
  _dragState.draggingSourceBlock = null;
  _dragState.draggingSlotIndex = null;
  _dragState.isOverSidebar = false;
  _dragState.dropHandled = false;
}

/**
 * 【核心轉換邏輯】將「單一泳道內的插入索引」轉換為「全域 1D 陣列的插入點」
 * 適用情境：外部區塊（如側邊欄）首次拖入主軸。
 */
function _laneInsertIndexToGlobal(allEntries: RotationEntry[], slotIndex: SlotIndex, laneInsertIndex: number): number {
  const laneEntries = getEntriesBySlot(allEntries, slotIndex);
  
  // 如果是插入在該泳道的最前面
  if (laneInsertIndex === 0) {
    // 泳道全空，直接插在 1D 陣列尾端
    if (laneEntries.length === 0) return allEntries.length - 1;
    // 找到該泳道原本第一塊在 1D 陣列中的位置，插在它「前面」
    const firstGlobalIndex = allEntries.findIndex((e) => e.id === laneEntries[0].id);
    return firstGlobalIndex - 1;
  } else {
    // 插入在某個現存區塊的後方，找到該目標前置區塊的 1D 陣列索引
    const prevLaneEntry = laneEntries[laneInsertIndex - 1];
    if (!prevLaneEntry) return allEntries.length - 1;
    return allEntries.findIndex((e) => e.id === prevLaneEntry.id);
  }
}

/**
 * 【核心轉換邏輯】將「單一泳道內的插入索引」轉換為「全域 1D 陣列的插入點」（排除自身）
 * 適用情境：同一個泳道內進行區塊重新排序（Move）。因為自己在計算時會造成偏移，需先濾除。
 */
function _laneInsertIndexToGlobalExcludingSelf(allEntries: RotationEntry[], slotIndex: SlotIndex, laneInsertIndex: number, selfId: string): number {
  // 先模擬把自己拔掉後的泳道陣列
  const laneEntriesWithoutSelf = getEntriesBySlot(allEntries, slotIndex).filter((e) => e.id !== selfId);
  
  if (laneInsertIndex === 0) {
    if (laneEntriesWithoutSelf.length === 0) return allEntries.length - 1;
    const firstGlobalIndex = allEntries.findIndex((e) => e.id === laneEntriesWithoutSelf[0].id);
    return firstGlobalIndex - 1;
  } else {
    const prevEntry = laneEntriesWithoutSelf[laneInsertIndex - 1];
    if (!prevEntry) return allEntries.length - 1;
    return allEntries.findIndex((e) => e.id === prevEntry.id);
  }
}

export function useBlockDrag() {
  const rotationStore = useRotationStore();
  const sidebarStore = useSidebarStore();
  const characterStore = useCharacterStore();
  
  // 匯出唯讀狀態，防止外部意外修改
  const dragState = readonly(_dragState);

  /**
   * 側邊欄區塊起拖（@start）
   * 紀錄來源區塊資料，以便後續跨區域拖放時深拷貝實例化。
   */
  function onSidebarDragStart(block: DefaultBlock | TemplateBlock): void {
    _dragState.isDragging = true;
    _dragState.sourceType = block.source === 'default' ? 'sidebar-default' : 'sidebar-template';
    _dragState.draggingId = block.id;
    _dragState.draggingSourceBlock = block;
    _dragState.draggingSlotIndex = null;
    _dragState.dropHandled = false;
    _dragState.isOverSidebar = false;
  }

  /**
   * 主軸實體區塊起拖（@start）
   */
  function onRotationDragStart(entry: RotationEntry): void {
    _dragState.isDragging = true;
    _dragState.sourceType = 'rotation-instance';
    _dragState.draggingId = entry.id;
    _dragState.draggingSourceBlock = null;
    _dragState.draggingSlotIndex = entry.slotIndex;
    _dragState.dropHandled = false;
    _dragState.isOverSidebar = false;
  }

  /**
   * 更新滑鼠是否懸停於側邊欄（用於判斷拖回序列化）
   */
  function setOverSidebar(val: boolean): void {
    if (_dragState.isDragging) _dragState.isOverSidebar = val;
  }

  /**
   * 處理：側邊欄 -> 主軸泳道 放入事件（@add）
   */
  function handleSidebarToLaneDrop(event: SortableEventLike, targetSlotIndex: SlotIndex): void {
    _dragState.dropHandled = true;
    const sourceBlock = _dragState.draggingSourceBlock;
    if (!sourceBlock) return;
    
    const targetCharacterId = characterStore.getCharacterIdBySlot(targetSlotIndex);
    if (!targetCharacterId) return;

    // 雙重防線（資料層校驗）：
    // put 規則理論上已在 UI 層物理擋下跨角色拖放，此處再次校驗，
    // 防止特殊路徑（如 forceFallback 啟用，或未來改寫 put 邏輯時的疏漏）
    // 導致非法資料仍被寫入 store。
    const isCharacterMatch = sourceBlock.characterId === null || sourceBlock.characterId === targetCharacterId;
    if (!isCharacterMatch) return;

    // 計算落點並寫入 1D 陣列
    const laneInsertIndex = event.newDraggableIndex ?? event.newIndex ?? 0;
    const globalInsertAfter = _laneInsertIndexToGlobal(rotationStore.entries, targetSlotIndex, laneInsertIndex);
    rotationStore.instantiateBlock(sourceBlock, targetSlotIndex, targetCharacterId, globalInsertAfter);
  }

  /**
   * 處理：主軸泳道內部排序事件（@update）
   */
  function handleSameLaneDrop(event: SortableEventLike, slotIndex: SlotIndex): void {
    _dragState.dropHandled = true;
    const draggingId = _dragState.draggingId;
    if (!draggingId) return;
    
    const allEntries = rotationStore.entries;
    const newLaneIndex = event.newDraggableIndex ?? event.newIndex ?? 0;
    
    // 計算移動目標落點，排除正在拖曳的自己，防止索引偏移
    const globalInsertAfter = _laneInsertIndexToGlobalExcludingSelf(allEntries, slotIndex, newLaneIndex, draggingId);
    rotationStore.moveBlock(draggingId, globalInsertAfter);
  }

  /**
   * 處理：拖曳結束（@end）
   * 包含：拖回側邊欄序列化、拖到空白處刪除，並負責重設狀態。
   */
  function handleDragEnd(): void {
    if (!_dragState.isDragging) return;
    const { sourceType, draggingId, isOverSidebar, dropHandled } = _dragState;
    
    // 僅處理主軸發起的拖曳結束
    if (sourceType === 'rotation-instance' && draggingId) {
      if (isOverSidebar) {
        // 拖回側邊欄：實體區塊序列化儲存為模板
        const entry = rotationStore.entries.find((e) => e.id === draggingId);
        if (entry) sidebarStore.serializeToTemplate(entry.block);
      } else if (!dropHandled) {
        // 未觸發有效 drop（即拖至無效空地）：執行拖曳刪除
        rotationStore.deleteBlock(draggingId);
      }
    }
    
    // 無論發生什麼事，結束時一定要清空全域拖曳狀態
    _resetDragState();
  }

  /**
   * 取得主軸泳道的 Sortable 參數與規則
   */
  function getRotationSortableOptions(_slotIndex: SlotIndex) {
    return {
      group: {
        name: 'rotation',
        pull: true,
        // 動態 put：
        // 1. 先卡死來源必須是 sidebar group，防止泳道互拖。
        // 2. 依方案 A 讀取模組單例 _dragState.draggingSourceBlock 做角色匹配。
        //    - 若 characterId === null（預設區塊通用），一律放行。
        //    - 否則（自訂模板）必須等於本泳道目前的角色 id 才放行。
        put: (to: { options?: { group?: { name?: string } } }, from: { options?: { group?: { name?: string } } }) => {
          if (from?.options?.group?.name !== 'sidebar') return false;
          
          const sourceBlock = _dragState.draggingSourceBlock;
          if (!sourceBlock) return false;
          if (sourceBlock.characterId === null) return true; // 通用基礎招式
          
          const targetCharacterId = characterStore.getCharacterIdBySlot(_slotIndex);
          return sourceBlock.characterId === targetCharacterId; // 嚴格角色對應
        },
      },
      animation: 150, // 移動平滑過渡動畫 (ms)
      ghostClass: 'sortable-ghost', // 自訂吸附線樣式類別
      chosenClass: 'sortable-chosen', // 選中/浮空樣式類別
      dragClass: 'sortable-drag',
      forceFallback: false, // 依賴原生物理拖曳以支援游標禁止圖示
    } as const;
  }

  /**
   * 取得側邊欄區塊的 Sortable 參數與規則
   */
  function getSidebarSortableOptions() {
    return {
      group: { name: 'sidebar', pull: 'clone', put: false }, // 僅允許複製拖出，不接受放入
      sort: false, // 側邊欄內部不允許自由排序
      animation: 0,
      ghostClass: 'sortable-ghost',
    } as const;
  }

  return {
    dragState,
    onSidebarDragStart,
    onRotationDragStart,
    setOverSidebar,
    handleSidebarToLaneDrop,
    handleSameLaneDrop,
    handleDragEnd,
    getRotationSortableOptions,
    getSidebarSortableOptions,
  };
}