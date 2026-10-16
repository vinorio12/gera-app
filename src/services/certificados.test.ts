import { beforeEach, describe, expect, it } from 'vitest';
import { getDb, resetDb } from '../mocks/db';
import { emitirCertificados, gerarCodigoCertificado, horasNoPeriodo, listarElegiveis, normalizarCodigoCertificado, validarCertificado } from './certificados';

beforeEach(() => resetDb());

describe('código de verificação', () => {
  it('tem o formato GERA-XXXX-XXXX sem letras que confundem', () => {
    for (let i = 0; i < 50; i++) expect(gerarCodigoCertificado()).toMatch(/^GERA-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  });
  it('aceita o código digitado de qualquer jeito', () => {
    expect(normalizarCodigoCertificado('gera 7k2m 4qxa')).toBe('GERA-7K2M-4QXA');
    expect(normalizarCodigoCertificado('GERA-7K2M-4QXA')).toBe('GERA-7K2M-4QXA');
    expect(normalizarCodigoCertificado('ABC')).toBeNull();
  });
});

describe('emissão e validação', () => {
  const periodo = { inicio: '2026-07-01', fim: '2026-09-30' };

  it('soma só as horas da entidade no período', () => {
    const regs = [
      { voluntarioId: 'v1', entidadeId: 'e1', data: '2026-07-10', horas: 4 },
      { voluntarioId: 'v1', entidadeId: 'e1', data: '2026-10-01', horas: 6 },
      { voluntarioId: 'v1', entidadeId: 'e2', data: '2026-08-01', horas: 3 },
    ];
    expect(horasNoPeriodo(regs, 'v1', 'e1', periodo)).toBe(4);
  });

  it('emite em lote com as horas do banco e valida pelo código', async () => {
    const elegiveis = await listarElegiveis({ entidadeId: 'ama-jaragua', periodo });
    expect(elegiveis.length).toBeGreaterThan(0);
    const emitidos = await emitirCertificados({ entidadeId: 'ama-jaragua', periodo, voluntarioIds: elegiveis.map((e) => e.voluntarioId) });
    expect(emitidos).toHaveLength(elegiveis.length);
    emitidos.forEach((c, i) => expect(c.horas).toBe(elegiveis[i]!.horas));
    const validado = await validarCertificado(emitidos[0]!.codigo.toLowerCase());
    expect(validado).toMatchObject({ nome: emitidos[0]!.nome, horas: emitidos[0]!.horas, inicio: periodo.inicio, fim: periodo.fim });
    expect(getDb().auditoria.some((a) => a.acao === 'Emitiu certificados')).toBe(true);
  });

  it('recusa quem não tem horas no período e código inexistente', async () => {
    await expect(emitirCertificados({ entidadeId: 'ama-jaragua', periodo, voluntarioIds: ['v-bruna'] })).rejects.toThrow(/não tem horas/);
    await expect(validarCertificado('GERA-AAAA-BBBB')).rejects.toThrow(/Não existe certificado/);
  });
});
