<template>
  <div>
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">资产总数</p>
            <p class="text-2xl font-bold text-gray-800 mt-1">{{ overview.totalAssets }}</p>
          </div>
          <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/></svg>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">闲置资产</p>
            <p class="text-2xl font-bold text-green-600 mt-1">{{ overview.idleAssets }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已借出</p>
            <p class="text-2xl font-bold text-blue-600 mt-1">{{ overview.borrowedAssets }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4"/></svg>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">资产总值</p>
            <p class="text-2xl font-bold text-amber-600 mt-1">¥{{ (overview.activeValue || 0).toFixed(0) }}</p>
          </div>
          <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/></svg>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-6 mb-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 class="text-base font-semibold text-gray-800 mb-4">资产状态分布</h3>
        <div class="space-y-3">
          <div v-for="item in statusStats" :key="item.status" class="flex items-center gap-3">
            <span class="text-sm text-gray-600 w-20 shrink-0">{{ item.label }}</span>
            <div class="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500" :class="barColor(item.status)"
                :style="{ width: barWidth(item.count) }"></div>
            </div>
            <span class="text-sm font-medium text-gray-700 w-12 text-right">{{ item.count }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 class="text-base font-semibold text-gray-800 mb-4">分类资产统计</h3>
        <div class="space-y-3">
          <div v-for="item in categoryStats" :key="item.category_name" class="flex items-center justify-between">
            <span class="text-sm text-gray-600">{{ item.category_name }}</span>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-500">{{ item.asset_count }} 件</span>
              <span class="text-sm font-medium text-gray-700">¥{{ (item.total_value || 0).toFixed(0) }}</span>
            </div>
          </div>
          <div v-if="categoryStats.length === 0" class="text-center text-gray-400 text-sm py-4">暂无数据</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 class="text-base font-semibold text-gray-800 mb-4">最近借用记录</h3>
        <div class="space-y-2">
          <div v-for="item in recentBorrows" :key="item.id" class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div>
              <p class="text-sm font-medium text-gray-700">{{ item.asset_name }}</p>
              <p class="text-xs text-gray-400">{{ item.asset_code }} · {{ item.borrower_name }}</p>
            </div>
            <span class="text-xs text-gray-500">{{ item.borrow_date }}</span>
          </div>
          <div v-if="recentBorrows.length === 0" class="text-center text-gray-400 text-sm py-4">暂无数据</div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 class="text-base font-semibold text-gray-800 mb-4">最近报废记录</h3>
        <div class="space-y-2">
          <div v-for="item in recentScraps" :key="item.id" class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div>
              <p class="text-sm font-medium text-gray-700">{{ item.asset_name }}</p>
              <p class="text-xs text-gray-400">{{ item.asset_code }} · {{ item.applicant_name }}</p>
            </div>
            <span :class="scrapStatusClass(item.status)" class="text-xs px-2 py-0.5 rounded-full">{{ scrapStatusLabel(item.status) }}</span>
          </div>
          <div v-if="recentScraps.length === 0" class="text-center text-gray-400 text-sm py-4">暂无数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import request from '../utils/request';

const overview = ref({});
const statusStats = ref([]);
const categoryStats = ref([]);
const recentBorrows = ref([]);
const recentScraps = ref([]);

const maxCount = computed(() => {
  const m = Math.max(...statusStats.value.map(s => s.count), 1);
  return m;
});

function barWidth(count) {
  return Math.max((count / maxCount.value) * 100, 2) + '%';
}

function barColor(status) {
  const map = { 'idle': 'bg-green-500', 'borrowed': 'bg-blue-500', 'in_repair': 'bg-yellow-500', 'scrapped': 'bg-gray-400', 'scrap_pending': 'bg-orange-500' };
  return map[status] || 'bg-gray-400';
}

const SCRAP_STATUS = { pending: '待审批', approved: '已批准', rejected: '已驳回' };
const SCRAP_CLASS = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };
function scrapStatusLabel(s) { return SCRAP_STATUS[s] || s; }
function scrapStatusClass(s) { return SCRAP_CLASS[s] || 'bg-gray-100 text-gray-600'; }

async function loadData() {
  try {
    const [overviewRes, statusRes, categoryRes, borrowRes, scrapRes] = await Promise.all([
      request.get('/statistics/overview'),
      request.get('/statistics/by-status'),
      request.get('/statistics/by-category'),
      request.get('/statistics/recent-borrows'),
      request.get('/statistics/recent-scraps')
    ]);
    overview.value = overviewRes.data;
    statusStats.value = statusRes.data;
    categoryStats.value = categoryRes.data;
    recentBorrows.value = borrowRes.data;
    recentScraps.value = scrapRes.data;
  } catch (err) {
    console.error('Failed to load statistics:', err);
  }
}

onMounted(loadData);
</script>
