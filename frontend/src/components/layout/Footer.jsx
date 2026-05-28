/**
 * [INPUT]: 无
 * [OUTPUT]: 应用底部导航
 * [POS]: Layout - Footer
 * [PROTOCOL]: 变更时更新此头部，然后检查 components/layout/CLAUDE.md
 */
import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-background">
      <div className="container px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Logo & Copyright */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="font-semibold">HappyLanding</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              © 2026 HappyLanding. All rights reserved.
            </p>
          </div>

          {/* Right: Links */}
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">隐私政策</Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">服务条款</Link>
            <Link to="/design-system" className="text-sm text-muted-foreground hover:text-foreground transition-colors">设计系统</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}