import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CircleCheck, CreditCard, Lock } from 'lucide-react';
import { Button, cx } from '@gera/design-system';
import { CopyField } from '../../components/shared/CopyField';
import { EmptyState } from '../../components/shared/EmptyState';
import { ComprovanteDownload } from '../../components/shared/ComprovanteDownload';
import { PageHeader } from '../../components/shared/PageHeader';
import { PaymentMethodPicker } from '../../components/shared/PaymentMethodPicker';
import { ErrorState, InlineError, Skeleton } from '../../components/shared/States';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { inputClass, labelClass } from '../../components/ui/form';
import { useAuth } from '../../lib/auth';
import { useCart } from '../../lib/cart';
import { formatDate, formatDateShort, formatMoeda } from '../../lib/format';
import { useNow } from '../../lib/useNow';
import { mensagemDeErro, useAndamentoPedido, useCampanha, useEvento, useGeraMutation, usePerfilComprador, useProdutosPorId } from '../../services/hooks';
import { criarPedido, type NovoPedido } from '../../services/pedidos';
import type { MetodoPagamento } from '../../types/domain';

const FRETE = 12;

interface Resumo {
  titulo: string;
  linhas: Array<{ rotulo: string; valor: number }>;
  total: number;
  /** Quantos nomes de participante pedir (ingressos). */
  participantes: number;
  pedido: NovoPedido | null;
  mensal: boolean;
  carregando: boolean;
  erro: unknown;
  vazio: boolean;
}

/** Monta o resumo do que está sendo pago a partir da URL (ingressos, doação) ou do carrinho (loja). */
function useResumo(entrega: 'retirada' | 'entrega'): Resumo {
  const [params] = useSearchParams();
  const eventoSlug = params.get('evento') ?? '';
  const campanhaSlug = params.get('campanha') ?? '';
  const evento = useEvento(eventoSlug);
  const campanha = useCampanha(campanhaSlug);
  const { itens } = useCart();
  const produtos = useProdutosPorId(itens.map((i) => i.produtoId));
  const base = { participantes: 0, mensal: false, vazio: false, erro: null as unknown };

  if (eventoSlug) {
    if (!evento.data) return { ...base, titulo: 'Ingressos', linhas: [], total: 0, pedido: null, carregando: evento.isPending, erro: evento.error };
    const escolhidos = (params.get('itens') ?? '')
      .split(',')
      .map((par) => par.split(':'))
      .map(([tipo = '', n = '0']) => ({ tipo, quantidade: Math.max(0, Math.floor(Number(n)) || 0) }))
      .filter((i) => i.quantidade > 0 && evento.data.ingressos.some((t) => t.tipo === i.tipo));
    const linhas = escolhidos.map((i) => {
      const t = evento.data.ingressos.find((x) => x.tipo === i.tipo)!;
      return { rotulo: `${i.quantidade} × ${i.tipo}`, valor: t.preco * i.quantidade };
    });
    const qtd = escolhidos.reduce((s, i) => s + i.quantidade, 0);
    return {
      ...base,
      titulo: `${evento.data.titulo} · ${formatDateShort(evento.data.data)}`,
      linhas,
      total: linhas.reduce((s, l) => s + l.valor, 0),
      participantes: qtd,
      vazio: qtd === 0,
      pedido: { tipo: 'ingressos', eventoSlug, ingressos: escolhidos, participantes: [] },
      carregando: false,
    };
  }
  if (campanhaSlug) {
    if (!campanha.data) return { ...base, titulo: 'Doação', linhas: [], total: 0, pedido: null, carregando: campanha.isPending, erro: campanha.error };
    const valor = Math.round(Number(params.get('valor') ?? 0) * 100) / 100;
    const mensal = params.get('mensal') === '1';
    return {
      ...base,
      titulo: `${campanha.data.titulo} · ${campanha.data.entidadeNome}`,
      linhas: [{ rotulo: mensal ? 'Doação mensal' : 'Doação', valor }],
      total: valor,
      mensal,
      vazio: !(valor >= 5),
      pedido: { tipo: 'doacao', campanhaSlug, valor, mensal },
      carregando: false,
    };
  }
  if (itens.length === 0) return { ...base, titulo: 'Loja solidária', linhas: [], total: 0, pedido: null, carregando: false, vazio: true };
  if (!produtos.data) return { ...base, titulo: 'Loja solidária', linhas: [], total: 0, pedido: null, carregando: produtos.isPending, erro: produtos.error };
  const linhas = itens.flatMap((i) => {
    const p = produtos.data.find((x) => x.id === i.produtoId);
    return p ? [{ rotulo: `${i.quantidade} × ${p.nome}${i.variacao ? ` (${i.variacao})` : ''}`, valor: p.preco * i.quantidade }] : [];
  });
  if (entrega === 'entrega') linhas.push({ rotulo: 'Entrega em Jaraguá do Sul', valor: FRETE });
  return {
    ...base,
    titulo: 'Loja solidária',
    linhas,
    total: linhas.reduce((s, l) => s + l.valor, 0),
    pedido: { tipo: 'loja', itens, entrega },
    carregando: false,
  };
}

export function CheckoutPage() {
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {pedidoId ? <Andamento pedidoId={pedidoId} onRecomecar={() => setPedidoId(null)} /> : <Formulario onCriado={setPedidoId} />}
    </div>
  );
}

function Formulario({ onCriado }: { onCriado: (id: string) => void }) {
  const { session } = useAuth();
  const perfil = usePerfilComprador(session?.role === 'voluntario' ? session.userId : undefined);
  const [entrega, setEntrega] = useState<'retirada' | 'entrega'>('retirada');
  const resumo = useResumo(entrega);
  // O nome já vem da sessão; o e-mail chega com o perfil logo em seguida.
  const [nome, setNome] = useState(session?.role === 'voluntario' ? session.userName : '');
  const [email, setEmail] = useState('');
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [metodo, setMetodo] = useState<MetodoPagamento>('pix');
  const [cartao, setCartao] = useState({ numero: '', nome: '', validade: '', cvv: '' });
  const [parcelas, setParcelas] = useState(1);
  const criar = useGeraMutation((args: Parameters<typeof criarPedido>) => criarPedido(...args));
  const [recusa, setRecusa] = useState<string | null>(null);
  const ids = { nome: useId(), email: useId(), num: useId(), titular: useId(), val: useId(), cvv: useId(), parc: useId() };

  // Completa com os dados do voluntário logado, sem apagar o que a pessoa já digitou.
  const perfilVoluntario = perfil.data?.voluntario;
  useEffect(() => {
    if (!perfilVoluntario) return;
    setNome((n) => n || perfilVoluntario.nome);
    setEmail((e) => e || perfilVoluntario.email);
  }, [perfilVoluntario]);

  // Doação mensal só no cartão.
  useEffect(() => {
    if (resumo.mensal) setMetodo('cartao');
  }, [resumo.mensal]);

  if (resumo.carregando) return <Skeleton className="h-96 border border-border" />;
  if (resumo.erro) return <ErrorState error={resumo.erro} />;
  if (resumo.vazio || !resumo.pedido) {
    return (
      <EmptyState
        title="Nada para pagar aqui"
        description="Escolha produtos, ingressos ou o valor da doação e volte."
        action={
          <>
            <ButtonLink to="/loja" variant="secondary">Ir para a loja</ButtonLink>
            <ButtonLink to="/campanhas" variant="secondary">Ver campanhas</ButtonLink>
          </>
        }
      />
    );
  }

  const gratuito = resumo.total === 0;
  const nomesParticipantes = Array.from({ length: resumo.participantes }, (_, i) => participantes[i] ?? (i === 0 ? nome : ''));

  const pagar = (e: FormEvent) => {
    e.preventDefault();
    setRecusa(null);
    const pedido = resumo.pedido!.tipo === 'ingressos' ? { ...resumo.pedido!, participantes: nomesParticipantes } : resumo.pedido!;
    criar.mutate(
      [
        pedido,
        { nome, email, voluntarioId: session?.role === 'voluntario' ? session.userId ?? null : null },
        gratuito ? null : { metodo, parcelas: metodo === 'cartao' ? parcelas : undefined, cartao: metodo === 'cartao' ? cartao : undefined },
      ],
      {
        onSuccess: ({ pedido: p, cobranca }) => {
          if (p.status === 'recusado') setRecusa(cobranca?.motivoRecusa ?? 'O pagamento foi recusado. Tente outra forma de pagamento.');
          else onCriado(p.id);
        },
      },
    );
  };

  return (
    <>
      <PageHeader eyebrow={resumo.titulo} title={gratuito ? 'Confirmar' : 'Pagamento'} />
      <form onSubmit={pagar} className="flex flex-col gap-6">
        <section aria-labelledby="resumo" className="rounded-lg border border-border bg-bg-card p-5 shadow-card">
          <h2 id="resumo" className="mb-3 text-lg font-bold text-ink">Resumo</h2>
          <ul className="flex flex-col gap-2">
            {resumo.linhas.map((l) => (
              <li key={l.rotulo} className="flex justify-between gap-3 text-ink">
                <span>{l.rotulo}</span>
                <span className="tabular-nums">{l.valor === 0 ? 'Gratuito' : formatMoeda(l.valor)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-bold text-ink">
            <span>Total{resumo.mensal ? ' por mês' : ''}</span>
            <span className="tabular-nums">{gratuito ? 'Gratuito' : formatMoeda(resumo.total)}</span>
          </p>
        </section>

        {resumo.pedido.tipo === 'loja' && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold text-ink">Como você quer receber</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ['retirada', 'Retirar na entidade', 'Grátis, com o número do pedido'],
                  ['entrega', 'Entrega', `${formatMoeda(FRETE)} em Jaraguá do Sul`],
                ] as const
              ).map(([id, rotulo, det]) => (
                <label key={id} className={cx('flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3', entrega === id ? 'border-primary bg-primary-soft' : 'border-border-strong bg-bg-card')}>
                  <input type="radio" name="entrega" checked={entrega === id} onChange={() => setEntrega(id)} className="mt-1 h-4 w-4 accent-primary" />
                  <span>
                    <span className="block font-semibold text-ink">{rotulo}</span>
                    <span className="block text-sm text-ink-muted">{det}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <section aria-labelledby="seus-dados" className="flex flex-col gap-3">
          <h2 id="seus-dados" className="text-lg font-bold text-ink">Seus dados</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor={ids.nome} className={labelClass}>Nome completo</label>
              <input id={ids.nome} required autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor={ids.email} className={labelClass}>E-mail (o comprovante vai para ele)</label>
              <input id={ids.email} required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
          </div>
        </section>

        {resumo.participantes > 0 && (
          <section aria-labelledby="participantes" className="flex flex-col gap-3">
            <h2 id="participantes" className="text-lg font-bold text-ink">Quem vai</h2>
            <p className="-mt-2 text-sm text-ink-muted">Cada ingresso sai com um QR próprio no nome do participante.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {nomesParticipantes.map((n, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <label htmlFor={`${ids.nome}-p${i}`} className={labelClass}>Participante {i + 1}</label>
                  <input
                    id={`${ids.nome}-p${i}`}
                    required
                    minLength={3}
                    value={n}
                    onChange={(e) => setParticipantes(() => nomesParticipantes.map((x, j) => (j === i ? e.target.value : x)))}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {!gratuito && (
          <section aria-label="Pagamento" className="flex flex-col gap-4">
            <PaymentMethodPicker
              value={metodo}
              onChange={setMetodo}
              indisponiveis={resumo.mensal ? { pix: 'Doação mensal só no cartão', boleto: 'Doação mensal só no cartão' } : {}}
            />
            {metodo === 'cartao' && (
              <div className="grid gap-3 rounded-lg border border-border bg-bg-card p-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label htmlFor={ids.num} className={labelClass}>Número do cartão</label>
                  <input
                    id={ids.num}
                    required
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={cartao.numero}
                    onChange={(e) => setCartao((c) => ({ ...c, numero: e.target.value.replace(/[^\d ]/g, '').slice(0, 23) }))}
                    placeholder="0000 0000 0000 0000"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label htmlFor={ids.titular} className={labelClass}>Nome impresso no cartão</label>
                  <input id={ids.titular} required autoComplete="cc-name" value={cartao.nome} onChange={(e) => setCartao((c) => ({ ...c, nome: e.target.value }))} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor={ids.val} className={labelClass}>Validade</label>
                  <input
                    id={ids.val}
                    required
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/AA"
                    value={cartao.validade}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setCartao((c) => ({ ...c, validade: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }));
                    }}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor={ids.cvv} className={labelClass}>Código de segurança</label>
                  <input id={ids.cvv} required inputMode="numeric" autoComplete="cc-csc" value={cartao.cvv} onChange={(e) => setCartao((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} className={inputClass} />
                </div>
                {!resumo.mensal && resumo.total >= 100 && (
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label htmlFor={ids.parc} className={labelClass}>Parcelas</label>
                    <select id={ids.parc} value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))} className={inputClass}>
                      {[1, 2, 3].map((n) => (
                        <option key={n} value={n}>
                          {n === 1 ? `À vista, ${formatMoeda(resumo.total)}` : `${n}x de ${formatMoeda(resumo.total / n)} sem juros`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <p className="text-xs text-ink-muted sm:col-span-2">
                  Protótipo: use 4111 1111 1111 1111 para aprovar ou 4000 0000 0000 0002 para ver uma recusa. Nenhum dado de cartão é guardado.
                </p>
              </div>
            )}
          </section>
        )}

        <InlineError>{recusa ?? (criar.isError ? mensagemDeErro(criar.error) : null)}</InlineError>
        <Button type="submit" variant={gratuito ? 'primary' : 'highlight'} className="justify-center" disabled={criar.isPending || perfil.isLoading}>
          {perfil.isLoading ? (
            'Carregando seus dados…'
          ) : criar.isPending ? (
            'Enviando…'
          ) : gratuito ? (
            'Garantir ingressos'
          ) : (
            <>
              <Lock size={18} aria-hidden /> {resumo.mensal ? `Doar ${formatMoeda(resumo.total)} por mês` : `Pagar ${formatMoeda(resumo.total)}`}
            </>
          )}
        </Button>
        <p className="text-center text-xs text-ink-muted">Pagamento simulado: nenhuma cobrança de verdade é feita no protótipo.</p>
      </form>
    </>
  );
}

function Andamento({ pedidoId, onRecomecar }: { pedidoId: string; onRecomecar: () => void }) {
  const andamento = useAndamentoPedido(pedidoId);
  const now = useNow(1000);

  if (andamento.isPending) return <Skeleton className="h-96 border border-border" />;
  if (andamento.isError) return <ErrorState error={andamento.error} />;
  const { pedido, cobranca } = andamento.data;

  if (pedido.status === 'pago') return <Confirmacao andamento={andamento.data} />;
  if (pedido.status === 'recusado') {
    return (
      <div className="flex flex-col items-start gap-4">
        <PageHeader title="Pagamento não concluído" />
        <InlineError>
          {cobranca?.status === 'expirada' ? 'O Pix expirou antes do pagamento. Gere um novo para tentar de novo.' : cobranca?.motivoRecusa ?? 'O pagamento não foi aprovado.'}
        </InlineError>
        <Button onClick={onRecomecar}>Tentar de novo</Button>
      </div>
    );
  }

  const restante = cobranca?.pix ? Math.max(0, Math.floor((new Date(cobranca.pix.expiraEm).getTime() - now) / 1000)) : 0;
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <PageHeader eyebrow={pedido.descricao} title="Aguardando pagamento" />
      {cobranca?.pix && (
        <section className="flex flex-col items-center gap-4 rounded-lg border border-border bg-bg-card p-6 text-center shadow-card">
          <p className="text-ink">Abra o app do seu banco e pague com o QR ou com o código copia e cola.</p>
          <div className="rounded-md bg-papel p-3">
            <QRCodeSVG value={cobranca.pix.copiaECola} size={200} level="M" title="QR do Pix" />
          </div>
          <p className="font-display text-3xl tabular-nums text-ink" aria-live="off">
            {String(Math.floor(restante / 60)).padStart(2, '0')}:{String(restante % 60).padStart(2, '0')}
          </p>
          <p className="-mt-3 text-sm text-ink-muted">para o QR expirar</p>
          <div className="w-full text-left">
            <CopyField label="Pix copia e cola" value={cobranca.pix.copiaECola} />
          </div>
        </section>
      )}
      {cobranca?.boleto && (
        <section className="flex flex-col gap-4 rounded-lg border border-border bg-bg-card p-6 shadow-card">
          <p className="text-ink">Pague até <strong>{formatDate(cobranca.boleto.vencimento)}</strong> no app do banco ou numa lotérica.</p>
          <CopyField label="Linha digitável" value={cobranca.boleto.linhaDigitavel} />
        </section>
      )}
      {cobranca?.cartao && (
        <section className="flex items-center gap-3 rounded-lg border border-border bg-bg-card p-6 shadow-card">
          <CreditCard size={24} aria-hidden className="text-link" />
          <p className="text-ink">
            Processando no cartão final <strong className="tabular-nums">{cobranca.cartao.final}</strong>
            {cobranca.cartao.parcelas > 1 && ` em ${cobranca.cartao.parcelas}x`}…
          </p>
        </section>
      )}
      <p role="status" className="text-sm text-ink-muted">
        Esta tela atualiza sozinha quando o pagamento for confirmado. No protótipo, a confirmação chega em alguns segundos.
      </p>
    </div>
  );
}

function Confirmacao({ andamento: { pedido, ingressos, entidadeNome, referencia } }: { andamento: NonNullable<ReturnType<typeof useAndamentoPedido>['data']> }) {
  const { limpar } = useCart();
  const carrinhoLimpo = useRef(false);
  // Esvazia o carrinho uma vez só, quando a compra da loja é confirmada.
  useEffect(() => {
    if (pedido.tipo === 'loja' && !carrinhoLimpo.current) {
      carrinhoLimpo.current = true;
      limpar();
    }
  }, [pedido.tipo, limpar]);
  const primeiro = pedido.comprador.nome.split(' ')[0];
  const titulo =
    pedido.tipo === 'doacao'
      ? `Valeu, ${primeiro}! Sua doação já está empurrando a meta.`
      : pedido.tipo === 'ingressos'
        ? `Tudo certo, ${primeiro}! Seus ingressos estão aqui.`
        : `Obrigado, ${primeiro}! Cada compra volta inteira para os projetos.`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3 rounded-lg bg-primary-soft p-5 text-on-primary-soft" role="status">
        <CircleCheck size={28} aria-hidden className="shrink-0" />
        <div>
          <p className="text-lg font-bold">{titulo}</p>
          <p className="text-sm">
            Pedido {pedido.id.toUpperCase()} · {pedido.valor === 0 ? 'gratuito' : formatMoeda(pedido.valor)}
            {pedido.mensal && ' por mês'}. O comprovante foi para {pedido.comprador.email}.
          </p>
        </div>
      </div>

      {pedido.tipo === 'loja' && (
        <p className="text-ink">
          {pedido.entrega === 'entrega'
            ? 'A entidade vai combinar a entrega pelo e-mail.'
            : 'Retire na entidade mostrando o número do pedido.'}
        </p>
      )}

      {ingressos.length > 0 && (
        <section aria-labelledby="seus-ingressos" className="flex flex-col gap-3">
          <h2 id="seus-ingressos" className="text-lg font-bold text-ink">Ingressos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {ingressos.map((i) => (
              <article key={i.id} className="flex items-center gap-4 rounded-lg border border-border bg-bg-card p-4 shadow-card">
                <div className="shrink-0 rounded-md bg-papel p-2">
                  <QRCodeSVG value={i.codigo} size={96} level="M" title={`QR do ingresso de ${i.participante}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-base uppercase leading-5 tracking-[0.08em] text-ink-muted">{i.tipo}</p>
                  <p className="font-semibold text-ink">{i.participante}</p>
                  <p className="break-all text-xs text-ink-muted">{i.id.toUpperCase()}</p>
                </div>
              </article>
            ))}
          </div>
          {pedido.voluntarioId && (
            <p className="text-sm text-ink-muted">
              Eles também ficam em{' '}
              <Link to="/app/ingressos" className="font-semibold text-link hover:underline">Meus ingressos</Link>, no app do voluntário.
            </p>
          )}
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        {pedido.valor > 0 && <ComprovanteDownload pedido={pedido} contexto={{ entidadeNome, referencia }} />}
        <ButtonLink to="/" variant="secondary">Voltar para o início</ButtonLink>
        {pedido.tipo === 'doacao' && <ButtonLink to="/campanhas" variant="secondary">Ver outras campanhas</ButtonLink>}
      </div>
    </div>
  );
}
