import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface FloatingPopoverTriggerProps
  extends React.ComponentPropsWithoutRef<typeof Button> {
  label: string
}

const FloatingPopoverTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  FloatingPopoverTriggerProps
>(({ className, label, id, children, ...props }, ref) => {
  const generatedId = React.useId()
  const triggerId = id || generatedId
  return (
    <div className="relative w-full">
      <Button
        ref={ref}
        id={triggerId}
        variant="outline"
        className={cn(
          "peer w-full justify-between bg-white font-normal hover:bg-white text-left",
          className
        )}
        {...props}
      >
        {children}
      </Button>
      <Label
        htmlFor={triggerId}
        className={cn(
          "absolute left-2 -top-2 text-xs bg-white px-1 text-muted-foreground transition-all duration-200 pointer-events-none z-10",
          "peer-focus:text-blue-600",
          "peer-[[data-state=open]]:text-blue-600"
        )}
      >
        {label}
      </Label>
    </div>
  )
})
FloatingPopoverTrigger.displayName = "FloatingPopoverTrigger"

export { FloatingPopoverTrigger }
