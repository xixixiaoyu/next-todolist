# 03 - 项目结构

本章将详细介绍项目的文件组织结构，解释每个目录和文件的作用，帮助您理解如何构建可维护的大型前端项目。

## 🎯 学习目标

- 理解现代前端项目的目录结构设计原则
- 掌握 Next.js App Router 的文件组织方式
- 学会按功能和层次组织代码
- 了解配置文件的作用和最佳实践

## 📁 完整项目结构

```
next-todolist/
├── 📁 src/                          # 源代码目录
│   ├── 📁 app/                      # Next.js App Router 页面
│   │   ├── 📄 layout.tsx            # 根布局组件
│   │   ├── 📄 page.tsx              # 首页
│   │   ├── 📄 globals.css           # 全局样式
│   │   ├── 📁 auth/                 # 认证相关页面
│   │   │   ├── 📄 page.tsx          # 登录/注册页面
│   │   │   └── 📁 callback/         # 认证回调
│   │   │       └── 📄 page.tsx      # 回调处理页面
│   │   └── 📄 middleware.ts         # 中间件
│   ├── 📁 components/               # React 组件
│   │   ├── 📁 ui/                   # 通用 UI 组件
│   │   │   ├── 📄 button.tsx        # 按钮组件
│   │   │   ├── 📄 input.tsx         # 输入框组件
│   │   │   ├── 📄 card.tsx          # 卡片组件
│   │   │   ├── 📄 label.tsx         # 标签组件
│   │   │   ├── 📄 loading.tsx       # 加载组件
│   │   │   ├── 📄 toast.tsx         # 通知组件
│   │   │   └── 📄 error-boundary.tsx # 错误边界
│   │   ├── 📁 auth/                 # 认证组件
│   │   │   ├── 📄 login-form.tsx    # 登录表单
│   │   │   ├── 📄 register-form.tsx # 注册表单
│   │   │   ├── 📄 auth-provider.tsx # 认证提供者
│   │   │   └── 📄 protected-route.tsx # 路由保护
│   │   ├── 📁 todo/                 # Todo 功能组件
│   │   │   ├── 📄 todo-form.tsx     # Todo 表单
│   │   │   ├── 📄 todo-item.tsx     # Todo 项目
│   │   │   ├── 📄 todo-list.tsx     # Todo 列表
│   │   │   └── 📄 todo-filters.tsx  # 过滤器
│   │   └── 📁 layout/               # 布局组件
│   │       └── 📄 header.tsx        # 页面头部
│   ├── 📁 lib/                      # 工具库和配置
│   │   ├── 📁 supabase/             # Supabase 配置
│   │   │   ├── 📄 client.ts         # 客户端配置
│   │   │   ├── 📄 server.ts         # 服务端配置
│   │   │   └── 📄 middleware.ts     # 中间件配置
│   │   ├── 📄 utils.ts              # 通用工具函数
│   │   └── 📄 validations.ts        # 表单验证规则
│   ├── 📁 store/                    # 状态管理
│   │   ├── 📄 auth.ts               # 认证状态
│   │   └── 📄 todos.ts              # Todo 状态
│   ├── 📁 types/                    # TypeScript 类型定义
│   │   └── 📄 index.ts              # 全局类型
│   ├── 📁 hooks/                    # 自定义 React Hooks
│   └── 📁 __tests__/                # 测试文件
│       └── 📁 components/           # 组件测试
│           └── 📁 ui/
│               └── 📄 button.test.tsx
├── 📁 supabase/                     # Supabase 相关文件
│   ├── 📁 migrations/               # 数据库迁移
│   │   └── 📄 001_initial_schema.sql
│   └── 📄 config.toml               # Supabase 配置
├── 📁 docs/                         # 项目文档
├── 📁 public/                       # 静态资源
├── 📄 package.json                  # 项目配置
├── 📄 tsconfig.json                 # TypeScript 配置
├── 📄 tailwind.config.ts            # Tailwind 配置
├── 📄 next.config.js                # Next.js 配置
├── 📄 jest.config.js                # Jest 配置
├── 📄 jest.setup.js                 # Jest 设置
├── 📄 .env.local                    # 环境变量
├── 📄 .env.example                  # 环境变量模板
├── 📄 .gitignore                    # Git 忽略文件
└── 📄 README.md                     # 项目说明
```

## 🏗️ 目录设计原则

### 1. 按功能分组 (Feature-based)

```
components/
├── auth/          # 认证相关的所有组件
├── todo/          # Todo 功能的所有组件
├── ui/            # 通用 UI 组件
└── layout/        # 布局相关组件
```

**优势：**
- 功能内聚，相关代码集中
- 易于维护和重构
- 团队协作时减少冲突

### 2. 按层次分离 (Layer-based)

```
src/
├── app/           # 页面层 (Presentation)
├── components/    # 组件层 (Components)
├── store/         # 状态层 (State)
├── lib/           # 工具层 (Utils)
└── types/         # 类型层 (Types)
```

**优势：**
- 职责清晰，易于理解
- 便于代码复用
- 符合软件架构原则

## 📂 核心目录详解

### src/app/ - 页面路由

Next.js App Router 使用文件系统路由：

```
app/
├── layout.tsx          # 根布局 (必需)
├── page.tsx            # 首页 /
├── loading.tsx         # 加载页面
├── error.tsx           # 错误页面
├── not-found.tsx       # 404 页面
├── auth/
│   ├── page.tsx        # /auth
│   └── callback/
│       └── page.tsx    # /auth/callback
└── dashboard/
    ├── layout.tsx      # 嵌套布局
    └── page.tsx        # /dashboard
```

**关键文件说明：**
- `layout.tsx`: 定义页面布局，可嵌套
- `page.tsx`: 页面组件，对应路由
- `loading.tsx`: 加载状态页面
- `error.tsx`: 错误处理页面

### src/components/ - 组件库

按功能和复用性组织组件：

```
components/
├── ui/                 # 通用 UI 组件 (高复用)
│   ├── button.tsx      # 按钮
│   ├── input.tsx       # 输入框
│   └── card.tsx        # 卡片
├── auth/               # 认证功能组件 (中等复用)
│   ├── login-form.tsx  # 登录表单
│   └── auth-provider.tsx # 认证上下文
└── todo/               # Todo 功能组件 (低复用)
    ├── todo-form.tsx   # Todo 表单
    └── todo-list.tsx   # Todo 列表
```

**组件分类原则：**
- **ui/**: 无业务逻辑的纯 UI 组件
- **功能模块/**: 包含业务逻辑的功能组件
- **layout/**: 布局相关组件

### src/lib/ - 工具库

存放工具函数和第三方库配置：

```
lib/
├── supabase/           # Supabase 配置
│   ├── client.ts       # 浏览器端客户端
│   ├── server.ts       # 服务端客户端
│   └── middleware.ts   # 中间件配置
├── utils.ts            # 通用工具函数
└── validations.ts      # 表单验证规则
```

**设计原则：**
- 纯函数，无副作用
- 单一职责，功能明确
- 易于测试和复用

### src/store/ - 状态管理

使用 Zustand 管理全局状态：

```
store/
├── auth.ts             # 认证状态
├── todos.ts            # Todo 状态
└── ui.ts               # UI 状态 (可选)
```

**状态设计原则：**
- 按功能模块分离状态
- 包含数据和操作方法
- 保持状态最小化

### src/types/ - 类型定义

集中管理 TypeScript 类型：

```
types/
├── index.ts            # 导出所有类型
├── database.ts         # 数据库类型
├── api.ts              # API 类型
└── components.ts       # 组件类型
```

## 🔧 配置文件说明

### package.json - 项目配置

```json
{
  "name": "next-todolist",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    // 生产依赖
  },
  "devDependencies": {
    // 开发依赖
  }
}
```

### tsconfig.json - TypeScript 配置

```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "jsx": "preserve",
    "paths": {
      "@/*": ["./src/*"]    // 路径别名
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### tailwind.config.ts - 样式配置

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",  // 扫描路径
  ],
  theme: {
    extend: {
      // 自定义主题
    },
  },
  plugins: [],
};
```

## 📋 文件命名规范

### 组件文件

```
PascalCase.tsx          # React 组件
kebab-case.tsx          # 多单词组件
index.tsx               # 目录入口文件
```

### 工具文件

```
camelCase.ts            # 工具函数
kebab-case.ts           # 多单词文件
constants.ts            # 常量文件
types.ts                # 类型定义
```

### 测试文件

```
Component.test.tsx      # 组件测试
utils.test.ts           # 工具测试
__mocks__/              # Mock 文件
```

## 🎯 最佳实践

### 1. 保持目录浅层

```
❌ 过深嵌套
components/ui/forms/inputs/text/TextInput.tsx

✅ 合理层次
components/ui/text-input.tsx
```

### 2. 使用 index.ts 简化导入

```typescript
// components/ui/index.ts
export { Button } from './button'
export { Input } from './input'
export { Card } from './card'

// 使用时
import { Button, Input, Card } from '@/components/ui'
```

### 3. 按功能组织，而非技术

```
❌ 按技术分组
├── hooks/
├── components/
└── utils/

✅ 按功能分组
├── auth/
├── todo/
└── shared/
```

## 🤔 思考题

1. 为什么要按功能而不是按技术组织代码？
2. 什么时候应该创建新的目录？
3. 如何平衡代码复用和功能内聚？
4. 大型项目中如何避免循环依赖？

## 📚 扩展阅读

- [Next.js App Router 文档](https://nextjs.org/docs/app)
- [React 项目结构最佳实践](https://react.dev/learn/thinking-in-react)
- [TypeScript 项目配置指南](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)

## 🔗 下一步

了解项目结构后，下一章我们将开始配置 Supabase 数据库。

[下一章：Supabase 设置 →](./04-supabase-setup.md)
