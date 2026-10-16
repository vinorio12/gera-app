// Quem está usando o sistema, do ponto de vista dos serviços. No protótipo, o AuthProvider avisa a
// cada troca de sessão; com a API real, o servidor tira isso do token de acesso.
import { commit, newId } from '../mocks/db';
import type { RegistroAuditoria } from '../types/domain';

let ator = 'Sistema';

export function definirAtor(nome: string | null) {
  ator = nome ?? 'Sistema';
}

export const atorAtual = () => ator;

/** Grava no histórico de auditoria (dentro do commit de quem chamou ou num commit próprio). */
export function auditar(registro: Omit<RegistroAuditoria, 'id' | 'em' | 'autor'>) {
  commit((db) => db.auditoria.push({ id: newId('aud'), em: new Date().toISOString(), autor: ator, ...registro }));
}
