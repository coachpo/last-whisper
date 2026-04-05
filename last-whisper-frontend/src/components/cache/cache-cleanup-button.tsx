
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
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
import { useToast } from '@/components/ui/use-toast'
import { audioCache } from '@/lib/audio-cache'
import { debug } from '@/lib/debug'

export function CacheCleanupButton() {
  const [isClearing, setIsClearing] = useState(false)
  const { toast } = useToast()

  const handleClearCache = async () => {
    setIsClearing(true)
    
    try {
      // Clear IndexedDB audio cache
      await audioCache.clearCache()
      
      // Clear browser Cache Storage entries
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        const audioCacheNames = cacheNames.filter(name => 
          name.includes('audio') || name.includes('audio-files')
        )
        
        await Promise.all(
          audioCacheNames.map(cacheName => caches.delete(cacheName))
        )
      }
      
      debug.log('Cache cleanup completed successfully')
      
      toast({
        title: "Cache cleared",
        description: "All audio caches have been cleared successfully.",
      })
    } catch (error) {
      debug.error('Failed to clear cache:', error)
      
      toast({
        title: "Cache clear failed",
        description: "Failed to clear some caches. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isClearing}
          title="Clear audio cache"
          aria-label="Clear audio cache"
          className="h-9 w-9"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear Audio Cache</AlertDialogTitle>
          <AlertDialogDescription>
            This will clear all cached audio files from your browser.
            Audio files will need to be downloaded again when you play them.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClearCache}
            disabled={isClearing}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isClearing ? "Clearing..." : "Clear Cache"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
