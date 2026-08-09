
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type FloatingComboboxProps = {
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  placeholder?: string;
  onCreate?: (value: string) => void;
  disabled?: boolean;
}

export function FloatingCombobox({
  options,
  value,
  onValueChange,
  label,
  placeholder,
  onCreate,
  disabled
}: FloatingComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const selectedOption = options.find((opt) => opt.value === value)
  const hasExactMatch = options.some(
    (opt) => opt.label.toLowerCase() === searchQuery.toLowerCase()
  )

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              open && "ring-2 ring-ring ring-offset-2"
            )}
            disabled={disabled}
          >
            <div className="flex flex-col items-start transition-all">
              <span className={cn(
                "ml-[-5px] -mt-[18px] px-[5px] py-[3px] text-xs text-muted-foreground transition-all bg-white",
                (value || open) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}>
                {label}
              </span>
              <span className={cn(
                "transition-all",
                (!value && !open) ? "text-muted-foreground" : "text-foreground"
              )}>
                {selectedOption ? selectedOption.label : (open ? "" : label)}
              </span>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput
              placeholder={placeholder || `Search ${label.toLowerCase()}...`}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onValueChange(option.value)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              {!hasExactMatch && searchQuery && onCreate && (
                <CommandGroup heading="New Trade">
                  <CommandItem
                    onSelect={() => {
                      onCreate(searchQuery)
                      setOpen(false)
                    }}
                    className="flex items-center gap-2 text-primary"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create "{searchQuery}"</span>
                  </CommandItem>
                </CommandGroup>
              )}
              {options.length === 0 && !searchQuery && (
                <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
              )}
              {options.length > 0 && !hasExactMatch && searchQuery && !onCreate && (
                <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
