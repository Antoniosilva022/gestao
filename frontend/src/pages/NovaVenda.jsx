import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/format';

export default function NovaVenda() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState([]);
  const [produtoSel, setProdutoSel] = useState('');
  const [qtde, setQtde] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/clientes').then((r) => setClientes(r.data));
    api.get('/produtos').then((r) => setProdutos(r.data));
  }, []);

  function addItem() {
    const p = produtos.find((x) => x.id === parseInt(produtoSel));
    if (!p) return toast.error('Selecione um produto');
    const quantidade = parseFloat(qtde);
    const estoqueAtual = parseFloat(p.estoque_atual || 0);

    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      return toast.error('Informe uma quantidade válida');
    }

    if (quantidade > estoqueAtual) {
      return toast.error(`Estoque insuficiente. Disponível: ${estoqueAtual}`);
    }

    const existing = itens.findIndex((i) => i.produto_id === p.id);
    if (existing >= 0) {
      const novos = [...itens];
      const novaQuantidade = novos[existing].quantidade + quantidade;
      if (novaQuantidade > estoqueAtual) {
        return toast.error(`Estoque insuficiente. Disponível: ${estoqueAtual}`);
      }
      novos[existing].quantidade = novaQuantidade;
      novos[existing].total = novos[existing].quantidade * novos[existing].preco_unitario;
      setItens(novos);
    } else {
      setItens([...itens, { produto_id: p.id, nome: p.nome, estoque_atual: estoqueAtual, quantidade, preco_unitario: parseFloat(p.preco), desconto: 0, total: quantidade * parseFloat(p.preco) }]);
    }
    setProdutoSel('');
    setQtde(1);
  }

  function removeItem(idx) { setItens(itens.filter((_, i) => i !== idx)); }

  function updateItemQuantidade(idx, value) {
    const quantidade = parseFloat(value);
    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      return;
    }

    const novos = [...itens];
    const estoqueAtual = parseFloat(novos[idx].estoque_atual || 0);
    if (quantidade > estoqueAtual) {
      toast.error(`Estoque insuficiente. Disponível: ${estoqueAtual}`);
      return;
    }

    novos[idx].quantidade = quantidade;
    novos[idx].total = quantidade * novos[idx].preco_unitario;
    setItens(novos);
  }

  const subtotal = itens.reduce((s, i) => s + i.total, 0);
  const total = subtotal - parseFloat(desconto || 0);

  async function handleFinalizar(e) {
    e.preventDefault();
    if (!itens.length) return toast.error('Adicione pelo menos um item');
    if (!formaPagamento) return toast.error('Selecione a forma de pagamento');
    if (parseFloat(total) < 0) return toast.error('Total da venda não pode ser negativo');
    setLoading(true);
    try {
      await api.post('/vendas', {
        cliente_id: clienteId || null,
        itens: itens.map((i) => ({ produto_id: i.produto_id, quantidade: i.quantidade, preco_unitario: i.preco_unitario, desconto: i.desconto })),
        desconto: parseFloat(desconto || 0),
        forma_pagamento: formaPagamento,
        observacoes,
      });
      toast.success('Venda registrada com sucesso!');
      navigate('/vendas');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao registrar venda');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-800">Nova Venda</h1>

      <form onSubmit={handleFinalizar} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700">Dados da Venda</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cliente</label>
              <select className="input" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Consumidor final</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Forma de Pagamento</label>
              <select className="input" value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
                <option value="">Selecione...</option>
                {['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX', 'Boleto', 'Cheque'].map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700">Itens</h2>
          <div className="flex gap-3">
            <select className="input flex-1" value={produtoSel} onChange={(e) => setProdutoSel(e.target.value)}>
              <option value="">Selecione um produto...</option>
              {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome} — {formatCurrency(p.preco)} — Estoque: {p.estoque_atual}</option>)}
            </select>
            <input type="number" min="0.01" step="0.01" className="input w-24" value={qtde} onChange={(e) => setQtde(e.target.value)} placeholder="Qtde" />
            <button type="button" onClick={addItem} className="btn-primary whitespace-nowrap">+ Adicionar</button>
          </div>

          {itens.length > 0 && (
            <table className="w-full mt-2">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Produto</th>
                  <th className="table-header">Estoque</th>
                  <th className="table-header">Qtde</th>
                  <th className="table-header">Unit.</th>
                  <th className="table-header">Total</th>
                  <th className="table-header"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itens.map((item, i) => (
                  <tr key={i}>
                    <td className="table-cell">{item.nome}</td>
                    <td className="table-cell">{item.estoque_atual}</td>
                    <td className="table-cell">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        max={item.estoque_atual}
                        className="input w-24"
                        value={item.quantidade}
                        onChange={(e) => updateItemQuantidade(i, e.target.value)}
                      />
                    </td>
                    <td className="table-cell">{formatCurrency(item.preco_unitario)}</td>
                    <td className="table-cell font-semibold">{formatCurrency(item.total)}</td>
                    <td className="table-cell"><button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="border-t pt-4 space-y-2 text-right">
            <div className="flex justify-end items-center gap-4">
              <span className="text-sm text-gray-600">Subtotal:</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-end items-center gap-4">
              <span className="text-sm text-gray-600">Desconto (R$):</span>
              <input type="number" min="0" step="0.01" className="input w-28 text-right" value={desconto} onChange={(e) => setDesconto(e.target.value)} />
            </div>
            <div className="flex justify-end items-center gap-4 text-lg">
              <span className="font-semibold text-gray-700">Total:</span>
              <span className="font-bold text-green-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <label className="label">Observações</label>
          <textarea className="input" rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/vendas')} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary px-8">{loading ? 'Salvando...' : 'Finalizar Venda'}</button>
        </div>
      </form>
    </div>
  );
}
