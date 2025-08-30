# GitHub CI/CD Setup for Last Whisper

This document describes the GitHub Actions CI/CD pipeline for building and deploying Docker images to GitHub Container Registry.

## Overview

The CI/CD pipeline automatically:
- Builds Docker images for both backend and frontend services
- Pushes images to GitHub Container Registry (ghcr.io)
- Performs security scans on the built images
- Supports multi-platform builds (linux/amd64, linux/arm64)

**Note**: This project uses a monorepo structure with the main repository at [coachpo/last-whisper](https://github.com/coachpo/last-whisper) and the backend and frontend as git submodules pointing to separate repositories:
- Backend: [coachpo/last-whisper-backend](https://github.com/coachpo/last-whisper-backend)
- Frontend: [coachpo/last-whisper-frontend](https://github.com/coachpo/last-whisper-frontend)

## Workflow Files

### `.github/workflows/docker-build.yml`

This workflow is triggered on:
- Push to `main` or `develop` branches
- Pull requests to `main` branch
- Manual workflow dispatch

The workflow includes:
- **Build and Push Job**: Builds and pushes Docker images for both services
- **Security Scan Job**: Runs Trivy vulnerability scanner on the latest images

## Setup Instructions

### 1. Repository Configuration

1. Ensure your repository is properly configured on GitHub
2. The workflow uses the repository name automatically via `${{ github.repository }}`

### 2. Container Registry Access

The workflow uses `GITHUB_TOKEN` which is automatically provided by GitHub Actions. For private repositories, ensure the token has the necessary permissions:

- `contents: read` - to checkout code
- `packages: write` - to push images to the registry

### 3. Environment Variables

Create a `.env` file in your project root (copy from `env.template`):

```bash
cp env.template .env
```

Edit the `.env` file with your configuration:

```env
GITHUB_REPOSITORY=coachpo/last-whisper
GITHUB_USERNAME=coachpo
GITHUB_TOKEN=your-github-token
NEXT_PUBLIC_API_URL=https://your-domain.com/apis
```

## Deployment

### Using Docker Compose (Production)

1. **Set up environment variables**:
   ```bash
   cp env.template .env
   # Edit .env with your configuration
   ```

2. **Deploy using the deployment script**:
   ```bash
   ./deploy.sh
   ```

3. **Or deploy manually**:
   ```bash
   # Login to GitHub Container Registry (for private repos)
   echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
   
   # Pull and start services
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Using Docker Compose (Development)

For local development, continue using the original `docker-compose.yml`:

```bash
docker-compose up --build
```

## Image Tags

The workflow creates multiple tags for each image:

- `latest` - for the main branch
- `main` - for the main branch
- `develop` - for the develop branch
- `main-<commit-sha>` - specific commit on main branch
- `pr-<number>` - for pull requests

## Security Scanning

The workflow includes automated security scanning using Trivy:

- Scans are performed on the `latest` images when pushing to main
- Results are uploaded to GitHub Security tab
- Vulnerabilities are reported as SARIF format

## Monitoring and Troubleshooting

### View Workflow Runs

1. Go to your repository on GitHub
2. Click on "Actions" tab
3. Select the "Build and Push Docker Images" workflow

### Check Container Registry

1. Go to your repository on GitHub
2. Click on "Packages" (right sidebar)
3. View your published images

### Common Issues

1. **Permission Denied**: Ensure `GITHUB_TOKEN` has `packages: write` permission
2. **Build Failures**: Check the workflow logs for specific error messages
3. **Image Not Found**: Verify the `GITHUB_REPOSITORY` environment variable is correct

### Logs and Debugging

```bash
# View container logs
docker-compose -f docker-compose.prod.yml logs

# View specific service logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Check running containers
docker-compose -f docker-compose.prod.yml ps
```

## File Structure

```
.
├── .github/
│   └── workflows/
│       └── docker-build.yml          # CI/CD workflow
├── docker-compose.yml                # Development compose file
├── docker-compose.prod.yml           # Production compose file
├── deploy.sh                         # Deployment script
├── env.template                      # Environment variables template
└── docs/
    └── GITHUB_CI_CD.md              # This documentation
```

## Best Practices

1. **Environment Variables**: Never commit sensitive data to the repository
2. **Image Tags**: Use specific tags for production deployments
3. **Security**: Regularly review security scan results
4. **Monitoring**: Monitor workflow runs and container health
5. **Backup**: Ensure your data volumes are properly backed up

## Advanced Configuration

### Custom Build Arguments

To add custom build arguments, modify the workflow file:

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: ./last-whisper-${{ matrix.service }}
    file: ./last-whisper-${{ matrix.service }}/Dockerfile
    build-args: |
      CUSTOM_ARG=value
    push: true
    tags: ${{ steps.meta.outputs.tags }}
```

### Multi-Environment Deployment

For multiple environments, create separate compose files:

- `docker-compose.staging.yml`
- `docker-compose.prod.yml`

And use different image tags for each environment.
