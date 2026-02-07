import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // 生產環境關閉 sourcemap
    minify: 'terser', // 使用 terser 進行更好的壓縮
    terserOptions: {
      compress: {
        drop_console: true, // 移除 console.log
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        // 代碼分割策略
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'map-vendor': ['mapbox-gl', 'react-map-gl'],
        },
        // 優化文件名
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // 設置 chunk 大小警告限制
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
