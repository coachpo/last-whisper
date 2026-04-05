
import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DatePickerProps {
  id?: string
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  ariaLabel?: string
  ariaLabelledBy?: string
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
  ariaLabel,
  ariaLabelledBy,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState(value || new Date())

  const currentYear = currentMonth.getFullYear()
  const currentMonthIndex = currentMonth.getMonth()

  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1).getDay()
  
  // Generate calendar days
  const days = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null)
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonthIndex, day)
    onChange?.(newDate)
    setIsOpen(false)
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentYear, currentMonthIndex - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentYear, currentMonthIndex + 1, 1))
  }

  const handleClear = () => {
    onChange?.(undefined)
    setIsOpen(false)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return today.getDate() === day && 
           today.getMonth() === currentMonthIndex && 
           today.getFullYear() === currentYear
  }

  const isSelected = (day: number) => {
    if (!value) return false
    return value.getDate() === day && 
           value.getMonth() === currentMonthIndex && 
           value.getFullYear() === currentYear
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          aria-label={ariaLabel || placeholder}
          aria-labelledby={ariaLabelledBy}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousMonth}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-semibold">
              {monthNames[currentMonthIndex]} {currentYear}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div key={index} className="relative">
                {day ? (
                  <Button
                    variant={isSelected(day) ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      "h-8 w-8 p-0 font-normal hover:bg-accent hover:text-accent-foreground",
                      isToday(day) && !isSelected(day) && "bg-accent text-accent-foreground",
                      isSelected(day) && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {day}
                  </Button>
                ) : (
                  <div className="h-8 w-8" />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
