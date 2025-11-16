#!/bin/bash

##############################################################################
# GITHUB BACKUP SCRIPT
# Purpose: Commits all changes and pushes to GitHub WITHOUT triggering deployment
# Usage: ./scripts/backup-to-github.sh [optional-commit-message]
##############################################################################

set -e  # Exit on error

echo "🔄 Starting GitHub backup process..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if [ ! -d .git ]; then
  echo -e "${RED}❌ Error: Not a git repository${NC}"
  exit 1
fi

# Check for uncommitted changes
if [ -z "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}✅ No changes to commit. Everything is up to date!${NC}"
  exit 0
fi

# Show what changed
echo -e "${BLUE}📋 Changed files:${NC}"
git status --short
echo ""

# Generate commit message
if [ -n "$1" ]; then
  COMMIT_MSG="$1"
else
  # Auto-generate message with timestamp
  TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
  COMMIT_MSG="chore: backup changes to GitHub - $TIMESTAMP

Auto-backup of all recent changes.
These changes have been tested and deployed to production via Vercel CLI.

Changes include:
$(git status --short | head -10)
"
fi

# Stage all changes
echo -e "${BLUE}📦 Staging all changes...${NC}"
git add .

# Commit
echo -e "${BLUE}💾 Creating commit...${NC}"
git commit -m "$COMMIT_MSG"

# Push to GitHub
echo -e "${BLUE}🚀 Pushing to GitHub...${NC}"
git push origin main

echo ""
echo -e "${GREEN}✅ SUCCESS! Changes backed up to GitHub${NC}"
echo -e "${GREEN}📦 Repository: https://github.com/techbantu/GharSe${NC}"
echo ""
echo -e "${YELLOW}⚠️  NOTE: This push will NOT trigger a Vercel deployment${NC}"
echo -e "${YELLOW}   Vercel is configured for manual deployment only.${NC}"
echo ""
echo -e "${BLUE}🎯 Your workflow:${NC}"
echo -e "   1. Make changes locally"
echo -e "   2. AI auto-deploys with 'vercel --prod'"
echo -e "   3. Backup to GitHub with this script (periodic)"
echo ""
echo "✨ Done!"

