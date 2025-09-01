# Last Whisper Documentation

This directory contains comprehensive documentation for the Last Whisper project, including both backend and frontend components.

## Documentation Index

### Core Documentation

- **[Architecture](ARCHITECTURE.md)** - System architecture and design patterns
- **[Dictation API](DICTATION_API.md)** - API documentation for dictation features
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Comprehensive deployment guide for all environments

## Quick Start

1. **Deployment**: Start with [Deployment Guide](DEPLOYMENT_GUIDE.md) for complete setup instructions
2. **API Reference**: Check [Dictation API](DICTATION_API.md) for API usage
3. **Architecture**: See [Architecture](ARCHITECTURE.md) for system design and components

## Project Structure

```
last-whisper/
├── docs/                   # Project documentation (this directory)
├── last-whisper-backend/   # FastAPI backend service
│   ├── app/               # Backend application code
│   ├── audio/             # Generated audio files
│   ├── keys/              # API keys and credentials
│   ├── Dockerfile         # Backend container configuration
│   ├── requirements.txt   # Python dependencies
│   ├── run_api.py         # Server startup script
│   ├── dictation.db       # SQLite database
│   └── README.md          # Backend quick start guide
├── last-whisper-frontend/  # Next.js frontend application
│   ├── src/               # Frontend source code
│   ├── public/            # Static assets
│   ├── scripts/           # Build and utility scripts
│   ├── Dockerfile         # Frontend container configuration
│   ├── package.json       # Node.js dependencies
│   ├── install.sh         # Quick setup script
│   └── README.md          # Frontend quick start guide
├── docker-compose.yml     # Full stack deployment
└── README.md              # Project overview
```

## Getting Help

- **Deployment Issues**: Start with [Deployment Guide](DEPLOYMENT_GUIDE.md)
- **API Issues**: Check [Dictation API](DICTATION_API.md)
- **Architecture Questions**: See [Architecture](ARCHITECTURE.md)

## Contributing

When adding new documentation:

1. Place all documentation in this `docs/` directory
2. Update this README.md index
3. Follow the existing documentation style
4. Include code examples where appropriate
5. Test all links and references

## Documentation Standards

- Use clear, descriptive titles
- Include code examples for complex concepts
- Provide step-by-step instructions
- Keep documentation up-to-date with code changes
- Use consistent formatting and structure
