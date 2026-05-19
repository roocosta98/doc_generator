import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuração refinada do Vite para rodar na porta 3000
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true // permite acesso em rede local se necessário
  }
});
