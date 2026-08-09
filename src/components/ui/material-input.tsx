import * as React from "react"
import { cn } from "@/lib/utils"

export interface MaterialInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
}

const MaterialInput = React.forwardRef<HTMLInputElement, MaterialInputProps>(
    ({ className, type, label, id, placeholder, ...props }, ref) => {
        const inputId = id || React.useId()

        return (
            <div className="relative">
                <input
                    type={type}
                    id={inputId}
                    className={cn(
                        "peer flex h-14 w-full rounded-md border border-input bg-background px-3 pt-5 pb-1 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                        className
                    )}
                    placeholder={placeholder || " "} // Placeholder required for peer-placeholder-shown
                    ref={ref}
                    {...props}
                />
                <label
                    htmlFor={inputId}
                    className="absolute left-3 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-muted-foreground duration-150 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 cursor-text"
                >
                    {label}
                </label>
            </div>
        )
    }
)
MaterialInput.displayName = "MaterialInput"

export { MaterialInput }
