import { describe, expect, it } from 'vitest';
import { linkGoogleAgenda, type EventoAgenda } from './agenda';

const base: EventoAgenda = {
  uid: 'x@gera',
  titulo: 'Voluntariado: Horta, com café',
  descricao: 'Leve luvas & água.',
  local: 'Rua Joinville, 100 · Jaraguá do Sul',
  inicio: new Date('2026-11-07T11:00:00Z'),
  fim: new Date('2026-11-07T15:00:00Z'),
};

describe('linkGoogleAgenda', () => {
  it('monta o link do Google Agenda com título, datas em UTC, detalhes e local', () => {
    const url = new URL(linkGoogleAgenda(base));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe(base.titulo);
    expect(url.searchParams.get('dates')).toBe('20261107T110000Z/20261107T150000Z');
    expect(url.searchParams.get('details')).toBe('Leve luvas & água.');
    expect(url.searchParams.get('location')).toBe(base.local);
  });

  it('acrescenta o endereço da página aos detalhes', () => {
    const url = new URL(linkGoogleAgenda({ ...base, url: 'https://gera.exemplo/oportunidades/1' }));
    expect(url.searchParams.get('details')).toBe('Leve luvas & água. https://gera.exemplo/oportunidades/1');
  });

  it('usa só as datas quando é o dia inteiro', () => {
    const url = new URL(linkGoogleAgenda({ ...base, diaInteiro: true, inicio: new Date(2026, 10, 20), fim: new Date(2026, 10, 21) }));
    expect(url.searchParams.get('dates')).toBe('20261120/20261121');
  });
});
