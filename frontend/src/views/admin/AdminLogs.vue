<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <input v-model="keyword" @keyup.enter="loadLogs" type="text" placeholder="搜索操作内容..."
        class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-64" />
      <input v-model="username" @keyup.enter="loadLogs" type="text" placeholder="用户名..."
        class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-40" />
      <input v-model="startDate" type="date"
        class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
      <span class="text-gray-400">至</span>
      <input v-model="endDate" type="date"
        class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
      <button @click="loadLogs"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">搜索</button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">ID</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">操作用户</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">操作</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">模块</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">详情</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">IP</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id" class="border-b border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-3 text-gray-600">{{ log.id }}</td>
            <td class="px-4 py-3 font-medium text-gray-800">{{ log.username }}</td>
            <td class="px-4 py-3 text-gray-600">{{ log.action }}</td>
            <td class="px-4 py-3">
              <span class="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-xs">{{ log.module || '-' }}</span>
            </td>
            <td class="px-4 py-3 text-gray-600 max-w-60 truncate" :title="log.detail">{{ log.detail || '-' }}</td>
            <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ log.ip || '-' }}</td>
            <td class="px-4 py-3 text-gray-600">{{ log.created_at }}</td>
          </tr>
          <tr v-if="logs.length === 0">
            <td colspan="7" class="text-center py-12 text-gray-400">暂无日志数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="total > pageSize" class="flex items-center justify-between mt-4">
      <p class="text-sm text-gray-500">共 {{ total }} 条记录</p>
      <div class="flex gap-1">
        <button @click="changePage(page - 1)" :disabled="page <= 1"
          class="px-3 py-1.5 border rounded text-sm hover:bg-gray-50 disabled:opacity-50">上一页</button>
        <button @click="changePage(page + 1)" :disabled="page >= Math.ceil(total / pageSize)"
          class="px-3 py-1.5 border rounded text-sm hover:bg-gray-50 disabled:opacity-50">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import request from '../../../utils/request';

const logs = ref([]);
const keyword = ref('');
const username = ref('');
const startDate = ref('');
const endDate = ref('');
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

async function loadLogs() {
  const params = { page: page.value, pageSize: pageSize.value };
  if (keyword.value) params.keyword = keyword.value;
  if (username.value) params.username = username.value;
  if (startDate.value) params.start_date = startDate.value;
  if (endDate.value) params.end_date = endDate.value;
  const res = await request.get('/logs', { params });
  logs.value = res.data.list;
  total.value = res.data.total;
}

function changePage(p) {
  if (p >= 1) { page.value = p; loadLogs(); }
}

onMounted(loadLogs);
</script>
