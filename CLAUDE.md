# GERA app

App React 18 + TypeScript + Vite da plataforma GERA (Comitê Social ACIJS). O design system é o pacote local `@gera/design-system` em `packages/gera-ds` (dependência `file:`).

## Regras

- Leia `packages/gera-ds/README.md` (e `src/tokens/tokens.json`) antes de criar qualquer tela.
- Use sempre os componentes de `@gera/design-system` em vez de recriar (Button, PortalVerbo, StatusBadge + volunteerStatus, KpiCard, Rack, CampaignProgress, Carteirinha, ValidationResult, EventCard, GeraLogo/GeraSymbol, formatBRL/formatNumber/formatHours).
- Nenhuma cor fora dos tokens: nada de hex, rgb ou cores padrão do Tailwind no app; só as classes do preset (`bg-brand-deep`, `text-ink-muted`, `bg-highlight text-on-highlight`...) ou `var(--token)`.
- Amarelo (`highlight`) só para dinheiro e metas; limão (`secondary`) nunca como texto em fundo claro.
- Todo o texto da interface em português do Brasil.

## Estilos

`src/main.tsx` importa, nesta ordem: `styles/tailwind-base.css` (preflight), `@gera/design-system/gera.css` e `styles/tailwind.css` (components + utilities). O preflight precisa vir antes do CSS do pacote porque zera o fundo de `[type='button']`, que tem a mesma especificidade das classes `.gr-btn--*`.

## Comandos

- `npm run dev`: servidor de desenvolvimento
- `npm run build`: `tsc -b` + `vite build` (rode antes de cada commit)
