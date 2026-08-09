import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { formatCurrency } from '../utils/format';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
}

export default function ResumoNegocios() {
  const [dataInicio, setDataInicio] = useState(monthStartIso);
  const [dataFim, setDataFim] = useState(todayIso);
  const [resumo, setResumo] = useState({ total_vendas: 0, faturamento_total: 0, ticket_medio: 0 });
  const [porProduto, setPorProduto] = useState([]);
  const [porPagamento, setPorPagamento] = useState([]);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (dataInicio) params.set('data_inicio', dataInicio);
    if (dataFim) params.set('data_fim', dataFim);
    return params.toString();
  }, [dataInicio, dataFim]);

  function exportarCsv() {
    const linhas = [];
    const inicio = dataInicio || 'inicio_nao_informado';
    const fim = dataFim || 'fim_nao_informado';
    const dataGeracao = new Date().toISOString();

    linhas.push(['secao', 'campo', 'valor'].join(';'));
    linhas.push([escapeCsv('resumo'), escapeCsv('periodo_inicio'), escapeCsv(inicio)].join(';'));
    linhas.push([escapeCsv('resumo'), escapeCsv('periodo_fim'), escapeCsv(fim)].join(';'));
    linhas.push([escapeCsv('resumo'), escapeCsv('gerado_em_utc'), escapeCsv(dataGeracao)].join(';'));
    linhas.push([escapeCsv('resumo'), escapeCsv('total_vendas'), escapeCsv(Number(resumo.total_vendas || 0))].join(';'));
    linhas.push([escapeCsv('resumo'), escapeCsv('faturamento_total'), escapeCsv(resumo.faturamento_total || 0)].join(';'));
    linhas.push([escapeCsv('resumo'), escapeCsv('ticket_medio'), escapeCsv(resumo.ticket_medio || 0)].join(';'));
    linhas.push('');

    linhas.push(['secao', 'produto_id', 'produto_nome', 'quantidade_vendida', 'faturamento'].join(';'));
    if (porProduto.length) {
      porProduto.forEach((item) => {
        linhas.push([
          escapeCsv('produtos'),
          escapeCsv(item.id),
          escapeCsv(item.nome),
          escapeCsv(item.quantidade_vendida),
          escapeCsv(item.faturamento),
        ].join(';'));
      });
    } else {
      linhas.push([escapeCsv('produtos'), '', escapeCsv('Sem vendas no periodo'), '', ''].join(';'));
    }
    linhas.push('');

    linhas.push(['secao', 'forma_pagamento', 'vendas', 'faturamento'].join(';'));
    if (porPagamento.length) {
      porPagamento.forEach((item) => {
        linhas.push([
          escapeCsv('pagamentos'),
          escapeCsv(item.forma_pagamento),
          escapeCsv(item.vendas),
          escapeCsv(item.faturamento),
        ].join(';'));
      });
    } else {
      linhas.push([escapeCsv('pagamentos'), escapeCsv('Sem faturamento no periodo'), '', ''].join(';'));
    }

    const csv = `\uFEFF${linhas.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-vendas-${inicio}_${fim}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function exportarXlsx() {
    const XLSX = await import('xlsx');
    const inicio = dataInicio || 'inicio_nao_informado';
    const fim = dataFim || 'fim_nao_informado';
    const dataGeracao = new Date().toISOString();

    const dadosResumo = [
      { campo: 'periodo_inicio', valor: inicio },
      { campo: 'periodo_fim', valor: fim },
      { campo: 'gerado_em_utc', valor: dataGeracao },
      { campo: 'total_vendas', valor: Number(resumo.total_vendas || 0) },
      { campo: 'faturamento_total', valor: Number(resumo.faturamento_total || 0) },
      { campo: 'ticket_medio', valor: Number(resumo.ticket_medio || 0) },
    ];

    const dadosProdutos = porProduto.length
      ? porProduto.map((item) => ({
          produto_id: item.id,
          produto_nome: item.nome,
          quantidade_vendida: Number(item.quantidade_vendida || 0),
          faturamento: Number(item.faturamento || 0),
        }))
      : [{ produto_id: '', produto_nome: 'Sem vendas no periodo', quantidade_vendida: '', faturamento: '' }];

    const dadosPagamentos = porPagamento.length
      ? porPagamento.map((item) => ({
          forma_pagamento: item.forma_pagamento,
          vendas: Number(item.vendas || 0),
          faturamento: Number(item.faturamento || 0),
        }))
      : [{ forma_pagamento: 'Sem faturamento no periodo', vendas: '', faturamento: '' }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(dadosResumo), 'Resumo');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(dadosProdutos), 'Produtos');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(dadosPagamentos), 'Pagamentos');
    XLSX.writeFile(workbook, `relatorio-vendas-${inicio}_${fim}.xlsx`);
  }

  async function load() {
    setLoading(true);
    try {
      const [resumoResp, produtoResp, pagamentoResp] = await Promise.all([
        api.get(`/vendas/relatorio/resumo?${query}`),
        api.get(`/vendas/relatorio/produtos?${query}&limite=20`),
        api.get(`/vendas/relatorio/pagamentos?${query}`),
      ]);

      setResumo(resumoResp.data || { total_vendas: 0, faturamento_total: 0, ticket_medio: 0 });
      setPorProduto(produtoResp.data || []);
      setPorPagamento(pagamentoResp.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Relatório de Vendas</h1>
          <p className="text-sm text-gray-500">Acompanhe período, produtos mais vendidos e faturamento por pagamento.</p>
        </div>
      </div>

      <div className="card grid gap-4 md:grid-cols-5">
        <div>
          <label className="label">Data inicial</label>
          <input type="date" className="input" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </div>
        <div>
          <label className="label">Data final</label>
          <input type="date" className="input" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </div>
        <div className="flex items-end">
          <button type="button" className="btn-secondary w-full" onClick={load} disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar relatório'}
          </button>
        </div>
        <div className="flex items-end">
          <button type="button" className="btn-primary w-full" onClick={exportarCsv}>
            Exportar CSV
          </button>
        </div>
        <div className="flex items-end">
          <button type="button" className="btn-primary w-full" onClick={exportarXlsx}>
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm text-gray-500">Total de vendas</p>
          <p className="mt-2 text-2xl font-semibold text-gray-800">{Number(resumo.total_vendas || 0)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Faturamento</p>
          <p className="mt-2 text-2xl font-semibold text-green-600">{formatCurrency(resumo.faturamento_total)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Ticket médio</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600">{formatCurrency(resumo.ticket_medio)}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800">Produtos Mais Vendidos</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Produto</th>
                <th className="table-header">Quantidade</th>
                <th className="table-header">Faturamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {porProduto.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{item.nome}</td>
                  <td className="table-cell">{item.quantidade_vendida}</td>
                  <td className="table-cell font-semibold">{formatCurrency(item.faturamento)}</td>
                </tr>
              ))}
              {!porProduto.length && <tr><td colSpan={3} className="table-cell text-center text-gray-400 py-8">Sem vendas no período</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800">Faturamento por Forma de Pagamento</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Forma de pagamento</th>
                <th className="table-header">Vendas</th>
                <th className="table-header">Faturamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {porPagamento.map((item) => (
                <tr key={item.forma_pagamento} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{item.forma_pagamento}</td>
                  <td className="table-cell">{item.vendas}</td>
                  <td className="table-cell font-semibold">{formatCurrency(item.faturamento)}</td>
                </tr>
              ))}
              {!porPagamento.length && <tr><td colSpan={3} className="table-cell text-center text-gray-400 py-8">Sem faturamento no período</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
