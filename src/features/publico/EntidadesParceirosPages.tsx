import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { KpiCard, cx, formatHours, formatNumber } from '@gera/design-system';
import { EmptyState } from '../../components/shared/EmptyState';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, Skeleton, SkeletonList } from '../../components/shared/States';
import { useCampanhas, useEntidadePublica, useEntidadesPublicas, useEventos, useOportunidades, useParceiros } from '../../services/hooks';
import type { CategoriaBeneficio } from '../../types/domain';
import { GradeCampanhas } from './CampanhasPages';
import { GradeEventos } from './EventosPages';
import { EntidadeCard, FaixaEngrenagem, OportunidadeCard } from './cards';

export function EntidadesPage() {
  const entidades = useEntidadesPublicas();
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <PageHeader title="Entidades" description="As entidades sociais que movem a engrenagem do Comitê Social ACIJS." />
      {entidades.isPending ? (
        <SkeletonList rows={3} />
      ) : entidades.isError ? (
        <ErrorState error={entidades.error} onRetry={() => entidades.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entidades.data.map((e) => (
            <EntidadeCard key={e.id} entidade={e} />
          ))}
        </div>
      )}
    </div>
  );
}

export function EntidadeDetalhePage() {
  const { slug = '' } = useParams();
  const entidade = useEntidadePublica(slug);
  const id = entidade.data?.id;
  // As listas só carregam depois de saber qual é a entidade.
  const oportunidades = useOportunidades({ entidadeId: id ?? '__nenhuma__' });
  const eventos = useEventos(id ?? '__nenhuma__');
  const campanhas = useCampanhas(id ?? '__nenhuma__');

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <Link to="/entidades" className="mb-4 inline-flex min-h-11 items-center gap-2 font-semibold text-link hover:underline">
        <ArrowLeft size={18} aria-hidden /> Entidades
      </Link>
      {entidade.isPending ? (
        <Skeleton className="h-80 border border-border" />
      ) : entidade.isError ? (
        <ErrorState error={entidade.error} />
      ) : (
        <div className="flex flex-col gap-8">
          <div className="overflow-hidden rounded-lg">
            <FaixaEngrenagem rotulo={entidade.data.areas.join(' · ')} className="h-40" />
          </div>
          <PageHeader title={entidade.data.nome} description={entidade.data.causa} />
          <p className="-mt-6 flex items-center gap-2 text-ink-muted">
            <MapPin size={18} aria-hidden /> {entidade.data.bairro}, Jaraguá do Sul
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard className="min-w-0" label="Voluntários ativos" value={formatNumber(entidade.data.voluntariosAtivos)} source="voluntários com ação nos últimos 6 meses" />
            <KpiCard className="min-w-0" label="Horas no ano" value={formatHours(entidade.data.horasNoAno)} source="banco de horas da entidade" />
          </div>
          {!!oportunidades.data?.length && (
            <section aria-labelledby="ent-oport" className="flex flex-col gap-4">
              <h2 id="ent-oport" className="text-2xl font-bold text-ink">Oportunidades</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {oportunidades.data.map((o) => (
                  <OportunidadeCard key={o.id} oportunidade={o} />
                ))}
              </div>
            </section>
          )}
          {!!eventos.data?.length && (
            <section aria-labelledby="ent-eventos" className="flex flex-col gap-4">
              <h2 id="ent-eventos" className="text-2xl font-bold text-ink">Eventos</h2>
              <GradeEventos eventos={eventos.data} />
            </section>
          )}
          {!!campanhas.data?.length && (
            <section aria-labelledby="ent-camp" className="flex flex-col gap-4">
              <h2 id="ent-camp" className="text-2xl font-bold text-ink">Campanhas</h2>
              <GradeCampanhas campanhas={campanhas.data} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

const CATEGORIAS: Array<CategoriaBeneficio | undefined> = [undefined, 'Alimentação', 'Saúde', 'Educação'];

export function ParceirosPage() {
  const parceiros = useParceiros();
  const [categoria, setCategoria] = useState<CategoriaBeneficio | undefined>();
  const visiveis = parceiros.data?.filter((p) => !categoria || p.categoria === categoria) ?? [];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <PageHeader
        title="Parceiros"
        description="Empresas que reconhecem quem gera impacto. Os benefícios valem para quem tem a carteirinha GERA ativa."
      />
      <div role="group" aria-label="Categoria" className="mb-6 flex flex-wrap gap-2">
        {CATEGORIAS.map((c) => (
          <button
            key={c ?? 'todas'}
            type="button"
            aria-pressed={categoria === c}
            onClick={() => setCategoria(c)}
            className={cx(
              'min-h-11 rounded-pill border px-4 text-sm font-semibold',
              categoria === c ? 'border-primary bg-primary-soft text-on-primary-soft' : 'border-border-strong bg-bg-card text-ink-muted',
            )}
          >
            {c ?? 'Todas'}
          </button>
        ))}
      </div>
      {parceiros.isPending ? (
        <SkeletonList rows={3} />
      ) : parceiros.isError ? (
        <ErrorState error={parceiros.error} onRetry={() => parceiros.refetch()} />
      ) : visiveis.length === 0 ? (
        <EmptyState title="Nenhum parceiro nessa categoria ainda" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visiveis.map((p) => (
            <article key={p.id} className="flex flex-col gap-3 rounded-lg border border-border bg-bg-card p-4 shadow-card">
              <div>
                <p className="font-display text-base uppercase leading-5 tracking-[0.08em] text-ink-muted">{p.categoria}</p>
                <h2 className="text-lg font-bold text-ink">{p.nome}</h2>
                <p className="text-sm text-ink-muted">{p.endereco}</p>
              </div>
              <ul className="flex flex-col gap-2">
                {p.beneficios.map((b) => (
                  <li key={b.id} className="rounded-md bg-secondary-soft px-3 py-2">
                    <p className="font-semibold text-on-secondary-soft">{b.titulo}</p>
                    <p className="text-sm text-ink-muted">{b.regra}</p>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
