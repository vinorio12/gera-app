import { describe, expect, it } from 'vitest';
import { bytesDaDataUrl, recorteCentral, validarArquivo, validarImagemSalva } from './imagem';

describe('recorteCentral', () => {
  it('foto quadrada: corta as laterais de uma imagem larga', () => {
    expect(recorteCentral(800, 400, 320, 320)).toEqual({ sx: 200, sy: 0, sw: 400, sh: 400 });
  });
  it('foto quadrada: corta o alto e o pé de uma imagem alta', () => {
    expect(recorteCentral(400, 1000, 320, 320)).toEqual({ sx: 0, sy: 300, sw: 400, sh: 400 });
  });
  it('banner 16:5: corta o alto e o pé de uma imagem quase quadrada', () => {
    const r = recorteCentral(1600, 1000, 1600, 500);
    expect(r.sw).toBe(1600);
    expect(r.sh).toBe(500);
    expect(r.sy).toBe(250);
  });
  it('mantém a proporção do destino', () => {
    const r = recorteCentral(3000, 3000, 1600, 500);
    expect(r.sw / r.sh).toBeCloseTo(3.2, 5);
  });
});

describe('bytesDaDataUrl', () => {
  it('conta os bytes do base64 sem o cabeçalho e descontando o preenchimento', () => {
    expect(bytesDaDataUrl('data:image/jpeg;base64,QUJD')).toBe(3); // "ABC"
    expect(bytesDaDataUrl('data:image/jpeg;base64,QUI=')).toBe(2); // "AB"
    expect(bytesDaDataUrl('data:image/jpeg;base64,QQ==')).toBe(1); // "A"
  });
});

describe('validarArquivo', () => {
  it('aceita JPG, PNG e WebP', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) expect(validarArquivo({ type, size: 1000 })).toBeNull();
  });
  it('recusa outros formatos e arquivos enormes, em português', () => {
    expect(validarArquivo({ type: 'image/gif', size: 1000 })).toMatch(/JPG, PNG ou WebP/);
    expect(validarArquivo({ type: 'application/pdf', size: 1000 })).toMatch(/formato/);
    expect(validarArquivo({ type: 'image/png', size: 11 * 1024 * 1024 })).toMatch(/grande demais/);
  });
});

describe('validarImagemSalva', () => {
  const grande = (bytes: number) => `data:image/jpeg;base64,${'A'.repeat(Math.ceil((bytes * 4) / 3))}`;
  it('aceita a imagem dentro do limite do tipo', () => {
    expect(validarImagemSalva(grande(50_000), 'foto')).toBeNull();
    expect(validarImagemSalva(grande(200_000), 'banner')).toBeNull();
  });
  it('recusa o que passa do limite (com folga) ou não é imagem aceita', () => {
    expect(validarImagemSalva(grande(100_000), 'foto')).toMatch(/grande demais/);
    expect(validarImagemSalva(grande(400_000), 'banner')).toMatch(/grande demais/);
    expect(validarImagemSalva('data:image/gif;base64,AAAA', 'foto')).toMatch(/formato/);
    expect(validarImagemSalva('https://exemplo.com/a.jpg', 'foto')).toMatch(/formato/);
  });
});
