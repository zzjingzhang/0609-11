<template>
  <div>
    <div class="flex items-center gap-2 mb-6">
      <router-link to="/assets" class="text-gray-500 hover:text-gray-700 text-sm">资产登记</router-link>
      <span class="text-gray-300">/</span>
      <span class="text-gray-800 text-sm font-medium">{{ isEdit ? '编辑资产' : '登记资产' }}</span>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-3xl">
      <div v-if="errorMsg" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{{ errorMsg }}</div -->

      <form @submit.prevent="handleSubmit">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">资产名称 <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="请输入资产名称" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">资产分类 <span class="text-red-500">*</span></label>
            <select v-model="form.category_id" required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">请选择分类</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">品牌</label>
            <input v-model="form.brand" type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="请输入品牌" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">型号</label>
            <input v-model="form.model" type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="请输入型号" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">购入日期</label>
            <input v-model="form.purchase_date" type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">购入价格</label>
            <input v-model="form.purchase_price" type="number" step="0.01" min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0.00" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">存放位置</label>
            <input v-model="form.location" type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="请输入存放位置" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea v-model="form.description" rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="请输入资产描述"></textarea>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button type="submit" :disabled="loading"
            class="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition disabled:opacity-50">
            {{ loading ? '提交中...' : (isEdit ? '更新资产' : '登记资产') }}
          </button>
          <router-link to="/assets"
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition">取消</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import request from '../../utils/request';

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => !!route.params.id);
const categories = ref([]);
const loading = ref(false);
const errorMsg = ref('');

const form = ref({
  name: '', category_id: '', model: '', brand: '',
  purchase_date: '', purchase_price: '', location: '', description: ''
});

async function loadCategories() {
  const res = await request.get('/categories');
  categories.value = res.data;
}

async function loadAsset() {
  if (isEdit.value) {
    const res = await request.get(`/assets/${route.params.id}`);
    const a = res.data;
    form.value = {
      name: a.name, category_id: a.category_id, model: a.model || '',
      brand: a.brand || '', purchase_date: a.purchase_date || '',
      purchase_price: a.purchase_price || '', location: a.location || '',
      description: a.description || ''
    };
  }
}

async function handleSubmit() {
  loading.value = true;
  errorMsg.value = '';
  try {
    if (isEdit.value) {
      await request.put(`/assets/${route.params.id}`, form.value);
    } else {
      await request.post('/assets', form.value);
    }
    router.push('/assets');
  } catch (err) {
    errorMsg.value = err.message || '操作失败';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadCategories();
  loadAsset();
});
</script>
