/**
 * [INPUT]: className, variant (raised | inset | flat), children
 * [OUTPUT]: 微拟物卡片组件（凸起/内凹变体）
 * [POS]: UI基础层 - 展示容器
 * [PROTOCOL]: 变更时更新此头部，然后检查 components/ui/CLAUDE.md
 */
import * as React from "react"
import { cn } from "@/lib/utils"

/* ========================================
   卡片样式配置 - 立体光影效果
   ======================================== */

const CARD_STYLES = {
  raised: {
    background: 'linear-gradient(145deg, hsl(var(--card)), color-mix(in srgb, hsl(var(--card)) 95%, black))',
    boxShadow: '0 4px 16px color-mix(in srgb, var(--primary) 20%, transparent), inset 0 1px 0 rgba(255,255,255,0.15)',
    hoverBoxShadow: '0 8px 24px color-mix(in srgb, var(--primary) 30%, transparent), inset 0 1px 0 rgba(255,255,255,0.2)',
  },
  inset: {
    background: 'linear-gradient(145deg, color-mix(in srgb, hsl(var(--card)) 90%, black), hsl(var(--card)))',
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
    hoverBoxShadow: 'inset 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
  },
  flat: {
    background: 'hsl(var(--card))',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    hoverBoxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  },
}

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: 'raised' | 'inset' | 'flat' }>(
  ({ className, variant = 'raised', ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false)
    const styleConfig = CARD_STYLES[variant]

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border border-border/50 p-6 transition-all duration-200",
          variant === 'inset' && "border-b-2 border-l-2",
          className
        )}
        style={{
          background: styleConfig.background,
          boxShadow: isHovered ? styleConfig.hoverBoxShadow : styleConfig.boxShadow,
        }}
        onMouseEnter={(e) => { setIsHovered(true); props.onMouseEnter?.(e) }}
        onMouseLeave={(e) => { setIsHovered(false); props.onMouseLeave?.(e) }}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }