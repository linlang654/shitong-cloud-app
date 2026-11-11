const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '../app.js'), 'utf8');
const startup = source.lastIndexOf('\nif ("serviceWorker" in navigator)');
assert.ok(startup > 0);

function setup({ role = 'admin', original = false, failFirst = false, labelItems = [] } = {}) {
  const requests = [], openedOrders = [], selects = [];
  const fields = new Map(Object.entries({
    source: 'douyin',
    customer_name: '测试客户',
    phone: '＋８６ １３１－００００－０００１',
    address: '师大东区2栋',
    school: '师大',
    campus: '东区',
    building: '2栋',
    merchant: '事事超级洗护馆',
    paid_amount: '29.90',
    voucher_code: ' ＡＢ １２＿ｘ ',
  }).map(([name, value]) => [name, { value }]));
  const pickup = { value: '' };
  const redeemed = { checked: true };
  fields.set('pickup_date', pickup);
  fields.set('redeemed', redeemed);
  const itemFields = {
    '[data-manual-item-product]': { value: '普通鞋' },
    '[data-manual-item-quantity]': { value: '2' },
    '[data-manual-item-unit]': { value: '双' },
    '[data-remove-manual-item]': {},
  };
  const item = { querySelector: (selector) => itemFields[selector] };
  const itemList = {
    children: [],
    append(row) { this.children.push(row); },
    replaceChildren() { this.children.length = 0; },
    querySelectorAll() { return this.children; },
  };
  const dialog = {
    open: false,
    showModal() { this.open = true; },
    close() { this.open = false; },
  };
  const form = { elements: { namedItem: (name) => fields.get(name) }, reset() {} };
  const message = { replaceChildren() { this.innerHTML = ''; } };
  const fieldset = {}, close = {};
  const elements = {
    manualOrderDialog: dialog,
    manualOrderForm: form,
    manualOrderFields: fieldset,
    manualOrderItems: itemList,
    manualOrderItemTemplate: { content: { cloneNode: () => item } },
    manualOrderMessage: message,
    manualOrderPickupDate: pickup,
    manualOrderRedeemed: redeemed,
    manualOrderItemCount: {},
    closeManualOrderBtn: close,
    addManualOrderItemBtn: {},
    adminManualOrderStatus: {},
  };
  const client = {
    from(table) {
      assert.equal(table, 'order_items');
      return {
        select(columns) {
          selects.push(columns);
          return { order: () => ({ range: async () => ({ data: labelItems }) }) };
        },
      };
    },
    async rpc(name, { order_data: orderData }) {
      assert.equal(name, 'create_manual_wash_order');
      requests.push(structuredClone(orderData));
      assert.equal(fieldset.disabled, true);
      assert.equal(close.disabled, true);
      if (failFirst && requests.length === 1) return { error: { message: '请求超时' } };
      return { data: {
        order_id: 'order-a',
        order_no: 'DY-261111-A',
        item_count: 2,
        pickup_date: orderData.pickup_date,
        already_exists: failFirst && requests.length === 2,
      } };
    },
  };
  const context = vm.createContext({
    URL,
    URLSearchParams,
    window: { location: { search: original ? '?env=original' : '' } },
    document: { getElementById: (id) => elements[id], querySelector: () => null, querySelectorAll: () => [] },
    localStorage: { getItem: () => null },
    crypto: { randomUUID },
    client, role, openedOrders,
  });
  vm.runInContext(source.slice(0, startup), context);
  vm.runInContext(`
    sb = client;
    currentUser = { id: "staff" };
    currentProfile = { role };
    loadStats = async () => {};
    loadAdmin = async () => {};
    showOrderDetail = async (id) => openedOrders.push(id);
  `, context);
  return {
    context, dialog, message, fieldset, close, requests, openedOrders, selects, redeemed, itemFields, pickup,
    open() { context.openManualOrderDialog(); pickup.value = '2026-11-16'; },
    submit: () => context.saveManualOrder({ preventDefault() {}, currentTarget: form }),
  };
}

test('validates redeemed coupon and actual item count before creating an order', async () => {
  const s = setup();
  s.open();
  assert.equal(s.dialog.open, true);
  s.redeemed.checked = false;
  await s.submit();
  assert.equal(s.requests.length, 0);
  assert.match(s.message.innerHTML, /核销/);
  s.redeemed.checked = true;
  s.itemFields['[data-manual-item-quantity]'].value = '101';
  await s.submit();
  assert.equal(s.requests.length, 0);
  assert.match(s.message.innerHTML, /100/);
});

test('a retry keeps the request and normalized data, then a new order gets a new request', async () => {
  const s = setup({ failFirst: true });
  s.open();
  await s.submit();
  assert.equal(s.dialog.open, true);
  assert.equal(s.fieldset.disabled, false);
  assert.equal(s.close.disabled, false);
  assert.match(s.message.innerHTML, /请求超时/);

  await s.submit();
  assert.deepEqual(s.requests[1], s.requests[0]);
  assert.equal(s.requests[0].phone, '13100000001');
  assert.equal(s.requests[0].voucher_code, 'AB12_x');
  assert.equal(s.requests[0].source, 'douyin');
  assert.equal(s.requests[0].redeemed, true);
  assert.equal(s.requests[0].pickup_date, '2026-11-16');
  assert.deepEqual(s.requests[0].items, [{ product_name: '普通鞋', spec: '2双', count: 2 }]);
  assert.equal(s.dialog.open, false);
  assert.deepEqual(s.openedOrders, ['order-a']);

  s.open();
  await s.submit();
  assert.notEqual(s.requests[2].request_id, s.requests[0].request_id);
});

test('only an administrator on the current business project can enter or submit an order', async () => {
  for (const options of [{ role: 'courier' }, { original: true }]) {
    const s = setup(options);
    s.open();
    await s.submit();
    assert.equal(s.dialog.open, false);
    assert.equal(s.requests.length, 0);
  }
});

test('Douyin labels use the scheduled pickup date while Excel labels keep the paid-date batch', async () => {
  const orders = { order_time: '2026-11-11T10:00:00', pickup_tasks: { pickup_date: '2026-11-16' } };
  const s = setup({ labelItems: [
    { id: 'douyin', orders: { ...orders, source: 'douyin' }, barcode: 'pending:261116:item-1' },
    { id: 'excel', orders: { ...orders, source: 'excel' }, barcode: '261111001' },
  ] });
  const { rows } = await s.context.loadWashLabelRows();
  assert.match(s.selects[0], /pickup_tasks\s*\(pickup_date\)/);
  assert.deepEqual(Object.fromEntries(rows.map((row) => [row.id, row.batch_date])), {
    douyin: '2026-11-16',
    excel: '2026-11-11',
  });
});
