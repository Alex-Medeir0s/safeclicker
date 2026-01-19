export default function Campaigns() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Campanhas</h1>

      <div className="grid grid-cols-2 gap-6">
        <CampaignCard
          title="Atualização de Senha Urgente"
          status="Ativa"
          users="150"
          clicks="23"
          reports="45"
        />
        <CampaignCard
          title="Promoção Black Friday"
          status="Finalizada"
          users="500"
          clicks="89"
          reports="120"
        />
      </div>
    </>
  );
}

function CampaignCard(props: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <span className="text-sm text-emerald-600 font-semibold">
        {props.status}
      </span>
      <h3 className="text-xl font-bold mt-2">{props.title}</h3>

      <div className="grid grid-cols-3 mt-6 text-center">
        <Metric label="Alvos" value={props.users} />
        <Metric label="Cliques" value={props.clicks} color="text-red-500" />
        <Metric label="Reportes" value={props.reports} color="text-emerald-500" />
      </div>
    </div>
  );
}

function Metric({ label, value, color }: any) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
