import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const EMPTY = { nome: '', email: '', senha: '', perfil: 'operador' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const { usuario } = useAuth();

  if (usuario?.perfil !== 'admin') return <p className="text-gray-400">Acesso restrito a administradores.</p>;

  function load() {
    api.get('/auth/usuarios').then((r) => setUsuarios(r.data));
  }

  useEffect(() => { load(); }, []);

  async function handleSalvar(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/usuarios', form);
      toast.success('Usuário criado!');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  }

  const f = (field) => ({ value: form[field] || '', onChange: (e) => setForm((p) => ({ ...p, [field]: e.target.value })) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Usuários do Sistema</h1>
        <button onClick={() => { setForm(EMPTY); setModal(true); }} className="btn-primary">+ Novo Usuário</button>
      </div>

      <div className="card">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Nome</th>
              <th className="table-header">Email</th>
              <th className="table-header">Perfil</th>
              <th className="table-header">Status</th>
              <th className="table-header">Criado em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{u.nome}</td>
                <td className="table-cell">{u.email}</td>
                <td className="table-cell capitalize">
                  <span className={`badge ${u.perfil === 'admin' ? 'badge-red' : u.perfil === 'gerente' ? 'badge-blue' : 'badge-gray'}`}>{u.perfil}</span>
                </td>
                <td className="table-cell">
                  <span className={`badge ${u.ativo ? 'badge-green' : 'badge-red'}`}>{u.ativo ? 'Ativo' : 'Inativo'}</span>
                </td>
                <td className="table-cell">{new Date(u.criado_em).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Novo Usuário" onClose={() => setModal(false)}>
          <form onSubmit={handleSalvar} className="space-y-4">
            <div>
              <label className="label">Nome *</label>
              <input className="input" {...f('nome')} required />
            </div>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" {...f('email')} required />
            </div>
            <div>
              <label className="label">Senha *</label>
              <input className="input" type="password" {...f('senha')} required minLength={6} />
            </div>
            <div>
              <label className="label">Perfil</label>
              <select className="input" {...f('perfil')}>
                <option value="operador">Operador</option>
                <option value="gerente">Gerente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Criando...' : 'Criar Usuário'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
