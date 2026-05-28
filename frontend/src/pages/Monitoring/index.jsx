/**
 * [INPUT]: 无
 * [OUTPUT]: 监控入口页面 - Grafana/Alertmanager 外链卡片
 * [POS]: Pages - Monitoring
 * [PROTOCOL]: 变更时更新此头部，然后检查 pages/Monitoring/CLAUDE.md
 */
import { Card } from '@/components/ui/card'
import { LayoutDashboard, Bell } from 'lucide-react'

const monitoringLinks = [
  {
    title: 'Grafana',
    description: '集群指标、可视化仪表盘',
    icon: LayoutDashboard,
    url: 'https://grafana.happylanding.com',
    color: 'primary',
  },
  {
    title: 'Alertmanager',
    description: '告警状态、触发规则',
    icon: Bell,
    url: 'https://alertmanager.happylanding.com',
    color: 'red',
  },
]

export default function Monitoring() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">监控</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {monitoringLinks.map((item) => {
          const Icon = item.icon
          return (
            <Card
              key={item.title}
              variant="raised"
              className="p-5 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => window.open(item.url, '_blank')}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  item.color === 'red' ? 'bg-red-100' : 'bg-primary/10'
                }`}>
                  <Icon className={`h-5 w-5 ${item.color === 'red' ? 'text-red-600' : 'text-primary'}`} />
                </div>
                <h3 className="text-base font-semibold">{item.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
              <div className="flex items-center text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium">打开</span>
                <span className="ml-1">→</span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}