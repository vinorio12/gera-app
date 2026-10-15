import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export interface ItemCarrinho {
  produtoId: string;
  variacao: string | null;
  quantidade: number;
}

interface CartContextValue {
  itens: ItemCarrinho[];
  total: number;
  adicionar: (item: ItemCarrinho, estoque: number) => void;
  alterar: (produtoId: string, variacao: string | null, quantidade: number, estoque: number) => void;
  remover: (produtoId: string, variacao: string | null) => void;
  limpar: () => void;
}

const STORAGE_KEY = 'gera.carrinho';
const CartContext = createContext<CartContextValue | null>(null);

function lerCarrinho(): ItemCarrinho[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ItemCarrinho[]) : [];
  } catch {
    return [];
  }
}

const mesmo = (a: ItemCarrinho, produtoId: string, variacao: string | null) => a.produtoId === produtoId && a.variacao === variacao;

/** Carrinho da loja solidária, guardado no navegador do visitante. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>(lerCarrinho);

  const salvar = useCallback((next: ItemCarrinho[]) => {
    setItens(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // sem storage: o carrinho vale até recarregar
    }
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      itens,
      total: itens.reduce((s, i) => s + i.quantidade, 0),
      adicionar: (item, estoque) => {
        const atual = itens.find((i) => mesmo(i, item.produtoId, item.variacao));
        const quantidade = Math.min(estoque, (atual?.quantidade ?? 0) + item.quantidade);
        salvar(atual ? itens.map((i) => (i === atual ? { ...i, quantidade } : i)) : [...itens, { ...item, quantidade }]);
      },
      alterar: (produtoId, variacao, quantidade, estoque) =>
        salvar(
          itens.map((i) => (mesmo(i, produtoId, variacao) ? { ...i, quantidade: Math.max(1, Math.min(estoque, quantidade)) } : i)),
        ),
      remover: (produtoId, variacao) => salvar(itens.filter((i) => !mesmo(i, produtoId, variacao))),
      limpar: () => salvar([]),
    }),
    [itens, salvar],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart precisa estar dentro de <CartProvider>');
  return ctx;
}
