import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // bind to 0.0.0.0 so the browser can reach the container
    port: 5173,
    watch: {
      usePolling: true,   // required on Windows + Docker (inotify doesn't cross the boundary)
      interval: 300,      // poll every 300ms — low enough to feel instant
    },
  },
});

