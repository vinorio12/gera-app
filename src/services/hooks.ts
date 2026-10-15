// Hooks do TanStack Query sobre a camada de serviços: é o que as telas usam.
import { QueryClient, keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resetDb } from '../mocks/db';
import type { Area } from '../types/domain';
import { listarOportunidadesDaEntidade, obterBancoDeHoras } from './horas';
import { obterPainelAdmin, obterPainelEntidade, type Periodo } from './indicadores';
import { listarOportunidadesAbertas } from './oportunidades';
import {
  listarCampanhas,
  listarEntidadesPublicas,
  listarEventos,
  listarOportunidades,
  listarParceiros,
  listarProdutos,
  obterCampanha,
  obterEntidadePublica,
  obterEvento,
  obterOportunidade,
  obterProduto,
  obterProdutosPorId,
  obterResumoPublico,
  type FiltroOportunidades,
} from './publico';
import { listarBeneficiosDoParceiro, listarResgates } from './parceiros';
import { acompanharPedido, listarMeusIngressos, listarMinhasDoacoes } from './pedidos';
import { listarEntidades, listarVoluntariosDaEntidade, obterMeuPainel, obterVoluntarioDaEntidade, ServiceError } from './voluntarios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Erro de regra (ServiceError) não melhora tentando de novo.
      retry: (count, error) => !(error instanceof ServiceError) && count < 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const useVoluntariosDaEntidade = (entidadeId: string) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'voluntarios'], queryFn: () => listarVoluntariosDaEntidade(entidadeId) });

export const useVoluntarioDaEntidade = (id: string, entidadeId: string) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'voluntario', id], queryFn: () => obterVoluntarioDaEntidade(id, entidadeId) });

export const useOportunidadesDaEntidade = (entidadeId: string) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'oportunidades'], queryFn: () => listarOportunidadesDaEntidade(entidadeId) });

export const useBancoDeHoras = (entidadeId: string) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'horas'], queryFn: () => obterBancoDeHoras(entidadeId) });

export const useMeuPainel = (voluntarioId: string) =>
  useQuery({ queryKey: ['voluntario', voluntarioId, 'painel'], queryFn: () => obterMeuPainel(voluntarioId) });

export const useOportunidadesAbertas = (area?: Area) =>
  useQuery({ queryKey: ['oportunidades', area ?? 'todas'], queryFn: () => listarOportunidadesAbertas({ area }) });

export const useBeneficiosDoParceiro = (parceiroId: string) =>
  useQuery({ queryKey: ['parceiro', parceiroId, 'beneficios'], queryFn: () => listarBeneficiosDoParceiro(parceiroId) });

export const useResgates = (parceiroId: string) =>
  useQuery({ queryKey: ['parceiro', parceiroId, 'resgates'], queryFn: () => listarResgates(parceiroId) });

export const usePainelAdmin = (periodo: Periodo, entidadeId?: string) =>
  useQuery({
    queryKey: ['admin', 'painel', periodo, entidadeId ?? 'todas'],
    queryFn: () => obterPainelAdmin({ periodo, entidadeId }),
    // Ao trocar o filtro, mantém os números anteriores na tela até chegarem os novos.
    placeholderData: keepPreviousData,
  });

export const usePainelEntidade = (entidadeId: string, periodo: Periodo) =>
  useQuery({
    queryKey: ['entidade', entidadeId, 'painel', periodo],
    queryFn: () => obterPainelEntidade({ entidadeId, periodo }),
    placeholderData: keepPreviousData,
  });

export const useEntidades = () => useQuery({ queryKey: ['entidades'], queryFn: listarEntidades });

// ---------- Site público ----------
export const useResumoPublico = () => useQuery({ queryKey: ['publico', 'resumo'], queryFn: obterResumoPublico });
export const useOportunidades = (f: FiltroOportunidades) =>
  useQuery({ queryKey: ['publico', 'oportunidades', f], queryFn: () => listarOportunidades(f), placeholderData: keepPreviousData });
export const useOportunidade = (id: string) => useQuery({ queryKey: ['publico', 'oportunidade', id], queryFn: () => obterOportunidade(id) });
export const useEventos = (entidadeId?: string) =>
  useQuery({ queryKey: ['publico', 'eventos', entidadeId ?? 'todas'], queryFn: () => listarEventos({ entidadeId }) });
export const useEvento = (slug: string) => useQuery({ queryKey: ['publico', 'evento', slug], queryFn: () => obterEvento(slug) });
export const useCampanhas = (entidadeId?: string) =>
  useQuery({ queryKey: ['publico', 'campanhas', entidadeId ?? 'todas'], queryFn: () => listarCampanhas({ entidadeId }) });
export const useCampanha = (slug: string) => useQuery({ queryKey: ['publico', 'campanha', slug], queryFn: () => obterCampanha(slug) });
export const useProdutos = (entidadeId?: string) =>
  useQuery({ queryKey: ['publico', 'produtos', entidadeId ?? 'todas'], queryFn: () => listarProdutos({ entidadeId }), placeholderData: keepPreviousData });
export const useProduto = (slug: string) => useQuery({ queryKey: ['publico', 'produto', slug], queryFn: () => obterProduto(slug) });
export const useProdutosPorId = (ids: string[]) =>
  useQuery({ queryKey: ['publico', 'produtos-id', [...ids].sort()], queryFn: () => obterProdutosPorId(ids), placeholderData: keepPreviousData });
export const useEntidadesPublicas = () => useQuery({ queryKey: ['publico', 'entidades'], queryFn: listarEntidadesPublicas });
export const useEntidadePublica = (slug: string) => useQuery({ queryKey: ['publico', 'entidade', slug], queryFn: () => obterEntidadePublica(slug) });
export const useParceiros = () => useQuery({ queryKey: ['publico', 'parceiros'], queryFn: listarParceiros });

// ---------- Pedidos ----------
/** Dados do voluntário logado para preencher o checkout (só quando há um). */
export const usePerfilComprador = (voluntarioId?: string) =>
  useQuery({ queryKey: ['voluntario', voluntarioId, 'painel'], queryFn: () => obterMeuPainel(voluntarioId!), enabled: !!voluntarioId });
/** Acompanha o pagamento: consulta a cada segundo enquanto o pedido aguarda. */
export const useAndamentoPedido = (pedidoId: string | null) =>
  useQuery({
    queryKey: ['pedido', pedidoId],
    queryFn: () => acompanharPedido(pedidoId!),
    enabled: !!pedidoId,
    refetchInterval: (q) => (q.state.data?.pedido.status === 'aguardando' ? 1000 : false),
  });
export const useMeusIngressos = (voluntarioId: string) =>
  useQuery({ queryKey: ['voluntario', voluntarioId, 'ingressos'], queryFn: () => listarMeusIngressos(voluntarioId) });
export const useMinhasDoacoes = (voluntarioId: string) =>
  useQuery({ queryKey: ['voluntario', voluntarioId, 'doacoes'], queryFn: () => listarMinhasDoacoes(voluntarioId) });

/**
 * Mutação que, ao dar certo, recarrega todas as consultas. No protótipo os dados são pequenos e
 * uma ação de um perfil (ex.: check-in) muda telas de outros (carteirinha, validação do parceiro).
 */
export function useGeraMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const client = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => client.invalidateQueries() });
}

/** Volta para os dados de exemplo originais (útil antes de uma demonstração). */
export function restaurarDadosDeExemplo() {
  resetDb();
  return queryClient.resetQueries();
}

/** Mensagem para mostrar a partir de qualquer erro de serviço. */
export const mensagemDeErro = (error: unknown) =>
  error instanceof ServiceError ? error.message : 'Algo deu errado do nosso lado. Tente de novo em instantes.';
