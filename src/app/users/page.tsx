export default function Users() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Usuários</h1>

      <table className="w-full bg-white rounded-xl overflow-hidden">
        <thead className="bg-slate-100 text-left">
          <tr>
            <th className="p-4">Nome</th>
            <th>Email</th>
            <th>Departamento</th>
            <th>Risco</th>
            <th>Treinamentos</th>
          </tr>
        </thead>
        <tbody>
          <UserRow
            name="Maria Silva"
            email="maria.silva@empresa.com"
            dept="Diretoria"
            risk="Baixo"
            trainings="5/5"
          />
          <UserRow
            name="João Santos"
            email="joao.santos@empresa.com"
            dept="TI"
            risk="Baixo"
            trainings="5/5"
          />
          <UserRow
            name="Ana Costa"
            email="ana.costa@empresa.com"
            dept="Marketing"
            risk="Médio"
            trainings="3/5"
          />
          <UserRow
            name="Carlos Souza"
            email="carlos.souza@empresa.com"
            dept="Vendas"
            risk="Alto"
            trainings="1/5"
          />
        </tbody>
      </table>
    </>
  );
}

function UserRow(props: any) {
  const riskColors: any = {
    Baixo: "text-emerald-500 bg-emerald-50",
    Médio: "text-yellow-600 bg-yellow-50",
    Alto: "text-red-500 bg-red-50",
  };

  return (
    <tr className="border-t">
      <td className="p-4 font-semibold">{props.name}</td>
      <td className="text-slate-600">{props.email}</td>
      <td>{props.dept}</td>
      <td>
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            riskColors[props.risk]
          }`}
        >
          {props.risk}
        </span>
      </td>
      <td className="font-semibold">{props.trainings}</td>
    </tr>
  );
}
