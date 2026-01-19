export default function Reports() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Relatórios</h1>

      <table className="w-full bg-white rounded-xl overflow-hidden">
        <thead className="bg-slate-100 text-left">
          <tr>
            <th className="p-4">Usuário</th>
            <th>Departamento</th>
            <th>Cliques</th>
            <th>Reporte</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <Row name="Maria Silva" dept="Diretoria" clicks="5%" report="95%" />
          <Row name="João Santos" dept="TI" clicks="2%" report="98%" />
        </tbody>
      </table>
    </>
  );
}

function Row(props: any) {
  return (
    <tr className="border-t">
      <td className="p-4 font-semibold">{props.name}</td>
      <td>{props.dept}</td>
      <td className="text-red-500">{props.clicks}</td>
      <td className="text-emerald-500">{props.report}</td>
      <td className="font-semibold">Melhorando</td>
    </tr>
  );
}
