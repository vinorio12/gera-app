import { useId, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CampaignProgress, cx, formatBRL, formatNumber } from '@gera/design-system';
import { EmptyState } from '../../components/shared/EmptyState';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, Skeleton, SkeletonList } from '../../components/shared/States';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { inputClass, labelClass } from '../../components/ui/form';
import { formatDate } from '../../lib/format';
import { useCampanha, useCampanhas } from '../../services/hooks';
import type { CampanhaPublica } from '../../services/publico';
import { FaixaEngrenagem } from './cards';
import { AgendaCompartilhar, urlPublica } from '../../components/shared/AgendaCompartilhar';
import { agendaDaCampanha, textoCompartilharCampanha } from '../../lib/agenda';

/** Grade de CampaignProgress (design system): barra em cremalheira com a engrenagem na ponta. */
export function GradeCampanhas({ campanhas }: { campanhas: CampanhaPublica[] }) {
  const navigate = useNavigate();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {campanhas.map((c) => (
        <CampaignProgress
          key={c.id}
          className="max-w-none"
          title={c.titulo}
          organization={c.entidadeNome}
          raised={c.arrecadado}
          goal={c.meta}
          daysLeft={c.diasRestantes}
          onSupport={() => navigate(`/campanhas/${c.slug}`)}
        />
      ))}
    </div>
  );
}

export function CampanhasPage() {
  const campanhas = useCampanhas();
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <PageHeader title="Campanhas" description="Cada real empurra a engrenagem. Veja quanto falta para cada meta." />
      {campanhas.isPending ? (
        <SkeletonList rows={3} />
      ) : campanhas.isError ? (
        <ErrorState error={campanhas.error} onRetry={() => campanhas.refetch()} />
      ) : campanhas.data.length === 0 ? (
        <EmptyState title="Nenhuma campanha ativa agora" description="Volte em breve ou apoie uma entidade direto pela página dela." />
      ) : (
        <GradeCampanhas campanhas={campanhas.data} />
      )}
    </div>
  );
}

const VALORES = [30, 50, 100, 200];

export function CampanhaDetalhePage() {
  const { slug = '' } = useParams();
  const campanha = useCampanha(slug);
  const [valor, setValor] = useState<number | null>(50);
  const [livre, setLivre] = useState('');
  const [mensal, setMensal] = useState(false);
  const ids = { livre: useId(), mensal: useId() };
  const escolhido = livre ? Number(livre.replace(',', '.')) : valor;
  const valido = !!escolhido && escolhido >= 5;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/campanhas" className="mb-4 inline-flex min-h-11 items-center gap-2 font-semibold text-link hover:underline">
        <ArrowLeft size={18} aria-hidden /> Campanhas
      </Link>
      {campanha.isPending ? (
        <Skeleton className="h-96 border border-border" />
      ) : campanha.isError ? (
        <ErrorState error={campanha.error} />
      ) : (
        (() => {
          const c = campanha.data;
          return (
            <>
              <div className="mb-6 overflow-hidden rounded-lg">
                <FaixaEngrenagem rotulo={c.entidadeNome} className="h-40" />
              </div>
              <PageHeader title={c.titulo} eyebrow={c.entidadeNome} />
              <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-4">
                  <p className="text-lg text-ink">{c.historia}</p>
                  <dl className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg border border-border bg-bg-card p-3">
                      <dt className="text-xs text-ink-muted">Apoiadores</dt>
                      <dd className="font-display text-2xl tabular-nums text-ink sm:text-3xl">{formatNumber(c.apoiadores)}</dd>
                    </div>
                    <div className="rounded-lg border border-border bg-bg-card p-3">
                      <dt className="text-xs text-ink-muted">Faltam</dt>
                      <dd className="font-display text-2xl tabular-nums text-ink sm:text-3xl">{formatBRL(Math.max(0, c.meta - c.arrecadado))}</dd>
                    </div>
                    <div className="rounded-lg border border-border bg-bg-card p-3">
                      <dt className="text-xs text-ink-muted">Termina em</dt>
                      <dd className="font-display text-2xl tabular-nums text-ink sm:text-3xl">{formatDate(c.terminaEm).slice(0, 5)}</dd>
                    </div>
                  </dl>
                  <AgendaCompartilhar
                    agenda={agendaDaCampanha(c, urlPublica(`/campanhas/${c.slug}`))}
                    textoWhatsApp={textoCompartilharCampanha(c, urlPublica(`/campanhas/${c.slug}`))}
                  />
                </div>
                <div className="flex flex-col gap-4">
                  {/* O botão do CampaignProgress leva ao formulário de apoio logo abaixo. */}
                  <CampaignProgress
                    className="max-w-none"
                    title="Meta da campanha"
                    organization={c.entidadeNome}
                    raised={c.arrecadado}
                    goal={c.meta}
                    daysLeft={c.diasRestantes}
                    ctaLabel="Escolher valor"
                    onSupport={() => document.getElementById('apoio')?.focus()}
                  />
                  <section aria-labelledby="apoiar" className="flex flex-col gap-3 rounded-lg border border-border bg-bg-card p-5 shadow-card">
                    <h2 id="apoiar" className="text-lg font-bold text-ink">Apoie esta campanha</h2>
                    <div role="group" aria-label="Valor sugerido" className="grid grid-cols-4 gap-2">
                      {VALORES.map((v, i) => (
                        <button
                          key={v}
                          id={i === 0 ? 'apoio' : undefined}
                          type="button"
                          aria-pressed={!livre && valor === v}
                          onClick={() => {
                            setValor(v);
                            setLivre('');
                          }}
                          className={cx(
                            'min-h-11 rounded-md border text-sm font-bold tabular-nums',
                            !livre && valor === v ? 'border-primary bg-primary-soft text-on-primary-soft' : 'border-border-strong bg-bg-card text-ink',
                          )}
                        >
                          {formatBRL(v)}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor={ids.livre} className={labelClass}>Outro valor (R$)</label>
                      <input id={ids.livre} inputMode="decimal" value={livre} onChange={(e) => setLivre(e.target.value.replace(/[^\d,]/g, ''))} placeholder="Mínimo R$ 5" className={inputClass} />
                    </div>
                    <label htmlFor={ids.mensal} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
                      <input id={ids.mensal} type="checkbox" checked={mensal} onChange={(e) => setMensal(e.target.checked)} className="h-5 w-5 accent-primary" />
                      Quero doar todo mês
                    </label>
                    <ButtonLink
                      to={`/checkout?campanha=${c.slug}&valor=${escolhido ?? 0}${mensal ? '&mensal=1' : ''}`}
                      variant="highlight"
                      className={cx('justify-center', !valido && 'pointer-events-none opacity-45')}
                      aria-disabled={!valido}
                      tabIndex={valido ? undefined : -1}
                    >
                      {valido ? `Doar ${formatBRL(escolhido!)}${mensal ? ' por mês' : ''}` : 'Escolha um valor'}
                    </ButtonLink>
                    <p className="text-xs text-ink-muted">Pix, cartão ou boleto. A doação mensal é feita no cartão.</p>
                  </section>
                </div>
              </div>
            </>
          );
        })()
      )}
    </div>
  );
}
