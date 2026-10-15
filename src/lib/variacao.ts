import type { Indicador } from '../services/indicadores';

/** Texto de variação para o KpiCard: "12% vs. período anterior". Sem base de comparação, não mostra nada. */
export function variacao(ind: Indicador): { text: string; direction: 'up' | 'down' } | undefined {
  if (ind.anterior === null || ind.anterior === 0) return undefined;
  const pct = Math.round(((ind.atual - ind.anterior) / ind.anterior) * 100);
  if (pct === 0) return undefined;
  return { text: `${Math.abs(pct)}% vs. período anterior`, direction: pct > 0 ? 'up' : 'down' };
}
