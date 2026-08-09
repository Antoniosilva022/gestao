import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { formatCurrency, formatDate } from '../utils/format';

const EMPTY = { nome: '', email: '', cpf: '', telefone: '', cargo: '', departamento: '', salario: '', data_admissao: '', status: 'ativo' };
const STATUS_BADGE = { ativo: 'badge-green', inativo: 'badge-gray', ferias: 'badge-blue', afastado: 'badge-yellow' };

export default function Funcionarios() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtrosInicializadosRef = useRef(false);
  const itensPorPaginaInicial = Number(searchParams.get('por_pagina') || 10);
  const paginaInicial = Number(searchParams.get('pagina') || 1);
  const [funcionarios, setFuncionarios] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFiltro, setStatusFiltro] = useState(searchParams.get('status') || '');
  const [salarioMin, setSalarioMin] = useState(searchParams.get('salario_min') || '');
  const [salarioMax, setSalarioMax] = useState(searchParams.get('salario_max') || '');
  const [admissaoInicio, setAdmissaoInicio] = useState(searchParams.get('admissao_inicio') || '');
  const [admissaoFim, setAdmissaoFim] = useState(searchParams.get('admissao_fim') || '');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(Number.isFinite(paginaInicial) && paginaInicial > 0 ? paginaInicial : 1);
  const [itensPorPagina, setItensPorPagina] = useState([5, 10, 20, 50].includes(itensPorPaginaInicial) ? itensPorPaginaInicial : 10);

  function load() {
    const params = new URLSearchParams();
    params.set('search', search);
    if (statusFiltro) params.set('status', statusFiltro);
    if (salarioMin) params.set('salario_min', salarioMin);
    if (salarioMax) params.set('salario_max', salarioMax);
    if (admissaoInicio) params.set('admissao_inicio', admissaoInicio);
    if (admissaoFim) params.set('admissao_fim', admissaoFim);
    api.get(`/funcionarios?${params.toString()}`).then((r) => setFuncionarios(r.data));
  }

  useEffect(() => { load(); }, [search, statusFiltro, salarioMin, salarioMax, admissaoInicio, admissaoFim]);

  useEffect(() => {
    if (!filtrosInicializadosRef.current) {
      filtrosInicializadosRef.current = true;
      return;
    }
    setPaginaAtual(1);
  }, [search, statusFiltro, salarioMin, salarioMax, admissaoInicio, admissaoFim]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFiltro) params.set('status', statusFiltro);
    if (salarioMin) params.set('salario_min', salarioMin);
    if (salarioMax) params.set('salario_max', salarioMax);
    if (admissaoInicio) params.set('admissao_inicio', admissaoInicio);
    if (admissaoFim) params.set('admissao_fim', admissaoFim);
    if (paginaAtual > 1) params.set('pagina', String(paginaAtual));
    if (itensPorPagina !== 10) params.set('por_pagina', String(itensPorPagina));
    setSearchParams(params, { replace: true });
  }, [search, statusFiltro, salarioMin, salarioMax, admissaoInicio, admissaoFim, paginaAtual, itensPorPagina, setSearchParams]);

  const resumoStatus = useMemo(() => {
    return funcionarios.reduce((acc, item) => {
      acc.total += 1;
      if (item.status === 'ativo') acc.ativo += 1;
      if (item.status === 'inativo') acc.inativo += 1;
      if (item.status === 'ferias') acc.ferias += 1;
      if (item.status === 'afastado') acc.afastado += 1;
      return acc;
    }, { total: 0, ativo: 0, inativo: 0, ferias: 0, afastado: 0 });
  }, [funcionarios]);

  const totalPaginas = Math.max(1, Math.ceil(funcionarios.length / itensPorPagina));
  const funcionariosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return funcionarios.slice(inicio, fim);
  }, [funcionarios, itensPorPagina, paginaAtual]);

  const paginasVisiveis = useMemo(() => {
    if (totalPaginas <= 7) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }

    const paginas = [1];
    const inicioJanela = Math.max(2, paginaAtual - 1);
    const fimJanela = Math.min(totalPaginas - 1, paginaAtual + 1);

    if (inicioJanela > 2) paginas.push('...');
    for (let p = inicioJanela; p <= fimJanela; p += 1) {
      paginas.push(p);
    }
    if (fimJanela < totalPaginas - 1) paginas.push('...');
    paginas.push(totalPaginas);

    return paginas;
  }, [paginaAtual, totalPaginas]);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

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

  async function handleAlterarStatus(funcionario, novoStatus) {
    setStatusLoadingId(funcionario.id);
    try {
      await api.put(`/funcionarios/${funcionario.id}`, {
        ...funcionario,
        status: novoStatus,
      });
      toast.success('Status atualizado!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar status');
    } finally {
      setStatusLoadingId(null);
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
        <div className="flex flex-wrap gap-3 items-end">
          <input className="input max-w-sm" placeholder="Buscar por nome, cargo ou departamento..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div>
            <label className="text-xs font-medium text-gray-500">Status</label>
            <select className="input mt-1" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
              <option value="">Todos</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="ferias">Férias</option>
              <option value="afastado">Afastado</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Salário mín.</label>
            <input className="input mt-1 w-32" type="number" min="0" step="0.01" value={salarioMin} onChange={(e) => setSalarioMin(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Salário máx.</label>
            <input className="input mt-1 w-32" type="number" min="0" step="0.01" value={salarioMax} onChange={(e) => setSalarioMax(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Admissão de</label>
            <input className="input mt-1" type="date" value={admissaoInicio} onChange={(e) => setAdmissaoInicio(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Admissão até</label>
            <input className="input mt-1" type="date" value={admissaoFim} onChange={(e) => setAdmissaoFim(e.target.value)} />
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFiltro('');
              setSalarioMin('');
              setSalarioMax('');
              setAdmissaoInicio('');
              setAdmissaoFim('');
            }}
            className="btn-secondary btn-sm"
          >
            Limpar filtros
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-500 font-medium">Total</p>
            <p className="text-lg font-bold text-gray-800 mt-1">{resumoStatus.total}</p>
          </div>
          <div className="rounded-lg border border-green-100 bg-green-50 p-3">
            <p className="text-xs text-green-600 font-medium">Ativos</p>
            <p className="text-lg font-bold text-green-700 mt-1">{resumoStatus.ativo}</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-500 font-medium">Inativos</p>
            <p className="text-lg font-bold text-gray-700 mt-1">{resumoStatus.inativo}</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs text-blue-600 font-medium">Férias</p>
            <p className="text-lg font-bold text-blue-700 mt-1">{resumoStatus.ferias}</p>
          </div>
          <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-3">
            <p className="text-xs text-yellow-600 font-medium">Afastados</p>
            <p className="text-lg font-bold text-yellow-700 mt-1">{resumoStatus.afastado}</p>
          </div>
        </div>

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
              {funcionariosPaginados.map((fn) => (
                <tr key={fn.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{fn.nome}</td>
                  <td className="table-cell">{fn.cargo || '-'}</td>
                  <td className="table-cell">{fn.departamento || '-'}</td>
                  <td className="table-cell">{formatCurrency(fn.salario)}</td>
                  <td className="table-cell">{formatDate(fn.data_admissao)}</td>
                  <td className="table-cell"><span className={`badge ${STATUS_BADGE[fn.status]}`}>{fn.status}</span></td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => openEditar(fn)} className="btn-secondary btn-sm">Editar</button>
                      {fn.status !== 'ativo' && (
                        <button
                          onClick={() => handleAlterarStatus(fn, 'ativo')}
                          disabled={statusLoadingId === fn.id}
                          className="btn-success btn-sm"
                        >
                          {statusLoadingId === fn.id ? 'Salvando...' : 'Ativar'}
                        </button>
                      )}
                      {fn.status === 'ativo' && (
                        <button
                          onClick={() => handleAlterarStatus(fn, 'inativo')}
                          disabled={statusLoadingId === fn.id}
                          className="btn-secondary btn-sm"
                        >
                          {statusLoadingId === fn.id ? 'Salvando...' : 'Inativar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!funcionarios.length && <tr><td colSpan={7} className="table-cell text-center text-gray-400 py-8">Nenhum funcionário cadastrado</td></tr>}
            </tbody>
          </table>
        </div>

        {funcionarios.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Itens por página</span>
              <select
                className="input h-9 w-24 py-1"
                value={itensPorPagina}
                onChange={(e) => {
                  setItensPorPagina(Number(e.target.value));
                  setPaginaAtual(1);
                }}
              >
                {[5, 10, 20, 50].map((qtd) => <option key={qtd} value={qtd}>{qtd}</option>)}
              </select>
            </div>

            <div className="text-sm text-gray-500">
              Página {paginaAtual} de {totalPaginas} ({funcionarios.length} registro(s))
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-secondary btn-sm"
                disabled={paginaAtual === 1}
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              {paginasVisiveis.map((item, idx) => {
                if (item === '...') {
                  return <span key={`ellipsis-${idx}`} className="px-1 text-gray-400">...</span>;
                }

                const pagina = Number(item);
                return (
                  <button
                    key={pagina}
                    type="button"
                    className={pagina === paginaAtual ? 'btn-primary btn-sm min-w-9' : 'btn-secondary btn-sm min-w-9'}
                    onClick={() => setPaginaAtual(pagina)}
                  >
                    {pagina}
                  </button>
                );
              })}
              <button
                type="button"
                className="btn-secondary btn-sm"
                disabled={paginaAtual >= totalPaginas}
                onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
              >
                Próxima
              </button>
            </div>
          </div>
        )}
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
