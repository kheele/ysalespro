import * as React from "react"
import { SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface FloatingSelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectTrigger> {
  label: string
}

const FloatingSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectTrigger>,
  FloatingSelectTriggerProps
>(({ className, label, id, ...props }, ref) => {
  const generatedId = React.useId()
  const triggerId = id || generatedId
  return (
    <div className="relative w-full">
      <SelectTrigger
        ref={ref}
        id={triggerId}
        className={cn("peer bg-white", className)}
        {...props}
      >
        <SelectValue placeholder=" " />
      </SelectTrigger>
      <Label
        htmlFor={triggerId}
        className={cn(
          "absolute left-2 -top-2 text-xs bg-white px-1 text-muted-foreground transition-colors duration-200 pointer-events-none z-10",
          "peer-focus:text-blue-600",
          "peer-data-[state=open]:text-blue-600"
        )}
      >
        {label}
      </Label>
    </div>
  )
})
FloatingSelectTrigger.displayName = "FloatingSelectTrigger"

export { FloatingSelectTrigger }
