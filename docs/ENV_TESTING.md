# Environment Variable Testing

This document explains how to test that environment variables can be read at runtime in the frontend application.

## Changes Made

1. **Removed standalone configuration**: The `output: 'standalone'` configuration has been removed from `next.config.js`
2. **Updated Dockerfile**: Modified to use regular Next.js build and `next start` command instead of standalone server
3. **Added environment variable display**: Created a debug component that shows environment variables at runtime

## Testing Environment Variables

### Method 1: Using the Debug Component

1. Set `NEXT_PUBLIC_DEBUG_LOGGING=true` in your environment
2. Run the application
3. Visit the homepage - you should see an "Environment Variables (Runtime)" card
4. The card will display all environment variables that are being read at runtime

### Method 2: Using Docker

1. Build the Docker image:
   ```bash
   docker build -t last-whisper-frontend .
   ```

2. Run the container with environment variables:
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_API_URL=http://your-backend-url:8008 \
     -e NEXT_PUBLIC_DEBUG_LOGGING=true \
     last-whisper-frontend
   ```

3. Visit `http://localhost:3000` and check the environment variables display

### Method 3: Using Docker Compose

1. Update your `docker-compose.yml` to include environment variables:
   ```yaml
   services:
     frontend:
       build: ./last-whisper-frontend
       ports:
         - "3000:3000"
       environment:
         - NEXT_PUBLIC_API_URL=http://backend:8008
         - NEXT_PUBLIC_DEBUG_LOGGING=true
   ```

2. Run with docker-compose:
   ```bash
   docker-compose up
   ```

## Environment Variables Used

The application currently uses these environment variables:

- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000)
- `NEXT_PUBLIC_DEBUG_LOGGING`: Enable debug logging (default: false)
- `NODE_ENV`: Node environment (set automatically)
- `PORT`: Server port (default: 3000)
- `HOSTNAME`: Server hostname (default: 0.0.0.0)

## Key Benefits

- **Runtime configuration**: Environment variables are now read at runtime, not build time
- **Dynamic updates**: You can change environment variables without rebuilding the Docker image
- **Flexible deployment**: Different environments can use different configurations without separate builds
- **Debug visibility**: The debug component shows exactly which environment variables are being used

## Notes

- Only `NEXT_PUBLIC_*` environment variables are available in the browser
- The debug component only shows when `NEXT_PUBLIC_DEBUG_LOGGING=true` or in development mode
- The application will fall back to default values if environment variables are not set
