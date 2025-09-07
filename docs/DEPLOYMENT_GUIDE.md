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

1. **Clone the repository** and navigate to the project directory
2. **Initialize Git submodules** to ensure all components are available
3. **Start the full stack** using Docker Compose
4. **Access the application** at the following endpoints:
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

1. **Set up environment variables** by copying the template and configuring your settings
2. **Deploy using the deployment script** provided in the deploy directory

**Configuration Files:**
- Environment template: [deploy/env.template](../deploy/env.template)
- Deployment script: [deploy/deploy.sh](../deploy/deploy.sh)
- Production compose: [deploy/docker-compose.prod.yml](../deploy/docker-compose.prod.yml)

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

The pipeline is configured in the GitHub Actions workflow files and includes:

- **Build Matrix**: Multiple Node.js and Python versions
- **Cache Optimization**: Docker layer caching for faster builds
- **Security Scanning**: Vulnerability detection
- **Registry Push**: Automatic image publishing

**Workflow Files:**
- Main CI/CD pipeline: [.github/workflows/docker-build.yml](../.github/workflows/docker-build.yml)
- Docker build runner: [.github/workflows/docker-build-runner.yml](../.github/workflows/docker-build-runner.yml)

### Manual Trigger

You can manually trigger the pipeline by:

1. Going to the **Actions** tab in your GitHub repository
2. Selecting the **Docker Build** workflow
3. Clicking **Run workflow**

## ⚙️ Environment Configuration

### Environment Variables

Create a `.env` file based on the environment template. The template includes all necessary configuration options:

**Key Configuration Categories:**
- **GitHub Container Registry**: Repository settings and authentication
- **Application Configuration**: Environment mode, API URLs, and debug settings
- **TTS Configuration**: Provider selection and service-specific settings
- **Logging Configuration**: Log levels and output formatting

**Template File:** [deploy/env.template](../deploy/env.template)

### TTS Provider Setup

#### Google Cloud Text-to-Speech

1. **Create a Google Cloud Project**
2. **Enable the Text-to-Speech API**
3. **Create a service account** and download the JSON key
4. **Place the key** in `deploy/keys/google-credentials.json`

#### Azure Speech Services

1. **Create an Azure Speech resource** in your Azure portal
2. **Get your subscription key and region** from the resource
3. **Configure environment variables** for Azure TTS provider

**Required Environment Variables:**
- `TTS_PROVIDER=azure`
- `AZURE_SPEECH_KEY` - Your Azure Speech service key
- `AZURE_SPEECH_REGION` - Your Azure region

### Domain Configuration

For production deployments with custom domains:

1. **Update Caddyfile** with your domain configuration
2. **Set DNS records** to point to your server
3. **Configure SSL** (handled automatically by Caddy)

**Configuration File:** [deploy/Caddyfile](../deploy/Caddyfile)

## 🛠️ Manual Deployment

### Backend Setup

For manual backend deployment:

1. **Navigate to backend directory** and set up Python virtual environment
2. **Install dependencies** using pyproject.toml
3. **Run the development server** using the provided run script

### Frontend Setup

For manual frontend deployment:

1. **Navigate to frontend directory** and install Node.js dependencies
2. **Configure environment variables** for API connection
3. **Start the development server** with hot reload

### Production Build

#### Backend Production

For production backend deployment:

1. **Install production dependencies** using pyproject.toml
2. **Run with production ASGI server** (Uvicorn) on specified host and port

#### Frontend Production

For production frontend deployment:

1. **Install dependencies** and build the application
2. **Start the production server** with optimized build

## 🔧 Troubleshooting

### Common Issues

#### Docker Issues

**Problem**: Images not pulling from GitHub Container Registry
**Solution**: Authenticate with GitHub Container Registry using your GitHub token and username

**Problem**: Permission denied errors
**Solution**: Ensure the deployment script has execute permissions

#### Service Issues

**Problem**: Backend not starting
**Solution**: Check container logs and verify environment variable configuration

**Problem**: Frontend not loading
**Solution**: Check frontend container logs and verify API URL configuration

#### Database Issues

**Problem**: Database not persisting
**Solution**: Check Docker volume mounts and inspect volume configuration

### Health Checks

Check if services are running by:

1. **Checking container status** using Docker Compose
2. **Verifying service health** through health endpoints
3. **Accessing API documentation** to confirm backend connectivity

### Logs

View logs for debugging by:

1. **Checking all services** for general issues
2. **Examining specific service logs** (backend, frontend, caddy)
3. **Following logs in real-time** for live monitoring

### Performance Monitoring

Monitor resource usage by:

1. **Checking container resource usage** with Docker stats
2. **Monitoring disk usage** and system resources
3. **Inspecting volume usage** and storage consumption

## 📚 Additional Resources

- [Architecture Documentation](ARCHITECTURE.md) - System design and components
- [Dictation API Documentation](DICTATION_API.md) - Complete API reference
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
