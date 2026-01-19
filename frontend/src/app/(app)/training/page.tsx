export default function Training() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Treinamentos</h1>

      <div className="grid grid-cols-3 gap-6">
        <TrainingCard
          title="Identificação de Phishing Básico"
          progress="80%"
          status="Em andamento"
        />
        <TrainingCard
          title="Segurança de Senhas"
          progress="100%"
          status="Concluído"
        />
        <TrainingCard
          title="Engenharia Social Avançada"
          progress="0%"
          status="Não iniciado"
        />
      </div>
    </>
  );
}

function TrainingCard(props: any) {
  const statusColors: any = {
    "Em andamento": "text-blue-600",
    "Concluído": "text-emerald-600",
    "Não iniciado": "text-slate-500",
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <span className={`text-sm font-semibold ${statusColors[props.status]}`}>
        {props.status}
      </span>
      <h3 className="text-xl font-bold mt-2 mb-4">{props.title}</h3>
      
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-2">
          <span>Progresso</span>
          <span className="font-semibold">{props.progress}</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: props.progress }}
          ></div>
        </div>
      </div>
    </div>
  );
}
