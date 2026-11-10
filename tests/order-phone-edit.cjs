const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '../app.js'), 'utf8');
const extract = (start, end) => {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from);
  return source.slice(from, to);
};
const code = [
  extract('function normalizeOrderMobile', '\nfunction '),
  extract('async function withLatestWashLabelPhones', 'function writeWashLabelExport'),
  extract('function canEditOrderPhone', 'async function saveOrderAddressFromDialog'),
].join('\n');

function setup({ role = 'admin', otherProject = false, conflict = false, queryError = null } = {}) {
  const order = { id: 'order-a', phone: '13000000000', address: 'Original', order_status: '待取件' };
  const cachedOrder = { ...order };
  const row = { order_id: order.id, 电话: order.phone, 条形编码: '000000001' };
  const changes = [], logs = [], filters = [], reprintQueries = [];
  const cell = { dataset: { labelPhoneOrder: order.id }, textContent: order.phone };
  const phoneDisplay = { textContent: order.phone };
  const input = { value: '＋８６ １３１－００００－０００１' };
  const button = {}, message = {};
  const form = {
    elements: { namedItem: () => input },
    querySelector: (selector) => selector === '[data-order-phone-message]' ? message : button,
    closest: () => ({ querySelector: () => phoneDisplay }),
  };
  const chain = {
    update: (payload) => { changes.push(payload); return chain; },
    eq: (field, value) => { filters.push([field, value]); return chain; },
    select: () => chain,
    maybeSingle: async () => ({
      data: conflict || queryError ? null : { id: order.id, ...changes[0] },
      error: queryError,
    }),
    in: async (field, values) => {
      reprintQueries.push([field, ...values]);
      return { data: values.filter((id) => id === order.id).map((id) => ({ id, phone: order.phone })), error: queryError };
    },
  };
  const context = vm.createContext({
    APP_MODE: 'admin', currentProfile: { role }, currentUser: {},
    TEMP_SUPABASE_CONFIG: { url: 'https://business.example' },
    loadConfig: () => ({ url: otherProject ? 'https://other.example' : 'https://business.example/' }),
    sb: { from: (table) => { assert.equal(table, 'orders'); return chain; } },
    orderManagementRows: [cachedOrder], labelReviewRows: [row], applyOrderFilters() {},
    document: { querySelectorAll: () => [cell] },
    chunkArray: (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, n) => list.slice(n * size, (n + 1) * size)),
    insertLog: async (event) => { logs.push(event); },
  });
  vm.runInContext(code, context);
  return { context, order, cachedOrder, row, cell, phoneDisplay, changes, filters, logs, input, button, message, reprintQueries,
    save: () => context.saveOrderPhoneFromDialog({ preventDefault() {}, currentTarget: form }, order) };
}

test('validates and normalizes a mobile number', async () => {
  const s = setup();
  for (const value of ['', '123456', '138000000001', '13000000000xyz']) {
    s.input.value = value;
    await s.save();
    assert.equal(s.message.className, 'warn');
  }
  s.input.value = '+86 130 0000 0000';
  await s.save();
  assert.match(s.message.textContent, /没有变化/);
  assert.equal(s.changes.length, 0);
});

test('updates only the phone and updates the detail and reprint caches', async () => {
  const s = setup();
  await s.save();
  assert.deepEqual(Object.keys(s.changes[0]).sort(), ['phone', 'updated_at']);
  assert.deepEqual(s.filters, [['id', 'order-a'], ['phone', '13000000000']]);
  for (const actual of [s.order.phone, s.cachedOrder.phone, s.row.电话, s.cell.textContent, s.phoneDisplay.textContent]) {
    assert.equal(actual, '13100000001');
  }
  assert.equal(s.order.address, 'Original');
  assert.equal(s.order.order_status, '待取件');
  assert.equal(s.row.条形编码, '000000001');
  assert.equal(s.message.className, 'success');
  assert.equal(s.button.disabled, false);
  assert.equal(s.logs[0].status, '后台修改联系电话');
  assert.doesNotMatch(s.logs[0].note, /\d{11}/);
});

test('blocks other roles and the original project, and reports conflicts or errors', async () => {
  for (const options of [{ role: 'courier' }, { role: 'factory' }, { otherProject: true }]) {
    const s = setup(options);
    await s.save();
    assert.equal(s.changes.length, 0);
  }
  for (const options of [{ conflict: true }, { queryError: { message: 'request failed' } }]) {
    const s = setup(options);
    await s.save();
    assert.equal(s.message.className, 'warn');
    assert.equal(s.order.phone, '13000000000');
    assert.equal(s.button.disabled, false);
    assert.equal(s.logs.length, 0);
  }
});

test('reprint uses the live number while preserving barcode, order and sequence', async () => {
  const s = setup();
  const stale = { ...s.row, 电话: '13800000000' };
  const second = { ...stale, 条形编码: '000000002' };
  const rows = await s.context.withLatestWashLabelPhones([second, stale]);
  assert.deepEqual(s.reprintQueries, [['id', 'order-a']]);
  assert.equal(rows[0].条形编码, second.条形编码);
  assert.equal(rows[1].条形编码, stale.条形编码);
  assert.equal(rows[0].电话, s.order.phone);
  assert.equal(rows[1].电话, s.order.phone);
  assert.equal(stale.电话, '13800000000');
  await assert.rejects(s.context.withLatestWashLabelPhones([{ order_id: 'unavailable' }]), /不可读取/);
});
