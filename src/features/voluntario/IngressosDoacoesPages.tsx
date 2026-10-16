import { QRCodeSVG } from 'qrcode.react';
import { AgendaCompartilhar, urlPublica } from '../../components/shared/AgendaCompartilhar';
import { ComprovanteDownload } from '../../components/shared/ComprovanteDownload';
import { EmptyState } from '../../components/shared/EmptyState';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, SkeletonList } from '../../components/shared/States';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { agendaDaCampanha, agendaDoEvento, textoCompartilharCampanha, textoCompartilharEvento } from '../../lib/agenda';
import { useSession } from '../../lib/auth';
import { formatDate, formatDateShort, formatMoeda } from '../../lib/format';
import { useMeusIngressos, useMinhasCompras, useMinhasDoacoes } from '../../services/hooks';

export function MeusIngressosPage() {
  const { userId } = useSession();
  const ingressos = useMeusIngressos(userId!);
  const compras = useMinhasCompras(userId!);
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
        <div className="flex flex-col gap-6">
          <ul className="flex flex-col gap-3">
            {ingressos.data.map((i) => (
              <li key={i.id} className="flex flex-col gap-3 rounded-lg border border-border bg-bg-card p-4 shadow-card">
                <div className="flex items-center gap-4">
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
                </div>
                <AgendaCompartilhar
                  compacto
                  agenda={agendaDoEvento(i.evento, urlPublica(`/eventos/${i.evento.slug}`))}
                  textoWhatsApp={textoCompartilharEvento(i.evento, urlPublica(`/eventos/${i.evento.slug}`))}
                />
              </li>
            ))}
          </ul>
          {!!compras.data?.length && (
            <section aria-labelledby="comprovantes" className="flex flex-col gap-2">
              <h2 id="comprovantes" className="text-lg font-bold text-ink">Comprovantes</h2>
              <ul className="divide-y divide-border rounded-lg border border-border bg-bg-card shadow-card">
                {compras.data.map((p) => (
                  <li key={p.id} className="flex flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{p.descricao}</p>
                        <p className="text-sm text-ink-muted">
                          {formatDate(p.criadoEm)} · {p.entidadeNome}
                        </p>
                      </div>
                      <span className="shrink-0 font-bold tabular-nums text-ink">{p.valor === 0 ? 'Gratuito' : formatMoeda(p.valor)}</span>
                    </div>
                    <ComprovanteDownload pedido={p} contexto={p} className="self-start" />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
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
        <ul className="flex flex-col gap-3">
          {doacoes.data.map((d) => (
            <li key={d.id} className="flex flex-col gap-3 rounded-lg border border-border bg-bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{d.descricao}</p>
                  <p className="text-sm text-ink-muted">
                    {formatDate(d.criadoEm)} · {d.entidadeNome} · {d.metodo === 'cartao' ? 'cartão' : d.metodo === 'pix' ? 'Pix' : 'boleto'}
                    {d.mensal && ' · todo mês'}
                  </p>
                </div>
                <span className="shrink-0 font-bold tabular-nums text-ink">{formatMoeda(d.valor)}</span>
              </div>
              <ComprovanteDownload pedido={d} contexto={d} className="self-start" />
              {d.campanha && (
                <AgendaCompartilhar
                  compacto
                  agenda={agendaDaCampanha(d.campanha, urlPublica(`/campanhas/${d.campanha.slug}`))}
                  textoWhatsApp={textoCompartilharCampanha(d.campanha, urlPublica(`/campanhas/${d.campanha.slug}`))}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
