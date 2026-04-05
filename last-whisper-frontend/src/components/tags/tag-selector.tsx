
import {useState} from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {apiClient} from '@/lib/api'
import {debug} from '@/lib/debug'
import {useToast} from '@/components/ui/use-toast'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Popover, PopoverContent, PopoverTrigger,} from '@/components/ui/popover'
import {ChevronDown, Plus, Tag as TagIcon, X} from 'lucide-react'
import {cn} from '@/lib/utils'

interface TagSelectorProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  placeholder?: string
  className?: string
  maxTags?: number
  maxTagLength?: number
  disabled?: boolean
}

export function TagSelector({ 
  selectedTags, 
  onTagsChange, 
  placeholder = "Select tags...",
  className,
                              maxTags = 20,
                              maxTagLength = 50,
                              disabled = false
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const { data: tagsData, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => apiClient.getTags(100, 0),
  })

  const createTagMutation = useMutation({
    mutationFn: (tagName: string) => apiClient.createTag({ name: tagName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
    onError: (error: Error) => {
        debug.error('Failed to create tag:', error)

      // Provide more specific error messages based on the error content
      let title = "Error creating tag"
      let description = error.message || "Failed to create tag. Please check your input and try again."

      if (error.message.includes("name") && error.message.includes("too_long")) {
        title = "Tag name too long"
        description = `Tag name must be ${maxTagLength} characters or less. Please shorten the name and try again.`
      } else if (error.message.includes("name") && error.message.includes("too_short")) {
        title = "Tag name too short"
        description = "Tag name must be at least 1 character long. Please enter a valid name."
      } else if (error.message.includes("already exists") || error.message.includes("duplicate")) {
        title = "Tag already exists"
        description = "A tag with this name already exists. Please choose a different name."
      } else if (error.message.includes("pattern") || error.message.includes("invalid")) {
        title = "Invalid tag name"
        description = "Tag name contains invalid characters. Please use only letters, numbers, and spaces."
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      })
    }
  })

  const availableTags = tagsData?.tags || []

  const filteredTags = availableTags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedTags.includes(tag.name)
  )

  const handleTagSelect = (tagName: string) => {
    if (selectedTags.length >= maxTags) return
    if (!selectedTags.includes(tagName)) {
      onTagsChange([...selectedTags, tagName])
    }
    setSearchQuery('')
  }

  const handleTagRemove = (tagName: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagName))
  }

  const handleAddNewTag = () => {
    const trimmedName = newTagName.trim()
    if (trimmedName && !selectedTags.includes(trimmedName)) {
      if (selectedTags.length < maxTags) {
        // Client-side validation
        if (trimmedName.length > maxTagLength) {
          toast({
            title: "Tag name too long",
            description: `Tag name must be ${maxTagLength} characters or less. Please shorten the name and try again.`,
            variant: "destructive",
          })
          return
        }

        if (trimmedName.length < 1) {
          toast({
            title: "Tag name required",
            description: "Please enter a tag name.",
            variant: "destructive",
          })
          return
        }
        
        // Check if tag already exists in available tags
        const existingTag = availableTags.find(tag => tag.name.toLowerCase() === trimmedName.toLowerCase())
        if (existingTag) {
          // Tag exists, just add it to selected tags
          onTagsChange([...selectedTags, existingTag.name])
        } else {
          // Tag doesn't exist, add it optimistically and create it in background
          onTagsChange([...selectedTags, trimmedName])
          createTagMutation.mutate(trimmedName)
        }
        setNewTagName('')
      }
    }
  }


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredTags.length > 0) {
        handleTagSelect(filteredTags[0].name)
      } else if (newTagName.trim()) {
        handleAddNewTag()
      }
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Tags</Label>
      
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="flex items-center space-x-1 pr-1"
            >
              <TagIcon className="h-3 w-3" />
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleTagRemove(tag)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Selector */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <Button
            variant="outline"
            aria-expanded={isOpen}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedTags.length === 0 ? placeholder : `${selectedTags.length} tags selected`}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="p-3 space-y-3">
            {/* Search Input */}
            <div className="space-y-2">
              <Input
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8"
              />
            </div>

            {/* Preset Tags */}
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading tags...</div>
            ) : filteredTags.length > 0 ? (
              <div
                role="listbox"
                aria-label="Available tags"
                className="space-y-1 max-h-48 overflow-y-auto"
              >
                {filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    role="option"
                    aria-selected="false"
                    onClick={() => handleTagSelect(tag.name)}
                    className="w-full flex items-center space-x-2 p-2 hover:bg-accent rounded-md text-left"
                  >
                    <TagIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm">{tag.name}</span>
                  </button>
                ))}
              </div>
            ) : searchQuery && (
              <div className="text-sm text-muted-foreground">
                No tags found matching &quot;{searchQuery}&quot;
              </div>
            )}

            {/* Add New Tag */}
            <div className="border-t pt-3 space-y-2">
              <div className="text-sm font-medium">Add New Tag</div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter new tag name..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddNewTag}
                  disabled={!newTagName.trim() || selectedTags.length >= maxTags}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Max Tags Warning */}
            {selectedTags.length >= maxTags && (
              <div className="text-xs text-muted-foreground">
                Maximum {maxTags} tags allowed
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
