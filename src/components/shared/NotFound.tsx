import { ButtonLink } from '../ui/ButtonLink';
import { EmptyState } from './EmptyState';

/** Rota que não existe dentro de um portal ou do site público. */
export function NotFound({ homePath }: { homePath: string }) {
  return (
    <EmptyState
      title="Essa página não existe"
      description="O endereço pode ter mudado ou ter sido digitado errado."
      action={<ButtonLink to={homePath}>Voltar para o início</ButtonLink>}
    />
  );
}
