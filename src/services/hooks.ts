// Hooks do TanStack Query sobre a camada de serviços: é o que as telas usam.
import { QueryClient, keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resetDb } from '../mocks/db';
import type { Area, CategoriaBeneficio } from '../types/domain';
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
import {
  listarCampanhasGestao,
  listarEventosGestao,
  listarIngressosDoEvento,
  listarMovimentos,
  listarOportunidadesGestao,
  listarPatrocinadores,
  listarProdutosGestao,
  obterDoacoesDaCampanha,
  obterEventoGestao,
  obterOportunidadeGestao,
  obterPatrocinador,
  obterProdutoGestao,
} from './gestao';
import { listarBeneficiosDoParceiro, listarResgates } from './parceiros';
import { listarCertificadosDaEntidade, listarElegiveis, listarMeusCertificados, validarCertificado } from './certificados';
import { obterFinanceiro } from './financeiro';
import {
  listarAuditoria,
  listarCampanhasAdmin,
  listarEntidadesAdmin,
  listarEventosAdmin,
  listarTodosVoluntarios,
  obterComite,
  obterTermoVigente,
} from './admin';
import { obterEntidadeConfig } from './configuracoes';
import { listarBeneficiosAtivos, listarBeneficiosParaVoluntario, listarParceirosAdmin, obterEmpresa, obterPainelEsg } from './beneficios';
import { listarPedidosExclusao, obterMeuPerfil } from './perfil';
import { listarNotificacoes } from './notificacoes';
import { gerarRelatorio, type TipoRelatorio } from './relatorios';
import { acompanharPedido, listarMeusIngressos, listarMinhasCompras, listarMinhasDoacoes } from './pedidos';
import { listarEntidades, listarParaReengajar, listarVoluntariosDaEntidade, obterMeuPainel, obterVoluntarioDaEntidade, ServiceError } from './voluntarios';

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

export const useParaReengajar = (entidadeId: string) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'reengajar'], queryFn: () => listarParaReengajar(entidadeId) });

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
export const useMinhasCompras = (voluntarioId: string) =>
  useQuery({ queryKey: ['voluntario', voluntarioId, 'compras'], queryFn: () => listarMinhasCompras(voluntarioId) });
export const useMinhasDoacoes = (voluntarioId: string) =>
  useQuery({ queryKey: ['voluntario', voluntarioId, 'doacoes'], queryFn: () => listarMinhasDoacoes(voluntarioId) });

// ---------- Gestão da entidade ----------
export const useOportunidadesGestao = (entidadeId: string) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'oportunidades-gestao'], queryFn: () => listarOportunidadesGestao(entidadeId) });
export const useOportunidadeGestao = (id: string | undefined, entidadeId: string) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'oportunidade', id], queryFn: () => obterOportunidadeGestao(id!, entidadeId), enabled: !!id });
export const useEventosGestao = (entidadeId: string) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'eventos'], queryFn: () => listarEventosGestao(entidadeId) });
export const useEventoGestao = (id: string | undefined, entidadeId: string) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'evento', id], queryFn: () => obterEventoGestao(id!, entidadeId), enabled: !!id });
export const useIngressosDoEvento = (eventoId: string, entidadeId: string) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'evento', eventoId, 'ingressos'], queryFn: () => listarIngressosDoEvento(eventoId, entidadeId) });
export const useProdutosGestao = (entidadeId: string) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'produtos'], queryFn: () => listarProdutosGestao(entidadeId) });
export const useProdutoGestao = (id: string | undefined, entidadeId: string) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'produto', id], queryFn: () => obterProdutoGestao(id!, entidadeId), enabled: !!id });
export const useMovimentosEstoque = (entidadeId: string) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'movimentos'], queryFn: () => listarMovimentos(entidadeId) });
export const useCampanhasGestao = (entidadeId: string) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'campanhas'], queryFn: () => listarCampanhasGestao(entidadeId) });
export const useDoacoesDaCampanha = (id: string | undefined, entidadeId: string) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'campanha', id], queryFn: () => obterDoacoesDaCampanha(id!, entidadeId), enabled: !!id });
export const usePatrocinadores = (entidadeId: string) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'patrocinadores'], queryFn: () => listarPatrocinadores(entidadeId) });
export const usePatrocinador = (id: string | undefined, entidadeId: string) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'patrocinador', id], queryFn: () => obterPatrocinador(id!, entidadeId), enabled: !!id });

// ---------- Financeiro, certificados e relatórios ----------
export const useFinanceiro = (periodo: Periodo, entidadeId?: string) =>
  useQuery({
    queryKey: ['financeiro', entidadeId ?? 'todas', periodo],
    queryFn: () => obterFinanceiro({ periodo, entidadeId }),
    placeholderData: keepPreviousData,
  });
export const useElegiveis = (entidadeId: string, periodo: Periodo) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'elegiveis', periodo], queryFn: () => listarElegiveis({ entidadeId, periodo }), placeholderData: keepPreviousData });
export const useCertificadosDaEntidade = (entidadeId: string) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'certificados'], queryFn: () => listarCertificadosDaEntidade(entidadeId) });
export const useMeusCertificados = (voluntarioId: string) =>
  useQuery({ queryKey: ['voluntario', voluntarioId, 'certificados'], queryFn: () => listarMeusCertificados(voluntarioId) });
export const useValidacaoCertificado = (codigo: string) =>
  useQuery({ queryKey: ['publico', 'certificado', codigo], queryFn: () => validarCertificado(codigo), enabled: !!codigo });
export const useRelatorio = (tipo: TipoRelatorio, periodo: Periodo, entidadeId?: string) =>
  useQuery({
    queryKey: ['relatorio', tipo, entidadeId ?? 'todas', periodo],
    queryFn: () => gerarRelatorio({ tipo, periodo, entidadeId }),
    placeholderData: keepPreviousData,
  });

// ---------- Admin e configurações ----------
export const useEntidadesAdmin = () => useQuery({ queryKey: ['admin', 'entidades'], queryFn: listarEntidadesAdmin });
export const useTodosVoluntarios = () => useQuery({ queryKey: ['admin', 'voluntarios'], queryFn: listarTodosVoluntarios });
export const useEventosAdmin = (entidadeId?: string) =>
  useQuery({ queryKey: ['admin', 'eventos', entidadeId ?? 'todas'], queryFn: () => listarEventosAdmin({ entidadeId }), placeholderData: keepPreviousData });
export const useCampanhasAdmin = (periodo: Periodo, entidadeId?: string) =>
  useQuery({ queryKey: ['admin', 'campanhas', entidadeId ?? 'todas', periodo], queryFn: () => listarCampanhasAdmin({ entidadeId, periodo }), placeholderData: keepPreviousData });
export const useComite = () => useQuery({ queryKey: ['admin', 'comite'], queryFn: obterComite });
export const useTermoVigente = () => useQuery({ queryKey: ['publico', 'termo'], queryFn: obterTermoVigente });
export const useAuditoria = () => useQuery({ queryKey: ['admin', 'auditoria'], queryFn: listarAuditoria });
export const useEntidadeConfig = (entidadeId: string) =>
  useQuery({ queryKey: ['entidade', entidadeId, 'config'], queryFn: () => obterEntidadeConfig(entidadeId) });

// ---------- Benefícios, perfil e notificações ----------
export const useBeneficiosAtivos = (parceiroId: string) =>
  useQuery({ queryKey: ['parceiro', parceiroId, 'beneficios-ativos'], queryFn: () => listarBeneficiosAtivos(parceiroId) });
export const useEmpresa = (parceiroId: string) => useQuery({ queryKey: ['parceiro', parceiroId, 'empresa'], queryFn: () => obterEmpresa(parceiroId) });
export const usePainelEsg = (parceiroId: string) => useQuery({ queryKey: ['parceiro', parceiroId, 'esg'], queryFn: () => obterPainelEsg(parceiroId) });
export const useParceirosAdmin = () => useQuery({ queryKey: ['admin', 'parceiros'], queryFn: listarParceirosAdmin });
export const useBeneficiosParaVoluntario = (voluntarioId: string, categoria?: CategoriaBeneficio) =>
  useQuery({
    queryKey: ['voluntario', voluntarioId, 'beneficios', categoria ?? 'todas'],
    queryFn: () => listarBeneficiosParaVoluntario(voluntarioId, categoria),
    placeholderData: keepPreviousData,
  });
export const useMeuPerfil = (voluntarioId: string) => useQuery({ queryKey: ['voluntario', voluntarioId, 'perfil'], queryFn: () => obterMeuPerfil(voluntarioId) });
export const usePedidosExclusao = () => useQuery({ queryKey: ['admin', 'lgpd'], queryFn: listarPedidosExclusao });
export const useNotificacoes = (voluntarioId: string) =>
  useQuery({ queryKey: ['voluntario', voluntarioId, 'notificacoes'], queryFn: () => listarNotificacoes(voluntarioId) });

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
