/**
 * [INPUT]: headline, painPoints[]
 * [OUTPUT]: 痛点问题展示区域（为什么需要这个产品）
 * [POS]: Landing Page - Problem-Agitation
 * [PROTOCOL]: 变更时更新此头部，然后检查 components/landing/CLAUDE.md
 */
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { AlertCircle, X } from 'lucide-react'
import { fadeInUp, staggerContainer } from '@/lib/motion'

const defaultPainPoints = [
  { icon: '🔍', title: '信息孤岛', description: '文档分散在各个系统，搜索效率低下' },
  { icon: '🤖', title: '知识碎片化', description: 'AI 无法理解上下文，答案总是答非所问' },
  { icon: '📊', title: '洞察困难', description: '数据关联性看不清，无法形成知识图谱' },
]

export function ProblemSection({
  headline = '还在为这些问题烦恼？',
  painPoints = defaultPainPoints
}) {
  return (
    <section className="py-20 md:py-28">
      <div className="container px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-3xl text-center mb-12"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{headline}</h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {painPoints.map((pain, i) => (
            <motion.div key={i} variants={fadeInUp}>
              <Card variant="inset" className="p-6 h-full">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <X className="h-6 w-6 text-destructive" />
                  </div>
                  <span className="text-4xl mb-4">{pain.icon}</span>
                  <h3 className="text-lg font-semibold mb-2">{pain.title}</h3>
                  <p className="text-sm text-muted-foreground">{pain.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}