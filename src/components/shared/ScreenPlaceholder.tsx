import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { PageHeader } from './PageHeader';

interface ScreenPlaceholderProps {
  title: string;
  eyebrow?: string;
  /** O que a tela vai ter quando for construída. */
  summary: string;
  action?: ReactNode;
}

/** Tela que já tem rota e lugar na navegação, mas ainda não tem conteúdo. */
export function ScreenPlaceholder({ title, eyebrow, summary, action }: ScreenPlaceholderProps) {
  return (
    <>
      <PageHeader title={title} eyebrow={eyebrow} />
      <EmptyState title="Esta tela entra na próxima etapa" description={summary} action={action} />
    </>
  );
}
