#!/bin/bash

# GharSe GitHub Push Script
# This script will help you push your code to GitHub

echo "🚀 GharSe GitHub Push Helper"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the GharSe root directory"
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Git repository not initialized"
    exit 1
fi

echo "✅ Git repository found"
echo ""

# Show current git status
echo "📊 Current Git Status:"
echo "--------------------"
git status --short
echo ""

# Show remote
echo "🔗 Git Remote:"
echo "-------------"
git remote -v
echo ""

# Ask user if they've created the GitHub repository
echo "❓ Have you created the repository on GitHub?"
echo "   Visit: https://github.com/new"
echo "   Repository name: GharSe"
echo "   Description: Revolutionary Home Chef Marketplace"
echo "   Visibility: Private (recommended)"
echo "   ⚠️  DO NOT initialize with README, .gitignore, or license"
echo ""
read -p "Have you created the repository? (y/n): " created_repo

if [ "$created_repo" != "y" ] && [ "$created_repo" != "Y" ]; then
    echo ""
    echo "⏸️  Please create the repository first, then run this script again."
    echo "   1. Go to: https://github.com/new"
    echo "   2. Create repository named 'GharSe'"
    echo "   3. Run this script again"
    exit 0
fi

echo ""
echo "🔐 GitHub Authentication Options:"
echo "--------------------------------"
echo "1. Use HTTPS (enter your GitHub credentials)"
echo "2. Use Personal Access Token (more secure)"
echo "3. Use SSH (if you have SSH keys set up)"
echo ""
read -p "Choose option (1/2/3): " auth_option

case $auth_option in
    1)
        echo ""
        echo "📤 Pushing to GitHub with HTTPS..."
        git push -u origin main
        ;;
    2)
        echo ""
        echo "🔑 Using Personal Access Token"
        echo "   Get your token from: https://github.com/settings/tokens"
        echo "   Required scopes: repo"
        echo ""
        read -p "Enter your GitHub username: " github_user
        read -sp "Enter your Personal Access Token: " github_token
        echo ""
        git remote set-url origin https://${github_user}:${github_token}@github.com/techbantu/GharSe.git
        git push -u origin main
        # Remove token from remote URL for security
        git remote set-url origin https://github.com/techbantu/GharSe.git
        ;;
    3)
        echo ""
        echo "🔐 Using SSH authentication"
        git remote set-url origin git@github.com:techbantu/GharSe.git
        git push -u origin main
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎉 Next Steps:"
    echo "   1. Visit: https://github.com/techbantu/GharSe"
    echo "   2. Verify all files are there"
    echo "   3. Set up branch protection (Settings → Branches)"
    echo "   4. Add repository secrets for CI/CD"
    echo "   5. Configure deployment (Vercel recommended)"
    echo ""
    echo "📚 Full setup guide: ./GITHUB_SETUP.md"
else
    echo ""
    echo "❌ Push failed. Please check the error message above."
    echo ""
    echo "Common issues:"
    echo "   - Repository not created on GitHub"
    echo "   - Authentication failed"
    echo "   - Network connection issues"
    echo ""
    echo "📚 See GITHUB_SETUP.md for detailed troubleshooting"
fi

