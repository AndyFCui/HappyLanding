/**
 * [INPUT]: 无
 * [OUTPUT]: Dashboard 页面 - 展示所有服务状态和入口
 * [POS]: Pages - Dashboard
 * [PROTOCOL]: 变更时更新此头部，然后检查 pages/Dashboard/CLAUDE.md
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Search, MessageSquare, Network, FileText, Activity, Zap, Shield, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

const services = [
  { name: '搜索服务', path: '/search', icon: Search, description: '全文 + 向量混合搜索', status: 'running' },
  { name: 'AI 对话', path: '/chat', icon: MessageSquare, description: 'Bedrock Claude 智能问答', status: 'running' },
  { name: '知识图谱', path: '/graph', icon: Network, description: 'Neptune 图数据库', status: 'running' },
  { name: '文档管理', path: '/documents', icon: FileText, description: '多格式文档解析', status: 'running' },
]

const systemInfo = [
  { label: '服务版本', value: 'v1.0.0', icon: Zap },
  { label: '运行环境', value: 'AWS EKS', icon: Shield },
  { label: '数据库', value: 'OpenSearch', icon: Database },
  { label: 'AI 模型', value: 'Claude 3', icon: MessageSquare },
]

export default function Dashboard() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="p-6">
      {/* Time Display */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          {time.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })} {time.toLocaleTimeString('zh-CN')}
        </p>
      </div>

      {/* System Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {systemInfo.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} variant="raised" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="font-semibold">{item.value}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Services Grid */}
      <h2 className="text-lg font-semibold mb-4">服务</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {services.map((service) => {
          const Icon = service.icon
          return (
            <Link key={service.path} to={service.path}>
              <Card variant="raised" className="p-5 h-full hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    service.status === 'running' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  )}>
                    {service.status === 'running' ? '运行中' : '离线'}
                  </span>
                </div>
                <h3 className="text-base font-semibold mb-1">{service.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                <div className="flex items-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium">进入</span>
                  <span className="ml-1">→</span>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold mb-4">快速操作</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/design-system">
          <Card variant="flat" className="p-4 hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary" />
              <span>设计系统</span>
            </div>
          </Card>
        </Link>
        <Link to="/services">
          <Card variant="flat" className="p-4 hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary" />
              <span>服务状态</span>
            </div>
          </Card>
        </Link>
        <Link to="/about">
          <Card variant="flat" className="p-4 hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary" />
              <span>关于</span>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}