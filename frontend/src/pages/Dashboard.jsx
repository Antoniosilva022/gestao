import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { formatCurrency } from '../utils/format';
import { demoDashboard } from '../utils/demoData';

function StatCard({ label, value, icon, color = 'blue', sub }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  };
  return (
    <div className={`card border ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((r) => setDados(r.data))
      .catch(() => setDados(demoDashboard))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Carregando...</div></div>;
  if (!dados) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <Link to="/vendas/nova" className="btn-primary">+ Nova Venda</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Receita do Mês" value={formatCurrency(dados.resumo.receita_mes)} icon="💵" color="green" />
        <StatCard label="Total Clientes" value={dados.total_clientes} icon="👥" color="blue" />
        <StatCard label="A Receber" value={formatCurrency(dados.financeiro.total_receber)} icon="📈" color="yellow" />
        <StatCard label="Estoque Baixo" value={dados.estoque_alerta} icon="⚠️" color="red" sub="produtos abaixo do mínimo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Vendas dos Últimos 6 Meses</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dados.vendas_por_mes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Top 5 Produtos</h2>
          <div className="space-y-3">
            {dados.top_produtos.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <span className="text-sm font-medium text-gray-700">{p.nome}</span>
                </div>
                <span className="text-sm font-semibold text-green-600">{formatCurrency(p.receita)}</span>
              </div>
            ))}
            {!dados.top_produtos.length && <p className="text-gray-400 text-sm text-center py-4">Nenhuma venda registrada</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Resumo Financeiro</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">A Receber (pendente)</span>
              <span className="font-semibold text-green-600">{formatCurrency(dados.financeiro.total_receber)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">A Pagar (pendente)</span>
              <span className="font-semibold text-red-600">{formatCurrency(dados.financeiro.total_pagar)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Contas Vencidas</span>
              <span className="font-semibold text-red-600">{dados.financeiro.contas_vencidas}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Funcionários por Status</h2>
          <div className="space-y-2">
            {dados.funcionarios.map((f) => (
              <div key={f.status} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm text-gray-600 capitalize">{f.status}</span>
                <span className="font-semibold text-gray-800">{f.count}</span>
              </div>
            ))}
            {!dados.funcionarios.length && <p className="text-gray-400 text-sm text-center py-4">Nenhum funcionário cadastrado</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
