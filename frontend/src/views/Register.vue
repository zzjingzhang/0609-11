<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-800">注册账号</h1>
        <p class="text-gray-500 mt-2">创建您的资产管理系统账号</p>
      </div>

      <div v-if="errorMsg" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
        {{ errorMsg }}
      </div>

      <div v-if="successMsg" class="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
        {{ successMsg }}
      </div>

      <form @submit.prevent="handleRegister">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
          <input v-model="form.username" type="text" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="请输入用户名" />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">真实姓名</label>
          <input v-model="form.real_name" type="text"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="请输入真实姓名" />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input v-model="form.password" type="password" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="请输入密码（至少6位）" />
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
          <input v-model="form.confirmPassword" type="password" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="请再次输入密码" />
        </div>
        <button type="submit" :disabled="loading"
          class="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50">
          {{ loading ? '注册中...' : '注 册' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-gray-500">
          已有账号？
          <router-link to="/login" class="text-indigo-600 hover:text-indigo-700 font-medium">返回登录</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import request from '../utils/request';

const router = useRouter();
const form = ref({ username: '', real_name: '', password: '', confirmPassword: '' });
const loading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

async function handleRegister() {
  errorMsg.value = '';
  successMsg.value = '';

  if (form.value.password !== form.value.confirmPassword) {
    errorMsg.value = '两次输入的密码不一致';
    return;
  }
  if (form.value.password.length < 6) {
    errorMsg.value = '密码长度不能少于6位';
    return;
  }

  loading.value = true;
  try {
    await request.post('/auth/register', {
      username: form.value.username,
      real_name: form.value.real_name || form.value.username,
      password: form.value.password
    });
    successMsg.value = '注册成功，即将跳转到登录页面...';
    setTimeout(() => router.push('/login'), 1500);
  } catch (err) {
    errorMsg.value = err.message || '注册失败';
  } finally {
    loading.value = false;
  }
}
</script>
