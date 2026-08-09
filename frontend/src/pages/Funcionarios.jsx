import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { formatCurrency, formatDate } from '../utils/format';

const EMPTY = { nome: '', email: '', cpf: '', telefone: '', cargo: '', departamento: '', salario: '', data_admissao: '', status: 'ativo' };
const STATUS_BADGE = { ativo: 'badge-green', inativo: 'badge-gray', ferias: 'badge-blue', afastado: 'badge-yellow' };

export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  function load() {
    api.get(`/funcionarios?search=${search}`).then((r) => setFuncionarios(r.data));
  }

  useEffect(() => { load(); }, [search]);

  function openNovo() { setForm(EMPTY); setEditId(null); setModal(true); }
  function openEditar(f) { setForm(f); setEditId(f.id); setModal(true); }

  async function handleSalvar(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/funcionarios/${editId}`, form);
        toast.success('Funcionário atualizado!');
      } else {
        await api.post('/funcionarios', form);
        toast.success('Funcionário cadastrado!');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  const f = (field) => ({ value: form[field] || '', onChange: (e) => setForm((p) => ({ ...p, [field]: e.target.value })) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Funcionários</h1>
        <button onClick={openNovo} className="btn-primary">+ Novo Funcionário</button>
      </div>

      <div className="card">
        <input className="input max-w-sm" placeholder="Buscar por nome, cargo ou departamento..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Nome</th>
                <th className="table-header">Cargo</th>
                <th className="table-header">Departamento</th>
                <th className="table-header">Salário</th>
                <th className="table-header">Admissão</th>
                <th className="table-header">Status</th>
                <th className="table-header">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {funcionarios.map((fn) => (
                <tr key={fn.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{fn.nome}</td>
                  <td className="table-cell">{fn.cargo || '-'}</td>
                  <td className="table-cell">{fn.departamento || '-'}</td>
                  <td className="table-cell">{formatCurrency(fn.salario)}</td>
                  <td className="table-cell">{formatDate(fn.data_admissao)}</td>
                  <td className="table-cell"><span className={`badge ${STATUS_BADGE[fn.status]}`}>{fn.status}</span></td>
                  <td className="table-cell">
                    <button onClick={() => openEditar(fn)} className="btn-secondary btn-sm">Editar</button>
                  </td>
                </tr>
              ))}
              {!funcionarios.length && <tr><td colSpan={7} className="table-cell text-center text-gray-400 py-8">Nenhum funcionário cadastrado</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={editId ? 'Editar Funcionário' : 'Novo Funcionário'} onClose={() => setModal(false)}>
          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Nome *</label>
                <input className="input" {...f('nome')} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" {...f('email')} />
              </div>
              <div>
                <label className="label">CPF</label>
                <input className="input" {...f('cpf')} />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input className="input" {...f('telefone')} />
              </div>
              <div>
                <label className="label">Cargo</label>
                <input className="input" {...f('cargo')} />
              </div>
              <div>
                <label className="label">Departamento</label>
                <input className="input" {...f('departamento')} />
              </div>
              <div>
                <label className="label">Salário</label>
                <input className="input" type="number" step="0.01" min="0" {...f('salario')} />
              </div>
              <div>
                <label className="label">Data de Admissão</label>
                <input className="input" type="date" {...f('data_admissao')} />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" {...f('status')}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="ferias">Férias</option>
                  <option value="afastado">Afastado</option>
                </select>
              </div>
              {editId && (
                <div>
                  <label className="label">Data de Demissão</label>
                  <input className="input" type="date" {...f('data_demissao')} />
                </div>
              )}
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
