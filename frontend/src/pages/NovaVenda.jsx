import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/format';

function calcularTotalItem(item) {
  const quantidade = Number(item.quantidade || 0);
  const precoUnitario = Number(item.preco_unitario || 0);
  const bruto = quantidade * precoUnitario;
  const desconto = Math.max(0, Math.min(Number(item.desconto || 0), bruto));
  return bruto - desconto;
}

export default function NovaVenda() {
  const navigate = useNavigate();
  const pagamentoRef = useRef(null);
  const itensRef = useRef(null);
  const descontoRef = useRef(null);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState([]);
  const [produtoBusca, setProdutoBusca] = useState('');
  const [produtoSel, setProdutoSel] = useState('');
  const [qtde, setQtde] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitTentado, setSubmitTentado] = useState(false);

  const produtosFiltrados = useMemo(() => {
    const termo = produtoBusca.trim().toLowerCase();
    if (!termo) return produtos;

    return produtos.filter((p) => {
      return p.nome?.toLowerCase().includes(termo)
        || String(p.codigo || '').toLowerCase().includes(termo)
        || String(p.categoria_nome || '').toLowerCase().includes(termo);
    });
  }, [produtoBusca, produtos]);

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
      const bruto = novos[existing].quantidade * novos[existing].preco_unitario;
      if (novos[existing].desconto > bruto) {
        novos[existing].desconto = bruto;
      }
      novos[existing].total = calcularTotalItem(novos[existing]);
      setItens(novos);
    } else {
      const novoItem = {
        produto_id: p.id,
        nome: p.nome,
        estoque_atual: estoqueAtual,
        quantidade,
        preco_unitario: parseFloat(p.preco),
        desconto: 0,
      };
      novoItem.total = calcularTotalItem(novoItem);
      setItens([...itens, novoItem]);
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
    const bruto = novos[idx].quantidade * novos[idx].preco_unitario;
    if (novos[idx].desconto > bruto) {
      novos[idx].desconto = bruto;
    }
    novos[idx].total = calcularTotalItem(novos[idx]);
    setItens(novos);
  }

  function updateItemDesconto(idx, value) {
    const descontoItem = Number(value);
    if (!Number.isFinite(descontoItem) || descontoItem < 0) {
      return;
    }

    const novos = [...itens];
    const bruto = novos[idx].quantidade * novos[idx].preco_unitario;
    if (descontoItem > bruto) {
      toast.error(`Desconto do item não pode ser maior que ${formatCurrency(bruto)}`);
      return;
    }

    novos[idx].desconto = descontoItem;
    novos[idx].total = calcularTotalItem(novos[idx]);
    setItens(novos);
  }

  const subtotalBruto = itens.reduce((s, i) => s + (i.quantidade * i.preco_unitario), 0);
  const descontoItens = itens.reduce((s, i) => s + Number(i.desconto || 0), 0);
  const subtotal = itens.reduce((s, i) => s + i.total, 0);
  const descontoGeral = Number(desconto || 0);
  const descontoGeralValido = Number.isFinite(descontoGeral) && descontoGeral >= 0;
  const total = subtotal - (descontoGeralValido ? descontoGeral : 0);

  const checklist = useMemo(() => {
    const itensValidos = itens.length > 0;
    const pagamentoValido = Boolean(formaPagamento);
    const descontoGeralOk = descontoGeralValido;
    const totalValido = Number.isFinite(total) && total >= 0;

    const itensChecklist = [
      { label: 'Pelo menos 1 item na venda', ok: itensValidos },
      { label: 'Forma de pagamento selecionada', ok: pagamentoValido },
      { label: 'Desconto geral válido', ok: descontoGeralOk },
      { label: 'Total final não negativo', ok: totalValido },
    ];

    return {
      itens: itensChecklist,
      pronto: itensChecklist.every((i) => i.ok),
    };
  }, [descontoGeralValido, formaPagamento, itens.length, total]);

  const mostrarErrosInline = submitTentado && !checklist.pronto;
  const erroItens = mostrarErrosInline && !itens.length;
  const erroPagamento = mostrarErrosInline && !formaPagamento;
  const erroDescontoGeral = mostrarErrosInline && !descontoGeralValido;
  const erroTotal = mostrarErrosInline && !(Number.isFinite(total) && total >= 0);

  function scrollParaElemento(ref, focus = false) {
    if (!ref?.current) return;
    ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (focus && typeof ref.current.focus === 'function') {
      ref.current.focus();
    }
  }

  function focarPrimeiraPendencia() {
    if (!itens.length) {
      scrollParaElemento(itensRef);
      return;
    }
    if (!formaPagamento) {
      scrollParaElemento(pagamentoRef, true);
      return;
    }
    if (!descontoGeralValido || !(Number.isFinite(total) && total >= 0)) {
      scrollParaElemento(descontoRef, true);
    }
  }

  async function handleFinalizar(e) {
    e.preventDefault();
    setSubmitTentado(true);
    if (!checklist.pronto) {
      toast.error('Revise o checklist antes de finalizar a venda');
      focarPrimeiraPendencia();
      return;
    }
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
              <select
                ref={pagamentoRef}
                className={`input ${erroPagamento ? 'border-red-300 focus:border-red-500' : ''}`}
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
              >
                <option value="">Selecione...</option>
                {['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX', 'Boleto', 'Cheque'].map((f) => <option key={f}>{f}</option>)}
              </select>
              {erroPagamento && <p className="mt-1 text-xs text-red-600">Selecione uma forma de pagamento para continuar.</p>}
            </div>
          </div>
        </div>

        <div ref={itensRef} className="card space-y-4">
          <h2 className="font-semibold text-gray-700">Itens</h2>
          {erroItens && <p className="text-xs text-red-600">Adicione pelo menos um item na venda.</p>}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="label">Buscar produto</label>
              <input
                className="input"
                placeholder="Digite nome, código ou categoria..."
                value={produtoBusca}
                onChange={(e) => setProdutoBusca(e.target.value)}
              />
            </div>
            <div className="flex items-end text-sm text-gray-500">
              {produtosFiltrados.length} produto(s) disponíveis
            </div>
          </div>
          <div className="flex gap-3">
            <select className="input flex-1" value={produtoSel} onChange={(e) => setProdutoSel(e.target.value)}>
              <option value="">Selecione um produto...</option>
              {produtosFiltrados.map((p) => {
                const estoqueAtual = Number(p.estoque_atual || 0);
                const minimo = Number(p.quantidade_minima || 0);
                const alertaBaixo = estoqueAtual <= minimo;

                return (
                  <option key={p.id} value={p.id}>
                    {p.nome} — {formatCurrency(p.preco)} — Estoque: {p.estoque_atual}{alertaBaixo ? ' (baixo)' : ''}
                  </option>
                );
              })}
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
                  <th className="table-header">Desconto</th>
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
                    <td className="table-cell">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        max={item.quantidade * item.preco_unitario}
                        className="input w-28"
                        value={item.desconto}
                        onChange={(e) => updateItemDesconto(i, e.target.value)}
                      />
                    </td>
                    <td className="table-cell font-semibold">{formatCurrency(item.total)}</td>
                    <td className="table-cell"><button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="border-t pt-4 space-y-2 text-right">
            <div className="flex justify-end items-center gap-4">
              <span className="text-sm text-gray-600">Subtotal bruto:</span>
              <span className="font-semibold">{formatCurrency(subtotalBruto)}</span>
            </div>
            <div className="flex justify-end items-center gap-4">
              <span className="text-sm text-gray-600">Desconto por itens:</span>
              <span className="font-semibold text-amber-600">- {formatCurrency(descontoItens)}</span>
            </div>
            <div className="flex justify-end items-center gap-4">
              <span className="text-sm text-gray-600">Subtotal:</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-end items-center gap-4">
              <span className="text-sm text-gray-600">Desconto (R$):</span>
              <input
                ref={descontoRef}
                type="number"
                min="0"
                step="0.01"
                className={`input w-28 text-right ${erroDescontoGeral ? 'border-red-300 focus:border-red-500' : ''}`}
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
              />
            </div>
            {erroDescontoGeral && <p className="text-xs text-red-600">Informe um desconto geral válido (valor maior ou igual a zero).</p>}
            <div className="flex justify-end items-center gap-4 text-lg">
              <span className="font-semibold text-gray-700">Total:</span>
              <span className={`font-bold ${erroTotal ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(total)}</span>
            </div>
            {erroTotal && <p className="text-xs text-red-600">O total final não pode ficar negativo.</p>}
          </div>
        </div>

        <div className="card">
          <label className="label">Observações</label>
          <textarea className="input" rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
        </div>

        <div className={`card border ${checklist.pronto ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-gray-800">Checklist de finalização</h2>
            <span className={`badge ${checklist.pronto ? 'badge-green' : 'badge-yellow'}`}>
              {checklist.pronto ? 'Pronto para finalizar' : 'Pendências encontradas'}
            </span>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {checklist.itens.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${item.ok ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className={item.ok ? 'text-green-800' : 'text-amber-800'}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/vendas')} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={loading || !checklist.pronto} className="btn-primary px-8">{loading ? 'Salvando...' : 'Finalizar Venda'}</button>
        </div>
      </form>
    </div>
  );
}
