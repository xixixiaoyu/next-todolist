# 23 - 监控运维

本章将详细介绍如何建立完整的监控和运维体系，确保应用在生产环境中稳定运行。

## 🎯 学习目标

- 掌握应用性能监控的关键指标
- 学会设置告警和通知系统
- 了解日志收集和分析方法
- 掌握故障排查和恢复流程

## 📊 监控体系架构

```
┌─────────────────────────────────────────────────────────┐
│                    监控体系                              │
├─────────────────────────────────────────────────────────┤
│  应用层监控                                              │
│  ├── 性能指标 (Web Vitals, API 响应时间)                │
│  ├── 错误监控 (JavaScript 错误, API 错误)               │
│  ├── 用户行为 (页面访问, 功能使用)                      │
│  └── 业务指标 (用户注册, 任务创建)                      │
├─────────────────────────────────────────────────────────┤
│  基础设施监控                                            │
│  ├── 服务器资源 (CPU, 内存, 磁盘)                       │
│  ├── 网络状态 (延迟, 带宽, 可用性)                      │
│  ├── 数据库性能 (查询时间, 连接数)                      │
│  └── 第三方服务 (Supabase, CDN)                         │
├─────────────────────────────────────────────────────────┤
│  告警和通知                                              │
│  ├── 实时告警 (Slack, 邮件, 短信)                       │
│  ├── 告警规则 (阈值, 趋势, 异常)                        │
│  └── 升级策略 (自动恢复, 人工介入)                      │
└─────────────────────────────────────────────────────────┘
```

## 🔍 性能监控

### 1. Web Vitals 监控

```typescript
// src/lib/monitoring/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

interface WebVitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  timestamp: number
}

class WebVitalsMonitor {
  private metrics: WebVitalMetric[] = []
  private reportEndpoint = '/api/analytics/web-vitals'

  init() {
    // 监控核心 Web Vitals
    getCLS(this.handleMetric.bind(this))
    getFID(this.handleMetric.bind(this))
    getFCP(this.handleMetric.bind(this))
    getLCP(this.handleMetric.bind(this))
    getTTFB(this.handleMetric.bind(this))

    // 页面卸载时发送数据
    window.addEventListener('beforeunload', () => {
      this.sendMetrics()
    })

    // 定期发送数据
    setInterval(() => {
      this.sendMetrics()
    }, 30000) // 每 30 秒发送一次
  }

  private handleMetric(metric: any) {
    const webVitalMetric: WebVitalMetric = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      timestamp: Date.now(),
    }

    this.metrics.push(webVitalMetric)

    // 实时报告关键指标
    if (metric.rating === 'poor') {
      this.reportCriticalMetric(webVitalMetric)
    }
  }

  private async reportCriticalMetric(metric: WebVitalMetric) {
    try {
      await fetch('/api/alerts/critical-metric', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      })
    } catch (error) {
      console.error('Failed to report critical metric:', error)
    }
  }

  private async sendMetrics() {
    if (this.metrics.length === 0) return

    try {
      await fetch(this.reportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: this.metrics,
          url: window.location.href,
          timestamp: Date.now(),
        }),
      })

      this.metrics = [] // 清空已发送的指标
    } catch (error) {
      console.error('Failed to send web vitals:', error)
    }
  }
}

export const webVitalsMonitor = new WebVitalsMonitor()
```

### 2. API 性能监控

```typescript
// src/lib/monitoring/api-monitor.ts
interface ApiMetric {
  url: string
  method: string
  status: number
  duration: number
  timestamp: number
  error?: string
}

class ApiMonitor {
  private metrics: ApiMetric[] = []
  private slowRequestThreshold = 2000 // 2 秒
  private errorRateThreshold = 0.05 // 5%

  // 拦截 fetch 请求
  init() {
    const originalFetch = window.fetch
    
    window.fetch = async (...args) => {
      const startTime = performance.now()
      const url = args[0] as string
      const options = args[1] || {}
      const method = options.method || 'GET'

      try {
        const response = await originalFetch(...args)
        const duration = performance.now() - startTime

        const metric: ApiMetric = {
          url,
          method,
          status: response.status,
          duration,
          timestamp: Date.now(),
        }

        this.recordMetric(metric)
        return response
      } catch (error) {
        const duration = performance.now() - startTime
        const metric: ApiMetric = {
          url,
          method,
          status: 0,
          duration,
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : 'Unknown error',
        }

        this.recordMetric(metric)
        throw error
      }
    }
  }

  private recordMetric(metric: ApiMetric) {
    this.metrics.push(metric)

    // 检查慢请求
    if (metric.duration > this.slowRequestThreshold) {
      this.reportSlowRequest(metric)
    }

    // 检查错误率
    this.checkErrorRate()

    // 定期清理旧数据
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500)
    }
  }

  private reportSlowRequest(metric: ApiMetric) {
    fetch('/api/alerts/slow-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metric),
    }).catch(console.error)
  }

  private checkErrorRate() {
    const recentMetrics = this.metrics.filter(
      m => Date.now() - m.timestamp < 5 * 60 * 1000 // 最近 5 分钟
    )

    if (recentMetrics.length < 10) return // 样本太少

    const errorCount = recentMetrics.filter(m => m.status >= 400 || m.error).length
    const errorRate = errorCount / recentMetrics.length

    if (errorRate > this.errorRateThreshold) {
      this.reportHighErrorRate(errorRate, recentMetrics.length)
    }
  }

  private reportHighErrorRate(errorRate: number, totalRequests: number) {
    fetch('/api/alerts/high-error-rate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        errorRate,
        totalRequests,
        timestamp: Date.now(),
      }),
    }).catch(console.error)
  }

  getMetrics() {
    return this.metrics
  }

  getStats() {
    const recentMetrics = this.metrics.filter(
      m => Date.now() - m.timestamp < 60 * 60 * 1000 // 最近 1 小时
    )

    const totalRequests = recentMetrics.length
    const errorCount = recentMetrics.filter(m => m.status >= 400 || m.error).length
    const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests

    return {
      totalRequests,
      errorCount,
      errorRate: errorCount / totalRequests,
      avgDuration,
      slowRequests: recentMetrics.filter(m => m.duration > this.slowRequestThreshold).length,
    }
  }
}

export const apiMonitor = new ApiMonitor()
```

## 🚨 告警系统

### 1. 告警规则配置

```typescript
// src/lib/monitoring/alert-rules.ts
export interface AlertRule {
  id: string
  name: string
  description: string
  condition: AlertCondition
  severity: 'low' | 'medium' | 'high' | 'critical'
  channels: AlertChannel[]
  cooldown: number // 冷却时间（秒）
  enabled: boolean
}

export interface AlertCondition {
  metric: string
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  threshold: number
  timeWindow: number // 时间窗口（秒）
  minSamples?: number // 最小样本数
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms'
  config: Record<string, any>
}

export const alertRules: AlertRule[] = [
  {
    id: 'high-error-rate',
    name: '高错误率告警',
    description: 'API 错误率超过 5%',
    condition: {
      metric: 'api.error_rate',
      operator: 'gt',
      threshold: 0.05,
      timeWindow: 300, // 5 分钟
      minSamples: 10,
    },
    severity: 'high',
    channels: [
      {
        type: 'slack',
        config: {
          webhook: process.env.SLACK_WEBHOOK_URL,
          channel: '#alerts',
        },
      },
      {
        type: 'email',
        config: {
          recipients: ['dev-team@example.com'],
        },
      },
    ],
    cooldown: 900, // 15 分钟
    enabled: true,
  },
  {
    id: 'slow-response',
    name: '响应时间过慢',
    description: 'API 平均响应时间超过 2 秒',
    condition: {
      metric: 'api.avg_response_time',
      operator: 'gt',
      threshold: 2000,
      timeWindow: 600, // 10 分钟
    },
    severity: 'medium',
    channels: [
      {
        type: 'slack',
        config: {
          webhook: process.env.SLACK_WEBHOOK_URL,
          channel: '#performance',
        },
      },
    ],
    cooldown: 1800, // 30 分钟
    enabled: true,
  },
  {
    id: 'database-connection-error',
    name: '数据库连接错误',
    description: '数据库连接失败',
    condition: {
      metric: 'database.connection_error',
      operator: 'gt',
      threshold: 0,
      timeWindow: 60, // 1 分钟
    },
    severity: 'critical',
    channels: [
      {
        type: 'slack',
        config: {
          webhook: process.env.SLACK_WEBHOOK_URL,
          channel: '#critical-alerts',
        },
      },
      {
        type: 'email',
        config: {
          recipients: ['oncall@example.com'],
        },
      },
      {
        type: 'sms',
        config: {
          numbers: ['+1234567890'],
        },
      },
    ],
    cooldown: 300, // 5 分钟
    enabled: true,
  },
]
```

### 2. 告警处理器

```typescript
// src/lib/monitoring/alert-handler.ts
import { AlertRule, AlertChannel } from './alert-rules'

interface Alert {
  id: string
  ruleId: string
  severity: string
  message: string
  timestamp: number
  resolved: boolean
  metadata?: Record<string, any>
}

class AlertHandler {
  private activeAlerts = new Map<string, Alert>()
  private lastAlertTime = new Map<string, number>()

  async processAlert(rule: AlertRule, value: number, metadata?: Record<string, any>) {
    const now = Date.now()
    const lastAlert = this.lastAlertTime.get(rule.id) || 0

    // 检查冷却时间
    if (now - lastAlert < rule.cooldown * 1000) {
      return
    }

    const alert: Alert = {
      id: `${rule.id}-${now}`,
      ruleId: rule.id,
      severity: rule.severity,
      message: this.generateAlertMessage(rule, value),
      timestamp: now,
      resolved: false,
      metadata,
    }

    this.activeAlerts.set(alert.id, alert)
    this.lastAlertTime.set(rule.id, now)

    // 发送告警
    await this.sendAlert(alert, rule.channels)

    // 记录告警
    await this.logAlert(alert)
  }

  private generateAlertMessage(rule: AlertRule, value: number): string {
    return `🚨 ${rule.name}\n` +
           `描述: ${rule.description}\n` +
           `当前值: ${value}\n` +
           `阈值: ${rule.condition.threshold}\n` +
           `时间: ${new Date().toISOString()}`
  }

  private async sendAlert(alert: Alert, channels: AlertChannel[]) {
    const promises = channels.map(channel => this.sendToChannel(alert, channel))
    await Promise.allSettled(promises)
  }

  private async sendToChannel(alert: Alert, channel: AlertChannel) {
    try {
      switch (channel.type) {
        case 'slack':
          await this.sendSlackAlert(alert, channel.config)
          break
        case 'email':
          await this.sendEmailAlert(alert, channel.config)
          break
        case 'webhook':
          await this.sendWebhookAlert(alert, channel.config)
          break
        case 'sms':
          await this.sendSmsAlert(alert, channel.config)
          break
      }
    } catch (error) {
      console.error(`Failed to send alert to ${channel.type}:`, error)
    }
  }

  private async sendSlackAlert(alert: Alert, config: any) {
    const payload = {
      channel: config.channel,
      username: 'AlertBot',
      icon_emoji: ':rotating_light:',
      attachments: [
        {
          color: this.getSeverityColor(alert.severity),
          title: `${alert.severity.toUpperCase()} Alert`,
          text: alert.message,
          timestamp: Math.floor(alert.timestamp / 1000),
        },
      ],
    }

    await fetch(config.webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  }

  private async sendEmailAlert(alert: Alert, config: any) {
    const emailData = {
      to: config.recipients,
      subject: `[${alert.severity.toUpperCase()}] ${alert.message.split('\n')[0]}`,
      html: alert.message.replace(/\n/g, '<br>'),
    }

    await fetch('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })
  }

  private async sendWebhookAlert(alert: Alert, config: any) {
    await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify(alert),
    })
  }

  private async sendSmsAlert(alert: Alert, config: any) {
    const smsData = {
      numbers: config.numbers,
      message: alert.message.substring(0, 160), // SMS 长度限制
    }

    await fetch('/api/notifications/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smsData),
    })
  }

  private getSeverityColor(severity: string): string {
    const colors = {
      low: '#36a64f',
      medium: '#ff9500',
      high: '#ff0000',
      critical: '#8b0000',
    }
    return colors[severity as keyof typeof colors] || '#808080'
  }

  private async logAlert(alert: Alert) {
    try {
      await fetch('/api/alerts/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert),
      })
    } catch (error) {
      console.error('Failed to log alert:', error)
    }
  }

  async resolveAlert(alertId: string) {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.resolved = true
      await this.logAlert(alert)
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved)
  }
}

export const alertHandler = new AlertHandler()
```

## 📈 监控仪表板

### 1. 实时监控组件

```typescript
// src/components/monitoring/monitoring-dashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface MonitoringData {
  webVitals: {
    cls: number
    fid: number
    lcp: number
    fcp: number
    ttfb: number
  }
  apiMetrics: {
    totalRequests: number
    errorRate: number
    avgResponseTime: number
    slowRequests: number
  }
  systemHealth: {
    uptime: number
    memoryUsage: number
    cpuUsage: number
    diskUsage: number
  }
  alerts: Array<{
    id: string
    severity: string
    message: string
    timestamp: number
  }>
}

export function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/monitoring/dashboard')
        const monitoringData = await response.json()
        setData(monitoringData)
      } catch (error) {
        console.error('Failed to fetch monitoring data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // 每 30 秒更新

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div className="p-6">加载监控数据...</div>
  }

  if (!data) {
    return <div className="p-6">无法加载监控数据</div>
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">监控仪表板</h1>

      {/* 告警概览 */}
      <Card>
        <CardHeader>
          <CardTitle>活跃告警</CardTitle>
        </CardHeader>
        <CardContent>
          {data.alerts.length === 0 ? (
            <p className="text-green-600">✅ 无活跃告警</p>
          ) : (
            <div className="space-y-2">
              {data.alerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {alert.severity}
                    </Badge>
                    <span className="ml-2">{alert.message}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="CLS"
          value={data.webVitals.cls.toFixed(3)}
          status={data.webVitals.cls < 0.1 ? 'good' : data.webVitals.cls < 0.25 ? 'warning' : 'poor'}
        />
        <MetricCard
          title="FID"
          value={`${data.webVitals.fid.toFixed(0)}ms`}
          status={data.webVitals.fid < 100 ? 'good' : data.webVitals.fid < 300 ? 'warning' : 'poor'}
        />
        <MetricCard
          title="LCP"
          value={`${(data.webVitals.lcp / 1000).toFixed(1)}s`}
          status={data.webVitals.lcp < 2500 ? 'good' : data.webVitals.lcp < 4000 ? 'warning' : 'poor'}
        />
        <MetricCard
          title="FCP"
          value={`${(data.webVitals.fcp / 1000).toFixed(1)}s`}
          status={data.webVitals.fcp < 1800 ? 'good' : data.webVitals.fcp < 3000 ? 'warning' : 'poor'}
        />
        <MetricCard
          title="TTFB"
          value={`${data.webVitals.ttfb.toFixed(0)}ms`}
          status={data.webVitals.ttfb < 800 ? 'good' : data.webVitals.ttfb < 1800 ? 'warning' : 'poor'}
        />
      </div>

      {/* API 指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="总请求数"
          value={data.apiMetrics.totalRequests.toString()}
          status="good"
        />
        <MetricCard
          title="错误率"
          value={`${(data.apiMetrics.errorRate * 100).toFixed(2)}%`}
          status={data.apiMetrics.errorRate < 0.01 ? 'good' : data.apiMetrics.errorRate < 0.05 ? 'warning' : 'poor'}
        />
        <MetricCard
          title="平均响应时间"
          value={`${data.apiMetrics.avgResponseTime.toFixed(0)}ms`}
          status={data.apiMetrics.avgResponseTime < 500 ? 'good' : data.apiMetrics.avgResponseTime < 2000 ? 'warning' : 'poor'}
        />
        <MetricCard
          title="慢请求数"
          value={data.apiMetrics.slowRequests.toString()}
          status={data.apiMetrics.slowRequests === 0 ? 'good' : 'warning'}
        />
      </div>

      {/* 系统健康 */}
      <Card>
        <CardHeader>
          <CardTitle>系统健康</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.floor(data.systemHealth.uptime / 3600)}h</div>
              <div className="text-sm text-gray-500">运行时间</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data.systemHealth.memoryUsage.toFixed(1)}%</div>
              <div className="text-sm text-gray-500">内存使用率</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data.systemHealth.cpuUsage.toFixed(1)}%</div>
              <div className="text-sm text-gray-500">CPU 使用率</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data.systemHealth.diskUsage.toFixed(1)}%</div>
              <div className="text-sm text-gray-500">磁盘使用率</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  status 
}: { 
  title: string
  value: string
  status: 'good' | 'warning' | 'poor'
}) {
  const statusColors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    poor: 'text-red-600 bg-red-50 border-red-200',
  }

  return (
    <Card className={`${statusColors[status]} border`}>
      <CardContent className="p-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm">{title}</div>
        </div>
      </CardContent>
    </Card>
  )
}
```

## 🤔 思考题

1. 如何设计有效的告警策略避免告警疲劳？
2. 如何平衡监控的全面性和性能影响？
3. 如何建立有效的故障响应流程？
4. 如何利用监控数据进行容量规划？

## 📚 扩展阅读

- [Web Vitals 监控指南](https://web.dev/vitals/)
- [SRE 实践指南](https://sre.google/sre-book/table-of-contents/)
- [监控系统设计](https://prometheus.io/docs/introduction/overview/)
- [告警最佳实践](https://docs.datadoghq.com/monitors/guide/best-practices/)

## 🎉 恭喜完成！

至此，您已经完成了整个 Next.js 14+ Todo List 学习路径！从项目初始化到生产部署，从基础功能到高级特性，您已经掌握了现代全栈 Web 开发的核心技能。

继续实践和探索，成为更优秀的开发者！🚀
