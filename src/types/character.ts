// ============================================================
// character.ts
// 定義「角色（Character）」介面與三個角色槽的型別。
// ============================================================

/**
 * Character：代表一個鳴潮角色的基本資料。
 * 此介面同時用於「角色名單常數」與「已選角色槽」。
 */
export interface Character {
  /**
   * 角色唯一識別碼。
   * 使用英文角色名稱的 kebab-case 格式，例如 'rover-havoc'。
   * 作為與 Block.characterId 對應的外鍵（Foreign Key）。
   */
  id: string;

  /** 角色的繁體中文顯示名稱，例如 '今汐'、'忌炎' */
  nameZh: string;

  /** 角色的英文名稱，例如 'Jiyan'、'Jinhsi'（保留供多語系擴充） */
  nameEn: string;

  /**
   * 角色屬性（元素）。
   * 保留欄位，供日後標籤系統或篩選功能使用。
   */
  element: CharacterElement;

  /**
   * 角色星級稀有度：5（五星）或 4（四星）。
   * 用於角色選單在各屬性頁籤內依星級分類（5★ 在 4★ 之前）。
   */
  rarity: CharacterRarity;
}

/**
 * 角色星級稀有度聯合型別。
 */
export type CharacterRarity = 5 | 4;

/**
 * 鳴潮角色的屬性（元素）聯合型別。
 */
export type CharacterElement =
  | '氣動'
  | '冷凝'
  | '導電'
  | '湮滅'
  | '衍射'
  | '熱熔';

/**
 * 角色槽索引：主時間軸共有三條泳道，對應索引 0、1、2。
 * 使用字面量型別確保不會傳入超出範圍的數字。
 */
export type SlotIndex = 0 | 1 | 2;

/**
 * CharacterSlot：單一角色槽的狀態。
 * 槽位可以是空的（null），代表尚未選擇角色。
 */
export interface CharacterSlot {
  /** 槽位索引，決定對應第幾條輸出軸 */
  slotIndex: SlotIndex;
  /** 已選角色，null 代表尚未選擇 */
  character: Character | null;
}

/**
 * CharacterSlots：三個角色槽的完整狀態，以 tuple 型別確保長度為 3。
 */
export type CharacterSlots = [CharacterSlot, CharacterSlot, CharacterSlot];