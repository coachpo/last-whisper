
import {QueryClientProvider} from '@tanstack/react-query'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'
import {Suspense, useMemo, useState} from 'react'
import {ThemeProvider} from '@/components/theme/theme-provider'
import {Toaster} from '@/components/ui/toaster'

import {SidebarProvider} from '@/contexts/sidebar-context'
import {LoadingProvider} from '@/contexts/loading-context'
import {MetadataProvider} from '@/contexts/metadata-context'
import {createAppQueryClient} from '@/lib/query-client'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createAppQueryClient)
  const enableDevtools = useMemo(() => {
    if (import.meta.env.VITE_ENABLE_RQ_DEVTOOLS === 'false') {
      return false
    }
    return import.meta.env.DEV
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <Suspense fallback={null}>
                <LoadingProvider>
                    <MetadataProvider>
                        <SidebarProvider>
                            {children}
                            <Toaster/>
                            {enableDevtools && <ReactQueryDevtools initialIsOpen={false}/>}
                        </SidebarProvider>
                    </MetadataProvider>
                </LoadingProvider>
            </Suspense>
        </ThemeProvider>
    </QueryClientProvider>
  )
}
