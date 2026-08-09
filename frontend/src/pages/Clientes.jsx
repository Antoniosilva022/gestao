import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { demoClientes } from '../utils/demoData';

const EMPTY = { nome: '', email: '', telefone: '', cpf_cnpj: '', endereco: '', cidade: '', estado: '', cep: '' };

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('true');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  function load() {
    api.get(`/clientes?search=${encodeURIComponent(search)}&ativo=${filtroAtivo}`)
      .then((r) => setClientes(r.data))
      .catch(() => setClientes(demoClientes.filter((c) => {
        const matchesSearch = !search || c.nome.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.cpf_cnpj.includes(search);
        const matchesAtivo = filtroAtivo === 'true' ? c.ativo !== false : c.ativo === false;
        return matchesSearch && matchesAtivo;
      })));
  }

  useEffect(() => { load(); }, [search, filtroAtivo]);

  function openNovo() { setForm(EMPTY); setEditId(null); setModal(true); }
  function openEditar(c) { setForm(c); setEditId(c.id); setModal(true); }

  async function handleSalvar(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/clientes/${editId}`, form);
        toast.success('Cliente atualizado!');
      } else {
        await api.post('/clientes', form);
        toast.success('Cliente cadastrado!');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  async function handleAlterarStatus(cliente) {
    const ativar = cliente.ativo === false;
    if (!confirm(ativar ? 'Reativar cliente?' : 'Desativar cliente?')) return;

    if (ativar) {
      await api.put(`/clientes/${cliente.id}`, { ...cliente, ativo: true });
      toast.success('Cliente reativado');
    } else {
      await api.delete(`/clientes/${cliente.id}`);
      toast.success('Cliente desativado');
    }

    load();
  }

  const f = (field) => ({ value: form[field] || '', onChange: (e) => setForm((p) => ({ ...p, [field]: e.target.value })) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
        <button onClick={openNovo} className="btn-primary">+ Novo Cliente</button>
      </div>

      <div className="card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input className="input max-w-sm" placeholder="Buscar por nome, email ou CPF/CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setFiltroAtivo('true')} className={filtroAtivo === 'true' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}>
              Ativos
            </button>
            <button type="button" onClick={() => setFiltroAtivo('false')} className={filtroAtivo === 'false' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}>
              Inativos
            </button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Nome</th>
                <th className="table-header">Email</th>
                <th className="table-header">Telefone</th>
                <th className="table-header">CPF/CNPJ</th>
                <th className="table-header">Cidade/UF</th>
                <th className="table-header">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{c.nome}</td>
                  <td className="table-cell">{c.email || '-'}</td>
                  <td className="table-cell">{c.telefone || '-'}</td>
                  <td className="table-cell">{c.cpf_cnpj || '-'}</td>
                  <td className="table-cell">{c.cidade ? `${c.cidade}/${c.estado}` : '-'}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={() => openEditar(c)} className="btn-secondary btn-sm">Editar</button>
                      <button onClick={() => handleAlterarStatus(c)} className={c.ativo === false ? 'btn-primary btn-sm' : 'btn-danger btn-sm'}>
                        {c.ativo === false ? 'Reativar' : 'Desativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!clientes.length && <tr><td colSpan={6} className="table-cell text-center text-gray-400 py-8">Nenhum cliente encontrado</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={editId ? 'Editar Cliente' : 'Novo Cliente'} onClose={() => setModal(false)}>
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
                <label className="label">Telefone</label>
                <input className="input" {...f('telefone')} />
              </div>
              <div>
                <label className="label">CPF / CNPJ</label>
                <input className="input" {...f('cpf_cnpj')} />
              </div>
              <div>
                <label className="label">CEP</label>
                <input className="input" {...f('cep')} />
              </div>
              <div className="col-span-2">
                <label className="label">Endereço</label>
                <input className="input" {...f('endereco')} />
              </div>
              <div>
                <label className="label">Cidade</label>
                <input className="input" {...f('cidade')} />
              </div>
              <div>
                <label className="label">Estado</label>
                <input className="input" maxLength={2} {...f('estado')} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
