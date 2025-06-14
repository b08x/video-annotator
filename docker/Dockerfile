# Stage 1: Dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files explicitly from project root
COPY ../package.json ./
COPY ../package-lock.json ./
# Debug: List files to ensure package-lock.json is present
RUN ls -la ./

# Install production dependencies
RUN npm ci --only=production

# Stage 2: Build dependencies stage
FROM node:20-alpine AS build-deps
WORKDIR /app

# Copy package files explicitly from project root
COPY ../package.json ./
COPY ../package-lock.json ./
# Debug: List files to ensure package-lock.json is present
RUN ls -la ./

# Install all dependencies (including dev)
RUN npm ci

# Stage 3: Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from build-deps stage
COPY --from=build-deps /app/node_modules ./node_modules

# Copy source files
COPY .. .

# Build the application
# Note: API key should be provided as build arg
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

RUN npm run build

# Stage 4: Development stage
FROM node:20-alpine AS development
WORKDIR /app

# Copy package files explicitly from project root
COPY ../package.json ./
COPY ../package-lock.json ./
# Debug: List files to ensure package-lock.json is present
RUN ls -la ./
RUN npm ci

# Copy source files
COPY .. .

# Expose Vite dev server port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Stage 5: Production stage
FROM nginx:alpine AS production

# Install runtime dependencies for environment variable substitution
RUN apk add --no-cache bash

# Copy nginx config
COPY ../docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy entrypoint script
COPY ../docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 80

# Use entrypoint for runtime configuration
ENTRYPOINT ["/docker-entrypoint.sh"]