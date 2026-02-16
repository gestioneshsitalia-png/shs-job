
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Fixed the error "Property 'cwd' does not exist on type 'Process'" by removing manual environment loading.
// The API key is injected automatically by the platform, so manual mapping via 'define' is unnecessary
// and we avoid defining process.env in the config as per guidelines.
export default defineConfig({
  plugins: [react()],
});
