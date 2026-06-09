<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <input v-model="keyword" @keyup.enter="loadAssets" type="text" placeholder="搜索资产编号/名称/型号..."
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-72" />
        <select v-model="filterStatus" @change="loadAssets"
          class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">全部状态</option>
          <option value="idle">闲置</option>
          <option value="borrowed">已借出</option>
          <option value="in_repair">维修中</option>
          <option value="scrap_pending">报废审批中</option>
          <option value="scrapped">已报废</option>
        </select>
        <select v-model="filterCategory" @change="loadAssets"
          class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">全部分类</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <button @click="loadAssets"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">搜索</button>
      </div>
      <router-link to="/assets/create"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        登记资产
      </router-link>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">资产编号</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">资产名称</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">分类</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">型号</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">状态</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">存放位置</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">购入价格</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="asset in assets" :key="asset.id" class="border-b border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-3 font-mono text-xs text-indigo-600">{{ asset.code }}</td>
            <td class="px-4 py-3 font-medium text-gray-800">{{ asset.name }}</td>
            <td class="px-4 py-3 text-gray-600">{{ asset.category_name }}</td>
            <td class="px-4 py-3 text-gray-600">{{ asset.model || '-' }}</td>
            <td class="px-4 py-3">
              <span :class="statusClass(asset.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                {{ statusLabel(asset.status) }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ asset.location || '-' }}</td>
            <td class="px-4 py-3 text-gray-600">¥{{ asset.purchase_price?.toFixed(2) || '0.00' }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <router-link :to="'/assets/' + asset.id + '/edit'" class="text-indigo-600 hover:text-indigo-800 text-xs">编辑</router-link>
              </div>
            </td>
          </tr>
          <tr v-if="assets.length === 0">
            <td colspan="8" class="text-center py-12 text-gray-400">暂无资产数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="total > pageSize" class="flex items-center justify-between mt-4">
      <p class="text-sm text-gray-500">共 {{ total }} 条记录</p>
      <div class="flex gap-1">
        <button @click="changePage(page - 1)" :disabled="page <= 1"
          class="px-3 py-1.5 border rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">上一页</button>
        <button v-for="p in totalPages" :key="p" @click="changePage(p)"
          class="px-3 py-1.5 border rounded text-sm" :class="p === page ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-gray-50'">{{ p }}</button>
        <button @click="changePage(page + 1)" :disabled="page >= totalPages"
          class="px-3 py-1.5 border rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import request from '../../utils/request';

const assets = ref([]);
const categories = ref([]);
const keyword = ref('');
const filterStatus = ref('');
const filterCategory = ref('');
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

const STATUS_MAP = { 'idle': '闲置', 'borrowed': '已借出', 'in_repair': '维修中', 'scrapped': '已报废', 'scrap_pending': '报废审批中' };

function statusLabel(s) { return STATUS_MAP[s] || s; }
function statusClass(s) {
  const map = { 'idle': 'bg-green-100 text-green-700', 'borrowed': 'bg-blue-100 text-blue-700', 'in_repair': 'bg-yellow-100 text-yellow-700', 'scrapped': 'bg-gray-100 text-gray-600', 'scrap_pending': 'bg-orange-100 text-orange-700' };
  return map[s] || 'bg-gray-100 text-gray-600';
}

async function loadAssets() {
  const params = { page: page.value, pageSize: pageSize.value };
  if (keyword.value) params.keyword = keyword.value;
  if (filterStatus.value) params.status = filterStatus.value;
  if (filterCategory.value) params.category_id = filterCategory.value;
  const res = await request.get('/assets', { params });
  assets.value = res.data.list;
  total.value = res.data.total;
}

async function loadCategories() {
  const res = await request.get('/categories');
  categories.value = res.data;
}

function changePage(p) {
  if (p >= 1 && p <= totalPages.value) {
    page.value = p;
    loadAssets();
  }
}

onMounted(() => {
  loadAssets();
  loadCategories();
});
</script>
