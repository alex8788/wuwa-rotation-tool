<script setup lang="ts">
// SidebarPanel.vue：側邊欄主容器 (提供 Tab 切換並渲染 DefaultBlockField 或 CustomBlockField)

import { ref } from 'vue'
import DefaultBlockField from '@/components/sidebar/DefaultBlockField.vue'
import CustomBlockField from '@/components/sidebar/CustomBlockField.vue'

type TabId = 'default' | 'custom'

// 目前顯示的 Tab
const activeTab = ref<TabId>('default')

const TABS: { id: TabId; label: string }[] = [
  { id: 'default', label: '預設' },
  { id: 'custom',  label: '自訂' },
]
</script>

<template>
  <aside class="sidebar-panel" aria-label="區塊側邊欄">
    
    <div class="segmented-control" role="tablist" aria-label="切換區塊類型">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        class="segment-btn"
        :class="{ 'segment-btn--active': activeTab === tab.id }"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :aria-controls="`tabpanel-${tab.id}`"
        :id="`tab-${tab.id}`"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="tab-content">
      
      <div
        v-show="activeTab === 'default'"
        id="tabpanel-default"
        role="tabpanel"
        aria-labelledby="tab-default"
      >
        <DefaultBlockField />
      </div>

      <div
        v-show="activeTab === 'custom'"
        id="tabpanel-custom"
        role="tabpanel"
        aria-labelledby="tab-custom"
      >
        <CustomBlockField />
      </div>

    </div>
  </aside>
</template>

<style scoped>
.sidebar-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 0.75rem;
  overflow-y: auto;
}

.segmented-control {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem 0;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  margin-bottom: 0.25rem;
}

.segment-btn {
  flex: 1;
  padding: 0.3125rem 0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.40);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.segment-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.65);
}

.segment-btn--active {
  background: rgba(255, 255, 255, 0.10);
  border-color: rgba(255, 255, 255, 0.28);
  color: rgba(255, 255, 255, 0.90);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}
</style>