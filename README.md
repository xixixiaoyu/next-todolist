# Todo List - 现代化任务管理应用

一个使用 Next.js 14+ 和 Supabase 构建的现代化 Todo List 应用，支持实时同步和多设备访问。

## ✨ 功能特性

- 🔐 **用户认证** - 安全的用户注册、登录和登出
- ✅ **任务管理** - 创建、编辑、删除和标记任务完成
- 🔄 **实时同步** - 多设备间数据实时同步
- 🔍 **搜索过滤** - 按状态、标题搜索和排序任务
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🎨 **现代 UI** - 使用 Tailwind CSS 构建的美观界面
- ♿ **可访问性** - 支持键盘导航和屏幕阅读器
- 🚀 **高性能** - 优化的加载速度和用户体验

## 🛠️ 技术栈

- **前端框架**: Next.js 14+ (App Router)
- **类型安全**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **表单处理**: React Hook Form + Zod
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **实时功能**: Supabase Realtime
- **图标**: Lucide React
- **测试**: Jest + React Testing Library
- **包管理**: pnpm

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm
- Supabase 账户

### 1. 克隆项目

```bash
git clone <repository-url>
cd next-todolist
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 设置 Supabase

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 在项目设置中获取 API URL 和 anon key
3. 在 SQL 编辑器中运行 `supabase/migrations/001_initial_schema.sql`

### 4. 配置环境变量

复制 `.env.example` 到 `.env.local` 并填入你的 Supabase 配置：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。
