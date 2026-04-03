#!/bin/bash

# CrisisLens Local Deployment Script
# Pulls latest images and deploys locally

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
GITHUB_REPO=${GITHUB_REPO:-"saivarunkonda/CrisisLens"}
AWS_REGION=${AWS_REGION:-"us-east-1"}
S3_BUCKET=${S3_BUCKET:-"crisislens-training-data"}

echo -e "${GREEN}🚀 Deploying CrisisLens Locally${NC}"
echo "================================"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed.${NC}"
    exit 1
fi

# Use docker compose if available, otherwise docker-compose
COMPOSE_CMD="docker compose"
if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
    COMPOSE_CMD="docker-compose"
fi

# Get latest deployment info from S3
echo -e "${YELLOW}📥 Fetching latest deployment info...${NC}"
if aws s3 ls "s3://${S3_BUCKET}/triggers/latest.json" 2>/dev/null; then
    aws s3 cp "s3://${S3_BUCKET}/triggers/latest.json" deployment-trigger.json
    
    # Extract image tags
    WEB_IMAGE=$(jq -r '.images.web' deployment-trigger.json)
    ML_IMAGE=$(jq -r '.images.ml' deployment-trigger.json)
    
    echo -e "${GREEN}✅ Found deployment:${NC}"
    echo "   Web: ${WEB_IMAGE}"
    echo "   ML:  ${ML_IMAGE}"
else
    echo -e "${YELLOW}⚠️  No deployment found, using latest tags${NC}"
    WEB_IMAGE="ghcr.io/${GITHUB_REPO}/web:latest"
    ML_IMAGE="ghcr.io/${GITHUB_REPO}/ml:latest"
fi

# Pull latest images
echo -e "${YELLOW}📥 Pulling Docker images...${NC}"
docker pull "${WEB_IMAGE}"
docker pull "${ML_IMAGE}"

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
$COMPOSE_CMD down || true

# Update docker-compose.yml with new image tags
echo -e "${YELLOW}📝 Updating docker-compose.yml...${NC}"
sed -i.bak "s|ghcr.io/${GITHUB_REPO}/web:latest|${WEB_IMAGE}|g" docker-compose.yml
sed -i.bak "s|ghcr.io/${GITHUB_REPO}/ml:latest|${ML_IMAGE}|g" docker-compose.yml

# Start services
echo -e "${YELLOW}🚀 Starting services...${NC}"
$COMPOSE_CMD up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Health checks
echo -e "${YELLOW}🏥 Running health checks...${NC}"

# Check ML service
if curl -f http://localhost:8000/health &> /dev/null; then
    echo -e "${GREEN}✅ ML Service is healthy${NC}"
else
    echo -e "${RED}❌ ML Service health check failed${NC}"
fi

# Check web service
if curl -f http://localhost:3000 &> /dev/null; then
    echo -e "${GREEN}✅ Web Service is healthy${NC}"
else
    echo -e "${RED}❌ Web Service health check failed${NC}"
fi

# Show container status
echo -e "${YELLOW}📊 Container Status:${NC}"
$COMPOSE_CMD ps

# Show logs
echo -e "${YELLOW}📋 Recent Logs:${NC}"
echo "=== Web Service ==="
$COMPOSE_CMD logs --tail=10 web
echo ""
echo "=== ML Service ==="
$COMPOSE_CMD logs --tail=10 ml

# Cleanup
rm -f deployment-trigger.json docker-compose.yml.bak

echo -e "${GREEN}✨ Deployment Complete!${NC}"
echo "================================"
echo -e "${GREEN}🌐 Web App:${NC} http://localhost:3000"
echo -e "${GREEN}🤖 ML API:${NC} http://localhost:8000"
echo -e "${GREEN}🔄 Nginx:${NC} http://localhost:80"
echo ""
echo -e "${YELLOW}📝 Useful Commands:${NC}"
echo "  View logs: $COMPOSE_CMD logs -f"
echo "  Stop all:  $COMPOSE_CMD down"
echo "  Restart:   $COMPOSE_CMD restart"
