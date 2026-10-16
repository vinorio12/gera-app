import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, MapPin } from 'lucide-react';
import { EventCard, formatNumber } from '@gera/design-system';
import { EmptyState } from '../../components/shared/EmptyState';
import { PageHeader } from '../../components/shared/PageHeader';
import { RouterLinks } from '../../components/shared/RouterLinks';
import { ErrorState, Skeleton, SkeletonList } from '../../components/shared/States';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { formatDateShort, formatMoeda } from '../../lib/format';
import { useEventos, useEvento } from '../../services/hooks';
import type { EventoPublico } from '../../services/publico';
import { FaixaEngrenagem } from './cards';
import { AgendaCompartilhar, urlPublica } from '../../components/shared/AgendaCompartilhar';
import { agendaDoEvento, textoCompartilharEvento } from '../../lib/agenda';

/** Grade de EventCard (design system); os links internos dele navegam pelo router. */
export function GradeEventos({ eventos }: { eventos: EventoPublico[] }) {
  return (
    <RouterLinks className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {eventos.map((e) => (
        <EventCard
          key={e.id}
          className="w-full"
          title={e.titulo}
          date={e.data}
          time={e.horario}
          place={e.local}
          capacity={e.ingressos.reduce((s, i) => s + i.total, 0)}
          priceFrom={Number.isFinite(e.precoMinimo) ? e.precoMinimo : undefined}
          soldOut={e.esgotado}
          href={`/eventos/${e.slug}`}
        />
      ))}
    </RouterLinks>
  );
}

export function EventosPage() {
  const eventos = useEventos();
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <PageHeader title="Eventos" description="Jantares, corridas, feiras e torneios das entidades. Toda a renda vai para os projetos." />
      {eventos.isPending ? (
        <SkeletonList rows={3} />
      ) : eventos.isError ? (
        <ErrorState error={eventos.error} onRetry={() => eventos.refetch()} />
      ) : eventos.data.length === 0 ? (
        <EmptyState title="Nenhum evento marcado agora" description="Volte em breve: a agenda é atualizada pelas entidades." />
      ) : (
        <GradeEventos eventos={eventos.data} />
      )}
    </div>
  );
}

export function EventoDetalhePage() {
  const { slug = '' } = useParams();
  const evento = useEvento(slug);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/eventos" className="mb-4 inline-flex min-h-11 items-center gap-2 font-semibold text-link hover:underline">
        <ArrowLeft size={18} aria-hidden /> Eventos
      </Link>
      {evento.isPending ? (
        <Skeleton className="h-96 border border-border" />
      ) : evento.isError ? (
        <ErrorState error={evento.error} />
      ) : (
        (() => {
          const e = evento.data;
          const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.local}, Jaraguá do Sul`)}`;
          return (
            <>
              <div className="mb-6 overflow-hidden rounded-lg">
                <FaixaEngrenagem rotulo={e.entidadeNome} className="h-40" />
              </div>
              <PageHeader title={e.titulo} description={e.descricao} />
              <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <section aria-label="Quando e onde" className="flex flex-col gap-3 rounded-lg border border-border bg-bg-card p-5 shadow-card">
                  <p className="flex items-start gap-2 text-ink"><CalendarDays size={20} aria-hidden className="mt-0.5 shrink-0 text-link" /> {formatDateShort(e.data)}</p>
                  <p className="flex items-start gap-2 text-ink"><Clock size={20} aria-hidden className="mt-0.5 shrink-0 text-link" /> {e.horario}</p>
                  <p className="flex items-start gap-2 text-ink"><MapPin size={20} aria-hidden className="mt-0.5 shrink-0 text-link" /> {e.local}</p>
                  <a href={mapa} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-link hover:underline">
                    Ver no mapa (abre em outra aba)
                  </a>
                  <p className="text-sm text-ink-muted">Organização: {e.entidadeNome}</p>
                  <AgendaCompartilhar
                    className="border-t border-border pt-3"
                    agenda={agendaDoEvento(e, urlPublica(`/eventos/${e.slug}`))}
                    textoWhatsApp={textoCompartilharEvento(e, urlPublica(`/eventos/${e.slug}`))}
                  />
                </section>
                <section aria-labelledby="ingressos" className="flex flex-col gap-3 rounded-lg border border-border bg-bg-card p-5 shadow-card">
                  <h2 id="ingressos" className="text-lg font-bold text-ink">Ingressos</h2>
                  <ul className="divide-y divide-border">
                    {e.ingressos.map((i) => {
                      const restantes = i.total - i.vendidos;
                      return (
                        <li key={i.tipo} className="flex items-center justify-between gap-3 py-3">
                          <div>
                            <p className="font-semibold text-ink">{i.tipo}</p>
                            <p className="text-sm text-ink-muted">
                              {restantes <= 0 ? 'Esgotado' : restantes <= 10 ? `Últimos ${restantes}` : `${formatNumber(restantes)} disponíveis`}
                            </p>
                          </div>
                          <span className="font-bold tabular-nums text-ink">{i.preco === 0 ? 'Gratuito' : formatMoeda(i.preco)}</span>
                        </li>
                      );
                    })}
                  </ul>
                  {e.esgotado ? (
                    <p className="font-semibold text-ink-muted">Ingressos esgotados.</p>
                  ) : (
                    <ButtonLink
                      to={`/eventos/${e.slug}/ingressos`}
                      variant={Number.isFinite(e.precoMinimo) && e.precoMinimo > 0 ? 'highlight' : 'primary'}
                      className="justify-center"
                    >
                      {Number.isFinite(e.precoMinimo) && e.precoMinimo > 0 ? 'Comprar ingressos' : 'Garantir vaga'}
                    </ButtonLink>
                  )}
                </section>
              </div>
            </>
          );
        })()
      )}
    </div>
  );
}
