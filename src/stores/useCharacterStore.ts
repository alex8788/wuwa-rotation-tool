// ============================================================
// useCharacterStore.ts — 管理三個角色槽的選角狀態。
//
// 設計原則：換角色（含連帶清空泳道）須可復原 → setCharacter 起手記錄快照，
//           與同批次的 rotationStore.clearSlot 合併為單一 undo 步驟。
// ============================================================

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CharacterSlots, SlotIndex } from '../types/character';
import { WUWA_CHARACTERS, CHARACTER_MAP } from '../constants/characters';
import { useHistory } from '../composables/useHistory';

export const useCharacterStore = defineStore('character', () => {
  /** 三個角色槽狀態（tuple 固定長度 3，對應三條泳道）；初始均未選角。 */
  const slots = ref<CharacterSlots>([
    { slotIndex: 0, character: null },
    { slotIndex: 1, character: null },
    { slotIndex: 2, character: null },
  ]);

  const history = useHistory();

  /** 完整角色名單，供下拉選單。 */
  const allCharacters = computed(() => WUWA_CHARACTERS);

  /** 三槽的角色（依 slotIndex 順序，可能含 null）。 */
  const slotCharacters = computed(() =>
    slots.value.map((slot) => slot.character)
  );

  /** 在指定槽位選角；characterId 傳 null 清空該槽。 */
  function setCharacter(slotIndex: SlotIndex, characterId: string | null): void {
    const character = characterId ? (CHARACTER_MAP[characterId] ?? null) : null;

    if (characterId && !character) {
      console.warn(
        `[useCharacterStore.setCharacter] 找不到 characterId: ${characterId}`
      );
      return;
    }

    history.record();
    slots.value[slotIndex] = { slotIndex, character };
  }

  /** 取得指定槽位的角色 id（供 Block.characterId 使用），空槽回 null。 */
  function getCharacterIdBySlot(slotIndex: SlotIndex): string | null {
    return slots.value[slotIndex].character?.id ?? null;
  }

  /** 反查某角色所在槽位（供模板依角色分流）；佔多槽回第一個、無則 null。 */
  function getSlotByCharacterId(characterId: string | null): SlotIndex | null {
    if (!characterId) return null;
    const slot = slots.value.find((s) => s.character?.id === characterId);
    return slot ? (slot.slotIndex as SlotIndex) : null;
  }

  return {
    slots,
    allCharacters,
    slotCharacters,
    setCharacter,
    getCharacterIdBySlot,
    getSlotByCharacterId,
  };
});