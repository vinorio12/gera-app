import { formatHours } from '@gera/design-system';
import { formatDate, formatMonth } from '../../lib/format';
import type { RegistroHoras } from '../../types/domain';

interface HoursTimelineProps {
  /** Registros em qualquer ordem; a linha do tempo agrupa por mês, do mais recente para o mais antigo. */
  registros: RegistroHoras[];
  nomeDaEntidade?: (entidadeId: string) => string;
  /** Mostra quem fez a ação (visão da entidade). */
  nomeDoVoluntario?: (voluntarioId: string) => string;
}

/** Banco de horas como cremalheira vertical: cada ação é um dente. */
export function HoursTimeline({ registros, nomeDaEntidade, nomeDoVoluntario }: HoursTimelineProps) {
  const meses = new Map<string, RegistroHoras[]>();
  [...registros]
    .sort((a, b) => b.data.localeCompare(a.data))
    .forEach((r) => meses.set(r.data.slice(0, 7), [...(meses.get(r.data.slice(0, 7)) ?? []), r]));

  return (
    <div className="flex flex-col gap-6">
      {[...meses].map(([mes, lista]) => (
        <section key={mes} aria-label={formatMonth(`${mes}-01`)}>
          <h3 className="mb-3 flex items-baseline justify-between gap-3">
            <span className="font-display text-xl uppercase leading-6 tracking-[0.04em] text-ink">{formatMonth(`${mes}-01`)}</span>
            <span className="text-sm font-semibold tabular-nums text-ink-muted">{formatHours(lista.reduce((s, r) => s + r.horas, 0))}</span>
          </h3>
          <ol className="ml-1 flex flex-col gap-4 border-l-2 border-border-strong">
            {lista.map((r) => (
              <li key={r.id} className="relative pl-5">
                {/* O dente da cremalheira (5px × 8px, como o --tooth do design system, girado). */}
                <span aria-hidden className="absolute -left-[2px] top-2 h-2 w-[7px] rounded-r-sm bg-primary" />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{r.projeto}</p>
                    <p className="text-sm text-ink-muted">
                      {[formatDate(r.data), nomeDoVoluntario?.(r.voluntarioId), nomeDaEntidade?.(r.entidadeId)]
                        .filter(Boolean)
                        .join(' · ')}
                      {r.origem === 'manual' && ' · registro manual'}
                    </p>
                  </div>
                  <span className="shrink-0 font-display text-2xl leading-7 tabular-nums text-ink">{formatHours(r.horas).toUpperCase()}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
