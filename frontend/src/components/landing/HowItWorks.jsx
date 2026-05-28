/**
 * [INPUT]: headline, steps[]
 * [OUTPUT]: 产品使用步骤展示
 * [POS]: Landing Page - How It Works
 * [PROTOCOL]: 变更时更新此头部，然后检查 components/landing/CLAUDE.md
 */
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { fadeInUp, staggerContainer } from '@/lib/motion'

const defaultSteps = [
  { step: 1, title: '连接数据源', description: '一键对接 OpenSearch、Neptune、S3 等数据源，自动同步文档和知识', icon: '🔗' },
  { step: 2, title: '配置搜索', description: '设置搜索策略、过滤器、排序规则，打造专属搜索体验', icon: '⚙️' },
  { step: 3, title: '启用 AI 对话', description: '选择 Bedrock 模型，配置 Prompt 模板，上线智能助手', icon: '🤖' },
  { step: 4, title: '分析知识图谱', description: '可视化查看实体关系，发现隐藏洞察', icon: '📊' },
]

export function HowItWorks({
  headline = '四步开启智能知识管理',
  steps = defaultSteps
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

        <div className="relative">
          {/* 连接线 */}
          <div className="hidden lg:block absolute top-16 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {steps.map((item) => (
              <motion.div key={item.step} variants={fadeInUp}>
                <Card variant="raised" className="p-6 text-center relative">
                  {/* Step Number */}
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4 relative z-10">
                    {item.step}
                  </div>
                  <span className="text-4xl mb-4 block">{item.icon}</span>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}