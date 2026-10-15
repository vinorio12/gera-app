# GERA app

App React 18 + TypeScript + Vite da plataforma GERA (Comitê Social ACIJS). O design system é o pacote local `@gera/design-system` em `packages/gera-ds` (dependência `file:`).

## Regras

- Leia `packages/gera-ds/README.md` (e `src/tokens/tokens.json`) antes de criar qualquer tela.
- Use sempre os componentes de `@gera/design-system` em vez de recriar (Button, PortalVerbo, StatusBadge + volunteerStatus, KpiCard, Rack, CampaignProgress, Carteirinha, ValidationResult, EventCard, GeraLogo/GeraSymbol, formatBRL/formatNumber/formatHours).
- Nenhuma cor fora dos tokens: nada de hex, rgb ou cores padrão do Tailwind no app; só as classes do preset (`bg-brand-deep`, `text-ink-muted`, `bg-highlight text-on-highlight`...) ou `var(--token)`.
- Amarelo (`highlight`) só para dinheiro e metas; limão (`secondary`) nunca como texto em fundo claro.
- Todo o texto da interface em português do Brasil.

## Estrutura

- `src/app/App.tsx`: providers (tema, sessão, ícones Lucide com traço 1.75) e rotas. Cada portal é carregado sob demanda.
- `src/features/{publico,admin,entidade,voluntario,parceiro}`: telas por domínio. Cada portal tem seu `*Portal.tsx` com as rotas aninhadas.
- `src/components/layout`: `PublicLayout` (cabeçalho + rodapé), `DeskLayout` (Admin e Entidade, barra lateral recolhível) e `MobileLayout` (Voluntário e Parceiro, abas inferiores).
- `src/components/shared`: peças do app que o pacote não tem (EmptyState, PageHeader, PageLoader, RequireRole...). `src/components/ui`: extensões finas do design system (ButtonLink usa as classes `gr-btn`).
- `src/lib/auth.tsx`: sessão simulada ("entrar como") e perfis, incluindo a Bruna Costa (cadastro aguardando aprovação) para demonstrar a jornada; `src/lib/portals.ts`: itens de navegação de cada portal; `src/lib/theme.tsx`: tema claro/escuro via `data-theme`.
- `src/types/domain.ts`: entidades do domínio. `src/mocks`: dados de exemplo determinísticos (`seed.ts`) e o "banco" em memória salvo no navegador (`db.ts`). Só `src/services` importa de `src/mocks`.
- `src/services`: funções assíncronas por domínio (amanhã chamam a API) e `hooks.ts` com os hooks do TanStack Query. As telas usam só os hooks. Toda mutação passa por `useGeraMutation`, que recarrega as consultas.
- `src/lib/carteirinha.ts`: regras puras da carteirinha (4 passos, status pela regra dos 6 meses, validade, elegibilidade e o QR temporário).
- Telas ainda não construídas usam `ScreenPlaceholder` com o resumo do item de navegação. Ao construir uma, troque a rota provisória pela tela de verdade.

## Estilos

`src/main.tsx` importa, nesta ordem: `styles/tailwind-base.css` (preflight), `@gera/design-system/gera.css` e `styles/tailwind.css` (components + utilities). O preflight precisa vir antes do CSS do pacote porque zera o fundo de `[type='button']`, que tem a mesma especificidade das classes `.gr-btn--*`.

O `tailwind.config.ts` remove a paleta padrão do Tailwind (`bg-red-500` nem é gerada) e `scripts/check-tokens.mjs` falha o build se aparecer hex, `rgb()`/`hsl()` ou classe da paleta padrão em `src/` ou no `index.html`. Para o logo sobre fundo claro/escuro do tema, use `BrandLogo` (troca para o negativo no escuro).

## Comandos

- `npm run dev`: servidor de desenvolvimento
- `npm run build`: checagem de cores + `tsc -b` + `vite build` (rode antes de cada commit)
- `npm run check:tokens`: só a checagem de cores
- `npm run build:static`: prévia para publicar como página no claude.ai (`dist-static/preview.html` + `assets/`). Usa `MemoryRouter`, porque a página roda num quadro sem URLs próprias.
