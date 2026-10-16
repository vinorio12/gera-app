import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// A ordem importa: o preflight do Tailwind zera o fundo de [type='button'], então ele vem antes
// do CSS do design system, e os utilitários vêm depois para poder ajustar os componentes.
import './styles/tailwind-base.css';
import '@gera/design-system/gera.css';
import './styles/tailwind.css';
import { App } from './app/App';
import { dentroDeQuadro } from './lib/download';

// PWA: o service worker só entra no build de produção e fora de quadros (a prévia publicada roda num iframe).
if (import.meta.env.PROD && 'serviceWorker' in navigator && !dentroDeQuadro()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Sem service worker o app funciona igual, só não abre offline.
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
