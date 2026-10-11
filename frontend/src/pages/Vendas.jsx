import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { formatCurrency, formatDate } from '../utils/format';

const STATUS_BADGE = { aberta: 'badge-blue', fechada: 'badge-green', cancelada: 'badge-red' };

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildAuditSummary(venda) {
  const itens = venda?.itens || [];
  const movimentacoes = venda?.movimentacoes || [];
  const itemMap = new Map();
  const movMap = new Map();

  for (const item of itens) {
    const key = String(item.produto_id);
    itemMap.set(key, (itemMap.get(key) || 0) + toNumber(item.quantidade));
  }

  for (const mov of movimentacoes) {
    const key = String(mov.produto_id);
    const current = movMap.get(key) || { saida: 0, entrada: 0, produto_nome: mov.produto_nome || `Produto ${mov.produto_id}` };
    if (mov.tipo === 'saida') {
      current.saida += toNumber(mov.quantidade);
    }
    if (mov.tipo === 'entrada') {
      current.entrada += toNumber(mov.quantidade);
    }
    movMap.set(key, current);
  }

  const inconsistencias = [];
  const allKeys = new Set([...itemMap.keys(), ...movMap.keys()]);

  for (const key of allKeys) {
    const itemQtde = itemMap.get(key) || 0;
    const mov = movMap.get(key) || { saida: 0, entrada: 0, produto_nome: `Produto ${key}` };

    if (mov.saida !== itemQtde) {
      inconsistencias.push(`${mov.produto_nome}: saída ${mov.saida} difere da quantidade vendida ${itemQtde}.`);
    }

    if (venda?.status === 'cancelada' && mov.entrada < itemQtde) {
      inconsistencias.push(`${mov.produto_nome}: devolução incompleta (${mov.entrada}/${itemQtde}).`);
    }

    if (venda?.status !== 'cancelada' && mov.entrada > 0) {
      inconsistencias.push(`${mov.produto_nome}: entrada registrada em venda não cancelada.`);
    }
  }

  return {
    ok: inconsistencias.length === 0,
    inconsistencias,
  };
}

export default function Vendas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vendas, setVendas] = useState([]);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [dataInicio, setDataInicio] = useState(searchParams.get('data_inicio') || '');
  const [dataFim, setDataFim] = useState(searchParams.get('data_fim') || '');
  const [somenteInconsistencias, setSomenteInconsistencias] = useState(searchParams.get('somente_inconsistencias') === 'true');
  const [detalheVenda, setDetalheVenda] = useState(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  function load() {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (dataInicio) params.set('data_inicio', dataInicio);
    if (dataFim) params.set('data_fim', dataFim);
    if (somenteInconsistencias) params.set('somente_inconsistencias', 'true');
    const query = params.toString();
    api.get(`/vendas${query ? `?${query}` : ''}`).then((r) => setVendas(r.data));
  }

  useEffect(() => { load(); }, [status, dataInicio, dataFim, somenteInconsistencias]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (dataInicio) params.set('data_inicio', dataInicio);
    if (dataFim) params.set('data_fim', dataFim);
    if (somenteInconsistencias) params.set('somente_inconsistencias', 'true');
    setSearchParams(params, { replace: true });
  }, [status, dataInicio, dataFim, somenteInconsistencias, setSearchParams]);

  async function fecharVenda(id) {
    try {
      await api.patch(`/vendas/${id}/status`, { status: 'fechada' });
      toast.success('Venda fechada com sucesso');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao fechar venda');
    }
  }

  async function cancelarVenda(id) {
    if (!confirm('Cancelar venda? O estoque será devolvido automaticamente.')) return;
    try {
      await api.patch(`/vendas/${id}/status`, { status: 'cancelada' });
      toast.success('Venda cancelada com devolução de estoque');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao cancelar venda');
    }
  }

  async function verDetalhes(id) {
    setLoadingDetalhe(true);
    try {
      const { data } = await api.get(`/vendas/${id}`);
      setDetalheVenda(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao buscar detalhes da venda');
    } finally {
      setLoadingDetalhe(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Vendas</h1>
        <Link to="/vendas/nova" className="btn-primary">+ Nova Venda</Link>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Data inicial</label>
            <input className="input w-40" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Data final</label>
            <input className="input w-40" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
          {['', 'aberta', 'fechada', 'cancelada'].map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-secondary'}`}>
              {s || 'Todas'}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSomenteInconsistencias((prev) => !prev)}
            className={`btn btn-sm ${somenteInconsistencias ? 'btn-danger' : 'btn-secondary'}`}
          >
            {somenteInconsistencias ? 'Mostrando inconsistências' : 'Somente com inconsistência'}
          </button>
          <button
            type="button"
            onClick={() => { setStatus(''); setDataInicio(''); setDataFim(''); setSomenteInconsistencias(false); }}
            className="btn btn-sm btn-secondary"
          >
            Limpar filtros
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">#</th>
                <th className="table-header">Cliente</th>
                <th className="table-header">Data</th>
                <th className="table-header">Total</th>
                <th className="table-header">Pagamento</th>
                <th className="table-header">Status</th>
                <th className="table-header">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendas.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="table-cell font-mono text-gray-400">#{v.id}</td>
                  <td className="table-cell font-medium">{v.cliente_nome || 'Consumidor'}</td>
                  <td className="table-cell">{formatDate(v.criado_em)}</td>
                  <td className="table-cell font-semibold text-green-600">{formatCurrency(v.total)}</td>
                  <td className="table-cell">{v.forma_pagamento || '-'}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${STATUS_BADGE[v.status]}`}>{v.status}</span>
                      {v.tem_inconsistencia && <span className="badge badge-red">inconsistente</span>}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={() => verDetalhes(v.id)} className="btn-secondary btn-sm">
                        {loadingDetalhe && detalheVenda?.id === v.id ? 'Carregando...' : 'Detalhes'}
                      </button>
                      {v.status === 'aberta' && (
                        <button onClick={() => fecharVenda(v.id)} className="btn-success btn-sm">Fechar</button>
                      )}
                      {v.status !== 'cancelada' && (
                        <button onClick={() => cancelarVenda(v.id)} className="btn-danger btn-sm">Cancelar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!vendas.length && <tr><td colSpan={7} className="table-cell text-center text-gray-400 py-8">Nenhuma venda encontrada</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {detalheVenda && (
        <Modal title={`Venda #${detalheVenda.id}`} onClose={() => setDetalheVenda(null)} size="lg">
          <div className="space-y-4">
            {(() => {
              const audit = buildAuditSummary(detalheVenda);
              return (
                <div className={`rounded-lg border p-3 ${audit.ok ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="font-medium text-sm mb-1">
                    {audit.ok ? 'Consistência de estoque: OK' : 'Atenção: inconsistências encontradas'}
                  </div>
                  {!audit.ok && (
                    <ul className="text-sm text-amber-800 list-disc pl-5 space-y-1">
                      {audit.inconsistencias.map((msg, idx) => <li key={idx}>{msg}</li>)}
                    </ul>
                  )}
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Cliente:</span>{' '}
                <span className="font-medium">{detalheVenda.cliente_nome || 'Consumidor final'}</span>
              </div>
              <div>
                <span className="text-gray-500">Data:</span>{' '}
                <span className="font-medium">{formatDate(detalheVenda.criado_em)}</span>
              </div>
              <div>
                <span className="text-gray-500">Pagamento:</span>{' '}
                <span className="font-medium">{detalheVenda.forma_pagamento || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>{' '}
                <span className={`badge ${STATUS_BADGE[detalheVenda.status]}`}>{detalheVenda.status}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Produto</th>
                    <th className="table-header">Qtde</th>
                    <th className="table-header">Unitário</th>
                    <th className="table-header">Desconto</th>
                    <th className="table-header">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detalheVenda.itens?.map((item) => (
                    <tr key={item.id}>
                      <td className="table-cell">{item.produto_nome}</td>
                      <td className="table-cell">{item.quantidade}</td>
                      <td className="table-cell">{formatCurrency(item.preco_unitario)}</td>
                      <td className="table-cell">{formatCurrency(item.desconto || 0)}</td>
                      <td className="table-cell font-semibold">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                  {!detalheVenda.itens?.length && (
                    <tr>
                      <td colSpan={5} className="table-cell text-center text-gray-400 py-6">Sem itens registrados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t pt-3 space-y-1 text-right">
              <div className="text-sm text-gray-600">Subtotal: <span className="font-medium">{formatCurrency(detalheVenda.subtotal)}</span></div>
              <div className="text-sm text-gray-600">Desconto: <span className="font-medium">{formatCurrency(detalheVenda.desconto)}</span></div>
              <div className="text-lg font-semibold text-green-600">Total: {formatCurrency(detalheVenda.total)}</div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-700 mb-3">Movimentações de Estoque</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-header">Data/Hora</th>
                      <th className="table-header">Produto</th>
                      <th className="table-header">Tipo</th>
                      <th className="table-header">Quantidade</th>
                      <th className="table-header">Motivo</th>
                      <th className="table-header">Usuário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detalheVenda.movimentacoes?.map((mov) => (
                      <tr key={mov.id}>
                        <td className="table-cell">{formatDateTime(mov.criado_em)}</td>
                        <td className="table-cell">{mov.produto_nome}</td>
                        <td className="table-cell">
                          <span className={`badge ${mov.tipo === 'entrada' ? 'badge-green' : 'badge-blue'}`}>{mov.tipo}</span>
                        </td>
                        <td className="table-cell">{mov.quantidade}</td>
                        <td className="table-cell">{mov.motivo}</td>
                        <td className="table-cell">{mov.usuario_nome || '-'}</td>
                      </tr>
                    ))}
                    {!detalheVenda.movimentacoes?.length && (
                      <tr>
                        <td colSpan={6} className="table-cell text-center text-gray-400 py-6">Sem movimentações vinculadas</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
