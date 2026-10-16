// "Banco" do protótipo: os dados de exemplo em memória, com as mudanças (aprovações, check-ins, resgates)
// salvas no navegador para a jornada continuar entre perfis e recarregamentos.
// Só os serviços (src/services) importam daqui; nenhum componente lê os dados de exemplo direto.
import type { MockDb } from '../types/domain';
import { createSeed, DB_VERSION } from './seed';

const STORAGE_KEY = 'gera.dados';

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockDb;
      if (parsed.versao === DB_VERSION) return parsed;
    }
  } catch {
    // storage bloqueado ou dado corrompido: volta aos dados de exemplo
  }
  return createSeed();
}

let db = load();

export function getDb(): MockDb {
  return db;
}

const estourouCota = (erro: unknown) =>
  erro instanceof DOMException && (erro.name === 'QuotaExceededError' || erro.name === 'NS_ERROR_DOM_QUOTA_REACHED' || erro.code === 22 || erro.code === 1014);

/**
 * Aplica uma mudança e salva. Devolve false só quando o navegador recusou por falta de espaço (cota cheia):
 * quem grava imagens usa isso para avisar e desfazer. Storage bloqueado de vez conta como salvo (a mudança vale até recarregar).
 */
export function commit(change: (db: MockDb) => void): boolean {
  change(db);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (erro) {
    return !estourouCota(erro);
  }
  return true;
}

/** Volta tudo para os dados de exemplo originais. */
export function resetDb() {
  db = createSeed();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // idem
  }
}

/** Simula a latência de rede, para os estados de carregamento aparecerem. */
export const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

let nextId = Date.now();
export const newId = (prefix: string) => `${prefix}-${(nextId++).toString(36)}`;
