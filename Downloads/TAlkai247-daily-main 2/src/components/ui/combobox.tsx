import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  options: {
    value: string
    label: string
    group?: string
    description?: string
  }[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  emptyText?: string
  className?: string
  groupBy?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  emptyText = "No results found.",
  className,
  groupBy = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const groups = React.useMemo(() => {
    if (!groupBy) return { ungrouped: options }
    return options.reduce((acc, option) => {
      const group = option.group || 'Other'
      if (!acc[group]) acc[group] = []
      acc[group].push(option)
      return acc
    }, {} as Record<string, typeof options>)
  }, [options, groupBy])

  const selectedOption = options.find(option => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-gray-700 text-white border-gray-600 hover:bg-gray-600",
            className
          )}
        >
          {value ? selectedOption?.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-gray-800 border-gray-700">
        <Command className="bg-gray-800">
          <CommandInput 
            placeholder="Search..." 
            className="bg-gray-800 text-white border-gray-700"
          />
          <CommandEmpty className="py-2 px-4 text-gray-400">{emptyText}</CommandEmpty>
          {groupBy ? (
            Object.entries(groups).map(([groupName, groupOptions]) => (
              <CommandGroup key={groupName} heading={groupName} className="text-gray-400">
                {groupOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onValueChange(option.value)
                      setOpen(false)
                    }}
                    className="text-white hover:bg-gray-700"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div>
                      <div>{option.label}</div>
                      {option.description && (
                        <div className="text-sm text-gray-400">{option.description}</div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))
          ) : (
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                  className="text-white hover:bg-gray-700"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div>
                    <div>{option.label}</div>
                    {option.description && (
                      <div className="text-sm text-gray-400">{option.description}</div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}