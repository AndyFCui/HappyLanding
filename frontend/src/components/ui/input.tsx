/**
 * [INPUT]: className, type, placeholder, disabled, value
 * [OUTPUT]: 微拟物输入框（内凹效果）
 * [POS]: UI基础层 - 表单输入
 * [PROTOCOL]: 变更时更新此头部，然后检查 components/ui/CLAUDE.md
 */
import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input"> & { variant?: 'inset' | 'flat' }>(
  ({ className, type, variant = 'inset', ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)

    const baseStyles = "flex h-11 w-full rounded-xl text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200"

    const variantStyles = {
      inset: {
        background: 'linear-gradient(145deg, color-mix(in srgb, hsl(var(--background)) 95%, black), hsl(var(--background)))',
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
        focusBoxShadow: 'inset 0 2px 8px rgba(0,0,0,0.15), 0 0 0 2px var(--ring)',
      },
      flat: {
        background: 'hsl(var(--background))',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
        focusBoxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08), 0 0 0 2px var(--ring)',
      },
    }

    const currentStyle = variantStyles[variant]

    return (
      <input
        type={type}
        className={cn(
          baseStyles,
          "px-4 py-2 border border-input/50",
          className
        )}
        style={{
          background: currentStyle.background,
          boxShadow: isFocused ? currentStyle.focusBoxShadow : currentStyle.boxShadow,
        }}
        ref={ref}
        onFocus={(e) => { setIsFocused(true); props.onFocus?.(e) }}
        onBlur={(e) => { setIsFocused(false); props.onBlur?.(e) }}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }