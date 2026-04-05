
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Filter, RotateCcw } from 'lucide-react'

export interface FilterOptions {
  since?: string
  until?: string
  page?: number
  per_page?: number
  item_id?: number
}

interface FilterPanelProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  onReset: () => void
  isLoading?: boolean
}

export function FilterPanel({ filters, onFiltersChange, onReset, isLoading }: FilterPanelProps) {
  const sinceInputId = 'attempts-since-date'
  const untilInputId = 'attempts-until-date'

  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters)
  const [sinceDate, setSinceDate] = useState<Date | undefined>(
    filters.since ? new Date(filters.since) : undefined
  )
  const [untilDate, setUntilDate] = useState<Date | undefined>(
    filters.until ? new Date(filters.until) : undefined
  )

  const handleInputChange = (key: keyof FilterOptions, value: string | number | undefined) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
  }

  const handleDateChange = (key: 'since' | 'until', date: Date | undefined) => {
    if (key === 'since') {
      setSinceDate(date)
    } else {
      setUntilDate(date)
    }
  }

  const handleApplyFilters = () => {
    // Only include filters that have meaningful values
    const processedFilters: FilterOptions = {
      page: 1, // Reset to first page when applying new filters
      per_page: localFilters.per_page || 20
    }
    
    // Only include since date if it's set and valid
    if (sinceDate) {
      processedFilters.since = sinceDate.toISOString()
    }
    
    // Only include until date if it's set and valid
    if (untilDate) {
      processedFilters.until = untilDate.toISOString()
    }

    if (localFilters.item_id) {
      processedFilters.item_id = localFilters.item_id
    }

    onFiltersChange(processedFilters)
  }

  const handleReset = () => {
    const defaultFilters: FilterOptions = {
      page: 1,
      per_page: 20,
    }
    setLocalFilters(defaultFilters)
    setSinceDate(undefined)
    setUntilDate(undefined)
    onReset()
  }



  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Since Date Filter */}
          <div className="space-y-2">
            <Label htmlFor={sinceInputId}>Since Date</Label>
            <DatePicker
              id={sinceInputId}
              value={sinceDate}
              onChange={(date) => handleDateChange('since', date)}
              placeholder="Select start date"
              disabled={isLoading}
            />
          </div>

          {/* Until Date Filter */}
          <div className="space-y-2">
            <Label htmlFor={untilInputId}>Until Date</Label>
            <DatePicker
              id={untilInputId}
              value={untilDate}
              onChange={(date) => handleDateChange('until', date)}
              placeholder="Select end date"
              disabled={isLoading}
            />
          </div>

          {/* Item ID Filter */}
          <div className="space-y-2">
            <Label htmlFor="item-id">Item ID</Label>
            <Input
              id="item-id"
              type="number"
              min={1}
              placeholder="e.g. 42"
              value={localFilters.item_id?.toString() || ''}
              onChange={(event) => {
                const value = event.target.value
                handleInputChange('item_id', value ? Number(value) : undefined)
              }}
              disabled={isLoading}
            />
          </div>

          {/* Per Page Filter */}
          <div className="space-y-2">
            <Label htmlFor="per-page">Items Per Page</Label>
            <Input
              id="per-page"
              type="number"
              min={1}
              max={100}
              placeholder="20"
              value={localFilters.per_page?.toString() || ''}
              onChange={(event) => {
                const value = event.target.value
                handleInputChange('per_page', value ? Number(value) : undefined)
              }}
              disabled={isLoading}
            />
          </div>

      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button 
          onClick={handleApplyFilters}
          disabled={isLoading}
          className="flex-1"
        >
          <Filter className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>
        <Button 
          variant="outline" 
          onClick={handleReset}
          disabled={isLoading}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  )
}
