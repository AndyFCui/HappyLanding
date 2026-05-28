import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { AlertTriangle, Info, Sparkles } from 'lucide-react'

const components = [
  { name: 'Button', category: '核心交互' },
  { name: 'Input', category: '表单' },
  { name: 'Label', category: '表单' },
  { name: 'Card', category: '展示' },
  { name: 'Badge', category: '反馈' },
  { name: 'Tabs', category: '导航' },
  { name: 'Switch', category: '表单' },
  { name: 'Checkbox', category: '表单' },
  { name: 'Progress', category: '反馈' },
  { name: 'Avatar', category: '展示' },
  { name: 'Alert', category: '反馈' },
  { name: 'Dialog', category: '反馈' },
  { name: 'Accordion', category: '导航' },
]

export default function DesignSystem() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">设计系统</h1>
        <p className="text-muted-foreground">shadcn/ui 组件库 · 微拟物光影质感</p>
      </div>

      {/* 微拟物光影质感展示区 */}
      <Card variant="raised" className="p-8">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>微拟物光影质感</CardTitle>
          </div>
          <CardDescription>渐变背景 + 立体阴影 + 微交互</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* 设计原则 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <h4 className="font-semibold mb-2">渐变背景</h4>
              <p className="text-sm text-muted-foreground">三段式渐变：亮 → 中 → 暗，使用 color-mix 派生</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <h4 className="font-semibold mb-2">立体阴影</h4>
              <p className="text-sm text-muted-foreground">三层：外投影 + 顶部高光 + 底部暗边</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <h4 className="font-semibold mb-2">微交互</h4>
              <p className="text-sm text-muted-foreground">hover: scale(1.02) | active: scale(0.97)</p>
            </div>
          </div>

          <Separator />

          {/* Button 升级展示 */}
          <div className="space-y-4">
            <h3 className="font-semibold">Button 按钮</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="accent">Accent</Button>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra Large</Button>
              <Button size="icon">🔍</Button>
            </div>
          </div>

          <Separator />

          {/* Card 升级展示 */}
          <div className="space-y-4">
            <h3 className="font-semibold">Card 卡片</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card variant="raised">
                <CardHeader className="p-4">
                  <CardTitle className="text-base">raised 凸起</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground">外投影 + 顶部高光</p>
                </CardContent>
              </Card>
              <Card variant="inset">
                <CardHeader className="p-4">
                  <CardTitle className="text-base">inset 内凹</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground">inset 阴影模拟凹陷</p>
                </CardContent>
              </Card>
              <Card variant="flat">
                <CardHeader className="p-4">
                  <CardTitle className="text-base">flat 平面</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground">轻阴影无渐变</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Input 升级展示 */}
          <div className="space-y-4">
            <h3 className="font-semibold">Input 输入框</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div className="space-y-2">
                <Label>inset 样式（默认）</Label>
                <Input placeholder="内凹效果输入框..." />
              </div>
              <div className="space-y-2">
                <Label>flat 样式</Label>
                <Input variant="flat" placeholder="扁平效果输入框..." />
              </div>
            </div>
          </div>

          <Separator />

          {/* Badge 升级展示 */}
          <div className="space-y-4">
            <h3 className="font-semibold">Badge 标签</h3>
            <div className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="accent">Accent</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 原有组件展示 */}
      <Tabs defaultValue="buttons" className="w-full">
        <TabsList>
          <TabsTrigger value="buttons">按钮</TabsTrigger>
          <TabsTrigger value="form">表单</TabsTrigger>
          <TabsTrigger value="display">展示</TabsTrigger>
          <TabsTrigger value="feedback">反馈</TabsTrigger>
        </TabsList>

        <TabsContent value="buttons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Button 按钮 - 基础变体</CardTitle>
              <CardDescription>核心交互组件，支持多种变体和尺寸</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 items-center">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              <Separator />
              <div className="flex flex-wrap gap-4 items-center">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">🔍</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>表单组件</CardTitle>
              <CardDescription>Input、Label、Switch、Checkbox</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid w-full max-w-sm gap-3">
                <Label htmlFor="email">邮箱</Label>
                <Input id="email" type="email" placeholder="email@example.com" />
              </div>
              <div className="flex items-center gap-4">
                <Switch id=" режим" />
                <Label htmlFor="режим">启用自动模式</Label>
              </div>
              <div className="flex items-center gap-4">
                <Checkbox id="terms" />
                <Label htmlFor="terms">我同意服务条款</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>展示组件</CardTitle>
              <CardDescription>Card、Avatar、Badge、Progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">卡片标题</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground">卡片内容示例</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">用户</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
                      <AvatarFallback>FL</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <p className="font-medium">Felix</p>
                      <p className="text-muted-foreground">开发者</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">标签</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>存储使用</span>
                  <span>65%</span>
                </div>
                <Progress value={65} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>反馈组件</CardTitle>
              <CardDescription>Alert、Dialog、Accordion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>信息提示</AlertTitle>
                  <AlertDescription>这是一条信息提示内容</AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>警告/错误</AlertTitle>
                  <AlertDescription>用于显示警告或错误信息</AlertDescription>
                </Alert>
              </div>

              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>展开查看详情</AccordionTrigger>
                  <AccordionContent>
                    这是展开的内容区域，可以包含更多信息。
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>另一个可展开项</AccordionTrigger>
                  <AccordionContent>
                    更多信息内容在这里。
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">打开对话框</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>确认操作</DialogTitle>
                    <DialogDescription>
                      此操作不可撤销。确定要继续吗？
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">取消</Button>
                    <Button>确认</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>组件清单</CardTitle>
          <CardDescription>当前已安装的 shadcn/ui 组件</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {components.map((comp) => (
              <div key={comp.name} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-mono text-sm">{comp.name}</span>
                <Badge variant="outline" className="text-xs">{comp.category}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}