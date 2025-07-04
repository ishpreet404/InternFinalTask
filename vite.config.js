import { defineConfig } from 'vite'

export default defineConfig({
  // Ensure assets are handled correctly
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
  
  build: {
    // Ensure all assets are processed correctly
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Ensure assets keep their original names for easier debugging
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
  
  // Ensure proper base path for Vercel
  base: './',
  
  // Development server configuration
  server: {
    port: 3000,
    host: true
  },
  
  // Preview server configuration
  preview: {
    port: 3000,
    host: true
  }
})
