<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <input v-model="keyword" @keyup.enter="loadRecords" type="text" placeholder="搜索资产编号/名称..."
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-72" />
        <select v-model="filterStatus" @change="loadRecords"
          class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">全部状态</option>
          <option value="pending">待审批</option>
          <option value="approved">已批准</option>
          <option value="rejected">已驳回</option>
        </select>
        <button @click="loadRecords"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">搜索</button>
      </div>
      <button @click="openScrapDialog"
        class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        申请报废
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">资产编号</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">资产名称</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">申请人</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">申请原因</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">状态</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">审批人</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">申请时间</th>
            <th v-if="authStore.isAdmin" class="text-left px-4 py-3 font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in records" :key="record.id" class="border-b border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-3 font-mono text-xs text-indigo-600">{{ record.asset_code }}</td>
            <td class="px-4 py-3 font-medium text-gray-800">{{ record.asset_name }}</td>
            <td class="px-4 py-3 text-gray-600">{{ record.applicant_name }}</td>
            <td class="px-4 py-3 text-gray-600 max-w-40 truncate">{{ record.reason || '-' }}</td>
            <td class="px-4 py-3">
              <span :class="scrapStatusClass(record.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                {{ scrapStatusLabel(record.status) }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ record.approver_name || '-' }}</td>
            <td class="px-4 py-3 text-gray-600">{{ record.created_at }}</td>
            <td v-if="authStore.isAdmin" class="px-4 py-3">
              <div v-if="record.status === 'pending'" class="flex items-center gap-2">
                <button @click="handleApprove(record)" class="text-green-600 hover:text-green-800 text-xs">批准</button>
                <button @click="handleReject(record)" class="text-red-600 hover:text-red-800 text-xs">驳回</button>
              </div>
              <span v-else class="text-gray-400 text-xs">-</span>
            </td>
          </tr>
          <tr v-if="records.length === 0">
            <td :colspan="authStore.isAdmin ? 8 : 7" class="text-center py-12 text-gray-400">暂无报废记录</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">申请报废</h3>
        <form @submit.prevent="handleScrap">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">选择资产 <span class="text-red-500">*</span></label>
            <select v-model="scrapForm.asset_id" required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">请选择可报废资产</option>
              <option v-for="asset in availableAssets" :key="asset.id" :value="asset.id">
                {{ asset.code }} - {{ asset.name }} ({{ asset.status === 'idle' ? '闲置' : '维修中' }})
              </option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">报废原因</label>
            <textarea v-model="scrapForm.reason" rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="请输入报废原因"></textarea>
          </div>
          <div class="flex gap-3">
            <button type="submit" class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition">提交申请</button>
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
import { useAuthStore } from '../../stores/auth';

const authStore = useAuthStore();
const records = ref([]);
const availableAssets = ref([]);
const keyword = ref('');
const filterStatus = ref('');
const showDialog = ref(false);
const scrapForm = ref({ asset_id: '', reason: '' });

const SCRAP_STATUS = { pending: '待审批', approved: '已批准', rejected: '已驳回' };
const SCRAP_CLASS = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };

function scrapStatusLabel(s) { return SCRAP_STATUS[s] || s; }
function scrapStatusClass(s) { return SCRAP_CLASS[s] || 'bg-gray-100 text-gray-600'; }

async function loadRecords() {
  const params = { page: 1, pageSize: 50 };
  if (keyword.value) params.keyword = keyword.value;
  if (filterStatus.value) params.status = filterStatus.value;
  const res = await request.get('/scrap', { params });
  records.value = res.data.list;
}

async function loadAvailableAssets() {
  const res = await request.get('/assets', { params: { pageSize: 200 } });
  availableAssets.value = res.data.list.filter(a => ['idle', 'in_repair'].includes(a.status));
}

function openScrapDialog() {
  scrapForm.value = { asset_id: '', reason: '' };
  loadAvailableAssets();
  showDialog.value = true;
}

async function handleScrap() {
  try {
    await request.post('/scrap', scrapForm.value);
    showDialog.value = false;
    loadRecords();
  } catch (err) {
    alert(err.message || '申请失败');
  }
}

async function handleApprove(record) {
  if (!confirm('确定批准该报废申请吗？')) return;
  try {
    await request.put(`/scrap/${record.id}/approve`);
    loadRecords();
  } catch (err) {
    alert(err.message || '操作失败');
  }
}

async function handleReject(record) {
  if (!confirm('确定驳回该报废申请吗？')) return;
  try {
    await request.put(`/scrap/${record.id}/reject`);
    loadRecords();
  } catch (err) {
    alert(err.message || '操作失败');
  }
}

onMounted(loadRecords);
</script>
