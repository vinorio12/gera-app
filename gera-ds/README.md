# @gera/design-system

Design system da **GERA**, a plataforma do Comitê Social ACIJS. Tudo que está no design system publicado, em código: tokens, CSS dos componentes, preset do Tailwind, logos e componentes React + TypeScript.

## O que tem aqui

| Caminho | O que é |
|---|---|
| `src/tokens/tokens.json` | fonte da verdade dos tokens (cores claro/escuro, tipografia, espaços, raios, sombras, dentes da cremalheira) |
| `src/tokens/tokens.css` | as CSS variables geradas, com tema claro, escuro e `prefers-color-scheme` |
| `src/tokens/tailwind-preset.ts` | preset do Tailwind v3 apontando para as variables |
| `src/styles/gera.css` | tokens + componentes num import só |
| `src/assets/*.svg` | logo principal, sem tagline, negativo, mono, símbolo e ícone de app |
| `src/components/*` | componentes React |
| `demo/index.html` | todos os componentes renderizados, abra no navegador |

## Instalar no projeto

Copie a pasta para dentro do repositório (por exemplo `packages/gera-ds` num monorepo, ou `src/design-system` num app Vite) e importe:

```ts
// main.tsx
import '@gera/design-system/gera.css'; // ou o caminho relativo para src/styles/gera.css
```

```ts
// tailwind.config.ts
import geraPreset from '@gera/design-system/tailwind-preset';
export default { presets: [geraPreset], content: ['./src/**/*.{ts,tsx}'] };
```

Com o preset, classes como `bg-brand-deep`, `text-ink-muted`, `bg-highlight text-on-highlight`, `font-display`, `rounded-lg`, `shadow-card` e `animate-gear-spin` passam a existir. Tema escuro: `document.documentElement.dataset.theme = 'dark'`.

## Componentes

```tsx
import { GeraLogo, GeraSymbol, Button, StatusBadge, volunteerStatus, PortalVerbo, KpiCard,
         CampaignProgress, Carteirinha, ValidationResult, EventCard, formatBRL } from '@gera/design-system';

<PortalVerbo portal="entidade" />                       // IMPULSIONAR
<Button variant="highlight">Doar agora</Button>          // amarelo só para dinheiro
<StatusBadge status={volunteerStatus({ signupDate, lastActionDate })} />
<KpiCard label="Valor arrecadado" value={formatBRL(32500)} source="gateway de pagamento" />
<CampaignProgress title="Reforma da sede" organization="AMA Jaraguá" raised={32500} goal={50000} daysLeft={18} />
<Carteirinha name="Alex Silva" organizations={['AMA Jaraguá']} registration="JS-2026-004812"
             hours={125} issuedAt="15/10/2026" validUntil="15/04/2027" status="ativo"
             qr={<QRCodeSVG value={tokenTemporario} />} />
<GeraSymbol size={40} spinning />                         // carregamento
```

| Componente | Para quê |
|---|---|
| `GeraLogo`, `GeraSymbol` | logo vetorial (default, negative, mono); o símbolo gira como loader |
| `Button` | primary, highlight (dinheiro), secondary, ghost, danger |
| `StatusBadge` + `volunteerStatus()` | Novo, Ativo, Inativo, Desligado, com a regra dos 6 meses calculada |
| `PortalVerbo` | ENGAJAR, IMPULSIONAR, CONECTAR, AMPLIAR |
| `KpiCard`, `Rack` | indicador com fonte obrigatória e cremalheira |
| `CampaignProgress` | barra em cremalheira com engrenagem na ponta |
| `Carteirinha` | carteirinha digital; esmaece se não estiver Ativa |
| `ValidationResult` | resposta do app do Parceiro ao ler o QR |
| `EventCard` | vitrine de eventos, gratuito, pago ou esgotado |

## Regras que o código já respeita

Cores só por token, nunca hex solto. Amarelo (`highlight`) só para dinheiro e metas. Limão (`secondary`) nunca como texto em fundo claro. Texto verde pequeno sobre `bg-page` usa `link`. Bebas Neue é só caixa alta. Toda animação de engrenagem para com `prefers-reduced-motion`. Números em pt-BR com `formatBRL`, `formatNumber` e `formatHours`.

## Para agentes (Claude Code, Lovable, Cursor)

Antes de criar telas, leia este README e `src/tokens/tokens.json`. Use os componentes daqui em vez de recriar, e estilize o resto com as classes do preset. Nada de cores fora dos tokens, gradientes, glassmorphism ou engrenagens 3D.

`npm run typecheck` confere os tipos.
