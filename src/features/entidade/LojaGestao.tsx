import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, Boxes, Pencil, Plus } from 'lucide-react';
import { Button, formatNumber } from '@gera/design-system';
import { Chips } from '../../components/shared/Chips';
import { Dialog } from '../../components/shared/Dialog';
import { EmptyState } from '../../components/shared/EmptyState';
import { PageHeader } from '../../components/shared/PageHeader';
import { ErrorState, InlineError, Skeleton, SkeletonList } from '../../components/shared/States';
import { useToast } from '../../components/shared/Toast';
import { VoltarLink } from '../../components/shared/VoltarLink';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { cardClass } from '../../components/ui/card';
import { Campo } from '../../components/ui/Campo';
import { inputClass } from '../../components/ui/form';
import { useSession } from '../../lib/auth';
import { formatDateTime, formatMoeda } from '../../lib/format';
import { ESTOQUE_BAIXO, movimentarEstoque, salvarProduto, type ProdutoGestao } from '../../services/gestao';
import { mensagemDeErro, useGeraMutation, useMovimentosEstoque, useProdutoGestao, useProdutosGestao } from '../../services/hooks';
import { TIPOS_PRODUTO, type MovimentoEstoque, type Produto } from '../../types/domain';
import { EstoqueTag } from '../publico/cards';

export function LojaGestaoPage() {
  const { orgId, orgName } = useSession();
  const produtos = useProdutosGestao(orgId!);
  const movimentos = useMovimentosEstoque(orgId!);
  const [movimentar, setMovimentar] = useState<{ produto: ProdutoGestao; tipo: MovimentoEstoque['tipo'] } | null>(null);
  const [filtroHistorico, setFiltroHistorico] = useState('todos');

  const alertas = produtos.data?.filter((p) => p.estoque <= ESTOQUE_BAIXO) ?? [];
  const historico = movimentos.data?.filter((m) => filtroHistorico === 'todos' || m.produtoId === filtroHistorico) ?? [];

  return (
    <>
      <PageHeader
        title="Loja e estoque"
        eyebrow={orgName}
        description="Produtos da loja solidária, entradas e saídas de estoque com motivo. As vendas do site dão baixa sozinhas."
        actions={
          <ButtonLink to="novo">
            <Plus size={18} aria-hidden /> Novo produto
          </ButtonLink>
        }
      />
      {produtos.isPending ? (
        <SkeletonList rows={4} />
      ) : produtos.isError ? (
        <ErrorState error={produtos.error} onRetry={() => produtos.refetch()} />
      ) : (
        <div className="flex flex-col gap-8">
          {alertas.length > 0 && (
            <section aria-labelledby="alertas" className="rounded-lg border border-accent bg-accent-soft p-4 text-on-accent-soft">
              <h2 id="alertas" className="mb-2 flex items-center gap-2 font-bold">
                <Boxes size={20} aria-hidden /> Estoque baixo
              </h2>
              <ul className="flex flex-col gap-2">
                {alertas.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">
                      {p.nome}: {p.estoque === 0 ? 'esgotado' : p.estoque === 1 ? 'última unidade' : `últimas ${p.estoque} unidades`}
                    </span>
                    <Button variant="secondary" onClick={() => setMovimentar({ produto: p, tipo: 'entrada' })}>
                      <ArrowDownToLine size={16} aria-hidden /> Dar entrada
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="produtos">
            <h2 id="produtos" className="mb-3 text-2xl font-bold text-ink">
              Produtos
            </h2>
            {produtos.data.length === 0 ? (
              <EmptyState title="Nenhum produto na loja" description="Cadastre camisetas, canecas, rifas ou artesanato." action={<ButtonLink to="novo">Novo produto</ButtonLink>} />
            ) : (
              <ul className="grid gap-4 md:grid-cols-2">
                {produtos.data.map((p) => (
                  <li key={p.id} className={`${cardClass} flex flex-col gap-3`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words font-bold text-ink">{p.nome}</h3>
                        <p className="text-sm text-ink-muted">
                          {p.tipo} · {formatMoeda(p.preco)}
                          {p.variacoes.length > 0 && ` · ${p.variacoes.join(', ')}`}
                        </p>
                      </div>
                      <EstoqueTag estoque={p.estoque} />
                    </div>
                    <p className="text-sm text-ink">
                      <strong className="tabular-nums">{formatNumber(p.estoque)}</strong> em estoque ·{' '}
                      <strong className="tabular-nums">{formatNumber(p.vendidos)}</strong> vendidos
                    </p>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => setMovimentar({ produto: p, tipo: 'entrada' })} aria-label={`Entrada de estoque: ${p.nome}`}>
                        <ArrowDownToLine size={16} aria-hidden /> Entrada
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={p.estoque === 0}
                        onClick={() => setMovimentar({ produto: p, tipo: 'saida' })}
                        aria-label={`Saída de estoque: ${p.nome}`}
                      >
                        <ArrowUpFromLine size={16} aria-hidden /> Saída
                      </Button>
                      <ButtonLink to={`${p.id}/editar`} variant="ghost" aria-label={`Editar ${p.nome}`}>
                        <Pencil size={16} aria-hidden /> Editar
                      </ButtonLink>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="historico" className="flex flex-col gap-3">
            <h2 id="historico" className="text-2xl font-bold text-ink">
              Histórico de estoque
            </h2>
            <div className="flex max-w-xs flex-col gap-1">
              <Campo id="filtro-produto" label="Produto">
                <select value={filtroHistorico} onChange={(e) => setFiltroHistorico(e.target.value)} className={inputClass}>
                  <option value="todos">Todos os produtos</option>
                  {produtos.data.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </Campo>
            </div>
            {movimentos.isPending ? (
              <SkeletonList rows={3} />
            ) : movimentos.isError ? (
              <ErrorState error={movimentos.error} onRetry={() => movimentos.refetch()} />
            ) : historico.length === 0 ? (
              <EmptyState title="Nenhuma movimentação" description="Entradas, saídas e vendas aparecem aqui com o motivo." />
            ) : (
              <div className="relative overflow-x-auto rounded-lg border border-border bg-bg-card shadow-card" tabIndex={0} role="region" aria-label="Histórico de estoque">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-border text-ink-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">Quando</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Produto</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">Quantidade</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {historico.slice(0, 40).map((m) => (
                      <tr key={m.id}>
                        <td className="whitespace-nowrap px-4 py-2 tabular-nums text-ink-muted">{formatDateTime(m.em)}</td>
                        <td className="px-4 py-2 text-ink">{m.produto}</td>
                        <td className="px-4 py-2 text-right font-semibold tabular-nums text-ink">
                          {m.tipo === 'entrada' ? '+' : '−'}
                          {formatNumber(m.quantidade)}
                          <span className="sr-only">{m.tipo === 'entrada' ? ' (entrada)' : ' (saída)'}</span>
                        </td>
                        <td className="px-4 py-2 text-ink-muted">{m.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
      {movimentar && <MovimentoDialog {...movimentar} onClose={() => setMovimentar(null)} />}
    </>
  );
}

const MOTIVOS = { entrada: ['Compra de fornecedor', 'Doação recebida', 'Produção própria', 'Ajuste de inventário'], saida: ['Brinde em evento', 'Venda no balcão', 'Avaria ou perda', 'Ajuste de inventário'] };

function MovimentoDialog({ produto, tipo, onClose }: { produto: ProdutoGestao; tipo: MovimentoEstoque['tipo']; onClose: () => void }) {
  const { orgId } = useSession();
  const toast = useToast();
  const mover = useGeraMutation(movimentarEstoque);
  const [quantidade, setQuantidade] = useState('1');
  const [motivo, setMotivo] = useState(MOTIVOS[tipo][0]!);
  const enviar = (e?: FormEvent) => {
    e?.preventDefault();
    mover.mutate(
      { entidadeId: orgId!, produtoId: produto.id, tipo, quantidade: Number(quantidade), motivo },
      {
        onSuccess: () => {
          toast.show(`${tipo === 'entrada' ? 'Entrada' : 'Saída'} de ${quantidade} em ${produto.nome} registrada.`);
          onClose();
        },
      },
    );
  };
  return (
    <Dialog
      open
      onClose={onClose}
      title={`${tipo === 'entrada' ? 'Entrada' : 'Saída'} de estoque · ${produto.nome}`}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => enviar()} disabled={mover.isPending}>
            {mover.isPending ? 'Registrando…' : 'Registrar'}
          </Button>
        </>
      }
    >
      <form onSubmit={enviar} className="flex flex-col gap-3 text-ink">
        <p className="text-ink-muted">Hoje há {formatNumber(produto.estoque)} em estoque.</p>
        <Campo id="quantidade" label="Quantidade">
          <input type="number" inputMode="numeric" min={1} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className={inputClass} />
        </Campo>
        <Campo id="motivo" label="Motivo" dica="Fica no histórico de estoque.">
          <input list={`motivos-${tipo}`} value={motivo} onChange={(e) => setMotivo(e.target.value)} className={inputClass} />
        </Campo>
        <datalist id={`motivos-${tipo}`}>
          {MOTIVOS[tipo].map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <InlineError>{mover.isError ? mensagemDeErro(mover.error) : null}</InlineError>
      </form>
    </Dialog>
  );
}

// ---------- Criar e editar produto ----------

export function ProdutoFormPage() {
  const { id } = useParams();
  const { orgId } = useSession();
  const existente = useProdutoGestao(id, orgId!);
  if (id && existente.isPending) return <Skeleton className="h-96 border border-border" />;
  if (id && existente.isError) return <ErrorState error={existente.error} />;
  return <ProdutoForm key={existente.data?.id ?? 'novo'} produto={existente.data} />;
}

function ProdutoForm({ produto }: { produto?: Produto }) {
  const { orgId, orgName } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const salvar = useGeraMutation(salvarProduto);
  const [d, setD] = useState({
    nome: produto?.nome ?? '',
    tipo: produto?.tipo ?? TIPOS_PRODUTO[0],
    preco: produto ? String(produto.preco).replace('.', ',') : '',
    variacoes: produto?.variacoes.join(', ') ?? '',
    estoqueInicial: '10',
  });
  const [temVariacoes, setTemVariacoes] = useState<'nao' | 'sim'>(produto?.variacoes.length ? 'sim' : 'nao');
  const set = (k: keyof typeof d) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    salvar.mutate(
      {
        entidadeId: orgId!,
        id: produto?.id,
        nome: d.nome,
        tipo: d.tipo,
        preco: Number(d.preco.replace(/\./g, '').replace(',', '.')),
        variacoes: temVariacoes === 'sim' ? d.variacoes.split(',') : [],
        estoqueInicial: Number(d.estoqueInicial),
      },
      {
        onSuccess: (p) => {
          toast.show(produto ? `${p.nome} atualizado.` : `${p.nome} já está na loja solidária.`);
          navigate('/entidade/loja');
        },
      },
    );
  };

  return (
    <div className="max-w-2xl">
      <VoltarLink to="/entidade/loja">Loja e estoque</VoltarLink>
      <PageHeader title={produto ? 'Editar produto' : 'Novo produto'} eyebrow={orgName} />
      <form onSubmit={enviar} noValidate className={`${cardClass} grid gap-4 sm:grid-cols-2`}>
        <Campo id="nome" label="Nome" className="sm:col-span-2">
          <input value={d.nome} onChange={set('nome')} className={inputClass} />
        </Campo>
        <Campo id="tipo" label="Tipo">
          <select value={d.tipo} onChange={set('tipo')} className={inputClass}>
            {TIPOS_PRODUTO.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Campo>
        <Campo id="preco" label="Preço (R$)">
          <input inputMode="decimal" value={d.preco} onChange={set('preco')} placeholder="49,90" className={inputClass} />
        </Campo>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-sm font-semibold text-ink" id="variacoes-rotulo">
            Tem variações (tamanho, cor)?
          </span>
          <Chips
            label="Tem variações"
            valor={temVariacoes}
            onChange={setTemVariacoes}
            opcoes={[
              { id: 'nao', label: 'Não' },
              { id: 'sim', label: 'Sim' },
            ]}
          />
        </div>
        {temVariacoes === 'sim' && (
          <Campo id="variacoes" label="Variações" dica="Separe por vírgula, ex.: P, M, G, GG. O preço é o mesmo para todas." className="sm:col-span-2">
            <input value={d.variacoes} onChange={set('variacoes')} className={inputClass} />
          </Campo>
        )}
        {!produto && (
          <Campo id="estoque" label="Estoque inicial" dica="Vira a primeira entrada do histórico.">
            <input type="number" inputMode="numeric" min={0} value={d.estoqueInicial} onChange={set('estoqueInicial')} className={inputClass} />
          </Campo>
        )}
        <div className="flex flex-col gap-3 sm:col-span-2">
          <InlineError>{salvar.isError ? mensagemDeErro(salvar.error) : null}</InlineError>
          <Button type="submit" disabled={salvar.isPending} className="self-start">
            {salvar.isPending ? 'Salvando…' : produto ? 'Salvar alterações' : 'Cadastrar produto'}
          </Button>
        </div>
      </form>
    </div>
  );
}
