const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '../app.js'), 'utf8');
const startup = source.lastIndexOf('\nif ("serviceWorker" in navigator)');
assert.ok(startup > 0);

function setup({ rpc } = {}) {
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
    rpc,
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
    orderSearch: { value: '', addEventListener(event, listener) { this[event] = listener; } },
    orderStatusFilter: { value: '', addEventListener(event, listener) { this[event] = listener; } },
    orderOverdueFilter: { value: '', addEventListener(event, listener) { this[event] = listener; } },
    orderCustomOverdueDays: {
      value: '',
      get valueAsNumber() { return this.value ? Number(this.value) : NaN; },
      classList: { toggle() {} },
      addEventListener(event, listener) { this[event] = listener; },
      reportValidity() { return true; },
      focus() {},
    },
    orderNextPage: { addEventListener(event, listener) { this[event] = listener; } },
    orderPreviousPage: { addEventListener(event, listener) { this[event] = listener; } },
    orderPageSummary: {},
    orderPagination: { classList: { toggle() {}, add() {} } },
    orderRows: { replaceChildren() { this.innerHTML = ''; } },
    orderFilterSummary: {},
  };
  const context = vm.createContext({
    URL, URLSearchParams, clearTimeout, setTimeout,
    window: { location: { search: '' } },
    document: { getElementById: (id) => nodes[id] },
    client, useServerSearch: Boolean(rpc),
  });
  vm.runInContext(source.slice(0, startup), context);
  vm.runInContext(`
    sb = client;
    currentUser = { id: 'staff' };
    isWashLabelBusinessProject = () => useServerSearch;
    renderOrderManagement = () => {
      bindOrderManagementFilters();
      return applyOrderFilters();
    };
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

test('business search sends filters to the server and loads only the requested page', async () => {
  const calls = [];
  const { context, nodes, requests } = setup({
    rpc: async (name, params) => {
      assert.equal(name, 'search_admin_orders');
      calls.push(structuredClone(params));
      const orderNo = params.p_keyword ? 'old-match' : `page-start-${params.p_offset}`;
      return { data: { rows: [{ order_no: orderNo }], total: params.p_keyword ? 1 : 125 } };
    },
  });
  await context.loadOrderManagement();
  assert.deepEqual(requests, []);
  assert.equal(calls[0].p_offset, 0);
  assert.equal(nodes.orderPageSummary.textContent, '第 1 / 3 页');
  nodes.orderNextPage.click();
  await new Promise(setImmediate);
  assert.equal(calls[1].p_offset, 50);
  assert.equal(nodes.orderRows.innerHTML, 'page-start-50');

  nodes.orderSearch.value = '139';
  nodes.orderSearch.input();
  nodes.orderSearch.value = '13900000001';
  nodes.orderSearch.input();
  await new Promise((resolve) => setTimeout(resolve, 350));
  assert.equal(calls.length, 3);
  assert.equal(calls[2].p_keyword, '13900000001');
  assert.equal(calls[2].p_offset, 0);
  assert.equal(nodes.orderRows.innerHTML, 'old-match');
});

test('a slow earlier request cannot overwrite newer business search results', async () => {
  const responses = [];
  const { context, nodes } = setup({
    rpc: (_name, params) => new Promise((resolve) => responses.push({
      complete: () => resolve({ data: { rows: [{ order_no: params.p_keyword || 'initial' }], total: 1 } }),
    })),
  });
  const initial = context.loadOrderManagement();
  responses.shift().complete();
  await initial;
  nodes.orderSearch.value = 'old';
  const previous = context.applyOrderFilters();
  nodes.orderSearch.value = 'new';
  const latest = context.applyOrderFilters();
  responses.pop().complete();
  await latest;
  responses.pop().complete();
  await previous;
  assert.equal(nodes.orderRows.innerHTML, 'new');
});

test('changing overdue days preserves other filters and restarts at page one', async () => {
  const calls = [];
  const { context, nodes } = setup({
    rpc: async (_name, params) => {
      calls.push(structuredClone(params));
      return { data: { rows: [], total: 125 } };
    },
  });
  await context.loadOrderManagement();
  nodes.orderNextPage.click();
  await new Promise(setImmediate);
  assert.equal(calls.at(-1).p_offset, 50);

  nodes.orderStatusFilter.value = '已取件';
  nodes.orderSearch.value = '订单';
  nodes.orderOverdueFilter.value = 'overdue-day-4';
  nodes.orderOverdueFilter.change();
  await new Promise(setImmediate);
  assert.deepEqual(calls.at(-1), {
    p_keyword: '订单', p_status: '已取件', p_start_date: null, p_end_date: null,
    p_overdue: 'overdue-day-4', p_offset: 0,
  });
  assert.match(nodes.orderFilterSummary.textContent, /超时 4 天/);

  nodes.orderOverdueFilter.value = 'custom';
  nodes.orderOverdueFilter.change();
  await new Promise(setImmediate);
  assert.equal(calls.at(-1).p_overdue, 'overdue');
  nodes.orderCustomOverdueDays.value = '14';
  nodes.orderCustomOverdueDays.change();
  await new Promise(setImmediate);
  assert.equal(calls.at(-1).p_overdue, 'overdue-day-14');
  assert.match(nodes.orderFilterSummary.textContent, /超时 14 天/);
});

test('overdue filters count complete 24-hour periods and exclude closed orders', () => {
  const { context } = setup();
  const order = (hours, status = '已取件') => ({
    updated_at: new Date(Date.now() - hours * 3600000).toISOString(),
    order_status: status,
  });
  assert.equal(context.matchesOverdueDashboardFilter(order(95), 'overdue-day-3'), true);
  assert.equal(context.matchesOverdueDashboardFilter(order(97), 'overdue-day-3'), false);
  assert.equal(context.matchesOverdueDashboardFilter(order(97), 'overdue-day-4'), true);
  assert.equal(context.matchesOverdueDashboardFilter(order(97), 'overdue-3-5'), true);
  assert.equal(context.matchesOverdueDashboardFilter(order(121), 'overdue-3-5'), false);
  assert.equal(context.matchesOverdueDashboardFilter(order(193), 'overdue-8-plus'), true);
  assert.equal(context.matchesOverdueDashboardFilter(order(97, '已送达'), 'overdue-day-4'), false);
});
