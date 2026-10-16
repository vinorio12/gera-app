// Gravação de fotos e banners nos dados. Com a API real, a imagem vai para um storage e aqui fica só o endereço.
import { commit } from '../mocks/db';
import { MENSAGEM_NAO_COUBE, validarImagemSalva, type TipoImagem } from '../lib/imagem';
import { ServiceError } from './voluntarios';

/**
 * Grava (ou remove, com null) a imagem de um campo. Se o navegador recusar por falta de espaço,
 * desfaz a mudança e avisa, em vez de perder a imagem calado.
 */
export function gravarImagem<T extends object>(alvo: T, campo: keyof T & string, valor: string | null, tipo: TipoImagem) {
  if (valor !== null) {
    const erro = validarImagemSalva(valor, tipo);
    if (erro) throw new ServiceError(erro);
  }
  const registro = alvo as Record<string, unknown>;
  const antes = registro[campo];
  const coube = commit(() => {
    if (valor === null) delete registro[campo];
    else registro[campo] = valor;
  });
  if (!coube) {
    if (antes === undefined) delete registro[campo];
    else registro[campo] = antes;
    throw new ServiceError(MENSAGEM_NAO_COUBE);
  }
}
