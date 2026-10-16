import { Check } from 'lucide-react';
import { Rack, cx, formatHours } from '@gera/design-system';
import { MARCOS, progressoMarcos } from '../../lib/marcos';

/**
 * Marcos de 10, 50, 100 e 250 h como dentes da cremalheira: os atingidos sobem em verde,
 * os que faltam ficam no traço neutro. A Rack do pacote é a base da engrenagem.
 */
export function MarcosDeHoras({ totalHoras }: { totalHoras: number }) {
  const { atingidos, proximo, faltam } = progressoMarcos(totalHoras);
  return (
    <section aria-labelledby="marcos" className="flex flex-col gap-3 rounded-lg border border-border bg-bg-card p-4 shadow-card">
      <h2 id="marcos" className="text-lg font-bold text-ink">Marcos de horas</h2>
      <ol className="grid grid-cols-4 items-end gap-2" aria-label={`${atingidos.length} de ${MARCOS.length} marcos atingidos`}>
        {MARCOS.map((m, i) => {
          const ok = atingidos.includes(m);
          return (
            <li key={m} className="flex flex-col items-center gap-1">
              <span
                aria-hidden
                className={cx('flex w-full items-start justify-center rounded-t-sm pt-1', ok ? 'bg-primary text-on-primary' : 'bg-border text-ink-muted')}
                style={{ height: `${28 + i * 10}px` }}
              >
                {ok && <Check size={16} />}
              </span>
              <span className={cx('text-sm font-bold tabular-nums', ok ? 'text-ink' : 'text-ink-muted')}>
                {formatHours(m)}
                <span className="sr-only">{ok ? ': atingido' : ': ainda não'}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <Rack />
      <p className="text-sm text-ink">
        {proximo
          ? `Faltam ${formatHours(faltam)} para o marco de ${formatHours(proximo)}.`
          : 'Você chegou a 250 h. Cada hora sua move muita coisa em Jaraguá!'}
      </p>
    </section>
  );
}
