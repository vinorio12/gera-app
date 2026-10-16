// Cartões do site público que o design system ainda não tem (produto, oportunidade, entidade).
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { formatHours, formatNumber } from '@gera/design-system';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { formatDateShort, formatMoeda } from '../../lib/format';
import type { EntidadePublica, OportunidadePublica, ProdutoPublico } from '../../services/publico';

/** Faixa sem foto: o grafismo de engrenagem sobre o verde da marca. */
export function FaixaEngrenagem({ rotulo, className = 'h-28' }: { rotulo?: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-brand-deep ${className}`}>
      <div aria-hidden className="gr-gear-mark absolute -right-8 -top-10 h-36 w-36 opacity-30" />
      <div aria-hidden className="gr-gear-mark absolute right-24 top-10 h-14 w-14 opacity-40" />
      {rotulo && (
        <span className="absolute bottom-3 left-4 font-display text-lg uppercase leading-5 tracking-[0.08em] text-on-brand-deep">
          {rotulo}
        </span>
      )}
    </div>
  );
}

export function EstoqueTag({ estoque }: { estoque: number }) {
  if (estoque === 0) return <span className="rounded-sm bg-bg-subtle px-2 py-1 text-xs font-bold text-ink-muted">Esgotado</span>;
  if (estoque <= 3)
    return (
      <span className="rounded-sm bg-accent-soft px-2 py-1 text-xs font-bold text-on-accent-soft">
        {estoque === 1 ? 'Última unidade' : `Últimas ${estoque} unidades`}
      </span>
    );
  return <span className="text-xs text-ink-muted">{formatNumber(estoque)} em estoque</span>;
}

export function ProdutoCard({ produto: p }: { produto: ProdutoPublico }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-bg-card shadow-card">
      <FaixaEngrenagem rotulo={p.tipo} />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-base font-bold leading-6 text-ink">
          <Link to={`/loja/${p.slug}`} className="hover:text-link hover:underline">
            {p.nome}
          </Link>
        </h3>
        <p className="text-sm text-ink-muted">{p.entidadeNome}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          <span className="text-lg font-bold tabular-nums text-ink">{formatMoeda(p.preco)}</span>
          <EstoqueTag estoque={p.estoque} />
        </div>
        {p.estoque > 0 ? (
          <ButtonLink to={`/loja/${p.slug}`} variant="highlight" className="justify-center" aria-label={`Comprar ${p.nome}`}>
            Comprar
          </ButtonLink>
        ) : (
          <ButtonLink to={`/loja/${p.slug}`} variant="secondary" className="justify-center">
            Ver produto
          </ButtonLink>
        )}
      </div>
    </article>
  );
}

/** Cartão de oportunidade do site. Com `previa`, sai sem links (é a prévia no formulário da entidade). */
export function OportunidadeCard({ oportunidade: o, previa = false }: { oportunidade: OportunidadePublica; previa?: boolean }) {
  const restantes = o.vagas - o.inscritos.length;
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base uppercase leading-5 tracking-[0.08em] text-ink-muted">{o.area}</p>
          <h3 className="break-words text-lg font-bold leading-6 text-ink">
            {previa ? (
              o.titulo
            ) : (
              <Link to={`/oportunidades/${o.id}`} className="hover:text-link hover:underline">
                {o.titulo}
              </Link>
            )}
          </h3>
          <p className="text-sm text-ink-muted">{o.entidadeNome}</p>
        </div>
        <span className="shrink-0 rounded-sm bg-primary-soft px-2 py-1 text-xs font-bold text-on-primary-soft">
          {restantes > 0 ? `${restantes} ${restantes === 1 ? 'vaga' : 'vagas'}` : 'Lotada'}
        </span>
      </div>
      <ul className="flex flex-col gap-1 text-sm text-ink-muted">
        <li className="flex items-center gap-2">
          <CalendarDays size={16} aria-hidden /> {formatDateShort(o.data)} · {o.turno}
        </li>
        <li className="flex items-center gap-2">
          <Clock size={16} aria-hidden /> {formatHours(o.horas)}
          {o.usaFormacao && ' · usa sua formação'}
        </li>
        <li className="flex items-center gap-2">
          <MapPin size={16} aria-hidden /> {o.local}
        </li>
      </ul>
      {previa ? (
        <span className="gr-btn gr-btn--primary mt-auto justify-center" aria-hidden>
          Quero participar
        </span>
      ) : (
        <ButtonLink to={`/oportunidades/${o.id}`} className="mt-auto justify-center" aria-label={`Quero participar: ${o.titulo}`}>
          Quero participar
        </ButtonLink>
      )}
    </article>
  );
}

export function EntidadeCard({ entidade: e }: { entidade: EntidadePublica }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-bg-card shadow-card">
      <FaixaEngrenagem rotulo={e.bairro} className="h-20" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg font-bold leading-6 text-ink">
          <Link to={`/entidades/${e.slug}`} className="hover:text-link hover:underline">
            {e.nome}
          </Link>
        </h3>
        <p className="text-sm text-ink-muted">{e.causa}</p>
        <p className="mt-auto pt-2 text-sm text-ink">
          <strong className="tabular-nums">{formatNumber(e.voluntariosAtivos)}</strong> voluntários ativos ·{' '}
          <strong className="tabular-nums">{formatHours(e.horasNoAno)}</strong> no ano
        </p>
      </div>
    </article>
  );
}

/** Seção da home com título e "ver todas". */
export function Secao({ id, titulo, sobretitulo, verTodas, children }: { id: string; titulo: string; sobretitulo?: string; verTodas?: { to: string; label: string }; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mx-auto max-w-[1200px] px-4 py-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          {sobretitulo && <p className="font-display text-base leading-5 tracking-[0.08em] text-ink-muted">{sobretitulo}</p>}
          <h2 id={id} className="text-2xl font-bold text-ink">
            {titulo}
          </h2>
        </div>
        {verTodas && (
          <Link to={verTodas.to} className="inline-flex min-h-11 items-center font-semibold text-link hover:underline">
            {verTodas.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
