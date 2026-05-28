import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, Sparkles } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm bg-background mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">AI 驱动的企业知识管理平台</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6">
            统一搜索，
            <span className="text-primary">智能问答</span>
            <br />知识图谱可视化
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            基于 Amazon OpenSearch + Bedrock 构建的混合搜索系统，支持全文检索、向量搜索、智能问答与知识图谱洞察。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="relative w-full max-w-md">
              <Input
                placeholder="输入关键词搜索文档、对话、知识图谱..."
                className="h-12 pl-4 pr-24"
              />
              <Button size="sm" className="absolute right-1.5 top-1.5">
                搜索
              </Button>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>99.9% 可用性</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>&lt;100ms 响应</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>向量 + 全文混合搜索</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent" />
    </section>
  )
}