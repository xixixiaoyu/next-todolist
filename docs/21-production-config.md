# 21 - 生产配置

本章将详细介绍如何为生产环境配置 Next.js 应用，包括性能优化、安全设置和监控配置。

## 🎯 学习目标

- 掌握生产环境的配置要点
- 学会优化应用的性能和安全性
- 了解环境变量和配置管理
- 掌握生产环境的监控和日志

## ⚙️ Next.js 生产配置

### 1. 基础配置

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 生产环境优化
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // 输出配置
  output: 'standalone', // 用于 Docker 部署
  
  // 实验性功能
  experimental: {
    // 启用 App Router
    appDir: true,
    // 优化 CSS
    optimizeCss: true,
    // 启用 Turbopack (开发环境)
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // 图片优化
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    domains: [
      'your-supabase-project.supabase.co',
      'cdn.example.com',
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 环境变量
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    BUILD_TIME: new Date().toISOString(),
  },

  // 重定向
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/dashboard',
        destination: '/todos',
        permanent: false,
      },
    ]
  },

  // 重写
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health-check',
      },
    ]
  },

  // 安全头部
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ]
  },

  // Webpack 配置
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 生产环境优化
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      }
    }

    // 添加自定义 loader
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    return config
  },
}

// 安全头部配置
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
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-analytics.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: *.supabase.co;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim()
  }
]

module.exports = nextConfig
```

### 2. 环境变量配置

```bash
# .env.production
# 生产环境变量

# 应用配置
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME="Todo List Pro"
NEXT_PUBLIC_APP_VERSION=1.0.0

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key

# 数据库配置
DATABASE_URL=postgresql://user:password@host:port/database

# 认证配置
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret

# 第三方服务
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENDGRID_API_KEY=your-sendgrid-key

# 缓存配置
REDIS_URL=redis://user:password@host:port

# 监控配置
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
DATADOG_API_KEY=your-datadog-key

# 功能开关
NEXT_PUBLIC_FEATURE_REALTIME=true
NEXT_PUBLIC_FEATURE_ANALYTICS=true
NEXT_PUBLIC_FEATURE_BETA=false
```

### 3. 环境变量验证

```typescript
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  // Node 环境
  NODE_ENV: z.enum(['development', 'test', 'production']),
  
  // 应用配置
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  NEXT_PUBLIC_APP_VERSION: z.string().min(1),
  
  // Supabase 配置
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // 可选配置
  NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error('❌ 环境变量验证失败:')
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`)
      })
    }
    process.exit(1)
  }
}

export const env = validateEnv()

// 类型安全的环境变量访问
export const config = {
  app: {
    url: env.NEXT_PUBLIC_APP_URL,
    name: env.NEXT_PUBLIC_APP_NAME,
    version: env.NEXT_PUBLIC_APP_VERSION,
  },
  supabase: {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  analytics: {
    googleAnalyticsId: env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
  },
  monitoring: {
    sentryDsn: env.NEXT_PUBLIC_SENTRY_DSN,
  },
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
}
```

## 🔒 安全配置

### 1. 内容安全策略 (CSP)

```typescript
// src/lib/csp.ts
export function generateCSP() {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  
  const csp = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      'https://vercel.live',
      'https://va.vercel-scripts.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Tailwind CSS 需要
    ],
    'img-src': [
      "'self'",
      'blob:',
      'data:',
      'https://*.supabase.co',
      'https://vercel.com',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://vitals.vercel-insights.com',
    ],
    'frame-src': [
      "'none'",
    ],
    'object-src': [
      "'none'",
    ],
    'base-uri': [
      "'self'",
    ],
    'form-action': [
      "'self'",
    ],
    'frame-ancestors': [
      "'none'",
    ],
    'upgrade-insecure-requests': [],
  }

  const cspString = Object.entries(csp)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ')

  return { csp: cspString, nonce }
}
```

### 2. API 路由安全

```typescript
// src/lib/api-security.ts
import { NextRequest, NextResponse } from 'next/server'
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'

// 速率限制
export const createRateLimit = (options: {
  windowMs: number
  max: number
  message?: string
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
  })
}

// 慢速限制
export const createSlowDown = (options: {
  windowMs: number
  delayAfter: number
  delayMs: number
}) => {
  return slowDown({
    windowMs: options.windowMs,
    delayAfter: options.delayAfter,
    delayMs: options.delayMs,
  })
}

// API 密钥验证
export function validateApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  const validApiKey = process.env.API_SECRET_KEY

  if (!apiKey || apiKey !== validApiKey) {
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    )
  }

  return null
}

// CORS 配置
export function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}

// 输入验证和清理
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return input
}
```

## 📊 监控和日志

### 1. 错误监控 (Sentry)

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs'
import { config } from './env'

if (config.monitoring.sentryDsn) {
  Sentry.init({
    dsn: config.monitoring.sentryDsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: config.isProduction ? 0.1 : 1.0,
    
    // 性能监控
    profilesSampleRate: config.isProduction ? 0.1 : 1.0,
    
    // 错误过滤
    beforeSend(event, hint) {
      // 过滤掉开发环境的错误
      if (!config.isProduction) {
        return null
      }
      
      // 过滤掉特定错误
      if (event.exception) {
        const error = hint.originalException
        if (error instanceof Error) {
          // 忽略网络错误
          if (error.message.includes('Network Error')) {
            return null
          }
          
          // 忽略取消的请求
          if (error.message.includes('AbortError')) {
            return null
          }
        }
      }
      
      return event
    },
    
    // 集成配置
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: [config.app.url],
      }),
    ],
  })
}

// 自定义错误报告
export function captureError(error: Error, context?: Record<string, any>) {
  if (config.isProduction) {
    Sentry.captureException(error, {
      extra: context,
    })
  } else {
    console.error('Error:', error, context)
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (config.isProduction) {
    Sentry.captureMessage(message, level)
  } else {
    console.log(`[${level.toUpperCase()}]`, message)
  }
}
```

### 2. 性能监控

```typescript
// src/lib/analytics.ts
import { config } from './env'

// Web Vitals 监控
export function reportWebVitals(metric: any) {
  if (!config.isProduction) return

  // 发送到 Vercel Analytics
  if (config.analytics.googleAnalyticsId) {
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.value),
      event_label: metric.id,
      non_interaction: true,
    })
  }

  // 发送到自定义分析服务
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metric),
  }).catch(console.error)
}

// 自定义事件追踪
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (!config.isProduction) {
    console.log('Track Event:', eventName, properties)
    return
  }

  // Google Analytics
  if (config.analytics.googleAnalyticsId) {
    gtag('event', eventName, properties)
  }

  // 自定义分析
  fetch('/api/analytics/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event: eventName,
      properties,
      timestamp: Date.now(),
    }),
  }).catch(console.error)
}

// 页面浏览追踪
export function trackPageView(url: string) {
  if (!config.isProduction) return

  if (config.analytics.googleAnalyticsId) {
    gtag('config', config.analytics.googleAnalyticsId, {
      page_location: url,
    })
  }
}
```

### 3. 日志系统

```typescript
// src/lib/logger.ts
import { config } from './env'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  userId?: string
  sessionId?: string
}

class Logger {
  private minLevel: LogLevel

  constructor() {
    this.minLevel = config.isProduction ? LogLevel.INFO : LogLevel.DEBUG
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    if (level < this.minLevel) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    }

    // 控制台输出
    const levelName = LogLevel[level]
    const contextStr = context ? JSON.stringify(context) : ''
    console.log(`[${levelName}] ${entry.timestamp} ${message} ${contextStr}`)

    // 生产环境发送到日志服务
    if (config.isProduction && level >= LogLevel.WARN) {
      this.sendToLogService(entry)
    }
  }

  private async sendToLogService(entry: LogEntry) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      })
    } catch (error) {
      console.error('Failed to send log to service:', error)
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context)
  }
}

export const logger = new Logger()
```

## 🚀 构建优化

### 1. 构建脚本

```json
{
  "scripts": {
    "build": "next build",
    "build:analyze": "ANALYZE=true next build",
    "build:production": "NODE_ENV=production next build",
    "start": "next start",
    "start:production": "NODE_ENV=production next start -p 3000",
    "export": "next export",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test:ci": "jest --coverage --watchAll=false",
    "build:ci": "npm run type-check && npm run lint && npm run test:ci && npm run build"
  }
}
```

### 2. Docker 配置

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables must be present at build time
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

RUN npm install -g pnpm && pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

## 🤔 思考题

1. 如何设计可扩展的配置管理系统？
2. 如何平衡安全性和性能？
3. 如何设计有效的监控和告警策略？
4. 如何处理生产环境的配置更新？

## 📚 扩展阅读

- [Next.js 生产部署](https://nextjs.org/docs/deployment)
- [Web 安全最佳实践](https://owasp.org/www-project-top-ten/)
- [性能监控指南](https://web.dev/vitals/)
- [Docker 最佳实践](https://docs.docker.com/develop/dev-best-practices/)

## 🔗 下一步

完成生产配置后，下一章我们将学习监控和运维。

[下一章：监控运维 →](./23-monitoring.md)
