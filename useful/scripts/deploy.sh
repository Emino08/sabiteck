#!/bin/bash

echo "🚀 Deploying DevCo Website..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
cd ..
mkdir -p deploy
cp -r backend deploy/
cp -r frontend/dist deploy/frontend
cp README.md deploy/
cp .env.example deploy/.env

echo "✅ Deployment package created in 'deploy' directory"
echo "📝 Don't forget to:"
echo "  1. Configure .env file with production settings"
echo "  2. Set up database and run migrations"
echo "  3. Configure web server to serve from backend/public"
echo "  4. Set proper file permissions"
