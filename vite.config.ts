import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  build: {
    // Deshabilitar verificación de tipos en el build
    // para evitar que errores de TS sin usar bloqueen el build
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignorar advertencias de TypeScript en producción
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        warn(warning);
      }
    }
  }
})
