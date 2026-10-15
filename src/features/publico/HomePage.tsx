import { PortalVerbo, type Portal } from '@gera/design-system';
import { ButtonLink } from '../../components/ui/ButtonLink';

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
