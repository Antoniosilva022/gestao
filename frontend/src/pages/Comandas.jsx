import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const EMPTY = { numero_comanda: '', mesa_ref: '', observacoes: '' };

export default function Comandas() {
  const navigate = useNavigate();
  const [comandas, setComandas] = useState([]);
  const [status, setStatus] = useState('aberta');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  function load() {
    api.get(`/restaurante/comandas?status=${status}`)
      .then((r) => setComandas(r.data))
      .catch(() => setComandas([]));
  }

  useEffect(() => { load(); }, [status]);

  function openNova() { setForm(EMPTY); setModal(true); }

  async function handleSalvar(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/restaurante/comandas', form);
      toast.success('Comanda aberta!');
      setModal(false);
      navigate(`/comandas/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao abrir comanda');
    } finally {
      setLoading(false);
    }
  }

  const f = (field) => ({ value: form[field] || '', onChange: (e) => setForm((p) => ({ ...p, [field]: e.target.value })) });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Comandas</h1>
          <p className="text-sm text-gray-500">Mesas em atendimento</p>
        </div>
        <button onClick={openNova} className="btn-primary w-full sm:w-auto">+ Abrir Comanda</button>
      </div>

      <div className="card p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => setStatus('aberta')} className={status === 'aberta' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}>
            Abertas
          </button>
          <button type="button" onClick={() => setStatus('fechada')} className={status === 'fechada' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}>
            Fechadas
          </button>
          <button type="button" onClick={() => setStatus('cancelada')} className={status === 'cancelada' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}>
            Canceladas
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:hidden">
          {comandas.map((c) => (
            <button key={c.id} type="button" onClick={() => navigate(`/comandas/${c.id}`)} className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm active:bg-blue-50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-800">{c.numero_comanda}</p>
                  <p className="mt-1 text-sm text-gray-500">{c.mesa_ref || 'Sem mesa'}{c.cliente_nome ? ` · ${c.cliente_nome}` : ''}</p>
                </div>
                <span className="badge-green capitalize">{c.status}</span>
              </div>
              <p className="mt-3 text-xs text-gray-400">Aberta em {new Date(c.criado_em).toLocaleString('pt-BR')}</p>
            </button>
          ))}
          {!comandas.length && <p className="py-6 text-center text-sm text-gray-400">Nenhuma comanda encontrada</p>}
        </div>
        <div className="mt-4 hidden overflow-x-auto sm:block">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Comanda</th>
                <th className="table-header">Mesa</th>
                <th className="table-header">Cliente</th>
                <th className="table-header">Status</th>
                <th className="table-header">Aberta em</th>
                <th className="table-header">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {comandas.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{c.numero_comanda}</td>
                  <td className="table-cell">{c.mesa_ref || '-'}</td>
                  <td className="table-cell">{c.cliente_nome || '-'}</td>
                  <td className="table-cell capitalize">{c.status}</td>
                  <td className="table-cell">{new Date(c.criado_em).toLocaleString('pt-BR')}</td>
                  <td className="table-cell">
                    <button onClick={() => navigate(`/comandas/${c.id}`)} className="btn-secondary btn-sm">Abrir</button>
                  </td>
                </tr>
              ))}
              {!comandas.length && (
                <tr><td className="table-cell text-gray-400" colSpan={6}>Nenhuma comanda encontrada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title="Abrir Comanda" onClose={() => setModal(false)}>
          <form onSubmit={handleSalvar} className="space-y-4">
            <div>
              <label className="label">Número/Identificação *</label>
              <input className="input" placeholder="Ex: Mesa 5" required {...f('numero_comanda')} />
            </div>
            <div>
              <label className="label">Mesa/Referência</label>
              <input className="input" {...f('mesa_ref')} />
            </div>
            <div>
              <label className="label">Observações</label>
              <textarea className="input" rows={2} {...f('observacoes')} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Salvando...' : 'Abrir'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
