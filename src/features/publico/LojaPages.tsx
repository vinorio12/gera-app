import { useId, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Button, cx } from '@gera/design-system';
import { EmptyState } from '../../components/shared/EmptyState';
import { IconButton } from '../../components/shared/IconButton';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, Skeleton, SkeletonList } from '../../components/shared/States';
import { useToast } from '../../components/shared/Toast';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { formatMoeda } from '../../lib/format';
import { inputClass, labelClass } from '../../components/ui/form';
import { useCart } from '../../lib/cart';
import { useEntidades, useProduto, useProdutos, useProdutosPorId } from '../../services/hooks';
import { EstoqueTag, FaixaEngrenagem, ProdutoCard } from './cards';

export function LojaPage() {
  const [entidadeId, setEntidadeId] = useState('');
  const produtos = useProdutos(entidadeId || undefined);
  const entidades = useEntidades();
  const selectId = useId();

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <PageHeader
        title="Loja solidária"
        description="Camisetas, canecas, livros, rifas e artesanato feitos pelas entidades. O lucro volta inteiro para os projetos."
        actions={<CarrinhoLink />}
      />
      <div className="mb-6 flex max-w-xs flex-col gap-1">
        <label htmlFor={selectId} className={labelClass}>Entidade</label>
        <select id={selectId} value={entidadeId} onChange={(e) => setEntidadeId(e.target.value)} className={inputClass}>
          <option value="">Todas</option>
          {entidades.data?.map((e) => (
            <option key={e.id} value={e.id}>{e.nome}</option>
          ))}
        </select>
      </div>
      {produtos.isError ? (
        <ErrorState error={produtos.error} onRetry={() => produtos.refetch()} />
      ) : !produtos.data ? (
        <SkeletonList rows={3} />
      ) : produtos.data.length === 0 ? (
        <EmptyState title="Essa entidade ainda não tem produtos na loja" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {produtos.data.map((p) => (
            <ProdutoCard key={p.id} produto={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function CarrinhoLink() {
  const { total } = useCart();
  return (
    <ButtonLink to="/carrinho" variant="secondary">
      <ShoppingCart size={18} aria-hidden /> Carrinho{total > 0 && <span className="tabular-nums"> ({total})</span>}
    </ButtonLink>
  );
}

export function ProdutoPage() {
  const { produto: slug = '' } = useParams();
  const produto = useProduto(slug);
  const { adicionar, itens } = useCart();
  const toast = useToast();
  const [variacao, setVariacao] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const qtdId = useId();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/loja" className="mb-4 inline-flex min-h-11 items-center gap-2 font-semibold text-link hover:underline">
        <ArrowLeft size={18} aria-hidden /> Loja
      </Link>
      {produto.isPending ? (
        <Skeleton className="h-96 border border-border" />
      ) : produto.isError ? (
        <ErrorState error={produto.error} />
      ) : (
        (() => {
          const p = produto.data;
          const noCarrinho = itens.filter((i) => i.produtoId === p.id).reduce((s, i) => s + i.quantidade, 0);
          const disponivel = p.estoque - noCarrinho;
          const precisaVariacao = p.variacoes.length > 0 && !variacao;
          return (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="overflow-hidden rounded-lg">
                <FaixaEngrenagem rotulo={p.tipo} className="aspect-square max-h-80 w-full md:max-h-none" />
              </div>
              <div className="flex flex-col gap-4">
                <PageHeader title={p.nome} eyebrow={p.entidadeNome} />
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-2xl font-bold tabular-nums text-ink">{formatMoeda(p.preco)}</span>
                  <EstoqueTag estoque={p.estoque} />
                </div>
                {p.variacoes.length > 0 && (
                  <div role="group" aria-label="Variação" className="flex flex-wrap gap-2">
                    {p.variacoes.map((v) => (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={variacao === v}
                        onClick={() => setVariacao(v)}
                        className={cx(
                          'min-h-11 min-w-11 rounded-md border px-3 text-sm font-semibold',
                          variacao === v ? 'border-primary bg-primary-soft text-on-primary-soft' : 'border-border-strong bg-bg-card text-ink',
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}
                {p.estoque > 0 && (
                  <div className="flex flex-col gap-1">
                    <label htmlFor={qtdId} className={labelClass}>Quantidade</label>
                    <input
                      id={qtdId}
                      type="number"
                      min={1}
                      max={Math.max(1, disponivel)}
                      value={quantidade}
                      onChange={(e) => setQuantidade(Math.max(1, Math.min(Math.max(1, disponivel), Number(e.target.value) || 1)))}
                      className={`${inputClass} w-28`}
                    />
                  </div>
                )}
                {p.estoque === 0 ? (
                  <p className="font-semibold text-ink-muted">Esgotado por enquanto.</p>
                ) : disponivel <= 0 ? (
                  <p className="font-semibold text-ink-muted">Todo o estoque já está no seu carrinho.</p>
                ) : (
                  <Button
                    variant="highlight"
                    className="justify-center"
                    disabled={precisaVariacao}
                    onClick={() => {
                      adicionar({ produtoId: p.id, variacao, quantidade }, p.estoque);
                      toast.show(`${p.nome} no carrinho. Cada compra ajuda a ${p.entidadeNome}!`);
                    }}
                  >
                    <ShoppingCart size={18} aria-hidden /> {precisaVariacao ? 'Escolha uma opção' : 'Adicionar ao carrinho'}
                  </Button>
                )}
                {noCarrinho > 0 && (
                  <Link to="/carrinho" className="inline-flex min-h-11 items-center font-semibold text-link hover:underline">
                    Ver carrinho ({noCarrinho} {noCarrinho === 1 ? 'item' : 'itens'} deste produto)
                  </Link>
                )}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}

export function CarrinhoPage() {
  const { itens, alterar, remover } = useCart();
  const produtos = useProdutosPorId(itens.map((i) => i.produtoId));
  const linhas = itens
    .map((i) => ({ item: i, produto: produtos.data?.find((p) => p.id === i.produtoId) }))
    .filter((l): l is { item: (typeof itens)[number]; produto: NonNullable<typeof l.produto> } => !!l.produto);
  const subtotal = linhas.reduce((s, l) => s + l.produto.preco * l.item.quantidade, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader title="Carrinho" />
      {itens.length === 0 ? (
        <EmptyState
          title="Seu carrinho está vazio"
          description="Camisetas, canecas e artesanato das entidades estão na loja solidária."
          action={<ButtonLink to="/loja">Ir para a loja</ButtonLink>}
        />
      ) : produtos.isError ? (
        <ErrorState error={produtos.error} onRetry={() => produtos.refetch()} />
      ) : !produtos.data ? (
        <SkeletonList rows={2} />
      ) : (
        <div className="flex flex-col gap-4">
          <ul className="divide-y divide-border rounded-lg border border-border bg-bg-card shadow-card">
            {linhas.map(({ item, produto: p }) => (
              <li key={`${p.id}-${item.variacao}`} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <Link to={`/loja/${p.slug}`} className="font-semibold text-ink hover:text-link hover:underline">
                    {p.nome}
                  </Link>
                  <p className="text-sm text-ink-muted">
                    {p.entidadeNome}
                    {item.variacao && ` · ${item.variacao}`} · {formatMoeda(p.preco)} cada
                  </p>
                </div>
                <div className="flex items-center gap-1" role="group" aria-label={`Quantidade de ${p.nome}`}>
                  <IconButton icon={Minus} label="Diminuir quantidade" disabled={item.quantidade <= 1} onClick={() => alterar(p.id, item.variacao, item.quantidade - 1, p.estoque)} />
                  <span className="w-8 text-center font-semibold tabular-nums text-ink" aria-live="polite">{item.quantidade}</span>
                  <IconButton icon={Plus} label="Aumentar quantidade" disabled={item.quantidade >= p.estoque} onClick={() => alterar(p.id, item.variacao, item.quantidade + 1, p.estoque)} />
                </div>
                <span className="w-24 text-right font-bold tabular-nums text-ink">{formatMoeda(p.preco * item.quantidade)}</span>
                <IconButton icon={Trash2} label={`Remover ${p.nome}`} onClick={() => remover(p.id, item.variacao)} />
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-bg-card p-4 shadow-card">
            <p className="text-lg text-ink">
              Subtotal <strong className="tabular-nums">{formatMoeda(subtotal)}</strong>
            </p>
            <ButtonLink to="/checkout?origem=loja" variant="highlight">
              Ir para o pagamento
            </ButtonLink>
          </div>
          <p className="text-xs text-ink-muted">Retire na entidade ou receba em casa (Jaraguá do Sul). Pague com Pix, cartão ou boleto.</p>
        </div>
      )}
    </div>
  );
}
