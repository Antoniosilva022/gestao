import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

export default function Estoque() {
  const [estoque, setEstoque] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [modal, setModal] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [showHistorico, setShowHistorico] = useState(false);
  const [form, setForm] = useState({ produto_id: '', tipo: 'entrada', quantidade: '', motivo: '' });
  const [loading, setLoading] = useState(false);

  function load() {
    api.get('/estoque').then((r) => setEstoque(r.data));
  }

  useEffect(() => {
    load();
    api.get('/produtos').then((r) => setProdutos(r.data));
  }, []);

  async function handleMovimentar(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/estoque/movimentar', form);
      toast.success('Movimentação registrada!');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao movimentar');
    } finally {
      setLoading(false);
    }
  }

  async function loadHistorico() {
    const { data } = await api.get('/estoque/historico');
    setHistorico(data);
    setShowHistorico(true);
  }

  const f = (field) => ({ value: form[field] || '', onChange: (e) => setForm((p) => ({ ...p, [field]: e.target.value })) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Estoque</h1>
        <div className="flex gap-3">
          <button onClick={loadHistorico} className="btn-secondary">Histórico</button>
          <button onClick={() => setModal(true)} className="btn-primary">+ Movimentar</button>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Produto</th>
                <th className="table-header">Código</th>
                <th className="table-header">Unidade</th>
                <th className="table-header">Quantidade</th>
                <th className="table-header">Mínimo</th>
                <th className="table-header">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {estoque.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{e.produto_nome}</td>
                  <td className="table-cell text-gray-400">{e.codigo || '-'}</td>
                  <td className="table-cell">{e.unidade}</td>
                  <td className="table-cell font-semibold">{e.quantidade}</td>
                  <td className="table-cell">{e.quantidade_minima}</td>
                  <td className="table-cell">
                    <span className={`badge ${parseFloat(e.quantidade) <= parseFloat(e.quantidade_minima) ? 'badge-red' : parseFloat(e.quantidade) <= parseFloat(e.quantidade_minima) * 2 ? 'badge-yellow' : 'badge-green'}`}>
                      {parseFloat(e.quantidade) <= parseFloat(e.quantidade_minima) ? 'Estoque Baixo' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
              {!estoque.length && <tr><td colSpan={6} className="table-cell text-center text-gray-400 py-8">Nenhum produto no estoque</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title="Movimentar Estoque" onClose={() => setModal(false)}>
          <form onSubmit={handleMovimentar} className="space-y-4">
            <div>
              <label className="label">Produto *</label>
              <select className="input" {...f('produto_id')} required>
                <option value="">Selecione...</option>
                {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tipo *</label>
              <select className="input" {...f('tipo')} required>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>
            <div>
              <label className="label">Quantidade *</label>
              <input className="input" type="number" min="0.01" step="0.01" {...f('quantidade')} required />
            </div>
            <div>
              <label className="label">Motivo</label>
              <input className="input" {...f('motivo')} placeholder="Ex: Compra de fornecedor, Ajuste..." />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Salvando...' : 'Registrar'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showHistorico && (
        <Modal title="Histórico de Movimentações" onClose={() => setShowHistorico(false)} size="lg">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="table-header">Data</th>
                  <th className="table-header">Produto</th>
                  <th className="table-header">Tipo</th>
                  <th className="table-header">Qtde</th>
                  <th className="table-header">Motivo</th>
                  <th className="table-header">Usuário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historico.map((h) => (
                  <tr key={h.id}>
                    <td className="table-cell">{new Date(h.criado_em).toLocaleDateString('pt-BR')}</td>
                    <td className="table-cell">{h.produto_nome}</td>
                    <td className="table-cell"><span className={`badge ${h.tipo === 'entrada' ? 'badge-green' : 'badge-red'}`}>{h.tipo}</span></td>
                    <td className="table-cell font-semibold">{h.quantidade}</td>
                    <td className="table-cell">{h.motivo || '-'}</td>
                    <td className="table-cell">{h.usuario_nome || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
}
