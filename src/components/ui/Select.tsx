import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  label?: string
  id?: string
  className?: string
}

// Radix Select forbids value="", so we map empty string to this sentinel internally.
const EMPTY_SENTINEL = '__none__'

function toInternal(v: string) { return v === '' ? EMPTY_SENTINEL : v }
function toExternal(v: string) { return v === EMPTY_SENTINEL ? '' : v }

export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  label,
  id,
  className,
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-surface-700 dark:text-surface-300">
          {label}
        </label>
      )}
      <SelectPrimitive.Root
        value={toInternal(value)}
        onValueChange={(v) => onValueChange(toExternal(v))}
      >
        <SelectPrimitive.Trigger
          id={id}
          className={cn(
            'flex h-[42px] w-full items-center justify-between gap-2 rounded-lg border border-surface-200 bg-white px-3.5 text-sm text-surface-900 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
            'data-[placeholder]:text-surface-400 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-50',
            className,
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown size={16} className="text-surface-400" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            className="z-[60] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-surface-200 bg-white shadow-modal dark:border-surface-700 dark:bg-surface-900"
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((o) => (
                <SelectPrimitive.Item
                  key={o.value}
                  value={toInternal(o.value)}
                  className={cn(
                    'relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm text-surface-700 outline-none',
                    'data-[highlighted]:bg-surface-100 data-[state=checked]:font-medium data-[state=checked]:text-emerald-600',
                    'dark:text-surface-300 dark:data-[highlighted]:bg-surface-800 dark:data-[state=checked]:text-emerald-400',
                  )}
                >
                  <SelectPrimitive.ItemIndicator className="absolute left-2 inline-flex items-center">
                    <Check size={15} />
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  )
}
