const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizeBusinessEntries } = require('../src/utils/businessSummary');

test('summarizes entries with tax and currency', () => {
  const result = summarizeBusinessEntries(
    [
      { name: 'Produto A', quantity: 2, unitPrice: 25, discount: 5 },
      { name: 'Produto B', quantity: 1, unitPrice: 40, discount: 0 }
    ],
    { taxRate: 0.1, currency: 'BRL' }
  );

  assert.deepEqual(result, {
    currency: 'BRL',
    subtotal: 85,
    tax: 8.5,
    total: 93.5,
    items: [
      { name: 'Produto A', quantity: 2, unitPrice: 25, discount: 5, subtotal: 45 },
      { name: 'Produto B', quantity: 1, unitPrice: 40, discount: 0, subtotal: 40 }
    ]
  });
});

test('clamps negative net values to zero', () => {
  const result = summarizeBusinessEntries([
    { name: 'Produto C', quantity: 1, unitPrice: 10, discount: 20 }
  ]);

  assert.equal(result.subtotal, 0);
  assert.equal(result.items[0].subtotal, 0);
});
