<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <input v-model="keyword" @keyup.enter="loadRecords" type="text" placeholder="搜索资产编号/名称..."
        class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-72" />
      <button @click="loadRecords"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">搜索</button>
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
            <th class="text-left px-4 py-3 font-medium text-gray-600">实际归还</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">状态</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in records" :key="record.id" class="border-b border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-3 font-mono text-xs text-indigo-600">{{ record.asset_code }}</td>
            <td class="px-4 py-3 font-medium text-gray-800">{{ record.asset_name }}</td>
            <td class="px-4 py-3 text-gray-600">{{ record.borrower_name }}</td>
            <td class="px-4 py-3 text-gray-600">{{ record.borrow_date }}</td>
            <td class="px-4 py-3 text-gray-600">{{ record.expected_return_date || '-' }}</td>
            <td class="px-4 py-3 text-gray-600">{{ record.actual_return_date || '-' }}</td>
            <td class="px-4 py-3">
              <span :class="record.status === 'borrowed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'"
                class="px-2 py-1 rounded-full text-xs font-medium">
                {{ record.status === 'borrowed' ? '借用中' : '已归还' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <button v-if="record.status === 'borrowed'" @click="handleReturn(record)"
                class="text-green-600 hover:text-green-800 text-xs font-medium">归还</button>
              <span v-else class="text-gray-400 text-xs">-</span>
            </td>
          </tr>
          <tr v-if="records.length === 0">
            <td colspan="8" class="text-center py-12 text-gray-400">暂无借用记录</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showReturnDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">归还资产</h3>
        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-600">资产：{{ returnRecord?.asset_name }} ({{ returnRecord?.asset_code }})</p>
          <p class="text-sm text-gray-600">借用人：{{ returnRecord?.borrower_name }}</p>
          <p class="text-sm text-gray-600">借用日期：{{ returnRecord?.borrow_date }}</p>
        </div>
        <form @submit.prevent="confirmReturn">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">实际归还日期</label>
            <input v-model="returnForm.actual_return_date" type="date" required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea v-model="returnForm.remark" rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"></textarea>
          </div>
          <div class="flex gap-3">
            <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">确认归还</button>
            <button type="button" @click="showReturnDialog = false" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition">取消</button>
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
const keyword = ref('');
const showReturnDialog = ref(false);
const returnRecord = ref(null);
const returnForm = ref({ actual_return_date: '', remark: '' });

async function loadRecords() {
  const params = { page: 1, pageSize: 50 };
  if (keyword.value) params.keyword = keyword.value;
  const res = await request.get('/borrow', { params });
  records.value = res.data.list;
}

function handleReturn(record) {
  returnRecord.value = record;
  returnForm.value = { actual_return_date: new Date().toISOString().slice(0, 10), remark: '' };
  showReturnDialog.value = true;
}

async function confirmReturn() {
  try {
    await request.post(`/borrow/${returnRecord.value.id}/return`, returnForm.value);
    showReturnDialog.value = false;
    loadRecords();
  } catch (err) {
    alert(err.message || '归还失败');
  }
}

onMounted(loadRecords);
</script>
