#!/bin/bash

echo "🚀 Skyfire Ascent - Vercel Deployment Script"
echo "============================================="

# Step 1: Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the project root."
    exit 1
fi

echo "✅ Found package.json"

# Step 2: Check for required files
echo "📋 Checking project files..."

if [ ! -f "vite.config.js" ]; then
    echo "❌ Missing vite.config.js"
    exit 1
fi

if [ ! -f "vercel.json" ]; then
    echo "❌ Missing vercel.json"
    exit 1
fi

echo "✅ Configuration files present"

# Step 3: Check critical assets
echo "🖼️  Checking critical assets..."

critical_assets=(
    "public/BG full.png"
    "public/Blurred BG.png"
    "public/Psyger-0.png"
    "public/Cloud 1.png"
    "public/Cloud 2.png" 
    "public/Cloud 3.png"
)

missing_assets=()

for asset in "${critical_assets[@]}"; do
    if [ ! -f "$asset" ]; then
        missing_assets+=("$asset")
    fi
done

if [ ${#missing_assets[@]} -ne 0 ]; then
    echo "❌ Missing critical assets:"
    for asset in "${missing_assets[@]}"; do
        echo "   - $asset"
    done
    exit 1
fi

echo "✅ Critical assets present"

# Step 4: Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi

echo "✅ Dependencies installed"

# Step 5: Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed - check the errors above"
    exit 1
fi

echo "✅ Build successful"

# Step 6: Check if dist folder was created
if [ ! -d "dist" ]; then
    echo "❌ dist folder not created"
    exit 1
fi

echo "✅ dist folder created"

# Step 7: Check if assets are in dist
echo "🔍 Checking built assets..."
asset_count=$(find dist/assets -name "*.png" 2>/dev/null | wc -l)

if [ "$asset_count" -eq 0 ]; then
    echo "⚠️  Warning: No PNG assets found in dist/assets"
    echo "   This might be normal if Vite is handling assets differently"
else
    echo "✅ Found $asset_count PNG assets in build"
fi

# Step 8: Test the build locally
echo "🧪 Testing build locally..."
echo "Starting preview server on http://localhost:3000"
echo "💡 Open another terminal and run: npm run preview"
echo "   Test your game, then press Ctrl+C here to continue with deployment"

# Wait for user confirmation
read -p "📋 Did the local preview work correctly? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please fix local preview issues before deploying"
    exit 1
fi

# Step 9: Git operations
echo "📤 Preparing for deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not initialized. Run: git init"
    exit 1
fi

# Add all changes
git add .

# Commit with timestamp
commit_message="Fix Vercel deployment - $(date '+%Y-%m-%d %H:%M:%S')"
git commit -m "$commit_message"

if [ $? -ne 0 ]; then
    echo "ℹ️  No changes to commit or commit failed"
fi

# Push to origin
echo "🚀 Pushing to repository..."
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Git push failed. Check your repository settings."
    exit 1
fi

echo ""
echo "🎉 SUCCESS! Deployment script completed."
echo ""
echo "📋 Next steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Check the deployment status"
echo "3. Open the deployed URL"
echo "4. Check browser console for any asset loading errors"
echo ""
echo "🔍 If issues persist, check VERCEL_FIX_GUIDE.md"
echo ""
echo "🎮 Good luck with your game deployment!"
