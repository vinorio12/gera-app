// Carteirinha offline: o último painel fica no navegador para abrir a carteirinha sem rede.
// O QR continua sendo gerado aqui (tokenCarteirinha), então ele se renova mesmo offline.
import { useEffect, useState } from 'react';
import type { MeuPainel } from '../services/voluntarios';

const chave = (voluntarioId: string) => `gera.carteirinha.${voluntarioId}`;

export interface PainelSalvo {
  painel: Pick<MeuPainel, 'voluntario' | 'carteirinha' | 'entidades'>;
  /** Quando o status foi sincronizado com o servidor. */
  em: string;
}

export function salvarPainel(voluntarioId: string, painel: MeuPainel, em = new Date()) {
  try {
    const dados: PainelSalvo = { painel: { voluntario: painel.voluntario, carteirinha: painel.carteirinha, entidades: painel.entidades }, em: em.toISOString() };
    localStorage.setItem(chave(voluntarioId), JSON.stringify(dados));
  } catch {
    // sem storage: offline mostra só o que der
  }
}

export function lerPainelSalvo(voluntarioId: string): PainelSalvo | null {
  try {
    const raw = localStorage.getItem(chave(voluntarioId));
    return raw ? (JSON.parse(raw) as PainelSalvo) : null;
  } catch {
    return null;
  }
}

/** true com rede; acompanha os eventos online/offline do navegador. */
export function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}
