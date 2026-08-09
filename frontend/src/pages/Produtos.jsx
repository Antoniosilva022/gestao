import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { formatCurrency } from '../utils/format';
import { demoCategorias, demoProdutos } from '../utils/demoData';

const EMPTY = { nome: '', descricao: '', preco: '', custo: '', unidade: 'UN', categoria_id: '', codigo: '', estoque_atual: '', quantidade_minima: '' };

function classifyStock(quantidade, minimo) {
  if (quantidade <= 0) return 'baixo';
  if (quantidade <= minimo) return 'atencao';
  return 'normal';
}

export default function Produtos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filtroAtivo, setFiltroAtivo] = useState(searchParams.get('ativo') || 'true');
  const [modal, setModal] = useState(false);
  const [showCategoriaInline, setShowCategoriaInline] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [categoriaForm, setCategoriaForm] = useState({ nome: '', descricao: '' });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoriaLoading, setCategoriaLoading] = useState(false);
  const [quickModal, setQuickModal] = useState(false);
  const [quickProduto, setQuickProduto] = useState(null);
  const [quickTipo, setQuickTipo] = useState('estoque');
  const [quickValor, setQuickValor] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);

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

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filtroAtivo && filtroAtivo !== 'true') params.set('ativo', filtroAtivo);
    setSearchParams(params, { replace: true });
  }, [search, filtroAtivo, setSearchParams]);

  useEffect(() => {
    function handleFocus() {
      load();
    }

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [search, filtroAtivo]);

  function openNovo() { setForm(EMPTY); setEditId(null); setModal(true); }
  function openEditar(p) {
    setForm({
      ...p,
      estoque_atual: p.estoque_atual ?? '',
      quantidade_minima: p.quantidade_minima ?? '',
    });
    setEditId(p.id);
    setModal(true);
  }
  function openNovaCategoria() {
    setCategoriaForm({ nome: '', descricao: '' });
    setShowCategoriaInline((current) => !current);
  }

  function openAjusteRapido(produto, tipo) {
    setQuickProduto(produto);
    setQuickTipo(tipo);
    setQuickValor(tipo === 'estoque' ? String(produto.estoque_atual ?? 0) : String(produto.quantidade_minima ?? 0));
    setQuickModal(true);
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        categoria_id: form.categoria_id || null,
        estoque_atual: form.estoque_atual === '' ? 0 : Number(form.estoque_atual),
        quantidade_minima: form.quantidade_minima === '' ? 0 : Number(form.quantidade_minima),
      };

      if (editId) {
        await api.put(`/produtos/${editId}`, payload);
        toast.success('Produto atualizado!');
      } else {
        await api.post('/produtos', payload);
        toast.success('Produto cadastrado!');
      }
      setModal(false);
      await load();
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

  async function handleSalvarAjusteRapido(e) {
    e.preventDefault();
    if (!quickProduto) return;

    setQuickLoading(true);
    try {
      const payload = {
        ...quickProduto,
        estoque_atual: quickTipo === 'estoque' ? Number(quickValor) : Number(quickProduto.estoque_atual ?? 0),
        quantidade_minima: quickTipo === 'minimo' ? Number(quickValor) : Number(quickProduto.quantidade_minima ?? 0),
      };

      await api.put(`/produtos/${quickProduto.id}`, payload);
      toast.success(quickTipo === 'estoque' ? 'Estoque ajustado!' : 'Mínimo ajustado!');
      setQuickModal(false);
      setQuickProduto(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar produto');
    } finally {
      setQuickLoading(false);
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

    await load();
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
                    <span className={`badge ${classifyStock(Number(p.estoque_atual || 0), Number(p.quantidade_minima || 0)) === 'baixo' ? 'badge-red' : classifyStock(Number(p.estoque_atual || 0), Number(p.quantidade_minima || 0)) === 'atencao' ? 'badge-yellow' : 'badge-green'}`}>
                      {p.estoque_atual} {p.unidade}
                    </span>
                    <div className="mt-1 text-xs text-gray-400">Mínimo: {p.quantidade_minima ?? 0}</div>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => openEditar(p)} className="btn-secondary btn-sm">Editar</button>
                      <button onClick={() => openAjusteRapido(p, 'estoque')} className="btn-secondary btn-sm">Estoque</button>
                      <button onClick={() => openAjusteRapido(p, 'minimo')} className="btn-secondary btn-sm">Mínimo</button>
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
              <div>
                <label className="label">Estoque atual</label>
                <input className="input" type="number" step="0.01" min="0" {...f('estoque_atual')} />
              </div>
              <div>
                <label className="label">Estoque mínimo</label>
                <input className="input" type="number" step="0.01" min="0" {...f('quantidade_minima')} />
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

      {quickModal && quickProduto && (
        <Modal
          title={quickTipo === 'estoque' ? `Ajustar estoque - ${quickProduto.nome}` : `Ajustar mínimo - ${quickProduto.nome}`}
          onClose={() => setQuickModal(false)}
          size="sm"
        >
          <form onSubmit={handleSalvarAjusteRapido} className="space-y-4">
            <div>
              <label className="label">{quickTipo === 'estoque' ? 'Novo estoque' : 'Novo mínimo'}</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={quickValor}
                onChange={(e) => setQuickValor(e.target.value)}
                required
              />
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 space-y-1">
              <div>Estoque atual: {quickProduto.estoque_atual ?? 0}</div>
              <div>Mínimo atual: {quickProduto.quantidade_minima ?? 0}</div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setQuickModal(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" disabled={quickLoading} className="btn-primary">
                {quickLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
