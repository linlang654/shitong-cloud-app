const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '../app.js'), 'utf8');
const startup = source.lastIndexOf('\nif ("serviceWorker" in navigator)');

function setup(mode = 'admin') {
  const nodes = new Map(), fields = new Map(), timers = new Map(), calls = [];
  let timerId = 0;
  const node = (id) => {
    if (!nodes.has(id)) nodes.set(id, {
      value: '', dataset: {}, innerHTML: '',
      focus() {},
      addEventListener(event, fn) { this[event] = fn; },
      setAttribute() {},
    });
    return nodes.get(id);
  };
  const client = {};
  node('washBatchSelect').value = '2026-11-10';
  const context = vm.createContext({
    URL, URLSearchParams, console, client, calls,
    window: { location: { search: '' } },
    document: {
      body: { dataset: { appMode: mode } }, getElementById: node,
      querySelector: (selector) => fields.get(selector) || null,
      querySelectorAll: (selector) => selector === '#labelRows [data-settlement-select]'
        ? [...fields].filter(([key]) => key.startsWith('[data-settlement-select=')).map(([, value]) => value) : [],
    },
    localStorage: { getItem: () => null },
    setTimeout: (fn) => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: (id) => timers.delete(id),
  });
  const run = (code) => vm.runInContext(code, context);
  run(source.slice(0, startup));
  run(`sb = client; currentUser = { id: 'staff' }; currentProfile = { role: 'admin' };
    settlementSchemaAvailable = true; washAdjustmentSchemaAvailable = true;`);
  return { context, run, node, fields, calls, timers };
}

function rows(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`, order_id: `order-${i}`, 条形编码: `261110${String(i + 1).padStart(5, '0')}`,
    姓名: `客户${i}`, 电话: `138${String(i).padStart(8, '0')}`, 订单号: `order-${i}`,
    校区: '师大东区', 楼栋: `${i % 20 + 1}栋`, 物品: '普通鞋1双',
    item_status: '已取件', batch_date: i % 2 ? '2026-11-10' : '2026-11-09',
    settlement_selected_key: 'regular_shoe', settlement_suggestion: 'regular_shoe',
    route: { school: '师大', campus: '东区', building: `${i % 20 + 1}栋` },
  }));
}

test('historical label search keeps all results while rendering only 50 rows per page', () => {
  const s = setup();
  s.context.fixture = rows(5000);
  s.run('renderLabels(fixture, { batches: [] })');
  assert.equal(s.run('labelVisibleRows.length'), 2500);
  assert.equal((s.node('labelRows').innerHTML.match(/<tr /g) || []).length, 50);
  s.node('labelSearch').value = '师大';
  s.run('applyLabelFilters(); selectVisibleLabels(); changeLabelPage(1)');
  assert.equal(s.run('labelVisibleRows.length'), 5000);
  assert.equal(s.run('labelSelectedItems.size'), 5000);
  assert.match(s.node('labelPageInfo').textContent, /第 2 \/ 100 页/);
  assert.match(s.node('labelRows').innerHTML, /data-label-row="item-50" class="selected"/);
  s.node('labelSearch').value = '客户4999';
  s.run('applyLabelFilters()');
  assert.equal(s.run('labelVisibleRows[0].id'), 'item-4999');
  assert.equal(s.run('labelPage'), 0);
  assert.equal(s.run('labelSelectedItems.size'), 0);
});

test('rapid typing searches once, supports updated phones and barcodes, and ignores a replaced page', () => {
  const s = setup();
  s.context.fixture = rows(100);
  s.run('renderLabels(fixture, { batches: [] })');
  const input = s.node('labelSearch');
  for (const value of ['客', '客户', '客户99']) {
    input.value = value;
    input.input({ target: input });
  }
  assert.equal(s.timers.size, 1);
  [...s.timers.values()][0]();
  assert.equal(s.run('labelVisibleRows[0].id'), 'item-99');
  s.run('labelReviewRows[99].电话 = "15500009999"; labelReviewRows[99].条形编码 = "261120999"');
  input.value = '15500009999';
  s.run('applyLabelFilters()');
  assert.equal(s.run('labelVisibleRows[0].id'), 'item-99');
  input.value = '261120999';
  s.run('applyLabelFilters()');
  assert.equal(s.run('labelVisibleRows.length'), 1);
  input.input({ target: input });
  const callback = [...s.timers.values()].at(-1);
  s.run('currentUser = null');
  const before = s.node('labelRows').innerHTML;
  callback();
  assert.equal(s.node('labelRows').innerHTML, before);
});

test('bulk category edits and saved values include selected items on other pages', () => {
  const s = setup();
  s.context.fixture = rows(120);
  s.run('renderLabels(fixture, { batches: [] })');
  s.node('labelSearch').value = '师大';
  s.run('applyLabelFilters(); selectVisibleLabels()');
  s.node('labelBulkCategory').value = 'heavy_outerwear';
  s.run('applyCategoryToSelectedLabels(); changeLabelPage(1)');
  assert.equal(s.run('labelSelectedItems.size'), 120);
  assert.equal(s.run('settlementValuesFromRow("item-119").categoryKey'), 'heavy_outerwear');
  assert.match(s.node('labelRows').innerHTML, /value="heavy_outerwear" selected/);
  const select = { value: 'other', dataset: { settlementSelect: 'item-50' } };
  s.fields.set('[data-settlement-select="item-50"]', select);
  s.fields.set('[data-settlement-other-name="item-50"]', { value: '羊绒围巾' });
  s.fields.set('[data-settlement-other-unit="item-50"]', { value: '件' });
  s.fields.set('[data-settlement-other-cost="item-50"]', { value: '12.5' });
  s.run('captureLabelDrafts()');
  s.fields.clear();
  assert.equal(s.run('settlementValuesFromRow("item-50").details.otherName'), '羊绒围巾');
  assert.equal(s.run('settlementValuesFromRow("item-50").details.cost'), '12.5');
  s.run('renderLabelPage(false)');
  assert.match(s.node('labelRows').innerHTML, /value="羊绒围巾"/);
});

test('switching the business batch reuses loaded rows and preserves draft edits', () => {
  const s = setup();
  s.context.fixture = rows(120);
  s.run('renderLabels(fixture, { batches: [] }); labelSettlementDrafts.set("item-0", {itemId:"item-0", categoryKey:"heavy_outerwear", details:{}})');
  s.node('washBatchSelect').value = '2026-11-09';
  s.node('washBatchSelect').change();
  assert.equal(s.run('labelVisibleRows.length'), 60);
  assert.equal(s.run('labelVisibleRows[0].id'), 'item-0');
  assert.equal(s.run('settlementValuesFromRow("item-0").categoryKey'), 'heavy_outerwear');
});

test('refresh loads only the current role and deduplicates concurrent refresh clicks', async () => {
  for (const [mode, expected] of [
    ['admin', ['stats', 'admin']], ['courier', ['courier']], ['factory', ['factory', 'scans']],
  ]) {
    const s = setup(mode);
    s.run(`
      canUseCurrentPage = () => true;
      loadRecognitionRules = async () => {};
      detectSettlementSchemaAvailability = detectWashAdjustmentSchemaAvailability =
        detectExceptionTicketSchemaAvailability = detectRetryPickupSchemaAvailability = loadSettlementCatalog = async () => {};
      loadStats = async () => calls.push('stats'); loadAdmin = async () => calls.push('admin');
      loadCourierTasks = async () => calls.push('courier'); loadFactoryItems = async () => calls.push('factory');
      loadFactoryDailyScans = async () => calls.push('scans');
    `);
    await Promise.all([s.context.refreshAll({ reusePending: true }), s.context.refreshAll({ reusePending: true })]);
    assert.deepEqual(s.calls, expected);
    assert.equal(s.run('refreshLoad'), null);
  }
});

test('a refresh after a write waits for an older refresh and reads again', async () => {
  const s = setup();
  let release;
  s.context.firstRead = new Promise((resolve) => { release = resolve; });
  s.run(`
    canUseCurrentPage = () => true; loadRecognitionRules = async () => {};
    detectSettlementSchemaAvailability = detectWashAdjustmentSchemaAvailability =
      detectExceptionTicketSchemaAvailability = detectRetryPickupSchemaAvailability = loadSettlementCatalog = async () => {};
    loadStats = async () => {};
    loadAdmin = async () => { calls.push('read'); if(calls.length === 1) await firstRead; };
  `);
  const a = s.context.refreshAll({ reusePending: true });
  await new Promise(setImmediate);
  const afterWrite = s.context.refreshAll();
  release();
  await Promise.all([a, afterWrite]);
  assert.deepEqual(s.calls, ['read', 'read']);
});

test('label loads deduplicate requests and discard results after logout', async () => {
  const s = setup();
  let finish;
  s.context.dataReady = new Promise((resolve) => { finish = resolve; });
  s.run(`
    detectSettlementSchemaAvailability = detectWashAdjustmentSchemaAvailability = async () => {};
    loadWashLabelRows = async () => { calls.push('labels'); return dataReady; };
    loadWashPrintBatches = async () => ({ batches: [] });
  `);
  const a = s.context.loadLabels(), b = s.context.loadLabels();
  await new Promise(setImmediate);
  assert.deepEqual(s.calls, ['labels']);
  s.run('currentUser = null');
  finish({ rows: rows(10) });
  await Promise.all([a, b]);
  assert.equal(s.node('adminLabels').innerHTML, '');
  assert.equal(s.run('labelLoad'), null);
});

test('history loader fetches lightweight fields with at most two concurrent pages and no truncation', async () => {
  for (const withCount of [true, false]) {
    const s = setup();
    let inFlight = 0, peak = 0;
    const data = rows(3005).map((row) => ({ id: row.id, barcode: row.条形编码, product_name: '普通鞋', orders: { id: row.order_id } }));
    s.context.client.from = (table) => {
      assert.equal(table, 'order_items');
      let options;
      const query = {
        select(columns, suppliedOptions) {
          options = suppliedOptions;
          assert.ok(!columns.includes('*'));
          assert.ok(!columns.includes('image_links'));
          assert.ok(!columns.includes('raw_data'));
          return this;
        },
        order() { return this; },
        async range(from, to) {
          s.calls.push(from);
          peak = Math.max(peak, ++inFlight);
          await new Promise(setImmediate);
          inFlight--;
          return { data: data.slice(from, to + 1), count: withCount && options?.count ? data.length : null };
        },
      };
      return query;
    };
    const result = await s.context.loadWashLabelRows();
    assert.equal(result.error, null);
    assert.equal(result.rows.length, 3005);
    assert.equal(new Set(result.rows.map((row) => row.id)).size, 3005);
    assert.deepEqual(s.calls, [0, 1000, 2000, 3000]);
    assert.equal(peak, withCount ? 2 : 1);
  }
});

test('label reload after a save cannot reuse a read started before that save', async () => {
  const s = setup();
  let release;
  s.context.firstRead = new Promise((resolve) => { release = resolve; });
  s.context.fixture = rows(2);
  s.run(`
    detectSettlementSchemaAvailability = detectWashAdjustmentSchemaAvailability = async () => {};
    loadWashPrintBatches = async () => ({ batches: [] });
    loadWashLabelRows = async () => {
      calls.push('labels');
      if (calls.length === 1) return firstRead;
      return { rows: fixture };
    };
  `);
  const first = s.context.loadLabels();
  await new Promise(setImmediate);
  const fresh = s.context.loadLabels({ fresh: true });
  release({ rows: rows(1) });
  await Promise.all([first, fresh]);
  assert.deepEqual(s.calls, ['labels', 'labels']);
  assert.equal(s.run('labelReviewRows.length'), 2);
});
