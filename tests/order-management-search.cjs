const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '../app.js'), 'utf8');
const startup = source.lastIndexOf('\nif ("serviceWorker" in navigator)');
assert.ok(startup > 0);

function setup() {
  const rows = Array.from({ length: 681 }, (_, index) => ({
    id: String(index + 1).padStart(4, '0'),
    order_no: `order-${index + 1}`,
    created_at: new Date(Date.UTC(2026, 10, 1, 0, index)).toISOString(),
    order_status: index === 0 ? '已出库' : '待取件',
    phone: index < 2 ? '13900000001' : '13900000002',
    order_items: [{ barcode: `261101${String(index + 1).padStart(3, '0')}` }],
  }));
  const requests = [];
  let failCursor;
  const client = {
    from(table) {
      assert.equal(table, 'orders');
      let cursor = '', limit, newestFirst = false;
      const query = {
        select() { return this; },
        order(key) { if (key === 'created_at') newestFirst = true; return this; },
        limit(size) { limit = size; return this; },
        gt(key, id) { assert.equal(key, 'id'); cursor = id; return this; },
        then(resolve) {
          requests.push({ cursor, limit, newestFirst });
          if (failCursor === cursor) return resolve({ error: new Error('offline') });
          const ordered = newestFirst ? rows.slice().reverse() : rows.filter((row) => row.id > cursor);
          return resolve({ data: structuredClone(ordered.slice(0, limit)) });
        },
      };
      return query;
    },
  };
  const nodes = {
    orderSearch: { value: '' },
    orderStatusFilter: { value: '' },
    orderRows: { replaceChildren() { this.innerHTML = ''; } },
    orderFilterSummary: {},
  };
  const context = vm.createContext({
    URL, URLSearchParams,
    window: { location: { search: '' } },
    document: { getElementById: (id) => nodes[id] },
    client,
  });
  vm.runInContext(source.slice(0, startup), context);
  vm.runInContext(`
    sb = client;
    currentUser = { id: 'staff' };
    renderOrderManagement = applyOrderFilters;
    renderOrderRows = (rows) => rows.map((row) => row.order_no).join(', ');
  `, context);
  return { context, nodes, requests, failAt: (cursor) => { failCursor = cursor; } };
}

test('historical order search goes beyond 500 and keeps the newest default list', async () => {
  const { context, nodes, requests } = setup();
  await context.loadOrderManagement();
  assert.deepEqual(requests, [{ cursor: '', limit: 500, newestFirst: true }]);
  assert.match(nodes.orderFilterSummary.textContent, /最近订单，共 500 单/);

  nodes.orderSearch.value = '13900000001';
  const firstSearch = context.applyOrderFilters();
  nodes.orderSearch.value = '261101001';
  await context.applyOrderFilters();
  await firstSearch;
  assert.deepEqual(requests.slice(1).map(({ cursor }) => cursor), ['', '0300', '0600']);
  assert.equal(nodes.orderRows.innerHTML, 'order-1');
  assert.match(nodes.orderFilterSummary.textContent, /全部订单，共 1 单/);

  nodes.orderSearch.value = '13900000001';
  await context.applyOrderFilters();
  assert.equal(nodes.orderRows.innerHTML, 'order-2, order-1');
  nodes.orderStatusFilter.value = '已出库';
  await context.applyOrderFilters();
  assert.equal(nodes.orderRows.innerHTML, 'order-1');
  nodes.orderSearch.value = '';
  nodes.orderStatusFilter.value = '';
  await context.applyOrderFilters();
  assert.equal(requests.length, 4);
  assert.match(nodes.orderFilterSummary.textContent, /最近订单，共 500 单/);
});

test('failed historical read shows an error and a later search retries from page one', async () => {
  const { context, nodes, failAt } = setup();
  await context.loadOrderManagement();
  failAt('0300');
  nodes.orderSearch.value = 'order-1';
  await context.applyOrderFilters();
  assert.match(nodes.orderFilterSummary.textContent, /历史订单读取失败/);
  assert.equal(nodes.orderRows.innerHTML, '');
  failAt(undefined);
  nodes.orderSearch.value = '261101002';
  await context.applyOrderFilters();
  assert.equal(nodes.orderRows.innerHTML, 'order-2');
});
