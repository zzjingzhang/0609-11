# 企业内部资产管理系统

基于 Vue3 + Tailwind CSS + Node.js + Express + SQLite 技术栈开发的企业内部资产管理系统。

## 项目结构

```
├── backend/                    # 后端项目
│   ├── package.json
│   └── src/
│       ├── app.js              # 入口文件
│       ├── db/
│       │   ├── database.js     # 数据库连接
│       │   └── init.js         # 数据库初始化
│       ├── middleware/
│       │   ├── auth.js         # JWT认证中间件
│       │   └── logger.js       # 操作日志中间件
│       └── routes/
│           ├── auth.js         # 认证路由（登录/注册）
│           ├── users.js        # 用户管理路由
│           ├── categories.js   # 资产分类路由
│           ├── assets.js       # 资产管理路由
│           ├── borrow.js       # 借用/归还路由
│           ├── scrap.js        # 报废申请路由
│           ├── logs.js         # 操作日志路由
│           └── statistics.js   # 统计路由
├── frontend/                   # 前端项目
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.js             # 入口文件
│       ├── App.vue             # 根组件
│       ├── style.css           # 全局样式
│       ├── router/
│       │   └── index.js        # 路由配置
│       ├── stores/
│       │   └── auth.js         # 认证状态管理
│       ├── utils/
│       │   └── request.js      # Axios封装
│       └── views/
│           ├── Login.vue       # 登录页
│           ├── Register.vue    # 注册页
│           ├── Layout.vue      # 主布局
│           ├── Categories.vue  # 资产分类
│           ├── Borrow.vue      # 资产借用
│           ├── Return.vue      # 归还登记
│           ├── Scrap.vue       # 报废申请
│           ├── Statistics.vue  # 资产统计
│           ├── assets/
│           │   ├── AssetList.vue  # 资产登记列表
│           │   └── AssetForm.vue  # 资产登记/编辑表单
│           └── admin/
│               ├── AdminAssets.vue # 资产管理
│               ├── AdminUsers.vue  # 用户管理
│               └── AdminLogs.vue   # 操作日志
├── data/                       # SQLite数据库文件目录（运行后自动生成，位于backend/data/下）
├── .gitignore
└── README.md
```

## 功能模块

### 前台功能
- **资产登记**：登记新资产，查看资产列表，编辑资产信息
- **资产分类**：分类管理，支持增删改查，显示分类下资产数量
- **资产借用**：选择闲置资产进行借用，资产状态自动流转为"已借出"
- **归还登记**：归还借用的资产，资产状态自动流转回"闲置"
- **报废申请**：申请报废闲置/维修中的资产，资产状态自动流转为"报废审批中"；管理员审批后自动流转为"已报废"或恢复"闲置"
- **资产统计**：资产总览、状态分布、分类统计、最近借用/报废记录

### 后台功能（仅管理员可见）
- **资产管理**：完整的资产增删改查，支持删除资产
- **用户管理**：用户列表、编辑角色、启用/禁用、重置密码、删除用户
- **操作日志**：查看系统操作记录，支持按用户名、关键词、日期范围筛选

### 资产状态自动流转

| 当前状态 | 可流转状态 | 触发操作 |
|---------|-----------|---------|
| 闲置 | 已借出 | 借用申请 |
| 闲置 | 报废审批中 | 报废申请 |
| 闲置 | 维修中 | 手动变更 |
| 已借出 | 闲置 | 归还操作 |
| 维修中 | 闲置 | 手动变更 |
| 维修中 | 报废审批中 | 报废申请 |
| 报废审批中 | 已报废 | 管理员批准 |
| 报废审批中 | 闲置 | 管理员驳回 |
| 已报废 | - | 终态，不可变更 |

## 环境要求

- Node.js >= 16
- npm >= 8
- 无需额外安装 Python 或编译工具，数据库依赖使用纯 JavaScript 的 sql.js（SQLite WASM 版本）

## 快速开始

### 1. 安装后端依赖

```bash
cd backend
npm install
```

后端依赖包括：express、cors、jsonwebtoken、bcryptjs、sql.js

### 2. 安装前端依赖

```bash
cd frontend
npm install
```

前端依赖包括：vue、vue-router、pinia、axios、tailwindcss、vite

### 3. 数据库初始化

数据库在首次启动后端时自动初始化。也可手动执行：

```bash
cd backend
npm run init-db
```

初始化后会自动创建 SQLite 数据库文件 `backend/data/asset.db` 并插入默认账号和5个默认资产分类（电子设备、办公家具、交通工具、软件许可、其他）。

数据库文件位置：`backend/data/asset.db`

> 注意：数据库文件已在 `.gitignore` 中排除，不会提交到版本库。删除该文件后重新执行初始化命令即可重建。

### 4. 启动后端

```bash
cd backend
npm start
```

后端运行在 http://localhost:8001

### 5. 启动前端

```bash
cd frontend
npm run dev
```

前端运行在 http://localhost:5101

## 登录账号

| 角色 | 用户名 | 密码 | 说明 |
|------|-------|------|------|
| 管理员 | admin | admin123 | 可访问前台和后台所有功能 |
| 普通用户 | user | user123 | 可访问前台功能 |

## API 接口

后端提供以下 RESTful API：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/register | 用户注册 |
| GET | /api/auth/info | 获取当前用户信息 |
| GET | /api/users | 用户列表（管理员） |
| PUT | /api/users/:id | 编辑用户（管理员） |
| PUT | /api/users/:id/status | 启用/禁用用户（管理员） |
| PUT | /api/users/:id/password | 修改密码 |
| DELETE | /api/users/:id | 删除用户（管理员） |
| GET | /api/categories | 分类列表 |
| POST | /api/categories | 新增分类 |
| PUT | /api/categories/:id | 编辑分类 |
| DELETE | /api/categories/:id | 删除分类 |
| GET | /api/assets | 资产列表 |
| GET | /api/assets/:id | 资产详情 |
| POST | /api/assets | 登记资产 |
| PUT | /api/assets/:id | 编辑资产 |
| DELETE | /api/assets/:id | 删除资产（管理员） |
| PUT | /api/assets/:id/status | 变更资产状态 |
| GET | /api/borrow | 借用记录列表 |
| GET | /api/borrow/my | 我的借用记录 |
| POST | /api/borrow | 申请借用 |
| POST | /api/borrow/:id/return | 归还资产 |
| GET | /api/scrap | 报废记录列表 |
| POST | /api/scrap | 申请报废 |
| PUT | /api/scrap/:id/approve | 批准报废（管理员） |
| PUT | /api/scrap/:id/reject | 驳回报废（管理员） |
| GET | /api/statistics/overview | 统计概览 |
| GET | /api/statistics/by-category | 分类统计 |
| GET | /api/statistics/by-status | 状态统计 |
| GET | /api/statistics/recent-borrows | 最近借用 |
| GET | /api/statistics/recent-scraps | 最近报废 |
| GET | /api/logs | 操作日志（管理员） |

## 技术栈

- **前端**：Vue 3 + Vue Router + Pinia + Tailwind CSS + Vite + Axios
- **后端**：Node.js + Express + sql.js（SQLite WASM 版本，无需编译原生模块）+ JWT + bcryptjs
- **数据库**：SQLite（通过 sql.js 在内存中运行，自动持久化到文件）
