import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, PortalVerbo } from '@gera/design-system';
import { PageHeader } from '../../components/shared/PageHeader';
import { useToast } from '../../components/shared/Toast';
import { DEMO_PROFILES, PORTAL_HOME, ROLE_LABEL, roleForPath, useAuth, type ProfileKey, type Role } from '../../lib/auth';
import { restaurarDadosDeExemplo } from '../../services/hooks';

const ORDER: Role[] = ['voluntario', 'entidade', 'parceiro', 'admin'];

const DESCRIPTION: Record<Role, string> = {
  voluntario: 'Alex Silva, voluntário ativo da AMA Jaraguá.',
  entidade: 'Equipe da AMA Jaraguá. Vê só os dados da própria entidade.',
  parceiro: 'Café Exemplo, empresa parceira que valida carteirinhas.',
  admin: 'Comitê Social ACIJS, com a visão de todas as entidades.',
};

const BUTTON: Record<Role, string> = {
  voluntario: 'Entrar como Alex Silva',
  entidade: 'Entrar como AMA Jaraguá',
  parceiro: 'Entrar como Café Exemplo',
  admin: 'Entrar como Administrador',
};

/** Só caminhos internos, para o "next" não virar redirecionamento para fora do site. */
const isInternalPath = (path: string | null): path is string => !!path && path.startsWith('/') && !path.startsWith('//');

/** Login simulado: o seletor "entrar como" do protótipo. */
export function LoginPage() {
  const { session, signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const nextRole = isInternalPath(next) ? roleForPath(next) : null;

  const enter = (profile: ProfileKey) => {
    const { role } = signIn(profile);
    // Volta para onde a pessoa estava se a tela for pública ou do perfil escolhido.
    const target = isInternalPath(next) && (nextRole === null || nextRole === role) ? next : PORTAL_HOME[role];
    navigate(target, { replace: true });
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <PageHeader
        eyebrow="Protótipo"
        title="Entrar"
        description="Escolha um perfil para navegar. Ainda não tem senha: cada perfil abre o seu portal."
      />
      {nextRole && (
        <p className="mb-6 rounded-md bg-info-soft px-4 py-3 text-sm font-semibold text-on-info-soft" role="status">
          Para abrir essa tela, entre como {ROLE_LABEL[nextRole]}.
        </p>
      )}
      {session && !nextRole && (
        <p className="mb-6 rounded-md bg-bg-subtle px-4 py-3 text-sm text-ink-muted">
          Você está como <strong className="text-ink">{session.userName}</strong>. Escolher outro perfil troca a sessão.
        </p>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ORDER.map((role) => (
          <li key={role} className="flex flex-col gap-3 rounded-lg border border-border bg-bg-card p-3 shadow-card">
            <div>
              <PortalVerbo portal={role} subtitle={role === 'admin' ? undefined : DEMO_PROFILES[role].orgName} />
            </div>
            <p className="px-1 text-sm text-ink-muted">{DESCRIPTION[role]}</p>
            <Button className="mt-auto justify-center" onClick={() => enter(role)}>
              {BUTTON[role]}
            </Button>
            {role === 'voluntario' && (
              <Button variant="ghost" className="justify-center" onClick={() => enter('voluntario-novo')}>
                Entrar como Bruna Costa (cadastro novo)
              </Button>
            )}
          </li>
        ))}
      </ul>
      <section className="mt-10 flex flex-col items-start gap-3 rounded-lg border border-border bg-bg-card p-5 shadow-card" aria-labelledby="jornada">
        <h2 id="jornada" className="text-lg font-bold text-ink">
          Roteiro da jornada da carteirinha
        </h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-muted">
          <li>Entre como <strong className="text-ink">Bruna Costa</strong>: a carteirinha mostra o que falta e o código de presença.</li>
          <li>Entre como <strong className="text-ink">AMA Jaraguá</strong>, aprove a Bruna em Voluntários e faça o check-in dela em Banco de horas (digite JS-2026-004913).</li>
          <li>Volte para a Bruna: a carteirinha foi liberada, com QR que se renova a cada minuto.</li>
          <li>Entre como <strong className="text-ink">Café Exemplo</strong>, digite o mesmo número, veja "Elegível" e registre o uso.</li>
        </ol>
        <p className="text-sm text-ink-muted">
          As mudanças ficam salvas neste navegador. Para começar do zero antes de uma apresentação:
        </p>
        <Button
          variant="secondary"
          onClick={async () => {
            await restaurarDadosDeExemplo();
            toast.show('Pronto: os dados de exemplo voltaram ao início.');
          }}
        >
          Restaurar dados de exemplo
        </Button>
      </section>
    </div>
  );
}
