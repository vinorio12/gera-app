import { useId, useMemo, useState } from 'react';
import { cx } from '@gera/design-system';
import { isoDay } from '../../lib/carteirinha';
import { formatDate } from '../../lib/format';
import { periodoDoPreset, type Periodo, type PeriodoPreset } from '../../services/indicadores';
import { inputClass, labelClass } from '../ui/form';

const OPCOES: Array<{ id: PeriodoPreset; label: string }> = [
  { id: 'mes', label: 'Este mês' },
  { id: 'trimestre', label: '3 meses' },
  { id: 'ano', label: '12 meses' },
  { id: 'personalizado', label: 'Personalizado' },
];

/** Estado do filtro de período, compartilhado entre o controle e as consultas. */
export function usePeriodo(inicial: Exclude<PeriodoPreset, 'personalizado'> = 'mes') {
  const [preset, setPreset] = useState<PeriodoPreset>(inicial);
  const [custom, setCustom] = useState<Periodo>(() => periodoDoPreset('trimestre'));
  const periodo = useMemo(() => (preset === 'personalizado' ? custom : periodoDoPreset(preset)), [preset, custom]);
  return { preset, setPreset, custom, setCustom, periodo };
}

type FiltroPeriodoProps = ReturnType<typeof usePeriodo>;

export function FiltroPeriodo({ preset, setPreset, custom, setCustom, periodo }: FiltroPeriodoProps) {
  const ids = { inicio: useId(), fim: useId() };
  const hoje = isoDay(new Date());
  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label="Período" className="flex flex-wrap gap-1 rounded-md border border-border bg-bg-card p-1">
        {OPCOES.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={preset === o.id}
            onClick={() => setPreset(o.id)}
            className={cx(
              'min-h-10 rounded-sm px-3 text-sm font-semibold',
              preset === o.id ? 'bg-primary text-on-primary' : 'text-ink-muted hover:bg-bg-subtle hover:text-ink',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {preset === 'personalizado' ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={ids.inicio} className={labelClass}>De</label>
            <input
              id={ids.inicio}
              type="date"
              value={custom.inicio}
              max={custom.fim}
              onChange={(e) => e.target.value && setCustom((c) => ({ ...c, inicio: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={ids.fim} className={labelClass}>Até</label>
            <input
              id={ids.fim}
              type="date"
              value={custom.fim}
              min={custom.inicio}
              max={hoje}
              onChange={(e) => e.target.value && setCustom((c) => ({ ...c, fim: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink-muted">
          De {formatDate(periodo.inicio)} a {formatDate(periodo.fim)}, comparado ao período anterior de mesmo tamanho.
        </p>
      )}
    </div>
  );
}
