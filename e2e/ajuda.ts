import type { Page } from '@playwright/test';

export type Perfil = 'admin' | 'entidade' | 'voluntario' | 'voluntario-novo' | 'parceiro';

/**
 * Começa com os dados de exemplo, o perfil e o tema escolhidos. Os dados ficam no localStorage
 * do navegador, então trocar de perfil na mesma página mantém o que a jornada já fez.
 */
export async function preparar(page: Page, { perfil, tema = 'light' }: { perfil?: Perfil; tema?: 'light' | 'dark' } = {}) {
  await page.addInitScript(
    ([p, t]) => {
      if (sessionStorage.getItem('e2e-pronto')) return;
      sessionStorage.setItem('e2e-pronto', '1');
      localStorage.removeItem('gera.dados');
      localStorage.setItem('gera.theme', t!);
      if (p) localStorage.setItem('gera.session', JSON.stringify({ profile: p }));
      else localStorage.removeItem('gera.session');
    },
    [perfil ?? '', tema],
  );
}

/** Troca de perfil sem perder os dados da jornada. */
export async function entrarComo(page: Page, perfil: Perfil) {
  await page.evaluate((p) => localStorage.setItem('gera.session', JSON.stringify({ profile: p })), perfil);
}

/** Erros de console e de página durante o teste. */
export function vigiarErros(page: Page) {
  const erros: string[] = [];
  page.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
  page.on('pageerror', (e) => erros.push(e.message));
  return erros;
}
