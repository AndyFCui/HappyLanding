/**
 * [INPUT]: 无
 * [OUTPUT]: 应用顶部导航栏
 * [POS]: Layout - Header
 * [PROTOCOL]: 变更时更新此头部，然后检查 components/layout/CLAUDE.md
 */
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Search, MessageSquare, Network, FileText, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: '控制台', icon: LayoutDashboard },
  { path: '/search', label: '搜索', icon: Search },
  { path: '/chat', label: 'AI 对话', icon: MessageSquare },
  { path: '/graph', label: '知识图谱', icon: Network },
  { path: '/documents', label: '文档', icon: FileText },
]

export function Header() {
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="text-xl font-bold text-primary">HappyLanding</span>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          <Link
            to="/services"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Activity className="h-4 w-4" />
            服务状态
          </Link>
          <Link
            to="/about"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            关于
          </Link>
        </div>
      </div>
    </header>
  )
}