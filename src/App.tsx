import {
  Button,
  CampaignProgress,
  GeraLogo,
  GeraSymbol,
  KpiCard,
  PortalVerbo,
  StatusBadge,
  formatBRL,
  formatHours,
  formatNumber,
} from '@gera/design-system';

// Tela provisória: confere que o pacote, o CSS e o preset do Tailwind estão ligados.
// Será substituída pelas rotas dos portais.
export default function App() {
  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <GeraLogo height={56} />
        <GeraSymbol size={32} spinning title="Carregando" />
      </header>

      <section className="flex flex-wrap gap-4">
        <PortalVerbo portal="voluntario" />
        <PortalVerbo portal="entidade" />
        <PortalVerbo portal="parceiro" />
        <PortalVerbo portal="admin" />
      </section>

      <section className="flex flex-wrap gap-4">
        <KpiCard label="Entidades ativas" value={formatNumber(6)} source="cadastro de entidades" />
        <KpiCard
          label="Horas de voluntariado"
          value={formatHours(1284)}
          delta={{ text: '12% no mês', direction: 'up' }}
          source="banco de horas"
        />
        <KpiCard label="Valor arrecadado" value={formatBRL(32500)} source="gateway de pagamento" />
      </section>

      <section className="flex flex-wrap items-start gap-6">
        <CampaignProgress title="Reforma da sede" organization="AMA Jaraguá" raised={32500} goal={50000} daysLeft={18} />
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-bg-card p-6 shadow-card">
          <h2 className="font-display text-3xl text-ink">STATUS DO VOLUNTÁRIO</h2>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="novo" />
            <StatusBadge status="ativo" />
            <StatusBadge status="inativo" />
            <StatusBadge status="desligado" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button>Quero participar</Button>
            <Button variant="highlight">Doar agora</Button>
            <Button variant="secondary">Ver entidades</Button>
            <Button variant="ghost">Entrar</Button>
          </div>
        </div>
      </section>
    </main>
  );
}
