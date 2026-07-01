// ============================================================
// characters.ts
// 鳴潮角色名單常數。
// 收錄 1.0 至當前版本實裝之所有共鳴者角色。
// ============================================================

import type { Character } from '../types/character';

/**
 * WUWA_CHARACTERS：鳴潮全角色預設名單。
 *
 * 角色與區塊的顯示顏色一律由屬性（element）經 getElementColor 決定，
 * 故角色資料本身不再保留主題色欄位；每位角色僅記名稱、屬性與星級。
 * 各屬性頁籤內依星級分類（5★ 在 4★ 之前）。
 */
export const WUWA_CHARACTERS: Character[] = [
  // ── 氣動 ──────────────────────────────────────────
  // 5★
  { id: 'jiyan', nameZh: '忌炎', nameEn: 'Jiyan', element: '氣動', rarity: 5 },
  { id: 'jianxin', nameZh: '鑒心', nameEn: 'Jianxin', element: '氣動', rarity: 5 },
  { id: 'rover-aero', nameZh: '漂泊者・氣動', nameEn: 'Rover (Aero)', element: '氣動', rarity: 5 },
  { id: 'qiuyuan', nameZh: '仇遠', nameEn: 'Qiuyuan', element: '氣動', rarity: 5 },
  { id: 'yuno', nameZh: '尤諾', nameEn: 'Yuno', element: '氣動', rarity: 5 },
  { id: 'xiakong', nameZh: '夏空', nameEn: 'Xiakong', element: '氣動', rarity: 5 },
  { id: 'katishia', nameZh: '卡提希婭', nameEn: 'Katisia', element: '氣動', rarity: 5 },
  { id: 'sigrika', nameZh: '西格莉卡', nameEn: 'Sigrika', element: '氣動', rarity: 5 },
  // 4★
  { id: 'yangyang', nameZh: '秧秧', nameEn: 'Yangyang', element: '氣動', rarity: 4 },
  { id: 'aalto', nameZh: '秋水', nameEn: 'Aalto', element: '氣動', rarity: 4 },

  // ── 冷凝 ──────────────────────────────────────────
  // 5★
  { id: 'lingyang', nameZh: '凌陽', nameEn: 'Lingyang', element: '冷凝', rarity: 5 },
  { id: 'zhezhi', nameZh: '折枝', nameEn: 'Zhezhi', element: '冷凝', rarity: 5 },
  { id: 'carlotta', nameZh: '珂萊塔', nameEn: 'Carlotta', element: '冷凝', rarity: 5 },
  { id: 'hiyuki', nameZh: '緋雪', nameEn: 'Hiyuki', element: '冷凝', rarity: 5 },
  { id: 'lucilla', nameZh: '洛瑟菈', nameEn: 'Lucilla', element: '冷凝', rarity: 5 },
  // 4★
  { id: 'baizhi', nameZh: '白芷', nameEn: 'Baizhi', element: '冷凝', rarity: 4 },
  { id: 'sanhua', nameZh: '散華', nameEn: 'Sanhua', element: '冷凝', rarity: 4 },
  { id: 'youhu', nameZh: '釉瑚', nameEn: 'Youhu', element: '冷凝', rarity: 4 },

  // ── 導電 ──────────────────────────────────────────
  // 5★
  { id: 'calcharo', nameZh: '卡卡羅', nameEn: 'Calcharo', element: '導電', rarity: 5 },
  { id: 'yinlin', nameZh: '吟霖', nameEn: 'Yinlin', element: '導電', rarity: 5 },
  { id: 'xiangli-yao', nameZh: '相里要', nameEn: 'Xiangli Yao', element: '導電', rarity: 5 },
  { id: 'augusta', nameZh: '奧古斯塔', nameEn: 'Augusta', element: '導電', rarity: 5 },
  { id: 'rebecca', nameZh: '麗貝卡', nameEn: 'Rebecca', element: '導電', rarity: 5 },
  // 4★
  { id: 'yuanwu', nameZh: '淵武', nameEn: 'Yuanwu', element: '導電', rarity: 4 },
  { id: 'lumi', nameZh: '燈燈', nameEn: 'Lumi', element: '導電', rarity: 4 },
  { id: 'buling', nameZh: '卜靈', nameEn: 'Buling', element: '導電', rarity: 4 },

  // ── 湮滅 ──────────────────────────────────────────
  // 5★
  { id: 'rover-havoc', nameZh: '漂泊者・湮滅', nameEn: 'Rover (Havoc)', element: '湮滅', rarity: 5 },
  { id: 'camellya', nameZh: '椿', nameEn: 'Camellya', element: '湮滅', rarity: 5 },
  { id: 'phrolova', nameZh: '弗洛洛', nameEn: 'Phrolova', element: '湮滅', rarity: 5 },
  { id: 'cantarella', nameZh: '坎特蕾拉', nameEn: 'Cantarella', element: '湮滅', rarity: 5 },
  { id: 'rococo', nameZh: '洛可可', nameEn: 'Rococo', element: '湮滅', rarity: 5 },
  { id: 'chisaki', nameZh: '千咲', nameEn: 'Chisaki', element: '湮滅', rarity: 5 },
  // 4★
  { id: 'danjin', nameZh: '丹瑾', nameEn: 'Danjin', element: '湮滅', rarity: 4 },
  { id: 'taoqi', nameZh: '桃祈', nameEn: 'Taoqi', element: '湮滅', rarity: 4 },

  // ── 衍射 ──────────────────────────────────────────
  // 5★
  { id: 'rover-spectro', nameZh: '漂泊者・衍射', nameEn: 'Rover (Spectro)', element: '衍射', rarity: 5 },
  { id: 'jinhsi', nameZh: '今汐', nameEn: 'Jinhsi', element: '衍射', rarity: 5 },
  { id: 'verina', nameZh: '維里奈', nameEn: 'Verina', element: '衍射', rarity: 5 },
  { id: 'shorekeeper', nameZh: '守岸人', nameEn: 'Shorekeeper', element: '衍射', rarity: 5 },
  { id: 'phoebe', nameZh: '菲比', nameEn: 'Phoebe', element: '衍射', rarity: 5 },
  { id: 'luuk', nameZh: '陸·赫斯', nameEn: 'Luuk Herssen', element: '衍射', rarity: 5 },
  { id: 'linnae', nameZh: '琳奈', nameEn: 'Linnae', element: '衍射', rarity: 5 },
  { id: 'lucy', nameZh: '露西', nameEn: 'Lucy', element: '衍射', rarity: 5 },
  { id: 'zani', nameZh: '贊妮', nameEn: 'Zani', element: '衍射', rarity: 5 },


  // ── 熱熔 ──────────────────────────────────────────
  // 5★
  { id: 'encore', nameZh: '安可', nameEn: 'Encore', element: '熱熔', rarity: 5 },
  { id: 'changli', nameZh: '長離', nameEn: 'Changli', element: '熱熔', rarity: 5 },
  { id: 'brant', nameZh: '布蘭特', nameEn: 'Brant', element: '熱熔', rarity: 5 },
  { id: 'denia', nameZh: '達妮婭', nameEn: 'Denia', element: '熱熔', rarity: 5 },
  { id: 'mornye', nameZh: '莫寧', nameEn: 'Mornye', element: '熱熔', rarity: 5 },
  { id: 'amis', nameZh: '愛彌斯', nameEn: 'Amis', element: '熱熔', rarity: 5 },
  { id: 'gabelina', nameZh: '嘉貝莉娜', nameEn: 'Gabelina', element: '熱熔', rarity: 5 },
  { id: 'lupa', nameZh: '露帕', nameEn: 'Lupa', element: '熱熔', rarity: 5 },
  // 4★
  { id: 'chixia', nameZh: '熾霞', nameEn: 'Chixia', element: '熱熔', rarity: 4 },
  { id: 'mortefi', nameZh: '莫特斐', nameEn: 'Mortefi', element: '熱熔', rarity: 4 },
];

/**
 * CHARACTER_MAP：以 id 為鍵的角色查找表。
 * 時間複雜度 O(1) 的角色查找，避免在渲染迴圈中使用 Array.find()。
 */
export const CHARACTER_MAP: Record<string, Character> = Object.fromEntries(
  WUWA_CHARACTERS.map((c) => [c.id, c])
);