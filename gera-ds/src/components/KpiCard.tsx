import type { ReactNode } from 'react';
import { cx } from './cx';
import { Rack } from './Rack';

export interface KpiCardProps {
  label: string;
  /** Já formatado em pt-BR (use formatBRL, formatNumber, formatHours). */
  value: ReactNode;
  delta?: { text: string; direction: 'up' | 'down' };
  /** Obrigatório: de onde vem o número (prestação de contas). */
  source: string;
  className?: string;
}

export function KpiCard({ label, value, delta, source, className }: KpiCardProps) {
  return (
    <div className={cx('gr-kpi', className)}>
      <div className="gr-kpi__label">{label}</div>
      <div className="gr-kpi__value">{value}</div>
      {delta && (
        <div className={cx('gr-kpi__delta', delta.direction === 'down' && 'gr-kpi__delta--down')}>
          {delta.direction === 'up' ? '▲' : '▼'} {delta.text}
        </div>
      )}
      <Rack />
      <div className="gr-kpi__source">Fonte: {source}</div>
    </div>
  );
}
