# Docker Setup for Video Analyzer

## Prerequisites

- Docker and Docker Compose installed on your system
- A Google Gemini API key

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the project root (don't commit this to version control):

```bash
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 2. Building and Running

#### Production Build

Build the Docker image:

```bash
docker-compose build
```

Run the production container:

```bash
docker-compose up -d
```

The application will be available at `http://localhost:3000`

#### Development Mode

Run the development container:

```bash
docker-compose --profile dev up video-analyzer-dev
```

The development server will be available at `http://localhost:5173`

### 3. Managing the Application

Stop the container:

```bash
docker-compose down
```

View logs:

```bash
docker-compose logs -f
```

Rebuild after code changes:

```bash
docker-compose build --no-cache
```

### 4. Alternative: Using Docker directly (without docker-compose)

Build the image:

```bash
docker build -t video-analyzer .
```

Run the container:

```bash
docker run -d -p 3000:80 --name video-analyzer-app video-analyzer
```

### 5. API Key Handling Options

#### Option A: Build-time injection (current setup)

The API key is baked into the build. This is simpler but less secure.

#### Option B: Runtime injection (recommended for production)

Modify the Vite config to use runtime environment variables:

1. Update `vite.config.ts` to handle runtime variables
2. Create an entrypoint script that injects the API key at runtime
3. Modify the Dockerfile to use the entrypoint

Example entrypoint script (`docker-entrypoint.sh`):

```bash
#!/bin/sh
# Replace placeholder with actual API key
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|VITE_GEMINI_API_KEY_PLACEHOLDER|$GEMINI_API_KEY|g" {} +
nginx -g "daemon off;"
```

### 6. Production Considerations

- Use secrets management (Docker Secrets, Kubernetes Secrets, etc.) for the API key
- Consider using a reverse proxy for HTTPS
- Set up proper logging and monitoring
- Configure resource limits in docker-compose.yml:

```yaml
services:
  video-analyzer:
    # ... other config ...
    deploy:
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### 7. Troubleshooting

If the container fails to start:

- Check logs: `docker-compose logs`
- Verify the API key is correctly set
- Ensure ports 3000 (or 5173 for dev) are not in use
- Check file permissions in the build context
