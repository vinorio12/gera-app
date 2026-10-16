import { beforeEach, describe, expect, it } from 'vitest';
import { getDb, resetDb } from '../mocks/db';
import { FONTES, obterPainelAdmin, obterPainelEntidade, periodoAnterior, periodoDoPreset } from './indicadores';

beforeEach(() => resetDb());

describe('períodos', () => {
  it('presets terminam hoje', () => {
    const hoje = new Date(2026, 9, 15);
    expect(periodoDoPreset('mes', hoje)).toEqual({ inicio: '2026-10-01', fim: '2026-10-15' });
    expect(periodoDoPreset('trimestre', hoje)).toEqual({ inicio: '2026-07-16', fim: '2026-10-15' });
  });
  it('o período anterior tem o mesmo número de dias e termina na véspera', () => {
    expect(periodoAnterior({ inicio: '2026-10-01', fim: '2026-10-15' })).toEqual({ inicio: '2026-09-16', fim: '2026-09-30' });
  });
});

describe('painéis', () => {
  const ano = { inicio: '2025-10-16', fim: '2026-10-15' };

  it('a arrecadação por fonte inclui patrocínios e fecha com o total', async () => {
    expect(FONTES).toContain('Patrocínios');
    const p = await obterPainelAdmin({ periodo: ano });
    const somaFontes = Math.round(p.arrecadacaoPorFonte.reduce((s, f) => s + f.valor, 0) * 100) / 100;
    expect(somaFontes).toBeCloseTo(p.arrecadado.atual, 2);
    expect(p.arrecadacaoPorFonte.find((f) => f.fonte === 'Patrocínios')!.valor).toBeGreaterThan(0);
  });

  it('o painel da entidade só conta os dados dela', async () => {
    const p = await obterPainelEntidade({ entidadeId: 'ama-jaragua', periodo: ano });
    const horas = getDb().horas.filter((h) => h.entidadeId === 'ama-jaragua' && h.data >= ano.inicio && h.data <= ano.fim).reduce((s, h) => s + h.horas, 0);
    expect(p.horas.atual).toBe(horas);
    expect(p.pendencias.estoqueBaixo.every((x) => x.entidadeId === 'ama-jaragua' && x.estoque <= 3)).toBe(true);
  });

  it('sem dados para comparar, não inventa variação', async () => {
    const p = await obterPainelAdmin({ periodo: { inicio: '2025-10-16', fim: '2026-10-15' } });
    expect(p.arrecadado.anterior).toBeNull();
  });
});
