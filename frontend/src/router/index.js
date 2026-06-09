import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/assets' },
      { path: 'assets', name: 'AssetList', component: () => import('../views/assets/AssetList.vue'), meta: { title: '资产登记' } },
      { path: 'assets/create', name: 'AssetCreate', component: () => import('../views/assets/AssetForm.vue'), meta: { title: '登记资产' } },
      { path: 'assets/:id/edit', name: 'AssetEdit', component: () => import('../views/assets/AssetForm.vue'), meta: { title: '编辑资产' } },
      { path: 'categories', name: 'Categories', component: () => import('../views/Categories.vue'), meta: { title: '资产分类' } },
      { path: 'borrow', name: 'Borrow', component: () => import('../views/Borrow.vue'), meta: { title: '资产借用' } },
      { path: 'return', name: 'Return', component: () => import('../views/Return.vue'), meta: { title: '归还登记' } },
      { path: 'scrap', name: 'Scrap', component: () => import('../views/Scrap.vue'), meta: { title: '报废申请' } },
      { path: 'statistics', name: 'Statistics', component: () => import('../views/Statistics.vue'), meta: { title: '资产统计' } },
      { path: 'admin/assets', name: 'AdminAssets', component: () => import('../views/admin/AdminAssets.vue'), meta: { title: '资产管理', requiresAdmin: true } },
      { path: 'admin/users', name: 'AdminUsers', component: () => import('../views/admin/AdminUsers.vue'), meta: { title: '用户管理', requiresAdmin: true } },
      { path: 'admin/logs', name: 'AdminLogs', component: () => import('../views/admin/AdminLogs.vue'), meta: { title: '操作日志', requiresAdmin: true } },
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth !== false && !authStore.isLoggedIn) {
    return next('/login');
  }

  if ((to.path === '/login' || to.path === '/register') && authStore.isLoggedIn) {
    return next('/');
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next('/');
  }

  next();
});

export default router;
