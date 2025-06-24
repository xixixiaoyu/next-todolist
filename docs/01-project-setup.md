# 01 - 项目初始化

本章将详细介绍如何从零开始创建一个 Next.js 14+ 项目，并配置所有必要的依赖和工具。

## 🎯 学习目标

- 理解现代前端项目的初始化流程
- 掌握 Next.js 14+ 的项目配置
- 学会配置 TypeScript 和 Tailwind CSS
- 了解包管理器的选择和使用

## 📋 前置条件

确保您的开发环境已安装：
- Node.js 18+ 
- pnpm（推荐）或 npm/yarn
- Git
- VS Code（推荐）

## 🚀 步骤详解

### 1. 创建 Next.js 项目

使用 `create-next-app` 创建项目：

```bash
npx create-next-app@latest next-todolist --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

**参数说明：**
- `--typescript`: 启用 TypeScript 支持
- `--tailwind`: 集成 Tailwind CSS
- `--eslint`: 配置 ESLint 代码检查
- `--app`: 使用 App Router（Next.js 13+ 新特性）
- `--src-dir`: 将源代码放在 src 目录下
- `--import-alias "@/*"`: 配置路径别名
- `--use-pnpm`: 使用 pnpm 包管理器

### 2. 安装项目依赖

进入项目目录并安装额外依赖：

```bash
cd next-todolist

# 核心依赖
pnpm add @supabase/supabase-js @supabase/ssr react-hook-form @hookform/resolvers zod zustand lucide-react clsx tailwind-merge

# 开发依赖
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom @types/jest
```

**依赖说明：**

#### 核心功能依赖
- `@supabase/supabase-js`: Supabase JavaScript 客户端
- `@supabase/ssr`: Supabase SSR 支持
- `react-hook-form`: 高性能表单库
- `@hookform/resolvers`: 表单验证解析器
- `zod`: TypeScript 优先的模式验证库
- `zustand`: 轻量级状态管理库
- `lucide-react`: 现代图标库

#### 工具依赖
- `clsx`: 条件类名工具
- `tailwind-merge`: Tailwind 类名合并工具

#### 测试依赖
- `@testing-library/*`: React 测试工具套件
- `jest`: JavaScript 测试框架

### 3. 项目结构规划

创建标准的项目目录结构：

```bash
mkdir -p src/{components/{ui,auth,todo,layout},lib/{supabase},store,types,hooks,__tests__}
mkdir -p supabase/migrations
```

**目录说明：**
- `components/`: React 组件
  - `ui/`: 通用 UI 组件
  - `auth/`: 认证相关组件
  - `todo/`: Todo 功能组件
  - `layout/`: 布局组件
- `lib/`: 工具函数和配置
- `store/`: 状态管理
- `types/`: TypeScript 类型定义
- `hooks/`: 自定义 React Hooks
- `__tests__/`: 测试文件
- `supabase/`: 数据库相关文件

### 4. 配置环境变量

创建环境变量文件：

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
# .env.example（模板文件）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. 配置 package.json 脚本

更新 `package.json` 添加有用的脚本：

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "type-check": "tsc --noEmit"
  }
}
```

## 🔧 配置文件详解

### TypeScript 配置

Next.js 自动生成的 `tsconfig.json` 已经包含了最佳实践配置：

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Tailwind CSS 配置

`tailwind.config.ts` 配置文件：

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
```

## ✅ 验证安装

运行以下命令验证项目设置：

```bash
# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 启动开发服务器
pnpm dev
```

如果一切正常，您应该能在 `http://localhost:3000` 看到 Next.js 默认页面。

## 🎯 关键概念

### App Router vs Pages Router

Next.js 13+ 引入了新的 App Router，相比传统的 Pages Router 有以下优势：

1. **更好的性能**: 支持 React Server Components
2. **更灵活的布局**: 嵌套布局和模板
3. **更强的类型安全**: 自动生成的类型
4. **更好的开发体验**: 更直观的文件结构

### 为什么选择这些技术？

- **Next.js 14+**: 提供全栈开发能力，优秀的性能和开发体验
- **TypeScript**: 类型安全，减少运行时错误
- **Tailwind CSS**: 实用优先的 CSS 框架，快速构建 UI
- **pnpm**: 更快的包管理器，节省磁盘空间

## 🤔 思考题

1. 为什么选择 App Router 而不是 Pages Router？
2. pnpm 相比 npm 有什么优势？
3. 路径别名 `@/*` 的作用是什么？
4. 为什么要将源代码放在 `src` 目录下？

## 📚 扩展阅读

- [Next.js 官方文档](https://nextjs.org/docs)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [pnpm 文档](https://pnpm.io/zh/)

## 🔗 下一步

完成项目初始化后，下一章我们将详细介绍技术栈的选择和架构设计。

[下一章：技术栈介绍 →](./02-tech-stack.md)
