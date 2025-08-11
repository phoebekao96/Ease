import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  let define = {};
  if (command === 'serve') {
    define = {
      global: {},
      // Ensure css.devSourcemap is defined for @tailwindcss/vite when serving
      'css.devSourcemap': true,
    };
  }
  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    css: {
      devSourcemap: false,
    },
    // Some versions of @tailwindcss/vite reference css.devSourcemap during serve.
    // If your Vite doesn't expose it, we can safely define it via define.
    define: define,
    server: {
      proxy: {
        '/ws': {
          target: 'ws://localhost:7860',
          ws: true
        }
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
});
