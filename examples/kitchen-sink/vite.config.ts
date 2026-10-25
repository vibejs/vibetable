import { fileURLToPath } from 'node:url';
import { vibe } from '@usevibejs/compiler/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { invoiceApi } from './server.ts';
export default defineConfig({
  plugins: [vibe(), tailwindcss(), invoiceApi()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { host: '127.0.0.1' },
});
