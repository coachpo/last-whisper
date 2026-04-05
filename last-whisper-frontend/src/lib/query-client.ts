import {QueryClient} from '@tanstack/react-query'

const ONE_MINUTE = 60 * 1000

export function createAppQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: ONE_MINUTE,
        gcTime: ONE_MINUTE * 10,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          if (error instanceof Error && /4\d{2}/.test(error.message)) {
            return false
          }
          return failureCount < 2
        },
      },
    },
  })

  queryClient.setQueryDefaults(['items'], {
    staleTime: ONE_MINUTE / 2,
    gcTime: ONE_MINUTE * 5,
    refetchOnWindowFocus: false,
  })

  queryClient.setQueryDefaults(['stats-summary'], {
    staleTime: ONE_MINUTE * 5,
    gcTime: ONE_MINUTE * 15,
  })

  queryClient.setQueryDefaults(['stats-progress'], {
    staleTime: ONE_MINUTE * 2,
  })

  queryClient.setQueryDefaults(['practice-log'], {
    staleTime: ONE_MINUTE,
    refetchOnWindowFocus: false,
  })

  queryClient.setQueryDefaults(['attempts'], {
    staleTime: ONE_MINUTE,
    gcTime: ONE_MINUTE * 5,
  })

  return queryClient
}
