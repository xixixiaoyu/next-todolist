# 04 - Supabase 设置

本章将详细介绍如何设置 Supabase 项目，包括数据库设计、认证配置和安全策略。

## 🎯 学习目标

- 理解 Supabase 的核心概念和架构
- 学会创建和配置 Supabase 项目
- 掌握数据库表设计和关系建立
- 了解 Row Level Security (RLS) 的配置
- 学会设置实时订阅功能

## 🌟 Supabase 简介

Supabase 是一个开源的 Firebase 替代方案，提供：

- 🗄️ **PostgreSQL 数据库**: 强大的关系型数据库
- 🔐 **认证系统**: 内置用户管理和多种登录方式
- ⚡ **实时功能**: WebSocket 实时数据同步
- 📁 **文件存储**: 对象存储服务
- 🛡️ **行级安全**: 细粒度权限控制
- 🚀 **自动 API**: 基于数据库模式自动生成 RESTful API

## 🚀 创建 Supabase 项目

### 1. 注册账户

访问 [Supabase](https://supabase.com) 并注册账户。

### 2. 创建新项目

1. 点击 "New Project"
2. 选择组织（或创建新组织）
3. 填写项目信息：
   - **Name**: `next-todolist`
   - **Database Password**: 生成强密码并保存
   - **Region**: 选择离用户最近的区域
4. 点击 "Create new project"

### 3. 获取项目配置

项目创建完成后，在 Settings > API 中获取：
- **Project URL**: `https://your-project.supabase.co`
- **anon public key**: 客户端使用的公开密钥
- **service_role secret**: 服务端使用的私密密钥（谨慎保管）

## 🗄️ 数据库设计

### 数据库表结构

我们的 Todo 应用需要以下表：

```sql
-- 用户表 (由 Supabase Auth 自动创建)
auth.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE,
  -- 其他认证相关字段
)

-- Todo 表
public.todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
)
```

### 创建数据库表

在 Supabase Dashboard 的 SQL Editor 中执行以下 SQL：

```sql
-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建 todos 表
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 100),
    description TEXT CHECK (char_length(description) <= 500),
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON public.todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON public.todos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_todos_updated_at ON public.todos(updated_at DESC);

-- 创建更新 updated_at 字段的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器自动更新 updated_at 字段
CREATE TRIGGER update_todos_updated_at 
    BEFORE UPDATE ON public.todos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 数据库设计要点

1. **主键设计**: 使用 UUID 而非自增 ID，避免信息泄露
2. **约束检查**: 添加长度和内容约束，确保数据质量
3. **时间戳**: 使用 UTC 时间，避免时区问题
4. **外键关系**: 建立用户和 Todo 的关联关系
5. **索引优化**: 为常用查询字段创建索引
6. **触发器**: 自动更新时间戳字段

## 🛡️ 行级安全 (RLS) 配置

Row Level Security 确保用户只能访问自己的数据：

```sql
-- 启用 Row Level Security
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
-- 用户只能查看自己的 todos
CREATE POLICY "Users can view own todos" ON public.todos
    FOR SELECT USING (auth.uid() = user_id);

-- 用户只能插入自己的 todos
CREATE POLICY "Users can insert own todos" ON public.todos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的 todos
CREATE POLICY "Users can update own todos" ON public.todos
    FOR UPDATE USING (auth.uid() = user_id);

-- 用户只能删除自己的 todos
CREATE POLICY "Users can delete own todos" ON public.todos
    FOR DELETE USING (auth.uid() = user_id);
```

### RLS 策略解释

- `auth.uid()`: 获取当前认证用户的 ID
- `FOR SELECT USING`: 定义查询权限
- `FOR INSERT WITH CHECK`: 定义插入权限
- `FOR UPDATE USING`: 定义更新权限
- `FOR DELETE USING`: 定义删除权限

## ⚡ 实时功能配置

启用实时订阅功能：

```sql
-- 创建实时订阅的发布
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
```

在客户端代码中订阅变化：

```typescript
// 订阅 todos 表的变化
const subscription = supabase
  .channel('todos')
  .on(
    'postgres_changes',
    {
      event: '*',           // 监听所有事件 (INSERT, UPDATE, DELETE)
      schema: 'public',     // 数据库模式
      table: 'todos',       // 表名
    },
    (payload) => {
      console.log('数据变化:', payload)
      // 处理数据变化
    }
  )
  .subscribe()

// 取消订阅
subscription.unsubscribe()
```

## 🔐 认证配置

### 基本认证设置

在 Supabase Dashboard 的 Authentication > Settings 中配置：

1. **Site URL**: `http://localhost:3000` (开发环境)
2. **Redirect URLs**: 
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback` (生产环境)

### 邮箱认证配置

```sql
-- 配置邮箱模板 (可选)
-- 在 Authentication > Email Templates 中自定义邮件模板
```

### 认证策略

```typescript
// 客户端认证配置
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,      // 自动刷新令牌
    persistSession: true,        // 持久化会话
    detectSessionInUrl: true     // 从 URL 检测会话
  }
})
```

## 🔧 环境变量配置

在项目根目录创建 `.env.local` 文件：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**安全注意事项：**
- ✅ `NEXT_PUBLIC_*` 变量会暴露给客户端，只放公开信息
- ❌ 不要在客户端使用 `service_role` 密钥
- ✅ 生产环境使用不同的环境变量

## 📊 数据库监控

### 性能监控

在 Supabase Dashboard 中监控：

1. **Database > Logs**: 查看数据库日志
2. **Database > Extensions**: 启用有用的扩展
3. **Settings > Database**: 查看连接信息和性能指标

### 常用查询优化

```sql
-- 查看表大小
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE tablename = 'todos';

-- 查看索引使用情况
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'todos';

-- 分析查询性能
EXPLAIN ANALYZE SELECT * FROM todos WHERE user_id = 'user-uuid';
```

## 🧪 测试数据库连接

创建简单的测试脚本：

```typescript
// test-connection.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('count(*)')
      .single()
    
    if (error) throw error
    
    console.log('✅ 数据库连接成功')
    console.log('📊 Todo 数量:', data.count)
  } catch (error) {
    console.error('❌ 数据库连接失败:', error)
  }
}

testConnection()
```

## 🔄 数据迁移管理

### 创建迁移文件

```sql
-- supabase/migrations/001_initial_schema.sql
-- 包含所有表创建、索引、触发器和 RLS 策略的 SQL
```

### 版本控制

```bash
# 使用 Supabase CLI 管理迁移
npx supabase init
npx supabase db diff --file new_migration
npx supabase db push
```

## 🤔 思考题

1. 为什么使用 UUID 而不是自增 ID？
2. RLS 策略如何保证数据安全？
3. 实时订阅的性能考虑有哪些？
4. 如何设计数据库索引以优化查询性能？

## 📚 扩展阅读

- [Supabase 官方文档](https://supabase.com/docs)
- [PostgreSQL 最佳实践](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
- [数据库设计原则](https://en.wikipedia.org/wiki/Database_design)
- [Row Level Security 详解](https://supabase.com/docs/guides/auth/row-level-security)

## 🔗 下一步

完成 Supabase 设置后，下一章我们将实现用户认证系统。

[下一章：认证系统 →](./05-authentication.md)
