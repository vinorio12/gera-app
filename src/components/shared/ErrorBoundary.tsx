import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { RotateCcw, RefreshCw } from 'lucide-react';
import { Button, GeraSymbol } from '@gera/design-system';
import { restaurarDadosDeExemplo } from '../../services/hooks';

interface Props {
  /** Onde está (ex.: "portal da entidade"), para a mensagem. */
  onde: string;
  /** Muda a cada navegação: ao trocar de tela, a guarda tenta de novo. */
  resetKey: string;
  /** false quando a guarda já está dentro de um <main> (site público). */
  principal: boolean;
  children: ReactNode;
}

interface State {
  erro: Error | null;
}

class Guarda extends Component<Props, State> {
  state: State = { erro: null };

  static getDerivedStateFromError(erro: Error): State {
    return { erro };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    // Com a API real, isso vai para o monitoramento de erros.
    console.error('Erro na tela', erro, info.componentStack);
  }

  componentDidUpdate(anterior: Props) {
    if (this.state.erro && anterior.resetKey !== this.props.resetKey) this.setState({ erro: null });
  }

  render() {
    if (!this.state.erro) return this.props.children;
    const Raiz = this.props.principal ? 'main' : 'div';
    return (
      <Raiz id={this.props.principal ? 'conteudo' : undefined} role="alert" className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 py-10">
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-bg-card px-6 py-10 text-center shadow-card">
          <span className="text-border-strong">
            <GeraSymbol size={56} variant="mono" title="" aria-hidden />
          </span>
          <h1 className="text-xl font-bold text-ink">Algo travou no {this.props.onde}</h1>
          <p className="text-sm text-ink-muted">
            Não foi nada que você fez. Recarregue a página. Se continuar, restaure os dados de exemplo: o protótipo volta ao início e as mudanças feitas neste navegador
            são apagadas.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => window.location.reload()}>
              <RefreshCw size={18} aria-hidden /> Recarregar
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                await restaurarDadosDeExemplo();
                window.location.reload();
              }}
            >
              <RotateCcw size={18} aria-hidden /> Restaurar dados de exemplo
            </Button>
          </div>
        </div>
      </Raiz>
    );
  }
}

/** Guarda de erro de um portal: uma tela quebrada mostra uma mensagem amigável em vez da página em branco. */
export function ErrorBoundary({ onde, principal = true, children }: { onde: string; principal?: boolean; children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <Guarda onde={onde} resetKey={pathname} principal={principal}>
      {children}
    </Guarda>
  );
}
