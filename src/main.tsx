import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// A ordem importa: o preflight do Tailwind zera o fundo de [type='button'], então ele vem antes
// do CSS do design system, e os utilitários vêm depois para poder ajustar os componentes.
import './styles/tailwind-base.css';
import '@gera/design-system/gera.css';
import './styles/tailwind.css';
import { App } from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
