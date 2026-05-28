/**
 * [INPUT]: columns[], legal[], social[]
 * [OUTPUT]: 落地页底部导航
 * [POS]: Landing Page - Footer
 * [PROTOCOL]: 变更时更新此头部，然后检查 components/landing/CLAUDE.md
 */
import { Link } from 'react-router-dom'

const defaultColumns = [
  {
    title: '产品',
    links: [
      { label: '功能', href: '/#features' },
      { label: '定价', href: '/#pricing' },
      { label: '更新日志', href: '/changelog' },
    ]
  },
  {
    title: '资源',
    links: [
      { label: '文档', href: '/docs' },
      { label: '博客', href: '/blog' },
      { label: '帮助中心', href: '/help' },
    ]
  },
  {
    title: '公司',
    links: [
      { label: '关于我们', href: '/about' },
      { label: '联系我们', href: '/contact' },
      { label: '加入团队', href: '/careers' },
    ]
  },
]

const defaultLegal = [
  { label: '隐私政策', href: '/privacy' },
  { label: '服务条款', href: '/terms' },
]

export function Footer({
  columns = defaultColumns,
  legal = defaultLegal,
  siteName = 'HappyLanding',
  tagline = 'AI 驱动的企业知识管理平台'
}) {
  return (
    <footer className="mt-auto border-t bg-background">
      <div className="container px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Logo Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="text-xl font-bold">{siteName}</span>
            </Link>
            <p className="text-sm text-muted-foreground">{tagline}</p>
          </div>

          {/* Link Columns */}
          {columns.map((col, i) => (
            <div key={i}>
              <h4 className="font-semibold mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 {siteName}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {legal.map((item, i) => (
              <Link
                key={i}
                to={item.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}