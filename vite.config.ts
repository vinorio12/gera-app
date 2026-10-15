import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // O design system é um pacote local (symlink); garante uma única cópia do React.
  resolve: { dedupe: ['react', 'react-dom'] },
});
