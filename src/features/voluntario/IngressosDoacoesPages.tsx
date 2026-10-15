import { QRCodeSVG } from 'qrcode.react';
import { EmptyState } from '../../components/shared/EmptyState';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, SkeletonList } from '../../components/shared/States';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { useSession } from '../../lib/auth';
import { formatDate, formatDateShort, formatMoeda } from '../../lib/format';
import { useMeusIngressos, useMinhasDoacoes } from '../../services/hooks';

export function MeusIngressosPage() {
  const { userId } = useSession();
  const ingressos = useMeusIngressos(userId!);
  return (
    <>
      <PageHeader title="Meus ingressos" />
      {ingressos.isPending ? (
        <SkeletonList rows={2} />
      ) : ingressos.isError ? (
        <ErrorState error={ingressos.error} onRetry={() => ingressos.refetch()} />
      ) : ingressos.data.length === 0 ? (
        <EmptyState
          title="Nenhum ingresso ainda"
          description="Os ingressos que você comprar entrando como voluntário aparecem aqui, com o QR de cada participante."
          action={<ButtonLink to="/eventos">Ver eventos</ButtonLink>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {ingressos.data.map((i) => (
            <li key={i.id} className="flex items-center gap-4 rounded-lg border border-border bg-bg-card p-4 shadow-card">
              <div className="shrink-0 rounded-md bg-papel p-2">
                <QRCodeSVG value={i.codigo} size={96} level="M" title={`QR do ingresso de ${i.participante}`} />
              </div>
              <div className="min-w-0">
                <p className="font-display text-base uppercase leading-5 tracking-[0.08em] text-ink-muted">{i.tipo}</p>
                <p className="font-bold text-ink">{i.eventoTitulo}</p>
                <p className="text-sm text-ink-muted">
                  {formatDateShort(i.eventoData)} · {i.eventoHorario} · {i.local}
                </p>
                <p className="text-sm text-ink">{i.participante}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function MinhasDoacoesPage() {
  const { userId } = useSession();
  const doacoes = useMinhasDoacoes(userId!);
  return (
    <>
      <PageHeader title="Minhas doações" />
      {doacoes.isPending ? (
        <SkeletonList rows={2} />
      ) : doacoes.isError ? (
        <ErrorState error={doacoes.error} onRetry={() => doacoes.refetch()} />
      ) : doacoes.data.length === 0 ? (
        <EmptyState title="Nenhuma doação ainda" description="Cada real empurra a meta de uma entidade." action={<ButtonLink to="/campanhas">Ver campanhas</ButtonLink>} />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-bg-card shadow-card">
          {doacoes.data.map((d) => (
            <li key={d.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{d.descricao}</p>
                <p className="text-sm text-ink-muted">
                  {formatDate(d.criadoEm)} · {d.metodo === 'cartao' ? 'cartão' : d.metodo === 'pix' ? 'Pix' : 'boleto'}
                  {d.mensal && ' · todo mês'}
                </p>
              </div>
              <span className="shrink-0 font-bold tabular-nums text-ink">{formatMoeda(d.valor)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
