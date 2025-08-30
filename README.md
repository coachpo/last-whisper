# Last Whisper

A comprehensive dictation training platform with Text-to-Speech (TTS) capabilities, built with FastAPI backend and Next.js frontend.

## Features

- **Multiple TTS Providers**: Support for Local (Facebook MMS-TTS-Fin), Azure Speech, and Google Cloud Text-to-Speech
- **Dictation Practice**: Interactive dictation training with automatic scoring using Word Error Rate (WER)
- **Statistics & Analytics**: Comprehensive practice tracking and progress monitoring
- **Tag Management**: Organize practice items with custom tags and filtering
- **Audio Caching**: Efficient audio playback with local caching
- **PWA Support**: Installable web app with offline functionality
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended)
- **Node.js 18+** and **Python 3.11+** (for local development)

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/coachpo/last-whisper.git
cd last-whisper
```

2. Pull Git submodules (backend and frontend are separate repositories):
```bash
git submodule update --init --recursive
```

3. Start the full stack:
```bash
docker-compose up
```

4. Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Production Deployment with GitHub Container Registry

The project includes automated CI/CD using GitHub Actions that builds and pushes Docker images to GitHub Container Registry.

#### Automated CI/CD Pipeline

- **Main Pipeline**: Builds and pushes images on every push to `main` branch
- **Test Pipeline**: Validates builds on pull requests
- **Multi-platform**: Supports both `linux/amd64` and `linux/arm64` architectures
- **Security Scanning**: Includes Trivy security scanning for built images

#### Manual Deployment

For production deployments using pre-built images from GitHub Container Registry:

1. Set up environment variables:
```bash
cp env.template .env
# Edit .env with your configuration
```

2. Deploy using the deployment script:
```bash
./deploy.sh
```

See [GitHub CI/CD Documentation](docs/GITHUB_CI_CD.md) for detailed setup instructions.

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
├── docker-compose.prod.yml # Production deployment with registry images
├── deploy.sh              # Production deployment script
├── env.template           # Environment variables template
├── .github/workflows/     # GitHub Actions CI/CD pipelines
│   ├── docker-build.yml   # Main CI/CD pipeline
│   └── test-build.yml     # Test pipeline for PRs
└── README.md              # This file
```

## Documentation

For comprehensive documentation including API reference, architecture details, and deployment guides, see the [project documentation](docs/README.md).

### CI/CD and Deployment

- [GitHub CI/CD Setup](docs/GITHUB_CI_CD.md) - Complete guide for setting up automated builds and deployments

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **Pydantic** - Data validation
- **Multiple TTS Providers** - Local, Azure, Google Cloud

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **TanStack Query** - Data fetching and caching

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

[Add your license information here]

## Support

For issues and questions, please open an issue in the repository.