import { describe, expect, it } from 'vitest';
import { normalizarHex, razaoDeContraste, textoSobreCor } from './contraste';

const cores = { tinta: '#232324', papel: '#ffffff' };

describe('normalizarHex', () => {
  it('aceita 3 ou 6 dígitos, com ou sem #, e padroniza', () => {
    expect(normalizarHex('#ABC')).toBe('#aabbcc');
    expect(normalizarHex('1a2B3c')).toBe('#1a2b3c');
    expect(normalizarHex('  #FFFFFF ')).toBe('#ffffff');
  });
  it('recusa o que não é cor', () => {
    expect(normalizarHex('')).toBeNull();
    expect(normalizarHex('#12')).toBeNull();
    expect(normalizarHex('verde')).toBeNull();
    expect(normalizarHex('#ggg')).toBeNull();
  });
});

describe('razaoDeContraste', () => {
  it('dá 21 entre preto e branco e 1 entre cores iguais', () => {
    expect(razaoDeContraste('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(razaoDeContraste('#336699', '#336699')).toBeCloseTo(1, 5);
  });
  it('não depende da ordem', () => {
    expect(razaoDeContraste('#123456', '#fedcba')).toBeCloseTo(razaoDeContraste('#fedcba', '#123456'), 10);
  });
});

describe('textoSobreCor', () => {
  it('usa papel sobre cor escura e tinta sobre cor clara', () => {
    expect(textoSobreCor('#0b3d24', cores).texto).toBe('papel');
    expect(textoSobreCor('#f5d75a', cores).texto).toBe('tinta');
  });
  it('devolve null quando nem tinta nem papel chegam a 4,5:1', () => {
    // Cinza médio: com a tinta e com o papel fica abaixo de 4,5.
    const r = textoSobreCor('#808080', cores);
    expect(r.texto).toBeNull();
    expect(r.razao).toBeLessThan(4.5);
  });
  it('a razão devolvida é a do texto escolhido', () => {
    const r = textoSobreCor('#0b3d24', cores);
    expect(r.razao).toBeCloseTo(razaoDeContraste('#0b3d24', cores.papel), 10);
    expect(r.razao).toBeGreaterThanOrEqual(4.5);
  });
});
