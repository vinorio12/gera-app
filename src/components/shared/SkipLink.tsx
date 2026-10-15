/** Primeiro item focável da página: pula a navegação e vai direto ao conteúdo. */
export function SkipLink() {
  return (
    <a
      href="#conteudo"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-bg-card focus:px-4 focus:py-3 focus:font-semibold focus:text-link focus:shadow-raised"
    >
      Pular para o conteúdo
    </a>
  );
}
