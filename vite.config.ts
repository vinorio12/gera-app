/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // O design system é um pacote local (symlink); garante uma única cópia do React.
  resolve: { dedupe: ['react', 'react-dom'] },
  // Testes de unidade (Vitest): regras puras e serviços sobre os dados de exemplo, com localStorage do jsdom.
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    testTimeout: 15_000,
  },
});
