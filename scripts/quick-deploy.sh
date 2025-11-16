#!/bin/bash

##############################################################################
# QUICK DEPLOY SCRIPT
# Purpose: Deploys to Vercel production with auto-error checking
# Usage: ./scripts/quick-deploy.sh
##############################################################################

set -e  # Exit on error

echo "🚀 Starting Vercel deployment..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Deploy to Vercel
echo -e "${BLUE}📦 Deploying to Vercel production...${NC}"
vercel --prod

# Wait a moment for deployment to propagate
echo ""
echo -e "${BLUE}⏳ Waiting for deployment to propagate...${NC}"
sleep 3

# Health check
echo ""
echo -e "${BLUE}🔍 Running health checks...${NC}"
echo ""

# Check main site
SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://www.gharse.app || echo "000")
if [ "$SITE_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ Main site: OK (200)${NC}"
else
  echo -e "${RED}❌ Main site: Failed ($SITE_STATUS)${NC}"
fi

# Check health endpoint
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://www.gharse.app/api/health || echo "000")
if [ "$HEALTH_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ Health check: OK (200)${NC}"
else
  echo -e "${YELLOW}⚠️  Health check: $HEALTH_STATUS${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo -e "${BLUE}🌐 Live at: https://www.gharse.app${NC}"
echo ""
echo -e "${YELLOW}💡 Tip: Changes are NOT pushed to GitHub yet.${NC}"
echo -e "${YELLOW}   Run './scripts/backup-to-github.sh' when ready to backup.${NC}"
echo ""

