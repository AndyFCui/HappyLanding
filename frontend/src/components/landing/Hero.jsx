/**
 * [INPUT]: headline, subheadline, primaryCTA, secondaryCTA, socialProof
 * [OUTPUT]: Hero section with CTA buttons and social proof
 * [POS]: Landing Page - Above the fold 首屏
 * [PROTOCOL]: 变更时更新此头部，然后检查 components/landing/CLAUDE.md
 */
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Sparkles } from 'lucide-react'

export function Hero({
  badge = 'AI 驱动的企业知识管理',
  headline = '统一搜索，智能问答',
  subheadline = '基于 Amazon OpenSearch + Bedrock 构建的混合搜索系统，支持全文检索、向量搜索、智能问答与知识图谱洞察。',
  primaryCTA = '免费开始',
  secondaryCTA = '观看演示',
  socialProof = '已有 500+ 企业客户'
}) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="px-4 py-2 text-sm mb-8">
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              {badge}
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {headline.split('，').map((part, i) => (
              <span key={i}>
                {i === 1 ? <span className="text-primary">{part}</span> : part}
                {i < 1 && '，'}
              </span>
            ))}
            <br />
            <span className="text-primary">知识图谱可视化</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {subheadline}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button size="lg" className="text-base px-8">
              {primaryCTA}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="text-base">
              {secondaryCTA}
            </Button>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            className="mt-16 relative mx-auto max-w-4xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="aspect-video rounded-2xl border bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="text-6xl mb-4">🔍</div>
                <p>产品截图展示区域</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}