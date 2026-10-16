# Integração da GERA com o back-end

Este protótipo roda inteiro no navegador: os dados de exemplo ficam em memória e no `localStorage`, os pagamentos são simulados e o login é um seletor "entrar como". Este guia explica o que trocar para ligar a GERA a uma API de verdade sem mexer nas telas.

## 1. Como o app está montado

```
telas (src/features)  →  hooks (src/services/hooks.ts)  →  serviços (src/services/*.ts)  →  dados de exemplo (src/mocks)
```

- As telas só usam os hooks do TanStack Query (`useX` para ler) e `useGeraMutation(funcao)` para gravar. Nenhuma tela importa de `src/mocks`.
- Cada serviço é uma função `async` com entrada e saída tipadas (`src/types/domain.ts` e os tipos exportados no próprio serviço). **A troca pela API acontece dentro dessas funções**: mantenha a assinatura e troque o corpo.
- Erros de regra (validação, permissão, "vagas esgotadas") são `ServiceError` com a mensagem pronta para a pessoa ler, em português. A tela mostra `mensagemDeErro(erro)`.
- `useGeraMutation` recarrega todas as consultas depois de uma gravação. Com a API real, dá para trocar por invalidações por chave (as chaves estão em `hooks.ts`).

## 2. Passo a passo para trocar os serviços pela API

1. Crie `src/services/api.ts` com um cliente HTTP (fetch) que:
   - manda o token de acesso no cabeçalho `Authorization`;
   - converte respostas 4xx com `{ mensagem }` em `throw new ServiceError(mensagem)`;
   - converte 401 em "sessão expirada" (o `AuthProvider` manda para `/entrar`).
2. Em cada arquivo de `src/services`, troque `getDb()`, `commit()` e `delay()` por chamadas ao cliente. Exemplo:

   ```ts
   // antes
   export async function listarCampanhasGestao(entidadeId: string): Promise<CampanhaGestao[]> {
     await delay();
     return getDb().campanhas.filter(...)
   }
   // depois
   export const listarCampanhasGestao = (entidadeId: string) =>
     api.get<CampanhaGestao[]>(`/entidades/${entidadeId}/campanhas`);
   ```
3. As regras que hoje estão nos serviços (estoque, vagas, fila de espera, multi-tenant, auditoria) passam para o servidor. As regras puras de `src/lib` (carteirinha, lista de espera, marcos, notificações, agenda) podem continuar no cliente para a interface responder rápido, mas o servidor é quem decide.
4. Apague `src/mocks` e a função `restaurarDadosDeExemplo` (botão na tela de login e no error boundary) quando nada mais importar de lá.

### Funções e formatos

Os formatos são os tipos de `src/types/domain.ts` (datas `yyyy-MM-dd` ou ISO completo, valores em reais com centavos) e os tipos exportados em cada serviço. As rotas abaixo são sugestões.

| Serviço | Funções | Rota sugerida |
|---|---|---|
| `publico.ts` (sem login) | `obterResumoPublico`, `listarOportunidades(filtro)`, `obterOportunidade(id)`, `listarEventos`, `obterEvento(slug)`, `listarCampanhas`, `obterCampanha(slug)`, `listarProdutos`, `obterProduto(slug)`, `obterProdutosPorId(ids)`, `listarEntidadesPublicas`, `obterEntidadePublica(slug)`, `listarParceiros` | `GET /publico/...` (só dados públicos, sem pessoais) |
| `cadastro.ts` | `buscarCep(cep)`, `cadastrarVoluntario(NovoVoluntario)`, `salvarFoto(id, dataUrl \| null)` (null remove) | `POST /voluntarios`, `PUT/DELETE /voluntarios/:id/foto` |
| `voluntarios.ts` | `listarVoluntariosDaEntidade`, `obterVoluntarioDaEntidade`, `aprovarVoluntario`, `desligarVoluntario(motivo)`, `reativarVoluntario`, `listarEntidades`, `obterMeuPainel`, `listarParaReengajar` | `/entidades/:id/voluntarios/...`, `GET /eu/painel` |
| `horas.ts` | `listarOportunidadesDaEntidade`, `fazerCheckIn({ codigo })`, `registrarHorasManual`, `obterBancoDeHoras` | `POST /entidades/:id/check-ins`, `POST /entidades/:id/horas` |
| `oportunidades.ts` | `listarOportunidadesAbertas`, `inscrever`, `cancelarInscricao`, `entrarNaFila`, `sairDaFila` | `POST/DELETE /oportunidades/:id/inscricao`, `/fila` |
| `gestao.ts` | oportunidades (`salvarOportunidade`, `encerrar`, `reabrir`, `excluir`), eventos (`salvarEvento`, `excluirEvento`, `listarIngressosDoEvento`, `checkInIngresso`), loja (`salvarProduto`, `movimentarEstoque`, `listarMovimentos`), campanhas (`salvarCampanha`, `obterDoacoesDaCampanha`), patrocinadores (`salvarPatrocinador`, `marcarContrapartida`, `excluirPatrocinador`) | `/entidades/:id/...` |
| `pedidos.ts` | `criarPedido(NovoPedido, pagador, pagamento)`, `acompanharPedido(id)`, `listarMeusIngressos`, `listarMinhasDoacoes`, `listarMinhasCompras` | `POST /pedidos`, `GET /pedidos/:id`, `GET /eu/...` |
| `financeiro.ts` | `obterFinanceiro({ periodo, entidadeId? })`, `lancarDespesa` | `GET /financeiro?inicio&fim&entidade`, `POST /entidades/:id/despesas` |
| `certificados.ts` | `listarElegiveis`, `emitirCertificados`, `listarCertificadosDaEntidade`, `listarMeusCertificados`, `validarCertificado(codigo)` | `POST /entidades/:id/certificados`, `GET /publico/certificados/:codigo` |
| `relatorios.ts` | `gerarRelatorio({ tipo, periodo, entidadeId? })` → `Documento` | `GET /relatorios/:tipo?...` (o mesmo `Documento` vira prévia, PDF e CSV no cliente) |
| `indicadores.ts` | `obterPainelAdmin`, `obterPainelEntidade` | `GET /indicadores/...` |
| `parceiros.ts` | `validarCarteirinha(codigo)`, `listarBeneficiosDoParceiro`, `registrarUso`, `listarResgates` | `POST /parceiros/:id/validacoes`, `/usos` |
| `beneficios.ts` | `listarBeneficiosAtivos`, `salvarBeneficio`, `excluirBeneficio`, `obterEmpresa`, `salvarEmpresa`, `salvarImagemEmpresa(id, 'logo' \| 'banner', dataUrl \| null)`, `obterPainelEsg`, `listarParceirosAdmin`, `decidirParceiro`, `decidirBeneficio`, `listarBeneficiosParaVoluntario` | `/parceiros/:id/...`, `/admin/parceiros/...` |
| `perfil.ts` | `obterMeuPerfil`, `salvarMeuPerfil`, `salvarPreferencias`, `exportarMeusDados` (JSON da LGPD), `pedirExclusao`, `listarPedidosExclusao`, `atenderPedidoExclusao` | `/eu/...`, `/admin/lgpd/...` |
| `notificacoes.ts` | `listarNotificacoes`, `marcarNotificacoesVistas` | `GET /eu/notificacoes` (o servidor também manda e-mail/WhatsApp conforme as preferências) |
| `admin.ts` | entidades (`listarEntidadesAdmin`, `cadastrarEntidade`, `aprovarEntidade`), `listarTodosVoluntarios`, `listarEventosAdmin`, `listarCampanhasAdmin`, comitê (`obterComite`, `obterTermoVigente`, `salvarDadosComite`, `publicarTermo`, `adicionarAdmin`, `removerAdmin`), `listarAuditoria` | `/admin/...` |
| `configuracoes.ts` | `obterEntidadeConfig`, `salvarDadosEntidade`, `definirCorDestaque` (atalho da GERA), `definirCorLivre` (hex), `salvarImagemEntidade(id, 'logo' \| 'banner', dataUrl \| null)`, `convidarMembro`, `removerMembro` | `/entidades/:id/config`, `PUT/DELETE /entidades/:id/logo` e `/banner` |
| `sessao.ts` | `definirAtor`, `auditar` | some: o servidor grava a auditoria a partir do token |

**Multi-tenant:** hoje cada função recebe `entidadeId`/`parceiroId` e confere que o dado é dela. Na API, tire o id do token (a entidade só enxerga a própria) e use o parâmetro só no portal do comitê.

## 3. Login real

- `src/lib/auth.tsx` tem o `AuthProvider` com `signIn(perfil)`, `signOut()` e `verComoEntidade(entidade)`. Troque o `signIn` pelo fluxo real (OIDC/OAuth ou e-mail e senha) e monte a `Session` (`role`, `userName`, `userId`, `orgId`, `orgName`) a partir da resposta do servidor.
- A tela `src/features/publico/LoginPage.tsx` vira o formulário de login; o seletor "entrar como" e o roteiro de demonstração saem.
- `RequireRole` (`src/components/shared/RequireRole.tsx`) já protege as rotas por perfil e manda para `/entrar?next=...`.
- "Ver como entidade" vira um token de personificação emitido pelo servidor (só para administradores), com a faixa fixa já pronta no `DeskLayout`.
- `definirAtor` (em `src/services/sessao.ts`) deixa de existir: quem fez cada ação vem do token, no servidor.

## 4. Pagamentos reais

- `src/services/pagamentos.ts` define a interface `PaymentProvider` (`criarCobranca`, `criarAssinatura`, `consultarStatus`) e o `ProvedorSimulado`. Implemente a interface para o provedor escolhido (Mercado Pago, Asaas, PagBank, Pagar.me ou Stripe) e troque só a linha `export const paymentProvider = ...`.
- No back-end, o pedido nasce "aguardando" e o **webhook** do provedor confirma o pagamento. O efeito do pedido pago (estoque, campanha, ingressos com QR, entrada no financeiro), que hoje está na função `concluir` de `src/services/pedidos.ts`, passa para o servidor.
- Dados de cartão nunca passam pela GERA: use o tokenizador do provedor no formulário de cartão.

## 5. O que é só simulação

| O quê | Como está hoje | No produto |
|---|---|---|
| Dados | `src/mocks/seed.ts` gera os dados de exemplo (determinísticos) e `db.ts` guarda as mudanças no `localStorage`. Ao mudar a forma dos dados, suba `DB_VERSION`. | Banco de dados no servidor. |
| Latência | `delay()` em cada serviço. | Some. |
| Login | Seletor "entrar como". | OIDC/OAuth ou e-mail e senha. |
| Pagamentos | Provedor simulado: aprova em segundos; cartão de teste 4111 1111 1111 1111 aprova, final 0002 recusa. | Provedor real com webhook. |
| QR da carteirinha | Token com verificador simples que muda a cada minuto (`src/lib/carteirinha.ts`). | Token assinado pelo servidor. |
| Código de certificado | Gerado no cliente. | Gerado e guardado no servidor. |
| E-mails, convites e WhatsApp | Só a mensagem na tela; o WhatsApp abre `wa.me` com o texto pronto. | Envio real (e-mail, API do WhatsApp Business). |
| Notificações | Geradas no cliente a partir dos dados (`src/lib/notificacoes.ts`). | Geradas no servidor, com push, e-mail e WhatsApp conforme as preferências. |
| LGPD | "Pedir exclusão" só registra o pedido; o comitê marca como atendido. | Exclusão e anonimização no servidor, com prazo legal. |
| Distância dos parceiros | Valor fixo nos dados. | Calculada pela localização (com permissão). |
| CEP | ViaCEP com uma lista local de reserva. | Igual, ou serviço próprio. |
| Fotos, logos e banners | Data URL dentro dos dados (`fotoUrl`, `logoUrl`, `bannerUrl`), já recortada e reduzida no navegador por `src/lib/imagem.ts` (foto quadrada de 320 px, ~60 KB; banner 16:5 de 1600×500, ~250 KB). O `commit()` de `src/mocks/db.ts` devolve false quando o `localStorage` enche e `gravarImagem` desfaz e avisa. | Enviar o arquivo a um storage (S3, GCS...) e guardar só a URL nos dados; a API valida tipo (JPG, PNG, WebP) e tamanho, e pode gerar as versões em vários tamanhos. Mantenha o `alt` com o nome da pessoa, entidade ou empresa. |
| Cor livre da entidade | `Entidade.corLivre` (hex), escolhida em Configurações › Marca; o contraste do texto é calculado na tela (`src/lib/contraste.ts`). | A API valida o formato `#rrggbb`; o cálculo de contraste pode continuar no cliente. |
| Downloads | `salvarArquivo` (`src/lib/salvarArquivo.ts`): capacidade `downloads` do claude.ai na página publicada, `<a download>` fora de quadro e a prévia como último recurso. | Só o `<a download>`; ou URLs assinadas do servidor para arquivos grandes. |
| PDFs e planilhas | Gerados no navegador (jsPDF sob demanda, CSV com BOM e ";"). | Podem continuar no navegador. |
| Offline | Service worker em `public/sw.js` e a última carteirinha no `localStorage`. | Igual; com a API, o painel salvo vem do servidor. |

## 6. Testes

| Comando | O que faz |
|---|---|
| `npm run build` | Checagem de cores (nenhuma cor fora dos tokens), tipos e build. |
| `npm test` | Vitest: regras da carteirinha, pedidos, indicadores, certificados, lista de espera, agenda, marcos, notificações e exportações. |
| `npm run test:e2e` | Playwright: jornadas dos 4 portais e do site e a varredura de acessibilidade com axe (todas as rotas, tema claro, escuro e 360 px). Sobe um servidor de desenvolvimento próprio na porta 4318. |
| `npx playwright install chromium` | Instala o navegador dos testes (uma vez). |
| `npm run icones` | Regenera os ícones do PWA em `public/icons` a partir do ícone do design system. |

O CI (`.github/workflows/ci.yml`) roda build, Vitest e Playwright (com o Chromium) a cada push e pull request.

## 7. PWA

- `public/manifest.webmanifest` usa os ícones do pacote (`public/icons`, gerados por `npm run icones`).
- `public/sw.js` foi escrito à mão: rede primeiro para a navegação (com a última página guardada para offline) e cache primeiro para JS, CSS e ícones. O registro (`src/main.tsx`) só acontece no build de produção e fora de iframes.
- Ao publicar uma versão que mude o service worker, suba `VERSAO` em `public/sw.js` para limpar o cache antigo.
