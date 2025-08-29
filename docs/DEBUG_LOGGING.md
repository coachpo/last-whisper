# Debug Logging Configuration

This project includes a debug logging system that can be controlled via environment variables.

## Configuration

### Environment Variables

Add the following to your `.env.local` file:

```bash
# Enable debug logging (default: enabled in development, disabled in production)
NEXT_PUBLIC_DEBUG_LOGGING=true
```

### Behavior

- **Development mode** (`NODE_ENV=development`): Debug logging is enabled by default
- **Production mode** (`NODE_ENV=production`): Debug logging is disabled unless `NEXT_PUBLIC_DEBUG_LOGGING=true` is
  explicitly set
- **Override**: Setting `NEXT_PUBLIC_DEBUG_LOGGING=false` will disable debug logging even in development

## Usage

The debug utility provides structured logging for different parts of the application:

```typescript
import { debug } from '@/lib/debug'

// General logging
debug.log('General message', data)
debug.error('Error message', error)
debug.warn('Warning message', warning)
debug.info('Info message', info)

// API-specific logging
debug.api.request(url, method)
debug.api.response(url, status)
debug.api.error(url, error)

// Component-specific logging
debug.component.dataLoaded('ComponentName', data)
debug.component.error('ComponentName', error)
debug.component.mount('ComponentName')
```

## What Gets Logged

When debug logging is enabled, you'll see:

- **API Requests**: All HTTP requests and responses
- **Component Data Loading**: When components successfully load data
- **Component Errors**: When components encounter errors
- **Audio Player Events**: Audio loading, playback, and error events
- **General Application Events**: Various debug information throughout the app

## Disabling Debug Logging

To disable debug logging:

1. **For development**: Set `NEXT_PUBLIC_DEBUG_LOGGING=false` in `.env.local`
2. **For production**: Ensure `NEXT_PUBLIC_DEBUG_LOGGING` is not set to `true`

## Benefits

- **Performance**: No console output in production
- **Clean Logs**: Structured, categorized logging
- **Flexibility**: Easy to enable/disable per environment
- **Debugging**: Rich information for development and troubleshooting
