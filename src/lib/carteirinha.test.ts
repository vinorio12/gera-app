import { describe, expect, it } from 'vitest';
import type { RegistroHoras, Voluntario } from '../types/domain';
import {
  QR_JANELA_MS,
  dadosCarteirinha,
  elegibilidade,
  etapasCarteirinha,
  lerCodigo,
  normalizarRegistro,
  statusDoVoluntario,
  tokenCarteirinha,
  ultimaAcao,
} from './carteirinha';

const AGORA = new Date('2026-10-15T12:00:00');

const voluntario = (extra: Partial<Voluntario> = {}): Voluntario => ({
  id: 'v-teste',
  nome: 'Teste da Silva',
  cpf: '000.000.000-00',
  email: 'teste@exemplo.com.br',
  telefone: '(47) 99999-0000',
  nascimento: '1990-01-01',
  formacao: 'Pedagogia',
  areas: ['Educação'],
  entidadeIds: ['ama-jaragua'],
  cadastroEm: '2025-01-10',
  termoAceitoEm: '2025-01-10',
  aprovadoEm: '2025-01-12',
  desligamento: null,
  registro: 'JS-2025-000123',
  ...extra,
});

const registro = (data: string, horas = 4): RegistroHoras => ({
  id: `h-${data}`,
  voluntarioId: 'v-teste',
  entidadeId: 'ama-jaragua',
  oportunidadeId: null,
  data,
  projeto: 'Oficina',
  horas,
  origem: 'qr',
});

describe('status pela regra dos 6 meses', () => {
  it('é ativo com ação nos últimos 6 meses', () => {
    expect(statusDoVoluntario(voluntario(), [registro('2026-09-01')], AGORA)).toBe('ativo');
  });
  it('fica inativo sem ação há mais de 6 meses', () => {
    expect(statusDoVoluntario(voluntario(), [registro('2026-01-02')], AGORA)).toBe('inativo');
  });
  it('desligado vence qualquer ação recente', () => {
    expect(statusDoVoluntario(voluntario({ desligamento: { em: '2026-10-01', motivo: 'Pediu para sair' } }), [registro('2026-10-10')], AGORA)).toBe('desligado');
  });
  it('a última ação é a data mais recente', () => {
    expect(ultimaAcao([registro('2026-03-01'), registro('2026-08-20'), registro('2026-05-05')])).toBe('2026-08-20');
    expect(ultimaAcao([])).toBeNull();
  });
});

describe('os 4 passos da carteirinha', () => {
  it('só libera com cadastro, termo, aprovação e o primeiro check-in', () => {
    expect(etapasCarteirinha(voluntario({ aprovadoEm: null }), []).filter((e) => !e.feito).map((e) => e.id)).toEqual(['aprovacao', 'checkin']);
    expect(dadosCarteirinha(voluntario(), [], AGORA).liberada).toBe(false);
    expect(dadosCarteirinha(voluntario(), [registro('2026-10-10')], AGORA).liberada).toBe(true);
  });
  it('vale 182 dias depois da última ação e soma as horas', () => {
    const d = dadosCarteirinha(voluntario(), [registro('2026-10-10', 6), registro('2026-05-01', 4)], AGORA);
    expect(d.emitidaEm).toBe('2026-10-10');
    expect(d.validaAte).toBe('2027-04-10');
    expect(d.totalHoras).toBe(10);
  });
  it('elegibilidade explica o que falta', () => {
    const v = voluntario({ aprovadoEm: null });
    const r = elegibilidade(v, dadosCarteirinha(v, [], AGORA));
    expect(r.elegivel).toBe(false);
    if (!r.elegivel) expect(r.motivo).toContain('aprovado pela entidade');
    const ok = voluntario();
    expect(elegibilidade(ok, dadosCarteirinha(ok, [registro('2026-10-01')], AGORA))).toEqual({ elegivel: true });
  });
});

describe('QR temporário e número digitado', () => {
  it('o token lido de volta dá o registro', () => {
    const agora = Date.now();
    expect(lerCodigo(tokenCarteirinha('JS-2025-000123', agora), agora)).toEqual({ registro: 'JS-2025-000123' });
  });
  it('recusa QR vencido e QR adulterado', () => {
    const t0 = 1_800_000_000_000;
    const token = tokenCarteirinha('JS-2025-000123', t0);
    expect(lerCodigo(token, t0 + 5 * QR_JANELA_MS)).toEqual({ erro: expect.stringContaining('expirou') });
    expect(lerCodigo(token.replace(/:[a-z0-9]+$/, ':zzzzz'), t0)).toEqual({ erro: expect.stringContaining('não é de uma carteirinha') });
  });
  it('aceita o número digitado com ou sem hífen', () => {
    expect(normalizarRegistro('js2025000123')).toBe('JS-2025-000123');
    expect(normalizarRegistro(' JS-2025-000123 ')).toBe('JS-2025-000123');
    expect(lerCodigo('12345')).toEqual({ erro: expect.any(String) });
  });
});
