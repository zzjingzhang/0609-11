<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <input v-model="keyword" @keyup.enter="loadCategories" type="text" placeholder="搜索分类..."
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-64" />
        <button @click="loadCategories"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">搜索</button>
      </div>
      <button @click="openCreateDialog"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        新增分类
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">ID</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">分类名称</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">描述</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">资产数量</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">创建时间</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in categories" :key="cat.id" class="border-b border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-3 text-gray-600">{{ cat.id }}</td>
            <td class="px-4 py-3 font-medium text-gray-800">{{ cat.name }}</td>
            <td class="px-4 py-3 text-gray-600">{{ cat.description || '-' }}</td>
            <td class="px-4 py-3">
              <span class="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-medium">{{ cat.asset_count }}</span>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ cat.created_at }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <button @click="openEditDialog(cat)" class="text-indigo-600 hover:text-indigo-800 text-xs">编辑</button>
                <button @click="handleDelete(cat)" class="text-red-600 hover:text-red-800 text-xs">删除</button>
              </div>
            </td>
          </tr>
          <tr v-if="categories.length === 0">
            <td colspan="6" class="text-center py-12 text-gray-400">暂无分类数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ isEditing ? '编辑分类' : '新增分类' }}</h3>
        <form @submit.prevent="handleSave">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">分类名称 <span class="text-red-500">*</span></label>
            <input v-model="dialogForm.name" type="text" required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="请输入分类名称" />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea v-model="dialogForm.description" rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="请输入分类描述"></textarea>
          </div>
          <div class="flex gap-3">
            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">保存</button>
            <button type="button" @click="showDialog = false" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition">取消</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import request from '../utils/request';

const categories = ref([]);
const keyword = ref('');
const showDialog = ref(false);
const isEditing = ref(false);
const editingId = ref(null);
const dialogForm = ref({ name: '', description: '' });

async function loadCategories() {
  const res = await request.get('/categories');
  categories.value = res.data;
}

function openCreateDialog() {
  isEditing.value = false;
  editingId.value = null;
  dialogForm.value = { name: '', description: '' };
  showDialog.value = true;
}

function openEditDialog(cat) {
  isEditing.value = true;
  editingId.value = cat.id;
  dialogForm.value = { name: cat.name, description: cat.description };
  showDialog.value = true;
}

async function handleSave() {
  try {
    if (isEditing.value) {
      await request.put(`/categories/${editingId.value}`, dialogForm.value);
    } else {
      await request.post('/categories', dialogForm.value);
    }
    showDialog.value = false;
    loadCategories();
  } catch (err) {
    alert(err.message || '操作失败');
  }
}

async function handleDelete(cat) {
  if (!confirm(`确定删除分类"${cat.name}"吗？`)) return;
  try {
    await request.delete(`/categories/${cat.id}`);
    loadCategories();
  } catch (err) {
    alert(err.message || '删除失败');
  }
}

onMounted(loadCategories);
</script>
