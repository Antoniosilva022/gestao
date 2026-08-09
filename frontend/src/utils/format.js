export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

export function formatCPFCNPJ(value) {
  if (!value) return '-';
  return value;
}
