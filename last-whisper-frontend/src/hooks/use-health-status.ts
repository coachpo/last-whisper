import {useQuery} from '@tanstack/react-query'
import {apiClient} from '@/lib/api'
import {HealthCheck} from '@/types/api'

export function useHealthStatus() {
    return useQuery<HealthCheck>({
        queryKey: ['health'],
        queryFn: () => apiClient.getHealth(),
        refetchInterval: 30000, // Refetch every 30 seconds
        refetchIntervalInBackground: true,
        staleTime: 10000, // Consider data stale after 10 seconds
        retry: 3,
        retryDelay: 1000,
    })
}
