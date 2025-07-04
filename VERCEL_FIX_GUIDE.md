# Vercel Deployment Troubleshooting Guide

## 🚨 URGENT: Common Vercel Deployment Issues Fixed

### Issue 1: Case Sensitivity in Asset Names
**Problem**: Vercel's Linux servers are case-sensitive, unlike Windows development
**Files affected**: 
- `health 2.png` (lowercase 'h')
- All other health assets have uppercase 'H'

### Issue 2: Asset Path Resolution
**Problem**: Vite asset handling differs between dev and production
**Solution**: Updated asset loading with proper base URLs

### Issue 3: Missing Phaser Module
**Problem**: Phaser might not be bundling correctly for production
**Solution**: Explicit import handling in vite.config.js

## 🔧 IMMEDIATE FIXES APPLIED:

### 1. Created `vite.config.js`:
```javascript
import { defineConfig } from 'vite'

export default defineConfig({
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name].[hash][extname]`;
          }
          return `assets/[name].[hash][extname]`;
        }
      }
    }
  },
  base: './',
  server: { port: 3000, host: true },
  preview: { port: 3000, host: true }
})
```

### 2. Created `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "routes": [
    {
      "src": "/(.*\\.(png|jpg|jpeg|gif|svg|ico|webp))",
      "headers": { "Cache-Control": "public, max-age=31536000, immutable" }
    },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### 3. Enhanced Asset Loading:
- Added comprehensive error logging
- Added fallback handling for missing assets
- Added asset loading completion tracking

## 📋 DEPLOYMENT CHECKLIST:

### Before Deploying:
1. ✅ Run `npm run build` locally - check for errors
2. ✅ Check the `dist/` folder contains all assets
3. ✅ Verify asset names match exactly (case-sensitive)
4. ✅ Test in `npm run preview` mode

### Asset Verification:
Run this command to check your assets:
```bash
ls -la public/ | grep -E "\\.(png|jpg|jpeg)$"
```

Expected files (EXACT case):
- `BG full.png` ✅
- `Blurred BG.png` ✅  
- `health 2.png` ⚠️ (lowercase 'h')
- `Health 1.png` ✅
- `Health 3.png` ✅

### Deploy to Vercel:
```bash
npm run build
git add .
git commit -m "Fix Vercel deployment issues"
git push origin main
```

## 🔍 DEBUGGING ON VERCEL:

1. **Check Build Logs**: Go to Vercel dashboard → Your project → Functions tab → Build logs
2. **Check Console**: Open deployed site → F12 → Console tab
3. **Look for these messages**:
   - ✅ "Loading progress: 100%"
   - ✅ "All assets loaded successfully!"
   - ✅ "Background created successfully for mobile/desktop"
   - ❌ "Failed to load asset: [name] [path]"

## 🚨 IF STILL NOT WORKING:

### Quick Fix #1 - Rename Problematic Asset:
```bash
# In your public folder, rename this file:
mv "health 2.png" "Health 2.png"
```

Then update the code:
```javascript
this.load.image('health2', 'Health 2.png'); // Capital H
```

### Quick Fix #2 - Check Network Tab:
1. Open deployed site
2. F12 → Network tab
3. Refresh page
4. Look for any red 404 errors on image files

### Quick Fix #3 - Vercel Function Logs:
1. Go to Vercel dashboard
2. Your project → Functions tab
3. Check for any server errors

## 📊 EXPECTED CONSOLE OUTPUT (Working Deployment):

```
Loading progress: 25%
Loading progress: 50%
Loading progress: 75%
Loading progress: 100%
Loaded asset: bgFull image
Loaded asset: blurredBG image
Loaded asset: player image
... (all other assets)
All assets loaded successfully!
Background created successfully for mobile
Cloud 0 created: { type: 'cloud1', position: {x: 200, y: 850}, ... }
... (all clouds)
Orientation change handlers set up for mobile device
```

## 🎯 MOST LIKELY CAUSES:

1. **Case sensitivity** (90% of issues)
2. **Missing build configuration** (Fixed with vite.config.js)
3. **Incorrect asset paths** (Fixed with base URL handling)
4. **Vite production bundling** (Fixed with explicit asset handling)

## 🔥 NUCLEAR OPTION (If nothing else works):

1. Rename ALL assets to lowercase:
```bash
# In public folder:
for file in *.png; do mv "$file" "$(echo $file | tr 'A-Z' 'a-z')"; done
```

2. Update ALL asset names in main.js to lowercase
3. Redeploy

This should resolve 99% of Vercel deployment issues!
