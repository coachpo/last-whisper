# 🚀 Last Whisper Deployment Guide

This guide covers all deployment options for Last Whisper, from development to production environments.

## 📋 Table of Contents

- [Quick Start with Docker Compose](#-quick-start-with-docker-compose)
- [Production Deployment](#-production-deployment)
- [GitHub CI/CD Pipeline](#-github-cicd-pipeline)
- [Environment Configuration](#-environment-configuration)
- [Manual Deployment](#-manual-deployment)
- [Troubleshooting](#-troubleshooting)

## 🐳 Quick Start with Docker Compose

The easiest way to get started is using Docker Compose, which handles all dependencies and configuration automatically.

### Prerequisites

- **Docker & Docker Compose** (recommended for easy setup)
- **Git** (for cloning and submodule management)

### Setup Steps

1. **Clone the repository:**
```bash
git clone https://github.com/coachpo/last-whisper.git
cd last-whisper
```

2. **Initialize Git submodules:**
```bash
git submodule update --init --recursive
```

3. **Start the full stack:**
```bash
docker-compose up
```

4. **Access the application:**
- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:8000
- 📚 **API Documentation**: http://localhost:8000/docs

The application will be ready in a few minutes with all services running and connected.

## 🏭 Production Deployment

### GitHub Container Registry Deployment

The project includes automated CI/CD using GitHub Actions that builds and pushes Docker images to GitHub Container Registry.

#### Automated CI/CD Pipeline

- **Main Pipeline**: Builds and pushes images on every push to `main` branch
- **Test Pipeline**: Validates builds on pull requests
- **Multi-platform**: Supports both `linux/amd64` and `linux/arm64` architectures
- **Security Scanning**: Includes Trivy security scanning for built images

#### Manual Production Deployment

For production deployments using pre-built images from GitHub Container Registry:

1. **Set up environment variables:**
```bash
cp env.template .env
# Edit .env with your configuration
```

2. **Deploy using the deployment script:**
```bash
./deploy.sh
```

### Production Configuration

The production deployment uses the following components:

- **Caddy**: Reverse proxy with automatic HTTPS
- **Backend**: FastAPI service with TTS capabilities
- **Frontend**: Next.js application with PWA support
- **Persistent Storage**: Named volumes for data, audio, and cache

#### Key Features

- **Automatic HTTPS**: Caddy handles SSL certificates
- **Health Checks**: Built-in health monitoring
- **Logging**: Structured logging with JSON format
- **Security Headers**: XSS protection, clickjacking prevention
- **Compression**: Gzip compression for better performance

## 🔄 GitHub CI/CD Pipeline

### Pipeline Overview

The CI/CD pipeline automatically:

1. **Builds Docker images** for both frontend and backend
2. **Runs security scans** using Trivy
3. **Pushes to GitHub Container Registry** with proper tags
4. **Supports multi-platform builds** (AMD64 and ARM64)

### Pipeline Configuration

The pipeline is configured in `.github/workflows/docker-build.yml` and includes:

- **Build Matrix**: Multiple Node.js and Python versions
- **Cache Optimization**: Docker layer caching for faster builds
- **Security Scanning**: Vulnerability detection
- **Registry Push**: Automatic image publishing

### Manual Trigger

You can manually trigger the pipeline by:

1. Going to the **Actions** tab in your GitHub repository
2. Selecting the **Docker Build** workflow
3. Clicking **Run workflow**

## ⚙️ Environment Configuration

### Environment Variables

Create a `.env` file based on `env.template`:

```bash
# GitHub Container Registry Configuration
GITHUB_REPOSITORY=coachpo/last-whisper
GITHUB_USERNAME=your-username
GITHUB_TOKEN=your-github-token

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-domain.com/apis
NEXT_PUBLIC_DEBUG_LOGGING=false

# TTS Configuration
TTS_PROVIDER=google

# Logging Configuration
LOG_LEVEL=info
```

### TTS Provider Setup

#### Google Cloud Text-to-Speech

1. **Create a Google Cloud Project**
2. **Enable the Text-to-Speech API**
3. **Create a service account** and download the JSON key
4. **Place the key** in `deploy/keys/google-credentials.json`

#### Azure Speech Services

1. **Create an Azure Speech resource**
2. **Get your subscription key and region**
3. **Set environment variables**:
   ```bash
   TTS_PROVIDER=azure
   AZURE_SPEECH_KEY=your-key
   AZURE_SPEECH_REGION=your-region
   ```

### Domain Configuration

For production deployments with custom domains:

1. **Update Caddyfile** with your domain
2. **Set DNS records** to point to your server
3. **Configure SSL** (handled automatically by Caddy)

## 🛠️ Manual Deployment

### Backend Setup

```bash
cd last-whisper-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python run_api.py
```

### Frontend Setup

```bash
cd last-whisper-frontend
pnpm install
pnpm run dev
```

### Production Build

#### Backend Production

```bash
cd last-whisper-backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Frontend Production

```bash
cd last-whisper-frontend
pnpm install
pnpm run build
pnpm run start
```

## 🔧 Troubleshooting

### Common Issues

#### Docker Issues

**Problem**: Images not pulling from GitHub Container Registry
**Solution**: 
```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
```

**Problem**: Permission denied errors
**Solution**:
```bash
# Check file permissions
chmod +x deploy.sh
```

#### Service Issues

**Problem**: Backend not starting
**Solution**:
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs backend

# Check environment variables
docker compose -f docker-compose.prod.yml config
```

**Problem**: Frontend not loading
**Solution**:
```bash
# Check frontend logs
docker compose -f docker-compose.prod.yml logs frontend

# Verify API URL configuration
echo $NEXT_PUBLIC_API_URL
```

#### Database Issues

**Problem**: Database not persisting
**Solution**:
```bash
# Check volume mounts
docker volume ls | grep last-whisper

# Inspect volume
docker volume inspect last-whisper_database_data
```

### Health Checks

Check if services are running:

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Check service health
curl http://localhost:8008/health

# Check API documentation
curl http://localhost:8008/apis/docs
```

### Logs

View logs for debugging:

```bash
# All services
docker compose -f docker-compose.prod.yml logs

# Specific service
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs caddy

# Follow logs in real-time
docker compose -f docker-compose.prod.yml logs -f
```

### Performance Monitoring

Monitor resource usage:

```bash
# Container resource usage
docker stats

# Disk usage
docker system df

# Volume usage
docker volume ls
```

## 📚 Additional Resources

- [GitHub CI/CD Documentation](../docs/GITHUB_CI_CD.md) - Detailed CI/CD setup
- [Docker Setup Guide](../docs/DOCKER_SETUP.md) - Docker configuration details
- [Environment Testing](../docs/ENV_TESTING.md) - Environment validation
- [API Documentation](http://localhost:8000/docs) - Interactive API docs

## 🆘 Support

If you encounter issues:

1. **Check the logs** using the commands above
2. **Verify environment variables** are set correctly
3. **Ensure all prerequisites** are installed
4. **Check GitHub Actions** for build issues
5. **Open an issue** with detailed error information

---

**Ready to deploy?** 🚀 Start with the [Quick Start](#-quick-start-with-docker-compose) section!
