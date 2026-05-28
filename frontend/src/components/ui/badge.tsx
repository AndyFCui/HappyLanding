/**
 * [INPUT]: className, variant, children
 * [OUTPUT]: 微拟物标签组件（渐变背景变体）
 * [POS]: UI基础层 - 状态标识
 * [PROTOCOL]: 变更时更新此头部，然后检查 components/ui/CLAUDE.md
 */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/* ========================================
   标签样式配置 - 渐变 + 立体效果
   ======================================== */

const BADGE_STYLES = {
  default: {
    background: 'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 85%, black) 50%, color-mix(in srgb, var(--primary) 70%, black) 100%)',
    boxShadow: '0 2px 8px color-mix(in srgb, var(--primary) 30%, transparent), inset 0 1px 0 rgba(255,255,255,0.2)',
  },
  secondary: {
    background: 'linear-gradient(135deg, var(--secondary) 0%, color-mix(in srgb, var(--secondary) 85%, black) 50%, color-mix(in srgb, var(--secondary) 70%, black) 100%)',
    boxShadow: '0 2px 8px color-mix(in srgb, var(--secondary) 25%, transparent), inset 0 1px 0 rgba(255,255,255,0.15)',
  },
  destructive: {
    background: 'linear-gradient(135deg, var(--destructive) 0%, color-mix(in srgb, var(--destructive) 85%, black) 50%, color-mix(in srgb, var(--destructive) 70%, black) 100%)',
    boxShadow: '0 2px 8px color-mix(in srgb, var(--destructive) 30%, transparent), inset 0 1px 0 rgba(255,255,255,0.2)',
  },
  outline: {
    background: 'transparent',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  accent: {
    background: 'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 85%, black) 50%, color-mix(in srgb, var(--accent) 70%, black) 100%)',
    boxShadow: '0 2px 8px color-mix(in srgb, var(--accent) 30%, transparent), inset 0 1px 0 rgba(255,255,255,0.2)',
  },
}

const badgeVariants = cva(
  [
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    "active:scale-[0.97] hover:scale-[1.02]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        secondary: "text-secondary-foreground",
        destructive: "text-destructive-foreground",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        accent: "text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const styleConfig = BADGE_STYLES[variant || 'default']
  const needsCustomStyle = !['outline'].includes(variant)

  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={needsCustomStyle ? {
        background: styleConfig.background,
        boxShadow: isHovered ? styleConfig.boxShadow.replace('30%', '45%') : styleConfig.boxShadow,
      } : undefined}
      onMouseEnter={(e) => { setIsHovered(true); props.onMouseEnter?.(e) }}
      onMouseLeave={(e) => { setIsHovered(false); props.onMouseLeave?.(e) }}
      {...props}
    />
  )
}

export { Badge, badgeVariants }