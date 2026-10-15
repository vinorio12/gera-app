// Pagamentos atrás de uma interface: o back-end escolhe depois o provedor (Mercado Pago, Asaas,
// PagBank, Pagar.me ou Stripe) sem mudar nenhuma tela. No protótipo, um provedor simulado aprova
// a cobrança depois de alguns segundos.
import { addDays, format } from 'date-fns';
import type { MetodoPagamento } from '../types/domain';
import { ServiceError } from './voluntarios';

export type StatusCobranca = 'pendente' | 'aprovada' | 'recusada' | 'expirada';

export interface Cobranca {
  id: string;
  metodo: MetodoPagamento;
  valor: number;
  status: StatusCobranca;
  criadaEm: string;
  recorrente: boolean;
  pix?: { copiaECola: string; expiraEm: string };
  boleto?: { linhaDigitavel: string; vencimento: string };
  cartao?: { final: string; parcelas: number };
  motivoRecusa?: string;
}

export interface DadosCartao {
  numero: string;
  nome: string;
  validade: string;
  cvv: string;
}

export interface NovaCobranca {
  metodo: MetodoPagamento;
  valor: number;
  descricao: string;
  pagador: { nome: string; email: string };
  parcelas?: number;
  cartao?: DadosCartao;
}

export interface PaymentProvider {
  readonly nome: string;
  criarCobranca(input: NovaCobranca): Promise<Cobranca>;
  /** Cobrança mensal recorrente (só no cartão). */
  criarAssinatura(input: NovaCobranca): Promise<Cobranca>;
  consultarStatus(id: string): Promise<Cobranca>;
}

// ---------- Provedor simulado ----------

/** Quanto tempo cada método leva para "aprovar" no protótipo. */
const APROVA_EM_MS: Record<MetodoPagamento, number> = { pix: 5000, cartao: 2000, boleto: 8000 };
const PIX_VALIDADE_MIN = 10;

/** Algoritmo de Luhn: confere os dígitos do cartão sem guardar o número. */
export function cartaoValido(numero: string) {
  const d = numero.replace(/\D/g, '');
  if (d.length < 13 || d.length > 19) return false;
  let soma = 0;
  [...d].reverse().forEach((ch, i) => {
    let n = Number(ch);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    soma += n;
  });
  return soma % 10 === 0;
}

function validadeOk(mmaa: string) {
  const m = mmaa.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const mes = Number(m[1]);
  const fim = new Date(2000 + Number(m[2]), mes, 0, 23, 59);
  return mes >= 1 && mes <= 12 && fim >= new Date();
}

const digitos = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');

class ProvedorSimulado implements PaymentProvider {
  readonly nome = 'Simulado (protótipo)';
  private cobrancas = new Map<string, Cobranca>();

  async criarCobranca(input: NovaCobranca): Promise<Cobranca> {
    return this.criar(input, false);
  }

  async criarAssinatura(input: NovaCobranca): Promise<Cobranca> {
    if (input.metodo !== 'cartao') throw new ServiceError('A doação mensal é feita no cartão de crédito.');
    return this.criar(input, true);
  }

  async consultarStatus(id: string): Promise<Cobranca> {
    await new Promise((r) => setTimeout(r, 150));
    const c = this.cobrancas.get(id);
    if (!c) throw new ServiceError('Não encontramos esse pagamento. Comece de novo.');
    if (c.status === 'pendente') {
      const passou = Date.now() - new Date(c.criadaEm).getTime();
      if (c.pix && Date.now() > new Date(c.pix.expiraEm).getTime()) c.status = 'expirada';
      else if (passou >= APROVA_EM_MS[c.metodo]) c.status = 'aprovada';
    }
    return { ...c };
  }

  private async criar(input: NovaCobranca, recorrente: boolean): Promise<Cobranca> {
    await new Promise((r) => setTimeout(r, 400));
    if (!(input.valor > 0)) throw new ServiceError('O valor precisa ser maior que zero.');
    const agora = new Date();
    const id = `cob_${agora.getTime().toString(36)}${digitos(4)}`;
    const base: Cobranca = { id, metodo: input.metodo, valor: input.valor, status: 'pendente', criadaEm: agora.toISOString(), recorrente };

    if (input.metodo === 'cartao') {
      const c = input.cartao;
      if (!c || !cartaoValido(c.numero)) throw new ServiceError('Confira o número do cartão.');
      if (!validadeOk(c.validade)) throw new ServiceError('Confira a validade do cartão (MM/AA).');
      if (!/^\d{3,4}$/.test(c.cvv)) throw new ServiceError('Confira o código de segurança (CVV).');
      const final = c.numero.replace(/\D/g, '').slice(-4);
      base.cartao = { final, parcelas: input.parcelas ?? 1 };
      // Cartão de teste para ver a recusa: final 0002.
      if (final === '0002') {
        base.status = 'recusada';
        base.motivoRecusa = 'O banco emissor recusou o cartão. Tente outro cartão ou pague com Pix.';
      }
    }
    if (input.metodo === 'pix') {
      base.pix = {
        // Formato parecido com o "copia e cola" de verdade; não é um Pix válido.
        copiaECola: `00020126580014BR.GOV.BCB.PIX0136gera-prototipo-${id}5204000053039865406${input.valor.toFixed(2)}5802BR5913COMITE SOCIAL6013JARAGUA DO SUL6304${digitos(4)}`,
        expiraEm: new Date(agora.getTime() + PIX_VALIDADE_MIN * 60_000).toISOString(),
      };
    }
    if (input.metodo === 'boleto') {
      base.boleto = {
        linhaDigitavel: `34191.${digitos(5)} ${digitos(5)}.${digitos(6)} ${digitos(5)}.${digitos(6)} ${digitos(1)} ${digitos(14)}`,
        vencimento: format(addDays(agora, 3), 'yyyy-MM-dd'),
      };
    }
    this.cobrancas.set(id, base);
    return { ...base };
  }
}

/** O provedor em uso. Para trocar, implemente PaymentProvider e mude só esta linha. */
export const paymentProvider: PaymentProvider = new ProvedorSimulado();
