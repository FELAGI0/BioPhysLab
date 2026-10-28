import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // host 127.0.0.1: Vite v8 по умолчанию слушает только [::1] (IPv6),
    // а на этой машине IPv6-петля заблокирована — браузер получает
    // ERR_CONNECTION_REFUSED. Явно слушаем IPv4.
    host: '127.0.0.1',
    proxy: {
      // changeOrigin: true обязателен — иначе Host-заголовок не переписывается
      // и прокси может зациклиться.
      '/api': { target: 'http://127.0.0.1:8080', changeOrigin: true },
    },
  },
})
