import { describe, expect, it } from 'vitest';
import { hexDaMarca, marcaDaEntidade } from './marca';

describe('marcaDaEntidade', () => {
  it('sem cor livre usa o token escolhido, lido dos tokens', () => {
    const m = marcaDaEntidade({ corDestaque: 'portal-impulsionar' });
    expect(m.hex).toMatch(/^#[0-9a-f]{6}$/i);
    expect(m.texto).toBe('tinta');
    expect(m.estilo).toMatchObject({ '--cor-entidade': m.hex, '--texto-cor-entidade': 'var(--tinta)' });
  });
  it('a cor livre vale mais que o token', () => {
    expect(hexDaMarca({ corDestaque: 'portal-engajar', corLivre: '#112233' })).toBe('#112233');
    expect(marcaDaEntidade({ corDestaque: 'portal-engajar', corLivre: '#112233' }).texto).toBe('papel');
  });
  it('cor sem contraste não define texto: só detalhes', () => {
    const m = marcaDaEntidade({ corDestaque: 'portal-engajar', corLivre: '#808080' });
    expect(m.texto).toBeNull();
    expect(m.estilo).not.toHaveProperty('--texto-cor-entidade');
  });
});
