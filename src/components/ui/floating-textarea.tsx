import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface FloatingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
}

const FloatingTextarea = React.forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId()
    const textId = id || generatedId
    return (
      <div className="relative">
        <Textarea
          id={textId}
          ref={ref}
          placeholder=" "
          className={cn("peer min-h-[80px] bg-white", className)}
          {...props}
        />
        <Label
          htmlFor={textId}
          className={cn(
            "absolute left-2 -top-2 text-xs bg-white px-1 text-muted-foreground transition-colors duration-200 pointer-events-none z-10",
            "peer-focus:text-blue-600"
          )}
        >
          {label}
        </Label>
      </div>
    )
  }
)
FloatingTextarea.displayName = "FloatingTextarea"

export { FloatingTextarea }
