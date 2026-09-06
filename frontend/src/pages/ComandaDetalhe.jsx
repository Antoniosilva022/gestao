import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/format';

export default function ComandaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comanda, setComanda] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [produtoSel, setProdutoSel] = useState('');
  const [qtde, setQtde] = useState(1);
  const [loading, setLoading] = useState(false);

  function load() {
    api.get(`/restaurante/comandas/${id}`).then((r) => setComanda(r.data)).catch(() => setComanda(null));
  }

  useEffect(() => {
    load();
    api.get('/produtos').then((r) => setProdutos(r.data));
  }, [id]);

  const totalGeral = useMemo(() => {
    if (!comanda?.pedidos) return 0;
    return comanda.pedidos
      .filter((p) => p.status !== 'cancelado')
      .reduce((acc, p) => acc + Number(p.subtotal || 0), 0);
  }, [comanda]);

  async function handleAdicionarPedido(e) {
    e.preventDefault();
    const produtoId = parseInt(produtoSel);
    const quantidade = parseFloat(qtde);
    if (!produtoId) return toast.error('Selecione um produto');
    if (!Number.isFinite(quantidade) || quantidade <= 0) return toast.error('Informe uma quantidade válida');

    setLoading(true);
    try {
      await api.post('/restaurante/pedidos', {
        comanda_id: parseInt(id),
        itens: [{ produto_id: produtoId, quantidade }],
      });
      toast.success('Pedido lançado!');
      setProdutoSel('');
      setQtde(1);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao lançar pedido');
    } finally {
      setLoading(false);
    }
  }

  async function handleFecharComanda() {
    if (!confirm('Fechar esta comanda?')) return;
    try {
      await api.put(`/restaurante/comandas/${id}`, { status: 'fechada' });
      toast.success('Comanda fechada!');
      navigate('/comandas');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao fechar comanda');
    }
  }

  async function handleCancelarComanda() {
    if (!confirm('Cancelar esta comanda?')) return;
    try {
      await api.delete(`/restaurante/comandas/${id}`);
      toast.success('Comanda cancelada!');
      navigate('/comandas');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao cancelar comanda');
    }
  }

  if (!comanda) return <div className="text-gray-500">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Comanda {comanda.numero_comanda}</h1>
          <p className="text-sm text-gray-500">{comanda.mesa_ref ? `Mesa: ${comanda.mesa_ref}` : 'Sem mesa definida'} · Status: <span className="capitalize">{comanda.status}</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/comandas')} className="btn-secondary">Voltar</button>
          {comanda.status === 'aberta' && (
            <>
              <button onClick={handleCancelarComanda} className="btn-secondary">Cancelar</button>
              <button onClick={handleFecharComanda} className="btn-primary">Fechar Comanda</button>
            </>
          )}
        </div>
      </div>

      {comanda.status === 'aberta' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Lançar Pedido</h2>
          <form onSubmit={handleAdicionarPedido} className="flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1">
              <label className="label">Produto</label>
              <select className="input" value={produtoSel} onChange={(e) => setProdutoSel(e.target.value)}>
                <option value="">Selecione...</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome} — {formatCurrency(p.preco)}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-32">
              <label className="label">Quantidade</label>
              <input type="number" min="1" step="1" className="input" value={qtde} onChange={(e) => setQtde(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Lançando...' : '+ Adicionar'}</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Pedidos</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Pedido</th>
                <th className="table-header">Status</th>
                <th className="table-header">Subtotal</th>
                <th className="table-header">Lançado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {comanda.pedidos?.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">#{p.id}</td>
                  <td className="table-cell capitalize">{p.status}</td>
                  <td className="table-cell">{formatCurrency(p.subtotal)}</td>
                  <td className="table-cell">{new Date(p.criado_em).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
              {!comanda.pedidos?.length && (
                <tr><td className="table-cell text-gray-400" colSpan={4}>Nenhum pedido lançado ainda</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="table-cell font-semibold text-right">Total (sem taxa de serviço)</td>
                <td className="table-cell font-semibold">{formatCurrency(totalGeral)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
