import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
}

function daysAgoIso(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function classifyStock(quantidade, minimo) {
  if (quantidade <= minimo) return 'baixo';
  if (quantidade <= minimo * 2) return 'atencao';
  return 'normal';
}

function coverageLabel(coverage) {
  if (coverage === null || coverage === undefined) return 'Sem vendas';
  if (!Number.isFinite(coverage)) return 'Sem vendas';
  if (coverage >= 999) return '999+ dias';
  return `${coverage.toFixed(1)} dias`;
}

export default function Estoque() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [estoque, setEstoque] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [modal, setModal] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [showHistorico, setShowHistorico] = useState(false);
  const [busca, setBusca] = useState(searchParams.get('busca') || '');
  const [filtroSituacao, setFiltroSituacao] = useState(searchParams.get('situacao') || 'todos');
  const [historicoProdutoId, setHistoricoProdutoId] = useState(searchParams.get('historico_produto_id') || '');
  const [historicoTipo, setHistoricoTipo] = useState(searchParams.get('historico_tipo') || '');
  const [historicoDataInicio, setHistoricoDataInicio] = useState(searchParams.get('historico_data_inicio') || '');
  const [historicoDataFim, setHistoricoDataFim] = useState(searchParams.get('historico_data_fim') || '');
  const [recentHistoricoId, setRecentHistoricoId] = useState(null);
  const [coverageMap, setCoverageMap] = useState({});
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [quickMinimoProduto, setQuickMinimoProduto] = useState(null);
  const [quickMinimoValor, setQuickMinimoValor] = useState('');
  const [quickMinimoLoading, setQuickMinimoLoading] = useState(false);
  const [form, setForm] = useState({ produto_id: '', tipo: 'entrada', quantidade: '', motivo: '' });
  const [loading, setLoading] = useState(false);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  function load() {
    api.get('/estoque').then((r) => setEstoque(r.data));
  }

  function loadProdutos() {
    api.get('/produtos')
      .then((r) => setProdutos(r.data))
      .catch(() => setProdutos([]));
  }

  async function loadCoverage() {
    setCoverageLoading(true);
    try {
      const dataInicio = daysAgoIso(30);
      const dataFim = new Date().toISOString().slice(0, 10);
      const { data } = await api.get(`/vendas/relatorio/produtos?data_inicio=${dataInicio}&data_fim=${dataFim}&limite=100`);
      const diasPeriodo = Math.max(1, Math.round((new Date(`${dataFim}T00:00:00`) - new Date(`${dataInicio}T00:00:00`)) / 86400000) + 1);
      const mapa = {};

      data.forEach((item) => {
        const quantidadeVendida = Number(item.quantidade_vendida || 0);
        const mediaDiaria = quantidadeVendida / diasPeriodo;
        mapa[item.id] = {
          quantidadeVendida,
          mediaDiaria,
        };
      });

      setCoverageMap(mapa);
    } catch {
      setCoverageMap({});
    } finally {
      setCoverageLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadProdutos();
    loadCoverage();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (busca) params.set('busca', busca);
    if (filtroSituacao && filtroSituacao !== 'todos') params.set('situacao', filtroSituacao);
    if (historicoProdutoId) params.set('historico_produto_id', historicoProdutoId);
    if (historicoTipo) params.set('historico_tipo', historicoTipo);
    if (historicoDataInicio) params.set('historico_data_inicio', historicoDataInicio);
    if (historicoDataFim) params.set('historico_data_fim', historicoDataFim);
    setSearchParams(params, { replace: true });
  }, [
    busca,
    filtroSituacao,
    historicoProdutoId,
    historicoTipo,
    historicoDataInicio,
    historicoDataFim,
    setSearchParams,
  ]);

  const estoqueComOrdenacao = useMemo(() => {
    return [...estoque].sort((a, b) => {
      const situacaoA = classifyStock(Number(a.quantidade || 0), Number(a.quantidade_minima || 0));
      const situacaoB = classifyStock(Number(b.quantidade || 0), Number(b.quantidade_minima || 0));
      const ordem = { baixo: 0, atencao: 1, normal: 2 };
      if (ordem[situacaoA] !== ordem[situacaoB]) return ordem[situacaoA] - ordem[situacaoB];
      return Number(a.quantidade || 0) - Number(b.quantidade || 0);
    });
  }, [estoque]);

  const estoqueFiltrado = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return estoqueComOrdenacao.filter((item) => {
      const quantidade = Number(item.quantidade || 0);
      const minimo = Number(item.quantidade_minima || 0);
      const situacao = classifyStock(quantidade, minimo);
      const correspondeBusca = !termo
        || item.produto_nome?.toLowerCase().includes(termo)
        || item.codigo?.toLowerCase().includes(termo)
        || item.unidade?.toLowerCase().includes(termo);

      if (!correspondeBusca) return false;
      if (filtroSituacao === 'baixo') return situacao === 'baixo';
      if (filtroSituacao === 'atencao') return situacao === 'atencao';
      if (filtroSituacao === 'normal') return situacao === 'normal';
      return true;
    });
  }, [busca, estoqueComOrdenacao, filtroSituacao]);

  const resumoEstoque = useMemo(() => {
    return estoque.reduce((acc, item) => {
      const quantidade = Number(item.quantidade || 0);
      const minimo = Number(item.quantidade_minima || 0);
      const situacao = classifyStock(quantidade, minimo);
      acc.total += 1;
      if (situacao === 'baixo') acc.baixo += 1;
      else if (situacao === 'atencao') acc.atencao += 1;
      else acc.normal += 1;
      return acc;
    }, { total: 0, baixo: 0, atencao: 0, normal: 0 });
  }, [estoque]);

  const alertaCritico = useMemo(() => {
    const itens = estoqueComOrdenacao.filter((item) => classifyStock(Number(item.quantidade || 0), Number(item.quantidade_minima || 0)) === 'baixo');
    return {
      quantidade: itens.length,
      destaques: itens.slice(0, 3),
    };
  }, [estoqueComOrdenacao]);

  const coberturaMedia = useMemo(() => {
    const valores = estoqueFiltrado
      .map((item) => {
        const quantidade = Number(item.quantidade || 0);
        const mediaDiaria = coverageMap[item.produto_id]?.mediaDiaria;
        const cobertura = Number.isFinite(mediaDiaria) && mediaDiaria > 0 ? quantidade / mediaDiaria : null;
        return Number.isFinite(cobertura) ? cobertura : null;
      })
      .filter((value) => value !== null);

    if (!valores.length) return null;
    return valores.reduce((sum, value) => sum + value, 0) / valores.length;
  }, [estoqueFiltrado, coverageMap]);

  function exportarCsv() {
    const linhas = [];
    linhas.push(['produto', 'codigo', 'unidade', 'quantidade', 'minimo', 'situacao', 'cobertura'].join(';'));

    estoqueFiltrado.forEach((item) => {
      const quantidade = Number(item.quantidade || 0);
      const minimo = Number(item.quantidade_minima || 0);
      const situacao = classifyStock(quantidade, minimo);
      const mediaDiaria = coverageMap[item.produto_id]?.mediaDiaria;
      const cobertura = Number.isFinite(mediaDiaria) && mediaDiaria > 0 ? quantidade / mediaDiaria : null;

      linhas.push([
        escapeCsv(item.produto_nome),
        escapeCsv(item.codigo || '-'),
        escapeCsv(item.unidade),
        escapeCsv(item.quantidade),
        escapeCsv(item.quantidade_minima),
        escapeCsv(situacao),
        escapeCsv(coverageLabel(cobertura)),
      ].join(';'));
    });

    linhas.push('');
    linhas.push(['historico_data', 'produto', 'tipo', 'quantidade', 'motivo', 'usuario'].join(';'));

    historico.forEach((item) => {
      linhas.push([
        escapeCsv(new Date(item.criado_em).toLocaleDateString('pt-BR')),
        escapeCsv(item.produto_nome),
        escapeCsv(item.tipo),
        escapeCsv(item.quantidade),
        escapeCsv(item.motivo || '-'),
        escapeCsv(item.usuario_nome || '-'),
      ].join(';'));
    });

    const csv = `\uFEFF${linhas.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'estoque-e-historico.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function exportarExcel() {
    const XLSX = await import('xlsx');

    const planilhaEstoque = estoqueFiltrado.map((item) => {
      const quantidade = Number(item.quantidade || 0);
      const minimo = Number(item.quantidade_minima || 0);
      const situacao = classifyStock(quantidade, minimo);
      const mediaDiaria = coverageMap[item.produto_id]?.mediaDiaria;
      const cobertura = Number.isFinite(mediaDiaria) && mediaDiaria > 0 ? quantidade / mediaDiaria : null;

      return {
        produto: item.produto_nome,
        codigo: item.codigo || '-',
        unidade: item.unidade,
        quantidade: Number(item.quantidade || 0),
        minimo: Number(item.quantidade_minima || 0),
        situacao,
        cobertura: coverageLabel(cobertura),
      };
    });

    const planilhaHistorico = historico.map((item) => ({
      data: new Date(item.criado_em).toLocaleDateString('pt-BR'),
      produto: item.produto_nome,
      tipo: item.tipo,
      quantidade: Number(item.quantidade || 0),
      motivo: item.motivo || '-',
      usuario: item.usuario_nome || '-',
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(planilhaEstoque), 'Estoque');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(planilhaHistorico.length ? planilhaHistorico : [{ data: '', produto: 'Sem movimentações', tipo: '', quantidade: '', motivo: '', usuario: '' }]), 'Historico');
    XLSX.writeFile(workbook, 'estoque-e-historico.xlsx');
  }

  function abrirHistoricoProduto(produtoId) {
    setHistoricoProdutoId(String(produtoId || ''));
    loadHistorico(produtoId, true);
  }

  function abrirReposicao(item) {
    setForm({
      produto_id: String(item.produto_id),
      tipo: 'entrada',
      quantidade: '',
      motivo: `Reposição rápida - ${item.produto_nome}`,
    });
    setModal(true);
  }

  function abrirAjusteMinimo(item) {
    const produto = produtos.find((p) => Number(p.id) === Number(item.produto_id));
    if (!produto) {
      toast.error('Produto não encontrado para ajuste rápido');
      return;
    }

    setQuickMinimoProduto(produto);
    setQuickMinimoValor(String(item.quantidade_minima ?? produto.quantidade_minima ?? 0));
  }

  async function handleMovimentar(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/estoque/movimentar', form);
      setRecentHistoricoId(data.id);
      setHistorico((prev) => [data, ...prev.filter((item) => item.id !== data.id)]);
      toast.success('Movimentação registrada!');
      setModal(false);
      load();
      loadProdutos();
      loadCoverage();
      await loadHistorico(historicoProdutoId, false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao movimentar');
    } finally {
      setLoading(false);
    }
  }

  async function handleSalvarMinimo(e) {
    e.preventDefault();
    if (!quickMinimoProduto) return;

    setQuickMinimoLoading(true);
    try {
      const payload = {
        nome: quickMinimoProduto.nome,
        descricao: quickMinimoProduto.descricao,
        preco: quickMinimoProduto.preco,
        custo: quickMinimoProduto.custo,
        unidade: quickMinimoProduto.unidade,
        categoria_id: quickMinimoProduto.categoria_id || null,
        codigo: quickMinimoProduto.codigo,
        ativo: quickMinimoProduto.ativo !== false,
        estoque_atual: Number(quickMinimoProduto.estoque_atual || 0),
        quantidade_minima: Number(quickMinimoValor || 0),
      };

      await api.put(`/produtos/${quickMinimoProduto.id}`, payload);
      toast.success('Quantidade mínima atualizada!');
      setQuickMinimoProduto(null);
      setQuickMinimoValor('');
      load();
      loadProdutos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar mínimo');
    } finally {
      setQuickMinimoLoading(false);
    }
  }

  async function loadHistorico(produtoId = historicoProdutoId, openModal = true) {
    setLoadingHistorico(true);
    try {
      const params = new URLSearchParams();
      if (produtoId) params.set('produto_id', produtoId);
      if (historicoTipo) params.set('tipo', historicoTipo);
      if (historicoDataInicio) params.set('data_inicio', historicoDataInicio);
      if (historicoDataFim) params.set('data_fim', historicoDataFim);
      const query = params.toString();
      const { data } = await api.get(query ? `/estoque/historico?${query}` : '/estoque/historico');
      setHistorico(data);
      if (openModal) setShowHistorico(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao carregar histórico');
    } finally {
      setLoadingHistorico(false);
    }
  }

  const f = (field) => ({ value: form[field] || '', onChange: (e) => setForm((p) => ({ ...p, [field]: e.target.value })) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Estoque</h1>
          <p className="text-sm text-gray-500">Saldo, movimentações, cobertura e alertas por criticidade.</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-end">
          <button onClick={() => loadHistorico(historicoProdutoId, true)} className="btn-secondary">Histórico</button>
          <button onClick={exportarCsv} className="btn-secondary">Exportar CSV</button>
          <button onClick={exportarExcel} className="btn-primary">Exportar Excel</button>
          <button onClick={() => setModal(true)} className="btn-primary">+ Movimentar</button>
        </div>
      </div>

      {alertaCritico.quantidade > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-red-700">Estoque crítico detectado</p>
            <p className="text-sm text-red-600">{alertaCritico.quantidade} produto(s) estão abaixo do mínimo e precisam de atenção.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {alertaCritico.destaques.map((item) => (
                <span key={item.id} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-red-700 border border-red-100">
                  {item.produto_nome} • {item.quantidade}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-danger btn-sm" onClick={() => setFiltroSituacao('baixo')}>
              Ver críticos
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-5">
        <div className="card">
          <p className="text-sm text-gray-500">Produtos monitorados</p>
          <p className="mt-2 text-2xl font-semibold text-gray-800">{resumoEstoque.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Estoque baixo</p>
          <p className="mt-2 text-2xl font-semibold text-red-600">{resumoEstoque.baixo}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Em atenção</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600">{resumoEstoque.atencao}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Nível normal</p>
          <p className="mt-2 text-2xl font-semibold text-green-600">{resumoEstoque.normal}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Cobertura média</p>
          <p className="mt-2 text-2xl font-semibold text-blue-600">
            {coverageLoading ? '...' : coberturaMedia === null ? 'Sem dados' : `${coberturaMedia.toFixed(1)} dias`}
          </p>
        </div>
      </div>

      <div className="card grid gap-4 md:grid-cols-3">
        <div>
          <label className="label">Buscar produto</label>
          <input
            className="input"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome, código ou unidade"
          />
        </div>
        <div>
          <label className="label">Situação</label>
          <select className="input" value={filtroSituacao} onChange={(e) => setFiltroSituacao(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="baixo">Estoque baixo</option>
            <option value="atencao">Em atenção</option>
            <option value="normal">Normal</option>
          </select>
        </div>
        <div>
          <label className="label">Histórico por produto</label>
          <div className="flex gap-2">
            <select className="input" value={historicoProdutoId} onChange={(e) => setHistoricoProdutoId(e.target.value)}>
              <option value="">Todos os produtos</option>
              {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            <button type="button" className="btn-secondary whitespace-nowrap" onClick={() => loadHistorico(historicoProdutoId, true)}>
              Ver
            </button>
          </div>
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
                <th className="table-header">Cobertura</th>
                <th className="table-header">Situação</th>
                <th className="table-header">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {estoqueFiltrado.map((e) => {
                const quantidade = Number(e.quantidade || 0);
                const minimo = Number(e.quantidade_minima || 0);
                const situacao = classifyStock(quantidade, minimo);
                const mediaDiaria = coverageMap[e.produto_id]?.mediaDiaria;
                const cobertura = Number.isFinite(mediaDiaria) && mediaDiaria > 0 ? quantidade / mediaDiaria : null;
                const isCritico = situacao === 'baixo';
                const isAtencao = situacao === 'atencao';

                return (
                  <tr key={e.id} className={`${isCritico ? 'bg-red-50/40' : isAtencao ? 'bg-amber-50/40' : 'hover:bg-gray-50'}`}>
                    <td className="table-cell font-medium">{e.produto_nome}</td>
                    <td className="table-cell text-gray-400">{e.codigo || '-'}</td>
                    <td className="table-cell">{e.unidade}</td>
                    <td className="table-cell font-semibold">{e.quantidade}</td>
                    <td className="table-cell">{e.quantidade_minima}</td>
                    <td className="table-cell">
                      <span className={`badge ${!Number.isFinite(cobertura) ? 'badge-yellow' : cobertura >= 7 ? 'badge-green' : coverageMap[e.produto_id]?.mediaDiaria > 0 && cobertura >= 3 ? 'badge-yellow' : 'badge-red'}`}>
                        {coverageLabel(cobertura)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${situacao === 'baixo' ? 'badge-red' : situacao === 'atencao' ? 'badge-yellow' : 'badge-green'}`}>
                        {situacao === 'baixo' ? 'Estoque Baixo' : situacao === 'atencao' ? 'Em Atenção' : 'Normal'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => abrirReposicao(e)} className="btn-primary btn-sm">Repor</button>
                        <button type="button" onClick={() => abrirAjusteMinimo(e)} className="btn-secondary btn-sm">Mínimo</button>
                        <button type="button" onClick={() => abrirHistoricoProduto(e.produto_id)} className="btn-secondary btn-sm">Histórico</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!estoqueFiltrado.length && <tr><td colSpan={8} className="table-cell text-center text-gray-400 py-8">Nenhum item encontrado para os filtros informados</td></tr>}
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

      {quickMinimoProduto && (
        <Modal title={`Ajustar mínimo - ${quickMinimoProduto.nome}`} onClose={() => setQuickMinimoProduto(null)}>
          <form onSubmit={handleSalvarMinimo} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Estoque atual</label>
                <input className="input" value={quickMinimoProduto.estoque_atual ?? 0} readOnly />
              </div>
              <div>
                <label className="label">Novo mínimo *</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={quickMinimoValor}
                  onChange={(e) => setQuickMinimoValor(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setQuickMinimoProduto(null)} className="btn-secondary">Cancelar</button>
              <button type="submit" disabled={quickMinimoLoading} className="btn-primary">
                {quickMinimoLoading ? 'Salvando...' : 'Salvar mínimo'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showHistorico && (
        <Modal title="Histórico de Movimentações" onClose={() => setShowHistorico(false)} size="lg">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mb-4">
            <div>
              <label className="label">Produto</label>
              <select className="input" value={historicoProdutoId} onChange={(e) => setHistoricoProdutoId(e.target.value)}>
                <option value="">Todos os produtos</option>
                {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="input" value={historicoTipo} onChange={(e) => setHistoricoTipo(e.target.value)}>
                <option value="">Todos</option>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>
            <div>
              <label className="label">Data inicial</label>
              <input className="input" type="date" value={historicoDataInicio} onChange={(e) => setHistoricoDataInicio(e.target.value)} />
            </div>
            <div>
              <label className="label">Data final</label>
              <input className="input" type="date" value={historicoDataFim} onChange={(e) => setHistoricoDataFim(e.target.value)} />
            </div>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={() => loadHistorico(historicoProdutoId, false)} disabled={loadingHistorico}>
              {loadingHistorico ? 'Carregando...' : 'Aplicar filtros'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setHistoricoProdutoId('');
                setHistoricoTipo('');
                setHistoricoDataInicio('');
                setHistoricoDataFim('');
                loadHistorico('', false);
              }}
            >
              Limpar filtros
            </button>
          </div>
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
                  <tr key={h.id} className={h.id === recentHistoricoId ? 'bg-emerald-50' : ''}>
                    <td className="table-cell">{new Date(h.criado_em).toLocaleDateString('pt-BR')}</td>
                    <td className="table-cell">{h.produto_nome}</td>
                    <td className="table-cell"><span className={`badge ${h.tipo === 'entrada' ? 'badge-green' : 'badge-red'}`}>{h.tipo}</span></td>
                    <td className="table-cell font-semibold">{h.quantidade}</td>
                    <td className="table-cell">{h.motivo || '-'}</td>
                    <td className="table-cell">{h.usuario_nome || '-'}</td>
                  </tr>
                ))}
                {!historico.length && <tr><td colSpan={6} className="table-cell text-center text-gray-400 py-8">Nenhuma movimentação encontrada</td></tr>}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
}
