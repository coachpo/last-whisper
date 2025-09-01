# Last Whisper 🎯
[![CI/CD Pipeline](https://github.com/coachpo/last-whisper/actions/workflows/docker-build.yml/badge.svg?branch=main)](https://github.com/coachpo/last-whisper/actions/workflows/docker-build.yml)

A comprehensive dictation training platform with advanced Text-to-Speech (TTS) capabilities, built with FastAPI backend and Next.js frontend. Perfect for language learning, pronunciation practice, and dictation exercises.

## ✨ Key Features

### 🎙️ Advanced TTS Integration
- **Multiple TTS Providers**: Support for Azure Speech, Google Cloud Text-to-Speech, and Local TTS engines
- **High-Quality Audio**: Neural voice synthesis with customizable voice parameters
- **Batch Processing**: Efficient queue-based TTS conversion for multiple texts
- **Audio Caching**: Smart caching system for improved performance

### 📚 Dictation Training System
- **Interactive Practice**: Real-time dictation exercises with immediate feedback
- **Automatic Scoring**: Word Error Rate (WER) calculation for accurate assessment
- **Progress Tracking**: Comprehensive analytics and performance monitoring
- **Difficulty Levels**: Customizable difficulty settings for progressive learning

### 🏷️ Organization & Management
- **Tag System**: Flexible categorization with preset and custom tags
- **Search & Filter**: Advanced filtering by locale, difficulty, tags, and practice status
- **Statistics Dashboard**: Detailed insights into learning progress and performance
- **Session Management**: Track practice attempts and improvement over time

### 🚀 Modern Web Experience
- **PWA Support**: Installable web app with offline functionality
- **Responsive Design**: Seamless experience across desktop and mobile devices
- **Real-time Updates**: Live progress tracking and instant feedback
- **Clean UI**: Modern, intuitive interface built with shadcn/ui components

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended for easy setup)
- **Node.js 18+** and **Python 3.11+** (for local development)
- **Git** (for cloning and submodule management)

### 🐳 Using Docker Compose (Recommended)

The easiest way to get started is using Docker Compose, which handles all dependencies and configuration automatically.

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
docker compose up
```

4. **Access the application:**
- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:8000
- 📚 **API Documentation**: http://localhost:8000/docs

The application will be ready in a few minutes with all services running and connected.

### Production Deployment

For production deployment instructions, environment setup, and CI/CD configuration, see the comprehensive [Deployment Guide](docs/DEPLOYMENT_GUIDE.md).

### Local Development

#### Backend Setup
```bash
cd last-whisper-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python run_api.py
```

#### Frontend Setup
```bash
cd last-whisper-frontend
pnpm install
pnpm run dev
```

## Project Structure

```
last-whisper/
├── docs/                   # Project documentation
├── last-whisper-backend/   # FastAPI backend service (git submodule)
│   ├── app/               # Backend application code
│   ├── audio/             # Generated audio files
│   ├── keys/              # API keys and credentials
│   ├── Dockerfile         # Backend container configuration
│   ├── requirements.txt   # Python dependencies
│   ├── run_api.py         # Server startup script
│   ├── dictation.db       # SQLite database
│   └── README.md          # Backend quick start guide
├── last-whisper-frontend/  # Next.js frontend application (git submodule)
│   ├── src/               # Frontend source code
│   ├── public/            # Static assets
│   ├── scripts/           # Build and utility scripts
│   ├── Dockerfile         # Frontend container configuration
│   ├── package.json       # Node.js dependencies
│   ├── install.sh         # Quick setup script
│   └── README.md          # Frontend quick start guide
├── docker-compose.yml     # Development deployment
├── deploy/                # Production deployment files
│   ├── docker-compose.prod.yml # Production deployment configuration
│   ├── deploy.sh          # Production deployment script
│   ├── env.template       # Environment variables template
│   ├── Caddyfile          # Reverse proxy configuration
│   └── keys/              # API keys and credentials
├── .github/workflows/     # GitHub Actions CI/CD pipelines
│   ├── docker-build.yml   # Main CI/CD pipeline
│   └── test-build.yml     # Test pipeline for PRs
└── README.md              # This file
```

## Documentation

For comprehensive documentation including API reference, architecture details, and deployment guides, see the [project documentation](docs/README.md).

### CI/CD and Deployment

- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Complete production deployment guide with all options

## 🛠️ Technology Stack

### 🔧 Backend Architecture
- **FastAPI** - Modern, fast Python web framework with automatic OpenAPI documentation
- **SQLAlchemy 2.x** - Advanced ORM with async support and type hints
- **Pydantic** - Data validation and settings management with type safety
- **Uvicorn** - High-performance ASGI server for production deployment
- **Alembic** - Database migration management
- **Multiple TTS Providers** - Azure Speech, Google Cloud TTS, and Local engines

### 🎨 Frontend Architecture
- **Next.js 15** - React framework with App Router and server-side rendering
- **React 19** - Latest React with concurrent features and improved performance
- **TypeScript** - Type-safe development with comprehensive type checking
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **shadcn/ui** - High-quality, accessible UI components
- **TanStack Query** - Powerful data fetching, caching, and synchronization
- **PWA Support** - Progressive Web App capabilities with offline functionality

### 🗄️ Data & Storage
- **SQLite** - Lightweight database for development and small deployments
- **File System** - Audio file storage with efficient caching
- **Environment Variables** - Secure configuration management

### 🚀 DevOps & Deployment
- **Docker** - Containerized deployment for consistency across environments
- **GitHub Actions** - Automated CI/CD pipeline with multi-platform builds
- **GitHub Container Registry** - Secure image storage and distribution
- **Caddy** - Modern web server with automatic HTTPS

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository** and create a feature branch
2. **Make your changes** following our coding standards
3. **Add tests** for new functionality
4. **Ensure all tests pass** and code is properly formatted
5. **Submit a pull request** with a clear description of your changes

### Development Guidelines
- Follow the existing code style and architecture patterns
- Add comprehensive tests for new features
- Update documentation for any API changes
- Ensure backward compatibility when possible

## 📄 License

This project is licensed under the WTFPL - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Community

- 🐛 **Bug Reports**: Open an issue with detailed reproduction steps
- 💡 **Feature Requests**: Share your ideas and use cases
- 📖 **Documentation**: Check our comprehensive docs in the `/docs` folder
- 💬 **Discussions**: Join our community discussions for questions and ideas

## 🙏 Acknowledgments

- Built with modern web technologies and best practices
- Inspired by the need for accessible language learning tools
- Thanks to all contributors and the open-source community

---

**Ready to improve your dictation skills?** 🎯 [Get started now](#-quick-start) with Last Whisper!