# Development Dockerfile for Next.js
FROM node:18-alpine

# Install dependencies for better compatibility
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set environment to development
ENV NODE_ENV=development

# Start development server
CMD ["npm", "run", "dev"]
