import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { formatCurrency } from '../utils/format';
import { demoCategorias, demoProdutos } from '../utils/demoData';

const EMPTY = { nome: '', descricao: '', preco: '', custo: '', unidade: 'UN', categoria_id: '', codigo: '' };

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [search, setSearch] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('true');
  const [modal, setModal] = useState(false);
  const [showCategoriaInline, setShowCategoriaInline] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [categoriaForm, setCategoriaForm] = useState({ nome: '', descricao: '' });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoriaLoading, setCategoriaLoading] = useState(false);

  function load() {
    api.get(`/produtos?search=${encodeURIComponent(search)}&ativo=${filtroAtivo}`)
      .then((r) => setProdutos(r.data))
      .catch(() => setProdutos(demoProdutos.filter((p) => {
        const matchesSearch = !search || p.nome.toLowerCase().includes(search.toLowerCase()) || p.codigo.toLowerCase().includes(search.toLowerCase());
        const matchesAtivo = filtroAtivo === 'true' ? p.ativo !== false : p.ativo === false;
        return matchesSearch && matchesAtivo;
      })));
  }

  function loadCategorias() {
    api.get('/produtos/categorias')
      .then((r) => setCategorias(r.data))
      .catch(() => setCategorias(demoCategorias));
  }

  useEffect(() => {
    load();
    loadCategorias();
  }, []);
  useEffect(() => { load(); }, [search, filtroAtivo]);

  function openNovo() { setForm(EMPTY); setEditId(null); setModal(true); }
  function openEditar(p) { setForm(p); setEditId(p.id); setModal(true); }
  function openNovaCategoria() {
    setCategoriaForm({ nome: '', descricao: '' });
    setShowCategoriaInline((current) => !current);
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        categoria_id: form.categoria_id || null,
      };

      if (editId) {
        await api.put(`/produtos/${editId}`, payload);
        toast.success('Produto atualizado!');
      } else {
        await api.post('/produtos', payload);
        toast.success('Produto cadastrado!');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  async function handleSalvarCategoria(e) {
    e?.preventDefault?.();
    setCategoriaLoading(true);
    try {
      const { data } = await api.post('/produtos/categorias', categoriaForm);
      toast.success('Categoria criada!');
      loadCategorias();
      setForm((prev) => ({ ...prev, categoria_id: String(data.id) }));
      setCategoriaForm({ nome: '', descricao: '' });
      setShowCategoriaInline(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar categoria');
    } finally {
      setCategoriaLoading(false);
    }
  }

  async function handleAlterarStatus(produto) {
    const reativar = produto.ativo === false;

    if (!confirm(reativar ? 'Reativar produto?' : 'Desativar produto?')) return;

    if (reativar) {
      await api.put(`/produtos/${produto.id}`, { ...produto, ativo: true });
      toast.success('Produto reativado');
    } else {
      await api.delete(`/produtos/${produto.id}`);
      toast.success('Produto desativado');
    }

    load();
  }

  const f = (field) => ({ value: form[field] || '', onChange: (e) => setForm((p) => ({ ...p, [field]: e.target.value })) });
  const fc = (field) => ({ value: categoriaForm[field] || '', onChange: (e) => setCategoriaForm((p) => ({ ...p, [field]: e.target.value })) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Produtos</h1>
        <button onClick={openNovo} className="btn-primary">+ Novo Produto</button>
      </div>

      <div className="card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input className="input max-w-sm" placeholder="Buscar por nome ou código..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                <th className="table-header">Código</th>
                <th className="table-header">Nome</th>
                <th className="table-header">Categoria</th>
                <th className="table-header">Preço</th>
                <th className="table-header">Custo</th>
                <th className="table-header">Estoque</th>
                <th className="table-header">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {produtos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="table-cell text-gray-400">{p.codigo || '-'}</td>
                  <td className="table-cell font-medium">{p.nome}</td>
                  <td className="table-cell">{p.categoria_nome || '-'}</td>
                  <td className="table-cell text-green-600 font-medium">{formatCurrency(p.preco)}</td>
                  <td className="table-cell text-gray-500">{formatCurrency(p.custo)}</td>
                  <td className="table-cell">
                    <span className={`badge ${parseFloat(p.estoque_atual) <= 0 ? 'badge-red' : 'badge-green'}`}>
                      {p.estoque_atual} {p.unidade}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={() => openEditar(p)} className="btn-secondary btn-sm">Editar</button>
                      <button onClick={() => handleAlterarStatus(p)} className={p.ativo === false ? 'btn-primary btn-sm' : 'btn-danger btn-sm'}>
                        {p.ativo === false ? 'Reativar' : 'Desativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!produtos.length && <tr><td colSpan={7} className="table-cell text-center text-gray-400 py-8">Nenhum produto encontrado</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={editId ? 'Editar Produto' : 'Novo Produto'} onClose={() => setModal(false)}>
          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Nome *</label>
                <input className="input" {...f('nome')} required />
              </div>
              <div>
                <label className="label">Código</label>
                <input className="input" {...f('codigo')} />
              </div>
              <div>
                <label className="label">Unidade</label>
                <select className="input" {...f('unidade')}>
                  {['UN', 'KG', 'L', 'M', 'CX', 'PC'].map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Preço de Venda *</label>
                <input className="input" type="number" step="0.01" min="0" {...f('preco')} required />
              </div>
              <div>
                <label className="label">Custo</label>
                <input className="input" type="number" step="0.01" min="0" {...f('custo')} />
              </div>
              <div className="col-span-2">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <label className="label mb-0">Categoria</label>
                  <button type="button" onClick={openNovaCategoria} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    {showCategoriaInline ? 'Fechar criação rápida' : '+ Nova categoria'}
                  </button>
                </div>
                <select className="input" {...f('categoria_id')}>
                  <option value="">Selecione...</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                {showCategoriaInline && (
                  <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="label">Nome da categoria *</label>
                        <input className="input" {...fc('nome')} required />
                      </div>
                      <div>
                        <label className="label">Descrição</label>
                        <input className="input" {...fc('descricao')} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => setShowCategoriaInline(false)} className="btn-secondary btn-sm">Cancelar</button>
                      <button type="button" onClick={handleSalvarCategoria} disabled={categoriaLoading} className="btn-primary btn-sm">
                        {categoriaLoading ? 'Salvando...' : 'Salvar categoria'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <label className="label">Descrição</label>
                <textarea className="input" rows={2} {...f('descricao')} />
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
