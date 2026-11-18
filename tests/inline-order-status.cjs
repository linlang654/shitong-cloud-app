const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '../app.js'), 'utf8');
const startup = source.lastIndexOf('\nif ("serviceWorker" in navigator)');
assert.ok(startup > 0);

function setup() {
  const orders = ['a', 'b'].map((id) => ({
    id, order_no: id, order_status: '已取件', updated_at: '2026-10-01T00:00:00Z',
  }));
  const pending = new Map();
  const serverOrders = new Map(orders.map((order) => [order.id, { ...order }]));
  const logs = [], statsTimers = [];
  const rows = new Map(orders.map((order) => {
    const cells = {
      '[data-order-status-feedback]': { dataset: {} },
      '[data-order-overdue-age]': {},
      '[data-order-work-stage]': {},
    };
    const row = { querySelector: (selector) => cells[selector] };
    const select = { value: order.order_status, disabled: false, closest: () => row };
    return [order.id, { select, cells }];
  }));
  const table = { querySelector: (selector) => rows.get(selector.match(/"([^"]+)"/)[1])?.select };
  const client = {
    from(tableName) {
      if (tableName === 'order_items') return {
        select: () => ({ eq: async (_key, id) => ({ data: [{ id }] }) }),
        update: (payload) => ({ in: (_key, [id]) => new Promise((resolve) => {
          pending.set(id, (error) => {
            if (!error) Object.assign(serverOrders.get(id), { order_status: payload.item_status, updated_at: payload.updated_at });
            resolve({ error });
          });
        }) }),
      };
      if (tableName === 'pickup_tasks') return { update: () => ({ eq: async () => ({}) }) };
      if (tableName === 'orders') return {
        select: () => ({ eq: (_key, id) => ({ maybeSingle: async () => ({ data: serverOrders.get(id) }) }) }),
      };
      assert.equal(tableName, 'status_logs');
      return { insert: async (entry) => { logs.push(entry); return {}; } };
    },
  };
  const context = vm.createContext({
    URL, URLSearchParams, console, CSS: { escape: (value) => value },
    window: { location: { search: '' } },
    document: { getElementById: (id) => id === 'orderRows' ? table : undefined },
    setTimeout: (fn) => statsTimers.push(fn), clearTimeout: () => {},
    orders, client,
  });
  vm.runInContext(source.slice(0, startup), context);
  const run = (code) => vm.runInContext(code, context);
  run(`
    currentUser = { id: 'admin' };
    sb = client;
    orderManagementRows = orders;
    orderManagementLoad = { page: 2 };
    orderDashboardFilter = "overdue-8-plus";
    refreshAll = async () => { throw new Error("unexpected global refresh"); };
    applyOrderFilters = async () => { throw new Error("unexpected table refresh"); };
  `);
  return { context, run, orders, rows, pending, logs, statsTimers };
}

test('multiple orders save independently without reloading or losing the filtered page', async () => {
  const { context, run, rows, pending, orders, logs, statsTimers } = setup();
  const a = rows.get('a');
  const b = rows.get('b');
  const first = context.updateOrderStatus('a', '已入厂', a.select);
  assert.equal(a.select.disabled, true);
  assert.equal(b.select.disabled, false);
  const second = context.updateOrderStatus('b', '已送达', b.select);
  await new Promise(setImmediate);
  pending.get('b')();
  await second;
  assert.equal(b.select.disabled, false);
  assert.equal(a.select.disabled, true);
  assert.equal(statsTimers.length, 0);
  assert.match(b.select.innerHTML, /value="已送达" selected/);
  assert.equal(b.cells['[data-order-status-feedback]'].textContent, '已保存');

  pending.get('a')();
  await first;
  assert.equal(a.select.disabled, false);
  assert.match(a.select.innerHTML, /value="已入厂" selected/);
  assert.equal(a.cells['[data-order-overdue-age]'].textContent, '—');
  assert.match(a.cells['[data-order-work-stage]'].textContent, /工厂洗护/);
  assert.equal(orders.length, 2);
  assert.equal(run('orderManagementLoad.page'), 2);
  assert.equal(run('orderDashboardFilter'), 'overdue-8-plus');
  assert.deepEqual(logs.map((log) => log.status), ['已送达', '已入厂']);
  assert.equal(statsTimers.length, 1);
});

test('a failed write restores the confirmed status and unlocks just that row', async () => {
  const { context, rows, pending, logs } = setup();
  const a = rows.get('a');
  const failed = context.updateOrderStatus('a', '已送达', a.select);
  await new Promise(setImmediate);
  pending.get('a')(new Error('network error'));
  await failed;
  assert.match(a.select.innerHTML, /value="已取件" selected/);
  assert.equal(a.select.disabled, false);
  assert.match(a.cells['[data-order-status-feedback]'].title, /network error/);
  assert.equal(a.cells['[data-order-status-feedback]'].dataset.state, 'error');
  assert.deepEqual(logs, []);
});
