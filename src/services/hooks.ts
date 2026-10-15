// Hooks do TanStack Query sobre a camada de serviços: é o que as telas usam.
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resetDb } from '../mocks/db';
import type { Area } from '../types/domain';
import { listarOportunidadesDaEntidade, obterBancoDeHoras } from './horas';
import { listarOportunidadesAbertas } from './oportunidades';
import { listarBeneficiosDoParceiro, listarResgates } from './parceiros';
import { listarVoluntariosDaEntidade, obterMeuPainel, obterVoluntarioDaEntidade, ServiceError } from './voluntarios';

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
