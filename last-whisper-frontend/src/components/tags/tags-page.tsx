
import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Tag as TagIcon, 
  Trash2, 
  Copy, 
  Calendar, 
  ArrowUpDown
} from 'lucide-react'
import { CreateTagRequest } from '@/types/api'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'

type SortOption = 'name-asc' | 'name-desc' | 'newest' | 'oldest'

export function TagsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: tagsData, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => apiClient.getTags(100, 0),
  })

  const createTagMutation = useMutation({
    mutationFn: (data: CreateTagRequest) => apiClient.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setIsCreateDialogOpen(false)
      setCreateError(null)
      toast({
        title: "Tag created",
        description: "The tag has been created successfully.",
      })
    },
    onError: (error: Error) => {
      let title = "Error creating tag"
      let description = error.message || "Failed to create tag. The tag may already exist."

      if (error.message.includes("name") && error.message.includes("too_long")) {
        title = "Tag name too long"
        description = "Tag name must be 50 characters or less."
      } else if (error.message.includes("name") && error.message.includes("too_short")) {
        title = "Tag name too short"
        description = "Tag name must be at least 1 character long."
      } else if (error.message.includes("already exists") || error.message.includes("duplicate")) {
        title = "Tag already exists"
        description = "A tag with this name already exists."
      } else if (error.message.includes("pattern") || error.message.includes("invalid")) {
        title = "Invalid tag name"
        description = "Tag name contains invalid characters."
      }
      
      setCreateError(description)
      toast({
        title,
        description,
        variant: "destructive",
      })
    },
  })

  const deleteTagMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast({
        title: "Tag deleted",
        description: "The tag has been deleted successfully.",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tag",
        variant: "destructive",
      })
    },
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Tag name copied to clipboard",
      duration: 2000,
    })
  }

  const filteredAndSortedTags = React.useMemo(() => {
    if (!tagsData?.tags) return []
    
    const result = tagsData.tags.filter(tag =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    switch (sortBy) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
    }

    return result
  }, [tagsData, searchQuery, sortBy])

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground">
            Manage and organize your dictation tags
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full sm:w-auto shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Tag
            </Button>
          </DialogTrigger>
          <CreateTagDialog 
            onSubmit={(data) => createTagMutation.mutate(data)}
            isLoading={createTagMutation.isPending}
            isSuccess={createTagMutation.isSuccess}
            errorMessage={createError}
          />
        </Dialog>
      </div>

      {/* Stats Row */}
      {tagsData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
              <TagIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tagsData.total}</div>
              <p className="text-xs text-muted-foreground">
                Available for organization
              </p>
            </CardContent>
          </Card>
          {/* We could add more stats here if available from API */}
        </div>
      )}

      {/* Controls & Content */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-32 rounded-lg border bg-card animate-pulse" />
                ))}
              </div>
            ) : filteredAndSortedTags.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-card/50 border-dashed">
                <div className="bg-background p-4 rounded-full mb-4 ring-1 ring-border">
                  <TagIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No tags found</h3>
                <p className="text-muted-foreground max-w-sm mt-2">
                  {searchQuery 
                    ? "Try adjusting your search query to find what you're looking for." 
                    : "Get started by creating your first tag to organize your items."}
                </p>
                {!searchQuery && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tag
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredAndSortedTags.map((tag) => (
                  <Card key={tag.id} className="group hover:shadow-md transition-all duration-200 flex flex-col">
                    <CardHeader className="pb-3 space-y-0">
                      <div className="flex items-start justify-between">
                        <div className="bg-primary/10 text-primary p-2 rounded-md">
                          <TagIcon className="h-4 w-4" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyToClipboard(tag.name)}
                            title="Copy name"
                          >
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Delete tag"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;{tag.name}&quot;? 
                                  This action cannot be undone. Items using this tag will not be deleted.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteTagMutation.mutate(tag.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between pt-0">
                      <div>
                        <h3 className="font-semibold text-lg truncate" title={tag.name}>
                          {tag.name}
                        </h3>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-4">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Created {format(new Date(tag.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Create Tag Dialog Component
function CreateTagDialog({ 
  onSubmit, 
  isLoading,
  isSuccess,
  errorMessage,
}: { 
  onSubmit: (data: CreateTagRequest) => void
  isLoading: boolean
  isSuccess: boolean
  errorMessage: string | null
}) {
  const [formData, setFormData] = useState<CreateTagRequest>({
    name: ''
  })

  // Reset form when mutation succeeds
  React.useEffect(() => {
    if (isSuccess) {
      setFormData({ name: '' })
    }
  }, [isSuccess])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim()) {
        if (formData.name.length > 50 || formData.name.length < 1) {
            return
        }
      onSubmit({
        name: formData.name.trim()
      })
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create New Tag</DialogTitle>
        <DialogDescription>
          Add a new tag to organize your dictation items.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ name: e.target.value })}
            placeholder="e.g., difficult, verbs, jlpt-n5..."
            required
            maxLength={50}
            autoFocus
          />
          <div className="flex justify-between text-xs">
             <span className={formData.name.length > 50 ? 'text-destructive' : 'text-muted-foreground'}>
              {formData.name.length}/50 characters
            </span>
          </div>
          {errorMessage && (
            <p role="alert" className="text-sm text-destructive flex items-center animate-in fade-in slide-in-from-top-1">
              <span className="mr-2">⚠️</span>
              {errorMessage}
            </p>
          )}
        </div>
        <DialogFooter>
            <Button
                type="submit"
                disabled={
                    isLoading ||
                    !formData.name.trim() ||
                    formData.name.length > 50
                }
            >
            {isLoading ? "Creating..." : "Create Tag"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
