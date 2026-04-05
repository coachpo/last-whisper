
import {useMutation, useQueryClient} from '@tanstack/react-query'
import {apiClient} from '@/lib/api'
import {debug} from '@/lib/debug'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {Badge} from '@/components/ui/badge'
import {Item} from '@/types/api'
import {getDifficultyColor, getDifficultyLabel, truncateText} from '@/lib/utils'
import {useToast} from '@/components/ui/use-toast'

interface DeleteItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item
  onSuccess: () => void
}

export function DeleteItemDialog({ open, onOpenChange, item, onSuccess }: DeleteItemDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      onSuccess()
      toast({
        title: "Item deleted",
        description: "The dictation item has been deleted successfully.",
      })
    },
    onError: (error: Error) => {
        debug.error('Failed to delete item:', error)
      toast({
        title: "Error deleting item",
        description: error.message || "Failed to delete item. Please try again.",
        variant: "destructive",
      })
    }
  })

  const handleDelete = () => {
    deleteItemMutation.mutate(item.id)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Dictation Item</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this dictation item? This action cannot be undone.
            The associated audio file will also be removed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="outline">#{item.id}</Badge>
            <Badge variant="outline">{item.locale}</Badge>
            <Badge className={getDifficultyColor(item.difficulty)}>
              {getDifficultyLabel(item.difficulty)}
            </Badge>
          </div>
          <p className="text-sm font-medium">
            {truncateText(item.text, 100)}
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteItemMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteItemMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteItemMutation.isPending ? 'Deleting...' : 'Delete Item'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
