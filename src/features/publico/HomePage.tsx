import { Link } from 'react-router-dom';
import { KpiCard, PortalVerbo, formatBRL, formatHours, formatNumber, type Portal } from '@gera/design-system';
import { Skeleton } from '../../components/shared/States';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { useCampanhas, useEventos, useOportunidades, useParceiros, useProdutos, useResumoPublico } from '../../services/hooks';
import { GradeCampanhas } from './CampanhasPages';
import { GradeEventos } from './EventosPages';
import { OportunidadeCard, ProdutoCard, Secao } from './cards';

const GEARS: Array<{ portal: Portal; text: string }> = [
  { portal: 'voluntario', text: 'Você escolhe uma ação, faz o check-in e ganha a carteirinha com descontos nas empresas parceiras.' },
  { portal: 'entidade', text: 'A entidade organiza voluntários, eventos, loja e campanhas num lugar só.' },
  { portal: 'parceiro', text: 'A empresa oferece benefícios e valida a carteirinha pelo celular.' },
  { portal: 'admin', text: 'O comitê acompanha todas as entidades e presta contas com números de verdade.' },
];

export function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-brand-deep text-on-brand-deep">
        {/* Engrenagem limão do design system (gr-gear-mark) girando devagar no fundo. */}
        <div
          aria-hidden
          className="gr-gear-mark pointer-events-none absolute -right-28 -top-28 h-[440px] w-[440px] animate-gear-spin opacity-20 motion-reduce:animate-none md:-right-16"
          style={{ animationDuration: '60s' }}
        />
        <div className="relative mx-auto max-w-[1200px] px-4 py-16 md:py-24">
          <h1 className="font-display text-[48px] leading-[46px] md:text-[64px] md:leading-[60px]">
            GERE IMPACTO
            <br />
            EM JARAGUÁ
          </h1>
          <p className="mt-4 text-lg font-semibold">A engrenagem social do Comitê Social ACIJS</p>
          <p className="mt-2 font-display text-base leading-5 tracking-[0.08em] opacity-90">
            CONECTAR · IMPULSIONAR · AMPLIAR · ENGAJAR
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/cadastro">Quero ser voluntário</ButtonLink>
            <ButtonLink to="/campanhas" variant="highlight">
              Apoiar uma campanha
            </ButtonLink>
          </div>
        </div>
      </section>

      <Contadores />
      <Vitrines />
      <section className="mx-auto max-w-[1200px] px-4 py-12" aria-labelledby="como-gira">
        <p className="font-display text-base leading-5 tracking-[0.08em] text-ink-muted">QUATRO ENGRENAGENS</p>
        <h2 id="como-gira" className="mb-6 text-2xl font-bold text-ink">
          Como a GERA se move
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {GEARS.map(({ portal, text }) => (
            <li key={portal} className="flex flex-col gap-3">
              <div>
                <PortalVerbo portal={portal} />
              </div>
              <p className="text-ink-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

const gradeSkeleton = (n: number) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Carregando">
    {Array.from({ length: n }, (_, i) => (
      <Skeleton key={i} className="h-56 border border-border" />
    ))}
  </div>
);

/** Números consolidados, cada um com a fonte. */
function Contadores() {
  const resumo = useResumoPublico();
  return (
    <section aria-label="O impacto em números" className="mx-auto max-w-[1200px] px-4 pt-10">
      {resumo.data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard className="min-w-0" label="Entidades" value={formatNumber(resumo.data.entidades)} source="cadastro do Comitê Social" />
          <KpiCard className="min-w-0" label="Voluntários ativos" value={formatNumber(resumo.data.voluntarios)} source="ação nos últimos 6 meses" />
          <KpiCard className="min-w-0" label="Horas doadas" value={formatHours(resumo.data.horas)} source="banco de horas das entidades" />
          <KpiCard className="min-w-0" label="Arrecadado em 12 meses" value={formatBRL(resumo.data.arrecadado12m)} source="ingressos, loja, campanhas, doações e patrocínios" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-40 border border-border" />
          ))}
        </div>
      )}
    </section>
  );
}

function Vitrines() {
  const oportunidades = useOportunidades({});
  const eventos = useEventos();
  const campanhas = useCampanhas();
  const produtos = useProdutos();
  const parceiros = useParceiros();

  return (
    <>
      <Secao id="h-oport" sobretitulo="ENGAJAR" titulo="Oportunidades em destaque" verTodas={{ to: '/oportunidades', label: 'Ver todas as oportunidades' }}>
        {oportunidades.data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {oportunidades.data.slice(0, 3).map((o) => (
              <OportunidadeCard key={o.id} oportunidade={o} />
            ))}
          </div>
        ) : (
          gradeSkeleton(3)
        )}
      </Secao>
      <Secao id="h-eventos" titulo="Próximos eventos" verTodas={{ to: '/eventos', label: 'Ver a agenda' }}>
        {eventos.data ? <GradeEventos eventos={eventos.data.slice(0, 3)} /> : gradeSkeleton(3)}
      </Secao>
      <Secao id="h-camp" sobretitulo="IMPULSIONAR" titulo="Campanhas ativas" verTodas={{ to: '/campanhas', label: 'Ver todas as campanhas' }}>
        {campanhas.data ? <GradeCampanhas campanhas={campanhas.data.slice(0, 3)} /> : gradeSkeleton(3)}
      </Secao>
      <Secao id="h-loja" titulo="Loja solidária" verTodas={{ to: '/loja', label: 'Ver a loja' }}>
        {produtos.data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {produtos.data
              .filter((p) => p.estoque > 0)
              .slice(0, 4)
              .map((p) => (
                <ProdutoCard key={p.id} produto={p} />
              ))}
          </div>
        ) : (
          gradeSkeleton(4)
        )}
      </Secao>
      <Secao id="h-parc" sobretitulo="CONECTAR" titulo="Empresas parceiras" verTodas={{ to: '/parceiros', label: 'Ver benefícios' }}>
        <ul className="flex flex-wrap gap-2">
          {parceiros.data?.map((p) => (
            <li key={p.id}>
              <Link
                to="/parceiros"
                className="inline-flex min-h-11 items-center rounded-pill border border-border-strong bg-bg-card px-4 text-sm font-semibold text-ink hover:border-primary"
              >
                {p.nome}
              </Link>
            </li>
          ))}
        </ul>
      </Secao>
    </>
  );
}
