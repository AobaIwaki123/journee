# Development Dockerfile for Next.js
FROM node:20-alpine

# Install dependencies for better compatibility
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
# Use npm install instead of npm ci to handle package.json changes
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set environment to development
ENV NODE_ENV=development

# Start development server
CMD ["npm", "run", "dev"]
