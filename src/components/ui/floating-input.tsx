import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId
    return (
      <div className="relative">
        <Input
          id={inputId}
          ref={ref}
          placeholder=" "
          className={cn("peer bg-white", className)}
          {...props}
        />
        <Label
          htmlFor={inputId}
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
FloatingInput.displayName = "FloatingInput"

export { FloatingInput }
