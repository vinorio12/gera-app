import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import { formatHours, formatNumber } from '@gera/design-system';
import { parseDate } from '../../lib/carteirinha';
import { formatMonth } from '../../lib/format';
import { useTokenColors } from '../../lib/useTokenColors';

interface HorasPorMesChartProps {
  dados: Array<{ mes: string; horas: number }>;
}

const CORES = ['primary', 'ink-muted', 'border', 'bg-subtle'] as const;

const mesCurto = (mes: string) => format(parseDate(`${mes}-01`), 'MMM', { locale: ptBR });

/** Horas de voluntariado por mês: uma série, uma cor (a ação), barras finas com a ponta arredondada. */
export function HorasPorMesChart({ dados }: HorasPorMesChartProps) {
  const c = useTokenColors(CORES);
  const total = dados.reduce((s, d) => s + d.horas, 0);
  const pico = dados.reduce((max, d) => (d.horas > max.horas ? d : max), dados[0] ?? { mes: '', horas: 0 });

  return (
    <figure className="flex flex-col gap-3">
      <div
        className="h-64 w-full"
        role="img"
        aria-label={`Horas por mês nos últimos 12 meses: ${formatHours(total)} no total, pico de ${formatHours(pico.horas)} em ${pico.mes ? formatMonth(`${pico.mes}-01`) : ''}.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke={c.border} />
            <XAxis
              dataKey="mes"
              tickFormatter={mesCurto}
              tick={{ fill: c['ink-muted'], fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: c.border }}
              interval={0}
            />
            <YAxis
              width={44}
              tickFormatter={(v: number) => formatNumber(v)}
              tick={{ fill: c['ink-muted'], fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip cursor={{ fill: c['bg-subtle'] }} content={<TooltipHoras />} />
            <Bar dataKey="horas" fill={c.primary} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer font-semibold text-link">Ver como tabela</summary>
        <table className="mt-2 w-full max-w-sm text-left">
          <thead className="text-ink-muted">
            <tr>
              <th scope="col" className="py-1 font-semibold">Mês</th>
              <th scope="col" className="py-1 text-right font-semibold">Horas</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((d) => (
              <tr key={d.mes} className="border-t border-border">
                <td className="py-1 capitalize text-ink">{formatMonth(`${d.mes}-01`)}</td>
                <td className="py-1 text-right tabular-nums text-ink">{formatHours(d.horas)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

function TooltipHoras({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-bg-card px-3 py-2 text-sm shadow-raised">
      <p className="capitalize text-ink-muted">{formatMonth(`${label}-01`)}</p>
      <p className="font-semibold tabular-nums text-ink">{formatHours(Number(payload[0]!.value))}</p>
    </div>
  );
}
