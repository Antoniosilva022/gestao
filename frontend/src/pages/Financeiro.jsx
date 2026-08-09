import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { formatCurrency, formatDate } from '../utils/format';

const EMPTY = { tipo: 'pagar', descricao: '', valor: '', vencimento: '', categoria: '', observacoes: '' };
const STATUS_BADGE = { pendente: 'badge-yellow', pago: 'badge-green', cancelado: 'badge-gray', vencido: 'badge-red' };

export default function Financeiro() {
  const [contas, setContas] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [tipo, setTipo] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  function load() {
    const params = new URLSearchParams();
    if (tipo) params.append('tipo', tipo);
    if (status) params.append('status', status);
    api.get(`/financeiro?${params}`).then((r) => setContas(r.data));
    api.get('/financeiro/resumo').then((r) => setResumo(r.data));
  }

  useEffect(() => { load(); }, [tipo, status]);

  async function handleSalvar(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/financeiro', form);
      toast.success('Conta registrada!');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  async function pagar(id) {
    await api.patch(`/financeiro/${id}/pagar`);
    toast.success('Pagamento registrado!');
    load();
  }

  const f = (field) => ({ value: form[field] || '', onChange: (e) => setForm((p) => ({ ...p, [field]: e.target.value })) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Financeiro</h1>
        <button onClick={() => { setForm(EMPTY); setModal(true); }} className="btn-primary">+ Nova Conta</button>
      </div>

      {resumo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card border border-green-100 bg-green-50">
            <p className="text-xs text-green-600 font-medium">A Receber</p>
            <p className="text-xl font-bold text-green-700 mt-1">{formatCurrency(resumo.total_receber)}</p>
          </div>
          <div className="card border border-red-100 bg-red-50">
            <p className="text-xs text-red-600 font-medium">A Pagar</p>
            <p className="text-xl font-bold text-red-700 mt-1">{formatCurrency(resumo.total_pagar)}</p>
          </div>
          <div className="card border border-blue-100 bg-blue-50">
            <p className="text-xs text-blue-600 font-medium">Recebido no Mês</p>
            <p className="text-xl font-bold text-blue-700 mt-1">{formatCurrency(resumo.recebido_mes)}</p>
          </div>
          <div className="card border border-yellow-100 bg-yellow-50">
            <p className="text-xs text-yellow-600 font-medium">Pago no Mês</p>
            <p className="text-xl font-bold text-yellow-700 mt-1">{formatCurrency(resumo.pago_mes)}</p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex gap-2">
            {['', 'pagar', 'receber'].map((t) => (
              <button key={t} onClick={() => setTipo(t)} className={`btn btn-sm ${tipo === t ? 'btn-primary' : 'btn-secondary'}`}>
                {t === '' ? 'Todos' : t === 'pagar' ? 'A Pagar' : 'A Receber'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {['', 'pendente', 'pago', 'vencido', 'cancelado'].map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-secondary'}`}>
                {s || 'Todos'}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Tipo</th>
                <th className="table-header">Descrição</th>
                <th className="table-header">Valor</th>
                <th className="table-header">Vencimento</th>
                <th className="table-header">Pagamento</th>
                <th className="table-header">Status</th>
                <th className="table-header">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contas.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="table-cell"><span className={`badge ${c.tipo === 'receber' ? 'badge-green' : 'badge-red'}`}>{c.tipo}</span></td>
                  <td className="table-cell font-medium">{c.descricao}</td>
                  <td className="table-cell font-semibold">{formatCurrency(c.valor)}</td>
                  <td className="table-cell">{formatDate(c.vencimento)}</td>
                  <td className="table-cell">{formatDate(c.pagamento)}</td>
                  <td className="table-cell"><span className={`badge ${STATUS_BADGE[c.status]}`}>{c.status}</span></td>
                  <td className="table-cell">
                    {c.status === 'pendente' && <button onClick={() => pagar(c.id)} className="btn-success btn-sm">Pagar</button>}
                  </td>
                </tr>
              ))}
              {!contas.length && <tr><td colSpan={7} className="table-cell text-center text-gray-400 py-8">Nenhuma conta encontrada</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title="Nova Conta" onClose={() => setModal(false)}>
          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tipo *</label>
                <select className="input" {...f('tipo')} required>
                  <option value="pagar">A Pagar</option>
                  <option value="receber">A Receber</option>
                </select>
              </div>
              <div>
                <label className="label">Categoria</label>
                <input className="input" {...f('categoria')} placeholder="Ex: Fornecedores, Salários..." />
              </div>
              <div className="col-span-2">
                <label className="label">Descrição *</label>
                <input className="input" {...f('descricao')} required />
              </div>
              <div>
                <label className="label">Valor *</label>
                <input className="input" type="number" step="0.01" min="0.01" {...f('valor')} required />
              </div>
              <div>
                <label className="label">Vencimento *</label>
                <input className="input" type="date" {...f('vencimento')} required />
              </div>
              <div className="col-span-2">
                <label className="label">Observações</label>
                <textarea className="input" rows={2} {...f('observacoes')} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
