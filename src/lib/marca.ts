// Cor de marca da entidade: um token de portal (atalhos da GERA) ou uma cor livre escolhida por ela (dado, nunca hex no código).
import type { CSSProperties } from 'react';
import type { Entidade } from '../types/domain';
import { textoSobreCor } from './contraste';
import { corDoToken } from './coresPdf';

type CorDaEntidade = Pick<Entidade, 'corDestaque' | 'corLivre'>;

/** A cor efetiva em hex: a livre, ou o valor do token escolhido. */
export const hexDaMarca = (e: CorDaEntidade): string => e.corLivre ?? corDoToken(e.corDestaque);

export const coresDeTexto = () => ({ tinta: corDoToken('tinta'), papel: corDoToken('papel') });

export interface MarcaDaEntidade {
  hex: string;
  /** Texto que pode ficar sobre a cor; null = só faixa e borda, nunca atrás de texto. */
  texto: 'tinta' | 'papel' | null;
  razao: number;
  /** Variáveis CSS para pôr no elemento da marca (`--cor-entidade` e `--texto-cor-entidade`). */
  estilo: CSSProperties;
}

export function marcaDaEntidade(e: CorDaEntidade): MarcaDaEntidade {
  const hex = hexDaMarca(e);
  const { texto, razao } = textoSobreCor(hex, coresDeTexto());
  const estilo = {
    '--cor-entidade': hex,
    ...(texto ? { '--texto-cor-entidade': `var(--${texto})` } : {}),
  } as CSSProperties;
  return { hex, texto, razao, estilo };
}
