export function summarizeBusinessEntries(entries = [], options = {}) {
  const { taxRate = 0, currency = 'BRL' } = options;

  const normalizedItems = (entries || []).map((item) => {
    const quantity = Number(item?.quantity ?? 0);
    const unitPrice = Number(item?.unitPrice ?? 0);
    const discount = Number(item?.discount ?? 0);
    const netValue = quantity * unitPrice - discount;
    const subtotal = Math.max(netValue, 0);

    return {
      name: String(item?.name ?? '').trim(),
      quantity,
      unitPrice,
      discount,
      subtotal
    };
  });

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return {
    currency,
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number(total.toFixed(2)),
    items: normalizedItems
  };
}
