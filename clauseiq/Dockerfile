# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the Node.js backend and serve the static files
FROM node:20-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# Copy the built frontend static files from Stage 1 into the backend's public directory
COPY --from=frontend-builder /app/frontend/build ./public

# Expose the Cloud Run port (defaults to 8080)
EXPOSE 8080

# The PORT environment variable will be provided by Cloud Run
ENV PORT=8080
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.js"]
