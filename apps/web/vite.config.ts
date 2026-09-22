import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Honour PORT so a harness or hosting environment can place the dev server
  // somewhere other than the default.
  server: { port: Number(process.env.PORT) || 5173 },
})
