/**
 * [INPUT]: 无
 * [OUTPUT]: 应用侧边栏导航
 * [POS]: Layout - Sidebar
 * [PROTOCOL]: 变更时更新此头部，然后检查 components/layout/CLAUDE.md
 */
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Search, MessageSquare, Network, FileText, Activity, Info, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const menuItems = [
  { path: '/', label: '控制台', icon: LayoutDashboard },
  { path: '/search', label: '搜索', icon: Search },
  { path: '/chat', label: 'AI 对话', icon: MessageSquare },
  { path: '/graph', label: '知识图谱', icon: Network },
  { path: '/documents', label: '文档', icon: FileText },
]

const bottomItems = [
  { path: '/services', label: '服务状态', icon: Activity },
  { path: '/about', label: '关于', icon: Info },
]

export function Sidebar() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn(
      'flex flex-col bg-slate-900 text-white transition-all duration-300',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <Link to="/" className="flex items-center gap-2">
          <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          {!collapsed && <span className="text-lg font-bold">HappyLanding</span>}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-slate-800"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-90')} />
        </button>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 py-4">
        <div className="px-3 mb-2">
          {!collapsed && <span className="text-xs text-slate-500 uppercase">导航</span>}
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Menu */}
      <div className="border-t border-slate-800 py-4">
        {bottomItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}