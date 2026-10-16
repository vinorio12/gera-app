/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'memory' no build da prévia estática (npm run build:static). */
  readonly VITE_ROUTER?: 'memory';
}

interface Window {
  /** Só existe na página publicada no claude.ai; em dev e no build normal é undefined. */
  claude?: {
    use<K extends string>(nome: K): Promise<unknown | null>;
  };
}
