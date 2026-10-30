import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://almagd.id',
  trailingSlash: 'never',
  build: {
    format: 'file'
  },
  i18n: {
    defaultLocale: 'id',
    locales: ['id', 'en', 'ar'],
    routing: {
      prefixDefaultLocale: false
    }
  },
  vite: {
    server: {
      proxy: {
        '/admin': {
          target: 'http://localhost:5173',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => (path === '/admin' ? '/admin/' : path),
        }
      }
    }
  }
});
