// Lista de espera das oportunidades: regras puras, para os serviços e os testes.
import type { Oportunidade } from '../types/domain';

type ComFila = Pick<Oportunidade, 'vagas' | 'inscritos' | 'espera'>;

/** Passa os primeiros da fila para os inscritos enquanto houver vaga. Muda a oportunidade e devolve quem entrou. */
export function preencherVagas(o: ComFila): string[] {
  const entraram: string[] = [];
  while (o.inscritos.length < o.vagas && o.espera.length > 0) {
    const id = o.espera.shift()!;
    if (!o.inscritos.includes(id)) {
      o.inscritos.push(id);
      entraram.push(id);
    }
  }
  return entraram;
}

/** 1 para o primeiro da fila; 0 quando a pessoa não está nela. */
export const posicaoNaFila = (o: Pick<Oportunidade, 'espera'>, voluntarioId: string) => o.espera.indexOf(voluntarioId) + 1;

export const lotada = (o: Pick<Oportunidade, 'vagas' | 'inscritos'>) => o.inscritos.length >= o.vagas;
