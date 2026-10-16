// Regras puras das etapas 7 a 10: agenda, lista de espera, marcos, notificações e exportações.
import { describe, expect, it } from 'vitest';
import { mascararCpf } from '../services/admin';
import type { Oportunidade, Voluntario } from '../types/domain';
import { agendaDaOportunidade, gerarIcs, linkWhatsApp } from './agenda';
import { dadosCarteirinha } from './carteirinha';
import { documentoParaCsv, type Documento } from './documento';
import { preencherVagas, posicaoNaFila } from './listaEspera';
import { progressoMarcos } from './marcos';
import { gerarNotificacoes, naoVistas } from './notificacoes';

const oportunidade = (extra: Partial<Oportunidade> = {}): Oportunidade => ({
  id: 'o1',
  entidadeId: 'e1',
  titulo: 'Mutirão, pintura; e limpeza',
  descricao: 'Pintar a sede.',
  area: 'Educação',
  data: '2026-10-17',
  turno: 'Tarde',
  horas: 4,
  local: 'Sede',
  vagas: 2,
  inscritos: ['a', 'b'],
  usaFormacao: false,
  encerradaEm: null,
  espera: ['c', 'd'],
  ...extra,
});

describe('lista de espera', () => {
  it('quando abre vaga, entra o primeiro da fila', () => {
    const o = oportunidade();
    o.inscritos = ['a'];
    expect(preencherVagas(o)).toEqual(['c']);
    expect(o.inscritos).toEqual(['a', 'c']);
    expect(o.espera).toEqual(['d']);
    expect(posicaoNaFila(o, 'd')).toBe(1);
    expect(posicaoNaFila(o, 'x')).toBe(0);
  });
  it('mais vagas puxam mais gente da fila', () => {
    const o = oportunidade({ vagas: 5 });
    expect(preencherVagas(o)).toEqual(['c', 'd']);
  });
});

describe('agenda e WhatsApp', () => {
  it('gera um .ics válido, com CRLF e texto escapado', () => {
    const ics = gerarIcs(agendaDaOportunidade(oportunidade(), 'https://gera.exemplo/oportunidades/o1'), new Date('2026-10-16T12:00:00Z'));
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('SUMMARY:Voluntariado: Mutirão\\, pintura\\; e limpeza');
    expect(ics).toMatch(/DTSTART:20261017T\d{4}00Z/);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
  });
  it('o link do WhatsApp leva o texto codificado e o telefone com DDI', () => {
    expect(linkWhatsApp('Oi, tudo bem?')).toBe('https://wa.me/?text=Oi%2C%20tudo%20bem%3F');
    expect(linkWhatsApp('Oi', '(47) 99123-4567')).toBe('https://wa.me/5547991234567?text=Oi');
  });
});

describe('marcos de horas', () => {
  it('mostra os atingidos e quanto falta', () => {
    expect(progressoMarcos(0)).toEqual({ atingidos: [], proximo: 10, faltam: 10 });
    expect(progressoMarcos(125)).toEqual({ atingidos: [10, 50, 100], proximo: 250, faltam: 125 });
    expect(progressoMarcos(300)).toEqual({ atingidos: [10, 50, 100, 250], proximo: null, faltam: 0 });
  });
});

describe('notificações', () => {
  const v: Voluntario = {
    id: 'v1', nome: 'Alex Teste', cpf: '', email: '', telefone: '', nascimento: '1990-01-01', formacao: '', areas: ['Educação'],
    entidadeIds: ['e1'], cadastroEm: '2026-01-01', termoAceitoEm: '2026-01-01', aprovadoEm: '2026-01-03', desligamento: null, registro: 'JS-2026-000001',
  };
  const prefs = { canais: ['app' as const], oportunidades: true, lembretes: true, beneficios: true, carteirinha: true };
  const agora = new Date('2026-10-16T10:00:00');

  it('gera aprovação, ação amanhã e carteirinha perto de vencer', () => {
    const regs = [{ id: 'h', voluntarioId: 'v1', entidadeId: 'e1', oportunidadeId: null, data: '2026-04-20', projeto: 'X', horas: 4, origem: 'qr' as const }];
    const lista = gerarNotificacoes(
      {
        voluntario: v, carteirinha: dadosCarteirinha(v, regs, agora), entidades: [], oportunidades: [oportunidade({ inscritos: ['v1'] })],
        pedidos: [], eventos: [], beneficios: [], parceiros: [], preferencias: prefs,
      },
      agora,
    );
    expect(lista.map((n) => n.tipo).sort()).toEqual(['acao', 'cadastro', 'carteirinha']);
    expect(lista.find((n) => n.tipo === 'carteirinha')!.titulo).toMatch(/vence em \d+ dias/);
    expect(naoVistas(lista, new Date('2030-01-01').toISOString())).toBe(0);
  });

  it('respeita as preferências (sem lembretes, sem aviso de amanhã)', () => {
    const lista = gerarNotificacoes(
      {
        voluntario: v, carteirinha: dadosCarteirinha(v, [], agora), entidades: [], oportunidades: [oportunidade({ inscritos: ['v1'] })],
        pedidos: [], eventos: [], beneficios: [], parceiros: [], preferencias: { ...prefs, lembretes: false },
      },
      agora,
    );
    expect(lista.some((n) => n.tipo === 'acao')).toBe(false);
  });
});

describe('exportações', () => {
  it('CSV para Excel em português: BOM, ";" e números pt-BR', () => {
    const doc: Documento = {
      titulo: 'Teste',
      subtitulo: 'AMA',
      geradoEm: '16/10/2026',
      secoes: [{ titulo: 'Entradas', colunas: [{ titulo: 'Fonte' }, { titulo: 'Valor', tipo: 'moeda' }, { titulo: 'Horas', tipo: 'horas' }], linhas: [['Loja; balcão', 1234.5, 12]] }],
    };
    const csv = documentoParaCsv(doc);
    expect(csv.startsWith('﻿Teste')).toBe(true);
    expect(csv).toContain('"Loja; balcão";1.234,50;12');
    expect(csv).toContain('\r\n');
  });
  it('CPF mascarado mostra só os 6 dígitos do meio', () => {
    expect(mascararCpf('123.456.789-09')).toBe('***.456.789-**');
    expect(mascararCpf('')).toBe('***');
  });
});
