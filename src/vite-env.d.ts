/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'memory' no build da prévia estática (npm run build:static). */
  readonly VITE_ROUTER?: 'memory';
}
