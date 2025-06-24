# 22 - 部署指南

本章将详细介绍如何将 Next.js 14+ Todo List 应用部署到生产环境，包括 Vercel、Netlify 和自托管方案。

## 🎯 学习目标

- 理解现代前端应用的部署策略
- 掌握 Vercel 平台的部署流程
- 学会配置环境变量和域名
- 了解性能优化和监控设置
- 掌握 CI/CD 流程的配置

## 🚀 部署平台选择

### 平台对比

| 平台 | 优势 | 劣势 | 适用场景 |
|------|------|------|----------|
| **Vercel** | Next.js 原生支持，零配置部署 | 价格较高，功能限制 | 中小型项目，快速原型 |
| **Netlify** | 免费额度大，功能丰富 | Next.js 支持有限 | 静态站点，JAMstack |
| **AWS** | 功能强大，可扩展性好 | 配置复杂，学习成本高 | 大型企业应用 |
| **自托管** | 完全控制，成本可控 | 运维复杂，需要专业知识 | 特殊需求，安全要求高 |

## 🌟 Vercel 部署（推荐）

### 1. 准备工作

```bash
# 确保项目可以本地构建
pnpm build

# 检查构建输出
pnpm start

# 运行测试
pnpm test

# 类型检查
pnpm type-check
```

### 2. 项目配置

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 输出配置
  output: 'standalone', // 可选：用于 Docker 部署
  
  // 图片优化
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 环境变量
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },
  
  // 头部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // 实验性功能
  experimental: {
    // 启用 App Router
    appDir: true,
  },
}

module.exports = nextConfig
```

### 3. Vercel 配置文件

```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["hkg1", "sin1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/health",
      "destination": "/api/health"
    }
  ]
}
```

### 4. 部署步骤

#### 方法一：Git 集成（推荐）

1. **推送代码到 GitHub**
```bash
git add .
git commit -m "准备部署"
git push origin main
```

2. **连接 Vercel**
- 访问 [vercel.com](https://vercel.com)
- 使用 GitHub 账户登录
- 点击 "New Project"
- 选择你的仓库
- 点击 "Import"

3. **配置项目**
```bash
# 项目名称
Project Name: next-todolist

# 框架预设
Framework Preset: Next.js

# 构建命令
Build Command: pnpm build

# 输出目录
Output Directory: .next

# 安装命令
Install Command: pnpm install

# 开发命令
Development Command: pnpm dev
```

#### 方法二：CLI 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产部署
vercel --prod
```

### 5. 环境变量配置

在 Vercel Dashboard 中配置环境变量：

```bash
# 生产环境变量
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# 可选：分析工具
NEXT_PUBLIC_GOOGLE_ANALYTICS=GA_MEASUREMENT_ID
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### 6. 自定义域名

1. **添加域名**
- 在项目设置中点击 "Domains"
- 输入你的域名
- 按照提示配置 DNS

2. **DNS 配置**
```bash
# A 记录
Type: A
Name: @
Value: 76.76.19.61

# CNAME 记录
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## 🔧 性能优化

### 1. 构建优化

```javascript
// next.config.js
const nextConfig = {
  // 压缩
  compress: true,
  
  // 代码分割
  experimental: {
    optimizeCss: true,
  },
  
  // 图片优化
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // 字体优化
  optimizeFonts: true,
  
  // 静态资源优化
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://cdn.example.com' : '',
}
```

### 2. 缓存策略

```typescript
// src/app/api/todos/route.ts
export async function GET() {
  const data = await fetchTodos()
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
```

### 3. 代码分割

```typescript
// 动态导入
import dynamic from 'next/dynamic'

const TodoForm = dynamic(() => import('@/components/todo/todo-form'), {
  loading: () => <div>加载中...</div>,
  ssr: false, // 可选：禁用 SSR
})

// 条件加载
const AdminPanel = dynamic(() => import('@/components/admin/admin-panel'), {
  ssr: false,
})
```

## 📊 监控和分析

### 1. Vercel Analytics

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 2. 性能监控

```typescript
// src/lib/monitoring.ts
export function reportWebVitals(metric: any) {
  // 发送到分析服务
  if (process.env.NODE_ENV === 'production') {
    // Google Analytics
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.value),
      event_label: metric.id,
      non_interaction: true,
    })
    
    // 自定义分析
    fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify(metric),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
```

### 3. 错误监控

```typescript
// src/lib/error-tracking.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})

export function captureError(error: Error, context?: any) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, { extra: context })
  } else {
    console.error('Error:', error, context)
  }
}
```

## 🔄 CI/CD 流程

### 1. GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test:ci
      
      - name: Type check
        run: pnpm type-check
      
      - name: Lint
        run: pnpm lint

  deploy-preview:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project Artifacts
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### 2. 部署脚本

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "🚀 开始部署流程..."

# 环境检查
echo "📋 检查环境..."
node --version
pnpm --version

# 安装依赖
echo "📦 安装依赖..."
pnpm install --frozen-lockfile

# 运行测试
echo "🧪 运行测试..."
pnpm test:ci

# 类型检查
echo "🔍 类型检查..."
pnpm type-check

# 代码检查
echo "🔧 代码检查..."
pnpm lint

# 构建项目
echo "🏗️ 构建项目..."
pnpm build

# 部署到 Vercel
echo "🚀 部署到 Vercel..."
vercel --prod --token=$VERCEL_TOKEN

echo "✅ 部署完成！"
```

## 🔒 安全配置

### 1. 环境变量安全

```bash
# 生产环境变量清单
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_APP_URL=https://your-domain.com

# 私密变量（不要以 NEXT_PUBLIC_ 开头）
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
DATABASE_URL=postgresql://xxx
WEBHOOK_SECRET=xxx
```

### 2. 安全头部

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

## 🚨 故障排除

### 常见问题

1. **构建失败**
```bash
# 检查依赖版本
pnpm list

# 清理缓存
pnpm store prune
rm -rf .next
rm -rf node_modules
pnpm install
```

2. **环境变量问题**
```bash
# 检查环境变量
vercel env ls

# 添加环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL
```

3. **域名配置问题**
```bash
# 检查 DNS 配置
nslookup your-domain.com

# 检查 SSL 证书
openssl s_client -connect your-domain.com:443
```

## 🤔 思考题

1. 如何选择合适的部署平台？
2. 什么是蓝绿部署和金丝雀部署？
3. 如何设计高可用的部署架构？
4. 如何处理部署过程中的数据库迁移？

## 📚 扩展阅读

- [Vercel 官方文档](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [Web 性能优化](https://web.dev/performance/)
- [CI/CD 最佳实践](https://docs.github.com/en/actions/learn-github-actions)

## 🔗 下一步

完成部署后，下一章我们将学习如何监控和运维生产应用。

[下一章：监控运维 →](./23-monitoring.md)
