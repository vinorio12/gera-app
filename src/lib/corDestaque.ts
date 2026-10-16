import type { CorDestaque } from '../types/domain';

/** Nome e classe de cada cor de destaque das entidades (tokens de portal, nunca hex). */
export const COR_DESTAQUE: Record<CorDestaque, { nome: string; amostra: string }> = {
  'portal-engajar': { nome: 'Verde Engajar', amostra: 'bg-portal-engajar' },
  'portal-impulsionar': { nome: 'Amarelo Impulsionar', amostra: 'bg-portal-impulsionar' },
  'portal-conectar': { nome: 'Limão Conectar', amostra: 'bg-portal-conectar' },
  'portal-ampliar': { nome: 'Verde-escuro Ampliar', amostra: 'bg-portal-ampliar' },
};
