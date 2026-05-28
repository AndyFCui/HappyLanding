/**
 * [INPUT]: headline, subheadline, items[], layout
 * [OUTPUT]: 功能特性展示（Bento Grid 布局）
 * [POS]: Landing Page - Solution/Features
 * [PROTOCOL]: 变更时更新此头部，然后检查 components/landing/CLAUDE.md
 */
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, MessageSquare, Network, FileText, Zap, Shield } from 'lucide-react'
import { fadeInUp, staggerContainer } from '@/lib/motion'

const defaultFeatures = [
  { icon: Search, title: '统一搜索', description: '全文 + 向量混合搜索，覆盖所有企业知识，支持语义理解' },
  { icon: MessageSquare, title: 'AI 对话', description: '基于 Bedrock Claude 的智能问答，理解上下文', badge: 'New' },
  { icon: Network, title: '知识图谱', description: 'Neptune 图数据库，实体关联可视化分析' },
  { icon: FileText, title: '文档管理', description: '支持 PDF、Word、Markdown 等多格式文档解析' },
  { icon: Zap, title: '实时同步', description: '数据源变更实时同步，搜索结果始终最新' },
  { icon: Shield, title: '安全合规', description: 'Cognito 认证，细粒度权限控制，审计日志' },
]

export function FeaturesSection({
  headline = '强大功能，一站式解决',
  subheadline = '从搜索到对话，从图谱到文档，全部整合在一个平台',
  items = defaultFeatures,
  layout = 'bento'
}) {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-3xl text-center mb-12"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{headline}</h2>
          <p className="text-lg text-muted-foreground">{subheadline}</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {items.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={i}
                variants={fadeInUp}
              >
                <Card
                  variant="raised"
                  className="p-6 h-full hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      {feature.badge && (
                        <Badge variant="default" className="text-xs">{feature.badge}</Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground flex-1">{feature.description}</p>
                    <div className="mt-4 flex items-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm font-medium">了解更多</span>
                      <span className="ml-1">→</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}