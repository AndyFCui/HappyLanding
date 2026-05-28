/**
 * [INPUT]: 无
 * [OUTPUT]: 应用主布局（侧边栏 + 顶部栏 + 内容）
 * [POS]: Layout - AppLayout
 * [PROTOCOL]: 变更时更新此头部，然后检查 components/layout/CLAUDE.md
 */
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Activity, User } from 'lucide-react'

const pageTitles = {
  '/': '控制台',
  '/search': '搜索',
  '/chat': 'AI 对话',
  '/graph': '知识图谱',
  '/documents': '文档',
  '/services': '服务状态',
  '/about': '关于',
  '/design-system': '设计系统',
}

export function AppLayout({ children }) {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'HappyLanding'

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 rounded-lg">
              <Activity className="h-5 w-5 text-slate-500" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
                U
              </div>
              <span className="text-sm text-slate-700">用户</span>
            </div>
          </div>
        </header>
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}