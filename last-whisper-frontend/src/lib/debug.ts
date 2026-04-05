/**
 * Debug logging utility that can be controlled via environment variables
 */

const isDebugEnabled = import.meta.env.VITE_DEBUG_LOGGING === 'true' ||
    import.meta.env.DEV

export const debug = {
    log: (...args: unknown[]) => {
        if (isDebugEnabled) {
            console.log(...args)
        }
    },

    error: (...args: unknown[]) => {
        if (isDebugEnabled) {
            console.error(...args)
        }
    },

    warn: (...args: unknown[]) => {
        if (isDebugEnabled) {
            console.warn(...args)
        }
    },

    info: (...args: unknown[]) => {
        if (isDebugEnabled) {
            console.info(...args)
        }
    },

    // API-specific debug logging
    api: {
        request: (url: string, method?: string) => {
            if (isDebugEnabled) {
                console.log(`[API] Making request to: ${url}`, {method: method || 'GET'})
            }
        },

        response: (url: string, status: number) => {
            if (isDebugEnabled) {
                console.log(`[API] Response status: ${status} for ${url}`)
            }
        },

        error: (url: string, error: unknown) => {
            if (isDebugEnabled) {
                console.error(`[API] Error for ${url}:`, error)
            }
        }
    },

    // Component-specific debug logging
    component: {
        dataLoaded: (component: string, data: unknown) => {
            if (isDebugEnabled) {
                console.log(`[${component}] Data loaded:`, data)
            }
        },

        error: (component: string, error: unknown) => {
            if (isDebugEnabled) {
                console.error(`[${component}] Error:`, error)
            }
        },

        mount: (component: string) => {
            if (isDebugEnabled) {
                console.log(`[${component}] Component mounted`)
            }
        }
    }
}
