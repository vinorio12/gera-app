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
- `src/types/domain.ts`: entidades do domínio. `src/mocks`: dados de exemplo determinísticos (`seed.ts`; ao mudar a forma dos dados, suba `DB_VERSION` para descartar o que está salvo nos navegadores) e o "banco" em memória salvo no navegador (`db.ts`). Só `src/services` importa de `src/mocks`.
- `src/services`: funções assíncronas por domínio (amanhã chamam a API) e `hooks.ts` com os hooks do TanStack Query. As telas usam só os hooks. Toda mutação passa por `useGeraMutation`, que recarrega as consultas.
- `src/services/indicadores.ts`: indicadores dos painéis por período (com comparação ao período anterior só quando há dados para comparar). Os gráficos usam Recharts com cores lidas dos tokens por `useTokenColors` (o Recharts escreve a cor direto no SVG); rótulos e valores sempre em texto, e todo gráfico tem "Ver como tabela".
- `src/lib/carteirinha.ts`: regras puras da carteirinha (4 passos, status pela regra dos 6 meses, validade, elegibilidade e o QR temporário).
- Site público em `src/features/publico` (dados de `src/services/publico.ts`, sem dados pessoais). Componentes do design system que renderizam `<a href>` (como o `EventCard`) ficam dentro de `RouterLinks`, para navegar pelo router sem recarregar (e funcionar na prévia). O carrinho da loja fica em `src/lib/cart.tsx`.
- Pagamentos: `src/services/pagamentos.ts` define a interface `PaymentProvider` (cobrança Pix, cartão, boleto, assinatura mensal, consulta de status) e o provedor simulado, que aprova em segundos (cartão de teste 4111 1111 1111 1111 aprova; final 0002 recusa). Para usar um provedor real, implemente a interface e troque só `paymentProvider`. `src/services/pedidos.ts` cria o pedido "aguardando" e, quando o pagamento é aprovado, aplica o efeito (entrada no financeiro, estoque, campanha, ingressos com QR).
- Formulários com várias etapas usam React Hook Form + Zod (ver `CadastroPage`): valide por etapa com `trigger` e revalide o campo com erro enquanto a pessoa digita.
- Dinheiro: `formatBRL` (design system) arredonda para reais inteiros e serve para indicadores; para preços e valores a pagar use `formatMoeda` (`src/lib/format.ts`, com centavos).
- Telas ainda não construídas usam `ScreenPlaceholder` com o resumo do item de navegação. Ao construir uma, troque a rota provisória pela tela de verdade (hoje todas as telas da navegação estão prontas).
- Gestão da entidade em `src/services/gestao.ts` (oportunidades, eventos e check-in de ingressos `GERA-INGRESSO:<id>`, loja e estoque com movimentos, campanhas, patrocinadores). Toda função recebe a entidade e confere que o dado é dela (multi-tenant).
- Financeiro (`financeiro.ts`), certificados (`certificados.ts`), relatórios (`relatorios.ts`), admin (`admin.ts`), configurações da entidade (`configuracoes.ts`), benefícios e aprovação (`beneficios.ts`), perfil e LGPD (`perfil.ts`) e notificações (`notificacoes.ts`) seguem o mesmo padrão.
- Auditoria: ações sensíveis (aprovar, desligar, reativar, horas à mão, despesa, certificados, termo, parceiros) chamam `auditar()` de `src/services/sessao.ts`. Quem fez vem de `definirAtor`, que o `AuthProvider` chama a cada sessão (com a API, vem do token).
- Documentos exportáveis usam o modelo `Documento` (`src/lib/documento.ts`): a mesma estrutura vira prévia (`DocumentoView`), PDF (`src/lib/pdf.ts`, jsPDF carregado sob demanda, cores de `src/lib/coresPdf.ts` lidas do `tokens.json`) e CSV (BOM, ";" e números pt-BR). Use `Exportar`, `CertificadoDownload` e `ComprovanteDownload`. Todo download passa por `salvarArquivo` (`src/lib/salvarArquivo.ts`): (a) a capacidade `downloads` do claude.ai (`window.claude.use`), na página publicada; (b) o `<a download>` de `baixarArquivo` (`src/lib/download.ts`, devolve false em quadro); (c) só então `PreviaImpressao`, que num quadro não oferece "Imprimir". O `.ics` não é aceito pelo claude.ai: em quadro, `AgendaCompartilhar` mostra o link do Google Agenda (`linkGoogleAgenda`).
- Regras puras com teste: `src/lib/carteirinha.ts`, `listaEspera.ts`, `marcos.ts`, `notificacoes.ts`, `agenda.ts` (.ics e link do WhatsApp), `comprovante.ts`. Prefira pôr regra nova em `src/lib` (função pura) e chamá-la do serviço.
- Peças compartilhadas novas: `Campo` (rótulo + campo + erro/dica, em `components/ui`), `cardClass`, `Chips` (filtros), `ConfirmDialog`, `VoltarLink`, `AgendaCompartilhar`, `MarcosDeHoras`, `DisponibilidadeGrade`, `TermoTexto`, `FluxoMensalChart`, `ErrorBoundary` (um por portal e no site).
- A cor de destaque da entidade é sempre um token de portal (`CorDestaque` + `src/lib/corDestaque.ts`), nunca um hex.
- Tabelas largas ficam num contêiner `relative overflow-x-auto` com `tabIndex={0} role="region" aria-label` (o `relative` segura os `sr-only`, e o foco atende o axe). `fieldset` com tabela dentro precisa de `min-w-0`.
- "Ver como entidade": o administrador abre o portal da entidade com `verComoEntidade` (`src/lib/auth.tsx`); o `DeskLayout` mostra a faixa fixa "Você está vendo como X · Voltar ao admin".
- PWA: `public/manifest.webmanifest`, ícones em `public/icons` (gerados do pacote com `npm run icones`) e `public/sw.js` escrito à mão. O registro fica em `src/main.tsx`, só em produção e fora de iframe. A carteirinha guarda o último painel (`src/lib/carteirinhaOffline.ts`) e mostra "Offline · status sincronizado em …".
- Integração com a API real, login e pagamentos: veja `docs/INTEGRACAO.md`.

## Estilos

`src/main.tsx` importa, nesta ordem: `styles/tailwind-base.css` (preflight), `@gera/design-system/gera.css` e `styles/tailwind.css` (components + utilities). O preflight precisa vir antes do CSS do pacote porque zera o fundo de `[type='button']`, que tem a mesma especificidade das classes `.gr-btn--*`.

O `tailwind.config.ts` remove a paleta padrão do Tailwind (`bg-red-500` nem é gerada) e `scripts/check-tokens.mjs` falha o build se aparecer hex, `rgb()`/`hsl()` ou classe da paleta padrão em `src/` ou no `index.html`. Para o logo sobre fundo claro/escuro do tema, use `BrandLogo` (troca para o negativo no escuro).

## Comandos

- `npm run dev`: servidor de desenvolvimento
- `npm run build`: checagem de cores + `tsc -b` + `vite build` (rode antes de cada commit)
- `npm run check:tokens`: só a checagem de cores
- `npm run build:static`: prévia para publicar como página no claude.ai (`dist-static/preview.html` + `assets/`). Usa `MemoryRouter`, porque a página roda num quadro sem URLs próprias.
- `npm test`: testes de unidade (Vitest, arquivos `src/**/*.test.ts`, ambiente jsdom). Os serviços rodam sobre os dados de exemplo: chame `resetDb()` no `beforeEach`.
- `npm run test:e2e`: Playwright (`e2e/`), com jornadas dos 4 portais e do site e a varredura de acessibilidade com axe (todas as rotas, claro, escuro e 360 px; falha com violação séria ou crítica). Sobe o próprio servidor na porta 4318, sem mexer no 5173. Na primeira vez: `npx playwright install chromium`. Ao criar uma rota, inclua-a em `e2e/acessibilidade.spec.ts`.
- CI em `.github/workflows/ci.yml`: build, Vitest e Playwright a cada push.
