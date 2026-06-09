<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <input v-model="keyword" @keyup.enter="loadUsers" type="text" placeholder="搜索用户名/姓名..."
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-64" />
        <select v-model="filterRole" @change="loadUsers"
          class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">全部角色</option>
          <option value="admin">管理员</option>
          <option value="user">普通用户</option>
        </select>
        <button @click="loadUsers"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">搜索</button>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">ID</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">用户名</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">真实姓名</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">角色</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">状态</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">创建时间</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" class="border-b border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-3 text-gray-600">{{ user.id }}</td>
            <td class="px-4 py-3 font-medium text-gray-800">{{ user.username }}</td>
            <td class="px-4 py-3 text-gray-600">{{ user.real_name || '-' }}</td>
            <td class="px-4 py-3">
              <span :class="user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'"
                class="px-2 py-1 rounded-full text-xs font-medium">
                {{ user.role === 'admin' ? '管理员' : '普通用户' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span :class="user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                class="px-2 py-1 rounded-full text-xs font-medium">
                {{ user.status === 'active' ? '正常' : '禁用' }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ user.created_at }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <button @click="openEditDialog(user)" class="text-indigo-600 hover:text-indigo-800 text-xs">编辑</button>
                <button @click="toggleStatus(user)" class="text-amber-600 hover:text-amber-800 text-xs">
                  {{ user.status === 'active' ? '禁用' : '启用' }}
                </button>
                <button @click="resetPassword(user)" class="text-blue-600 hover:text-blue-800 text-xs">重置密码</button>
                <button @click="handleDelete(user)" class="text-red-600 hover:text-red-800 text-xs">删除</button>
              </div>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="7" class="text-center py-12 text-gray-400">暂无用户数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showEditDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">编辑用户</h3>
        <form @submit.prevent="handleSaveUser">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">真实姓名</label>
            <input v-model="editForm.real_name" type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <select v-model="editForm.role"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div class="flex gap-3">
            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">保存</button>
            <button type="button" @click="showEditDialog = false" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition">取消</button>
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
const users = ref([]);
const keyword = ref('');
const filterRole = ref('');
const showEditDialog = ref(false);
const editForm = ref({ id: null, real_name: '', role: 'user' });

async function loadUsers() {
  const params = {};
  if (keyword.value) params.keyword = keyword.value;
  if (filterRole.value) params.role = filterRole.value;
  const res = await request.get('/users', { params });
  users.value = res.data.list;
}

function openEditDialog(user) {
  editForm.value = { id: user.id, real_name: user.real_name, role: user.role };
  showEditDialog.value = true;
}

async function handleSaveUser() {
  try {
    await request.put(`/users/${editForm.value.id}`, editForm.value);
    showEditDialog.value = false;
    loadUsers();
  } catch (err) {
    alert(err.message || '保存失败');
  }
}

async function toggleStatus(user) {
  const newStatus = user.status === 'active' ? 'disabled' : 'active';
  try {
    await request.put(`/users/${user.id}/status`, { status: newStatus });
    loadUsers();
  } catch (err) {
    alert(err.message || '操作失败');
  }
}

async function resetPassword(user) {
  if (!confirm(`确定重置用户"${user.real_name || user.username}"的密码为123456吗？`)) return;
  try {
    await request.put(`/users/${user.id}/password`, { newPassword: '123456' });
    alert('密码已重置为123456');
  } catch (err) {
    alert(err.message || '重置失败');
  }
}

async function handleDelete(user) {
  if (user.id === authStore.user.id) {
    alert('不能删除自己');
    return;
  }
  if (!confirm(`确定删除用户"${user.real_name || user.username}"吗？`)) return;
  try {
    await request.delete(`/users/${user.id}`);
    loadUsers();
  } catch (err) {
    alert(err.message || '删除失败');
  }
}

onMounted(loadUsers);
</script>
