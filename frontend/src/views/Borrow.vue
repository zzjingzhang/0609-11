<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <input v-model="keyword" @keyup.enter="loadRecords" type="text" placeholder="搜索资产编号/名称/借用人..."
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-72" />
        <select v-model="filterStatus" @change="loadRecords"
          class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">全部状态</option>
          <option value="borrowed">借用中</option>
          <option value="returned">已归还</option>
        </select>
        <button @click="loadRecords"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">搜索</button>
      </div>
      <button @click="openBorrowDialog"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        申请借用
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">资产编号</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">资产名称</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">借用人</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">借用日期</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">预计归还</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">状态</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">备注</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in records" :key="record.id" class="border-b border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-3 font-mono text-xs text-indigo-600">{{ record.asset_code }}</td>
            <td class="px-4 py-3 font-medium text-gray-800">{{ record.asset_name }}</td>
            <td class="px-4 py-3 text-gray-600">{{ record.borrower_name }}</td>
            <td class="px-4 py-3 text-gray-600">{{ record.borrow_date }}</td>
            <td class="px-4 py-3 text-gray-600">{{ record.expected_return_date || '-' }}</td>
            <td class="px-4 py-3">
              <span :class="record.status === 'borrowed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'"
                class="px-2 py-1 rounded-full text-xs font-medium">
                {{ record.status === 'borrowed' ? '借用中' : '已归还' }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-600 max-w-32 truncate">{{ record.remark || '-' }}</td>
          </tr>
          <tr v-if="records.length === 0">
            <td colspan="7" class="text-center py-12 text-gray-400">暂无借用记录</td>
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

    <div v-if="showDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">申请借用</h3>
        <form @submit.prevent="handleBorrow">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">选择资产 <span class="text-red-500">*</span></label>
            <select v-model="borrowForm.asset_id" required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">请选择闲置资产</option>
              <option v-for="asset in idleAssets" :key="asset.id" :value="asset.id">
                {{ asset.code }} - {{ asset.name }}{{ asset.model ? ' (' + asset.model + ')' : '' }}
              </option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">借用日期 <span class="text-red-500">*</span></label>
            <input v-model="borrowForm.borrow_date" type="date" required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">预计归还日期</label>
            <input v-model="borrowForm.expected_return_date" type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea v-model="borrowForm.remark" rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"></textarea>
          </div>
          <div class="flex gap-3">
            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">确认借用</button>
            <button type="button" @click="showDialog = false" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition">取消</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import request from '../../utils/request';

const records = ref([]);
const idleAssets = ref([]);
const keyword = ref('');
const filterStatus = ref('');
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const showDialog = ref(false);
const borrowForm = ref({ asset_id: '', borrow_date: '', expected_return_date: '', remark: '' });

async function loadRecords() {
  const params = { page: page.value, pageSize: pageSize.value };
  if (keyword.value) params.keyword = keyword.value;
  if (filterStatus.value) params.status = filterStatus.value;
  const res = await request.get('/borrow', { params });
  records.value = res.data.list;
  total.value = res.data.total;
}

async function loadIdleAssets() {
  const res = await request.get('/assets', { params: { status: 'idle', pageSize: 100 } });
  idleAssets.value = res.data.list;
}

function openBorrowDialog() {
  borrowForm.value = { asset_id: '', borrow_date: new Date().toISOString().slice(0, 10), expected_return_date: '', remark: '' };
  loadIdleAssets();
  showDialog.value = true;
}

async function handleBorrow() {
  try {
    await request.post('/borrow', borrowForm.value);
    showDialog.value = false;
    loadRecords();
  } catch (err) {
    alert(err.message || '借用失败');
  }
}

function changePage(p) {
  if (p >= 1) { page.value = p; loadRecords(); }
}

onMounted(loadRecords);
</script>
