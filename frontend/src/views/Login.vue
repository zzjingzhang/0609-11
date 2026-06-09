<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-800">企业内部资产管理系统</h1>
        <p class="text-gray-500 mt-2">请登录您的账号</p>
      </div>

      <div v-if="errorMsg" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
        {{ errorMsg }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
          <input v-model="form.username" type="text" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" 
            placeholder="请输入用户名" />
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input v-model="form.password" type="password" required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" 
            placeholder="请输入密码" />
        </div>
        <button type="submit" :disabled="loading"
          class="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-gray-500">
          还没有账号？
          <router-link to="/register" class="text-indigo-600 hover:text-indigo-700 font-medium">立即注册</router-link>
        </p>
      </div>

      <div class="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
        <p class="font-medium mb-1">演示账号：</p>
        <p>前台用户：user / user123</p>
        <p>后台管理员：admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import request from '../utils/request';

const router = useRouter();
const authStore = useAuthStore();

const form = ref({ username: '', password: '' });
const loading = ref(false);
const errorMsg = ref('');

async function handleLogin() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await request.post('/auth/login', form.value);
    authStore.setAuth(res.data.token, res.data.user);
    router.push('/');
  } catch (err) {
    errorMsg.value = err.message || '登录失败';
  } finally {
    loading.value = false;
  }
}
</script>
