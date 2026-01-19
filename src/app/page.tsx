export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-2">
      {/* LEFT */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-900 text-white flex flex-col justify-center p-16">
        <h1 className="text-4xl font-bold mb-6">SafeClicker</h1>
        <p className="text-xl mb-8">
          Proteja sua organização contra ataques de phishing
        </p>

        <div className="grid grid-cols-3 gap-4 mt-10">
          <Stat value="95%" label="Redução de riscos" />
          <Stat value="500+" label="Empresas ativas" />
          <Stat value="50k" label="Usuários treinados" />
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center justify-center bg-white">
        <form className="w-96 space-y-4">
          <h2 className="text-3xl font-bold mb-2">Bem-vindo de volta</h2>
          <p className="text-slate-500 mb-6">
            Entre com suas credenciais
          </p>

          <input className="input" placeholder="E-mail" />
          <input className="input" placeholder="Senha" type="password" />

          <button className="w-full bg-blue-900 text-white py-3 rounded-lg font-semibold">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white/10 p-4 rounded-xl text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm">{label}</p>
    </div>
  );
}
