
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
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { FloatingPopoverTrigger } from "./floating-popover-trigger"

type ComboboxWithCreateProps = {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    onCreate?: (value: string) => void;
    placeholder: string;
    searchPlaceholder: string;
    notFoundText: string;
    createLabel?: string;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export function ComboboxWithCreate({ 
    options, 
    value, 
    onChange, 
    onCreate, 
    placeholder, 
    searchPlaceholder, 
    notFoundText, 
    createLabel = "Add new", 
    label,
    disabled,
    className
}: ComboboxWithCreateProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const showCreateOption = onCreate && searchQuery && !options.some(opt => opt.label.toLowerCase() === searchQuery.toLowerCase())

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {label ? (
          <FloatingPopoverTrigger
            label={label}
            className={cn("w-full justify-between bg-white", className)}
            disabled={disabled}
            aria-expanded={open}
          >
            {value
              ? options.find((option) => String(option.value) === String(value))?.label
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </FloatingPopoverTrigger>
        ) : (
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between bg-white", className)}
            disabled={disabled}
          >
            {value
              ? options.find((option) => String(option.value) === String(value))?.label
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>{notFoundText}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value === value ? "" : option.value)
                    setOpen(false)
                    setSearchQuery("")
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
            
            {showCreateOption && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value={searchQuery}
                    onSelect={() => {
                      onCreate(searchQuery)
                      setOpen(false)
                      setSearchQuery("")
                    }}
                    className="text-blue-600 font-medium"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {createLabel} "{searchQuery}"
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
