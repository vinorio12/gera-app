import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { Button, formatNumber } from '@gera/design-system';
import { IconButton } from '../../components/shared/IconButton';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, Skeleton } from '../../components/shared/States';
import { formatDateShort, formatMoeda } from '../../lib/format';
import { useEvento } from '../../services/hooks';

const MAX_POR_TIPO = 10;

/** Seletor de ingressos por tipo, com quantidade, preço e disponibilidade. */
export function IngressosPage() {
  const { slug = '' } = useParams();
  const evento = useEvento(slug);
  const navigate = useNavigate();
  const [qtd, setQtd] = useState<Record<string, number>>({});

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link to={`/eventos/${slug}`} className="mb-4 inline-flex min-h-11 items-center gap-2 font-semibold text-link hover:underline">
        <ArrowLeft size={18} aria-hidden /> Voltar ao evento
      </Link>
      {evento.isPending ? (
        <Skeleton className="h-80 border border-border" />
      ) : evento.isError ? (
        <ErrorState error={evento.error} />
      ) : (
        (() => {
          const e = evento.data;
          const total = e.ingressos.reduce((s, i) => s + (qtd[i.tipo] ?? 0) * i.preco, 0);
          const quantidade = Object.values(qtd).reduce((s, n) => s + n, 0);
          const continuar = () => {
            const itens = Object.entries(qtd)
              .filter(([, n]) => n > 0)
              .map(([t, n]) => `${t}:${n}`)
              .join(',');
            navigate(`/checkout?evento=${e.slug}&itens=${encodeURIComponent(itens)}`);
          };
          return (
            <>
              <PageHeader eyebrow={`${formatDateShort(e.data)} · ${e.horario}`} title="Ingressos" description={e.titulo} />
              <ul className="divide-y divide-border rounded-lg border border-border bg-bg-card shadow-card">
                {e.ingressos.map((i) => {
                  const restantes = i.total - i.vendidos;
                  const n = qtd[i.tipo] ?? 0;
                  const max = Math.min(MAX_POR_TIPO, restantes);
                  return (
                    <li key={i.tipo} className="flex flex-wrap items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{i.tipo}</p>
                        <p className="text-sm text-ink-muted">
                          {i.preco === 0 ? 'Gratuito' : formatMoeda(i.preco)} ·{' '}
                          {restantes <= 0 ? 'esgotado' : restantes <= 10 ? `últimos ${restantes}` : `${formatNumber(restantes)} disponíveis`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1" role="group" aria-label={`Quantidade de ingressos ${i.tipo}`}>
                        <IconButton icon={Minus} label={`Menos um ${i.tipo}`} disabled={n === 0} onClick={() => setQtd((q) => ({ ...q, [i.tipo]: n - 1 }))} />
                        <span className="w-8 text-center font-semibold tabular-nums text-ink" aria-live="polite">{n}</span>
                        <IconButton icon={Plus} label={`Mais um ${i.tipo}`} disabled={n >= max} onClick={() => setQtd((q) => ({ ...q, [i.tipo]: n + 1 }))} />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-bg-card p-4 shadow-card">
                <p className="text-lg text-ink">
                  {quantidade} {quantidade === 1 ? 'ingresso' : 'ingressos'} · <strong className="tabular-nums">{total === 0 ? 'Gratuito' : formatMoeda(total)}</strong>
                </p>
                <Button variant={total > 0 ? 'highlight' : 'primary'} disabled={quantidade === 0} onClick={continuar}>
                  {total > 0 ? 'Continuar para o pagamento' : 'Continuar'}
                </Button>
              </div>
            </>
          );
        })()
      )}
    </div>
  );
}
