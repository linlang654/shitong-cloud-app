const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const vendor = readFileSync(join(__dirname, '../vendor/xlsx.full.min.js'), 'utf8');
const xlsx = vm.runInNewContext(`${vendor}\nXLSX;`, { Buffer });

const source = readFileSync(join(__dirname, '../app.js'), 'utf8');
const startup = source.lastIndexOf('\nif ("serviceWorker" in navigator)');
assert.ok(startup > 0, 'the browser startup must be excluded from this test');

function item(id, date, building, barcode) {
  return {
    id,
    barcode: barcode ?? `pending:${date.slice(2).replaceAll('-', '')}:${id}`,
    source_key: `source-${id}`,
    product_name: '普通鞋',
    spec: '普通鞋1双',
    item_status: '待取件',
    orders: {
      id: `order-${id}`,
      customer_name: id,
      school: '师大',
      campus: '东区',
      building,
      phone: '13800000000',
      pay_time: `${date}T10:00:00`,
    },
  };
}

function setup(items, { date = '2026-11-10', issueError, original = false, createPrintBatch, listPrintBatches } = {}) {
  const downloads = [], calls = [], alerts = [];
  const itemWrites = [], importLogs = [];
  const importedOrders = new Map();
  const importedPickups = new Map();
  const importBatchTotals = [];
  const duplicateOrderLookups = [];
  let importBatchCount = 0;
  const phones = new Map(items.map(({ orders }, index) => [orders.id, `1390000${String(index + 1).padStart(4, '0')}`]));
  const elements = new Map();
  const node = (id) => {
    if (!elements.has(id)) elements.set(id, { dataset: {}, addEventListener(type, listener) { this[type] = listener; } });
    return elements.get(id);
  };
  node('washBatchSelect').value = date;
  const spreadsheet = {
    ...xlsx,
    writeFile(book, filename) {
      const buffer = xlsx.write(book, { type: 'buffer', bookType: 'xlsx' });
      const read = xlsx.read(buffer, { type: 'buffer' });
      const [sheet] = read.SheetNames;
      const rows = structuredClone(xlsx.utils.sheet_to_json(read.Sheets[sheet]));
      const [headers] = structuredClone(xlsx.utils.sheet_to_json(read.Sheets[sheet], { header: 1 }));
      downloads.push({ filename, sheet, rows, headers });
    },
  };
  const client = {
    from(table) {
      if (table === 'wash_label_print_batches') {
        const query = {
          select: () => query,
          order: () => query,
          range: async () => ({ data: listPrintBatches() }),
        };
        return query;
      }
      if (table === 'order_items') {
        return {
          select: () => ({
            order: () => ({ range: async (from, to) => ({ data: items.slice(from, to + 1) }) }),
            in: async (key, keys) => {
              assert.equal(key, 'source_key');
              if (!original) throw new Error('Business imports must not send source keys in a GET URL');
              return { data: items.filter((row) => keys.includes(row.source_key)) };
            },
          }),
          upsert: (payloads, options) => ({ select: async () => {
            itemWrites.push({ ...options, size: payloads.length });
            const data = [];
            for (const payload of payloads) {
              const existing = items.find((row) => row.source_key === payload.source_key);
              if (existing && options.ignoreDuplicates) continue;
              const row = { ...payload, id: existing?.id || `item-${items.length + 1}`, orders: importedOrders.get(payload.order_id) };
              if (existing) Object.assign(existing, row);
              else items.push(row);
              data.push(row);
            }
            return { data };
          } }),
        };
      }
      if (table === 'import_batches') {
        return {
          insert: () => ({ select: () => ({ single: async () => ({ data: { id: `import-${++importBatchCount}` } }) }) }),
          update: (payload) => ({ eq: async (_column, id) => { importBatchTotals.push({ id, ...payload }); return {}; } }),
        };
      }
      if (table === 'pickup_tasks') return {
        upsert: (payloads, options) => ({ select: async () => {
          const data = [];
          for (const payload of payloads) {
            if (options.ignoreDuplicates && importedPickups.has(payload.order_id)) continue;
            importedPickups.set(payload.order_id, { ...payload });
            data.push(importedPickups.get(payload.order_id));
          }
          return { data };
        } }),
      };
      if (table === 'status_logs') return { insert: async (rows) => { importLogs.push(...rows); return {}; } };
      assert.equal(table, 'orders');
      return {
        upsert: (payloads, options) => ({ select: async () => {
          const data = [];
          for (const payload of payloads) {
            const id = `order-${payload.order_no}`;
            const existing = importedOrders.get(id);
            if (existing && options.ignoreDuplicates) continue;
            const order = Object.assign(existing || {}, payload, { id });
            importedOrders.set(id, order);
            data.push(order);
          }
          return { data };
        } }),
        select: () => ({
          in: async (key, ids) => {
            if (key === 'order_no') {
              duplicateOrderLookups.push(ids.length);
              return { data: ids.map((id) => importedOrders.get(`order-${id}`)).filter(Boolean) };
            }
            assert.equal(key, 'id');
            return { data: ids.map((id) => ({ id, phone: phones.get(id) })) };
          },
        }),
      };
    },
    async rpc(name, input) {
      if (name === 'create_wash_label_print_batch') return createPrintBatch(structuredClone(input));
      assert.equal(name, 'issue_wash_label_barcodes');
      const { p_prefixes: prefixes, p_ordered_item_ids: ids, p_route_snapshots: snapshots } = structuredClone(input);
      calls.push({ prefixes, ids, snapshots });
      if (issueError) return { error: issueError };
      const counters = new Map(prefixes.map((prefix) => [prefix, 0]));
      for (const { barcode } of items) {
        const prefix = barcode.slice(0, 6);
        if (counters.has(prefix)) counters.set(prefix, Math.max(counters.get(prefix), Number(barcode.slice(6))));
      }
      const data = ids.map((id) => {
        const row = items.find((entry) => entry.id === id);
        const [, prefix] = row.barcode.split(':');
        assert.ok(counters.has(prefix));
        assert.deepEqual(snapshots[id], [row.orders.school, row.orders.campus, row.orders.building]);
        const number = counters.get(prefix) + 1;
        counters.set(prefix, number);
        row.barcode = `${prefix}${String(number).padStart(3, '0')}`;
        return { item_id: id, barcode: row.barcode };
      });
      return { data };
    },
  };
  const context = vm.createContext({
    URLSearchParams,
    URL,
    window: { location: { search: original ? '?env=original' : '' }, XLSX: spreadsheet },
    document: { getElementById: node, querySelector: () => null, querySelectorAll: () => [] },
    localStorage: { getItem: () => null },
    crypto: { randomUUID },
    XLSX: spreadsheet,
    alert: (message) => alerts.push(message),
    client,
  });
  const run = (code) => vm.runInContext(code, context);
  run(source.slice(0, startup));
  run('sb = client; currentUser = { id: "staff" }; currentProfile = { role: "admin" };');
  return {
    context, run, calls, downloads, alerts, phones, node, itemWrites, importLogs,
    importedOrders, importedPickups, importBatchTotals, duplicateOrderLookups,
  };
}

function labelColumns({ rows }) {
  return rows.map((row) => [row.序号, row.条形编码, row.姓名]);
}

function importFile(orders) {
  const rows = orders.map(([name, building, spec = '1双']) => ({
    订单号: name,
    状态: '已支付',
    所属商家: '事事超级洗护',
    商品名称: '普通鞋',
    规格: spec,
    姓名: name,
    电话: '13800000000',
    表单信息: `师大东区：${building}`,
    付款时间: '2026-11-10 10:00:00',
  }));
  const book = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(book, xlsx.utils.json_to_sheet(rows), '订单');
  const buffer = xlsx.write(book, { type: 'buffer', bookType: 'xlsx' });
  return { name: '订单.xlsx', arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) };
}

test('two imports defer numbering and a concurrent duplicate does not replace a staged item', async () => {
  const items = [];
  const s = setup(items);
  s.run(`
    detectSettlementSchemaAvailability = async () => false;
    loadRecognitionRules = async () => {};
    refreshAll = async () => {};
  `);

  const ten = ['ten', '10栋'];
  await s.context.handleImport({ target: { files: [importFile([ten])] } });
  assert.match(s.node('adminImportStatus').innerHTML, /新增 1 件物品/);
  const firstBarcode = items[0].barcode;
  await s.context.handleImport({ target: { files: [importFile([ten, ['two', '2栋']])] } });
  assert.match(s.node('adminImportStatus').innerHTML, /跳过重复 1 件/);
  assert.equal(items.length, 2);
  assert.equal(items[0].barcode, firstBarcode);
  assert.ok(items.every((row) => /^pending:261110:/.test(row.barcode)));
  assert.deepEqual(s.calls.map((call) => call.ids), [[], []]);
  assert.deepEqual(s.itemWrites, [1, 2].map((size) => ({ onConflict: 'source_key', ignoreDuplicates: true, size })));
  assert.deepEqual(s.importLogs.map((log) => log.barcode), [null, null]);

  await s.context.exportWashLabels();
  assert.deepEqual(s.alerts, []);
  assert.deepEqual(labelColumns(s.downloads[0]), [[1, '261110001', 'two'], [2, '261110002', 'ten']]);
});

test('a large Excel import writes bounded batches and reimport preserves issued labels', async () => {
  const items = [];
  const s = setup(items);
  s.run(`
    detectSettlementSchemaAvailability = async () => false;
    loadRecognitionRules = async () => {};
    refreshAll = async () => {};
  `);
  const file = importFile(Array.from({ length: 130 }, (_, index) => [
    `ORDER-LONG-SOURCE-KEY-${String(index + 1).padStart(24, '0')}`, `${index + 1}栋`, '2双',
  ]));
  const importWorkbook = () => s.context.handleImport({ target: { files: [file] } });
  await importWorkbook();
  assert.match(s.node('adminImportStatus').innerHTML, /130 个订单，新增 260 件物品，跳过重复 0 件/);
  assert.equal(items.length, 260);
  assert.equal(s.importLogs.length, 260);
  assert.ok(items.every((row) => /^pending:261110:/.test(row.barcode)));

  await s.context.exportWashLabels();
  assert.deepEqual(s.alerts, []);
  const issued = { id: items[0].id, barcode: items[0].barcode };
  assert.match(issued.barcode, /^261110\d{3}$/);

  await importWorkbook();
  assert.match(s.node('adminImportStatus').innerHTML, /130 个订单，新增 0 件物品，跳过重复 260 件/);
  assert.deepEqual(s.duplicateOrderLookups, [30, 30, 30, 30, 10]);
  assert.equal(s.importBatchTotals[1].imported_orders, 0);
  assert.deepEqual(s.itemWrites, [200, 60, 200, 60].map((size) => ({
    onConflict: 'source_key', ignoreDuplicates: true, size,
  })));
  assert.equal(items.length, 260);
  assert.equal(s.importLogs.length, 260);
  assert.equal(items.find((row) => row.id === issued.id).barcode, issued.barcode);
});

test('a repeated import preserves corrected order data and pickup progress while importing new rows', async () => {
  const items = [];
  const s = setup(items);
  s.run(`
    detectSettlementSchemaAvailability = async () => false;
    loadRecognitionRules = async () => {};
    refreshAll = async () => {};
  `);
  const importOrders = (orders) => s.context.handleImport({ target: { files: [importFile(orders)] } });
  await importOrders([['corrected', '10栋']]);
  const orderId = 'order-corrected';
  Object.assign(s.importedOrders.get(orderId), {
    school: '理工', campus: '北区', building: '22栋', exception_note: '',
    phone: '13900008888', order_status: '已取件',
  });
  Object.assign(s.importedPickups.get(orderId), { status: '已取件', pickup_date: '2026-11-11' });
  const savedOrder = structuredClone(s.importedOrders.get(orderId));
  const savedPickup = structuredClone(s.importedPickups.get(orderId));

  await importOrders([['corrected', '10栋'], ['new', '5栋']]);
  assert.deepEqual(s.importedOrders.get(orderId), savedOrder);
  assert.deepEqual(s.importedPickups.get(orderId), savedPickup);
  assert.equal(s.importedOrders.get('order-new').import_batch_id, 'import-2');
  assert.equal(s.importedPickups.get('order-new').status, '待取件');
  assert.equal(s.importBatchTotals[1].imported_orders, 1);
  assert.equal(items.length, 2);
  assert.match(s.node('adminImportStatus').innerHTML, /新增订单 1 单，保留已有订单 1 单/);

  // A retry after the task write failed can finish the import without touching the order.
  s.importedPickups.delete(orderId);
  await importOrders([['corrected', '10栋']]);
  assert.deepEqual(s.importedOrders.get(orderId), savedOrder);
  assert.equal(s.importedPickups.get(orderId).status, '已取件');
  assert.equal(s.importedPickups.get(orderId).pickup_date, '2026-11-10');
});

test('first full daily export assigns actual barcodes in natural building order', async () => {
  const day = '2026-11-10';
  const s = setup([item('ten', day, '10栋'), item('three', day, '3栋'), item('two', day, '2栋')]);
  await s.context.exportWashLabels();
  assert.deepEqual(s.alerts, []);
  assert.deepEqual(s.calls.map(({ prefixes, ids }) => ({ prefixes, ids })), [
    { prefixes: ['261110'], ids: ['two', 'three', 'ten'] },
  ]);
  assert.equal(s.downloads[0].sheet, '2026-11-10批次');
  assert.deepEqual(s.downloads[0].headers, [
    '序号', '批次', '条形编码', '所属商家', '姓名', '电话', '校区', '物品',
    '结算品类', '结算确认状态', '实付款', '下单时间', '售后电话',
  ]);
  assert.deepEqual(labelColumns(s.downloads[0]), [
    [1, '261110001', 'two'], [2, '261110002', 'three'], [3, '261110003', 'ten'],
  ]);
  await s.context.exportWashLabels();
  assert.equal(s.calls.length, 1);
  assert.deepEqual(s.downloads[1].rows, s.downloads[0].rows);
});

test('selected export allocates the entire date and writes only selected rows with current phones', async () => {
  const day = '2026-11-10';
  const s = setup([item('ten', day, '10栋'), item('three', day, '3栋'), item('two', day, '2栋')]);
  await s.run('(async () => { labelVisibleRows = labelReviewRows = (await loadWashLabelRows()).rows; })()');
  s.run('labelSelectedItems.add("ten"); labelSelectedItems.add("two");');
  await s.context.exportSelectedWashLabels();
  assert.deepEqual(s.calls[0].ids, ['two', 'three', 'ten']);
  assert.equal(s.downloads[0].sheet, '所选水洗标');
  assert.deepEqual(labelColumns(s.downloads[0]), [[1, '261110001', 'two'], [2, '261110003', 'ten']]);
  assert.deepEqual(s.downloads[0].rows.map((row) => row.电话), [s.phones.get('order-two'), s.phones.get('order-ten')]);
  await s.context.exportSelectedWashLabels();
  assert.equal(s.calls.length, 1);
  assert.deepEqual(s.downloads[1].rows, s.downloads[0].rows);
});

test('merged export sorts buildings while numbering each date separately and preserving issued barcodes', async () => {
  const s = setup([
    item('day10-ten', '2026-11-10', '10栋'),
    item('day10-three', '2026-11-10', '3栋'),
    item('day09-five', '2026-11-09', '5栋'),
    item('day09-two', '2026-11-09', '2栋'),
    item('old', '2026-11-09', '7栋', '261109007'),
  ]);
  await s.run('(async () => { mergeWashLabelRows = labelReviewRows = (await loadWashLabelRows()).rows; })()');
  await s.context.exportMergedWashLabels();
  assert.deepEqual(s.calls[0].prefixes, ['261109', '261110']);
  assert.deepEqual(s.calls[0].ids, ['day09-two', 'day10-three', 'day09-five', 'day10-ten']);
  assert.equal(s.downloads[0].sheet, '合并批次');
  assert.deepEqual(labelColumns(s.downloads[0]), [
    [1, '261109008', 'day09-two'], [2, '261110001', 'day10-three'], [3, '261109009', 'day09-five'],
    [4, '261109007', 'old'], [5, '261110002', 'day10-ten'],
  ]);
  assert.equal(s.downloads[0].rows[3].电话, s.phones.get('order-old'));
  await s.context.exportMergedWashLabels();
  assert.equal(s.calls.length, 1);
  assert.deepEqual(s.downloads[1].rows, s.downloads[0].rows);
});

test('failed issuance never downloads provisional barcodes', async () => {
  const issueError = { code: '40001', message: '待分配水洗标已变化，请刷新后重新导出。' };
  const s = setup([item('two', '2026-11-10', '2栋')], { issueError });
  await s.context.exportWashLabels();
  assert.equal(s.calls.length, 1);
  assert.deepEqual(s.downloads, []);
  assert.match(s.alerts[0], /待分配水洗标已变化/);
  assert.equal(s.node('exportWashLabelsBtn').disabled, false);
});

test('the original project cannot issue new barcodes', async () => {
  const s = setup([item('two', '2026-11-10', '2栋')], { original: true });
  await s.context.exportWashLabels();
  assert.equal(s.calls.length, 0);
  assert.deepEqual(s.downloads, []);
  assert.match(s.alerts[0], /请切换到当前业务库/);
});

test('two print batches keep independent membership, continue barcodes, and reprint with current phones', async () => {
  const day = '2026-11-10';
  const items = [item('ten', day, '10栋'), item('three', day, '3栋'), item('two', day, '2栋')];
  const requests = [];
  const batches = new Map();
  let lastBarcode = 0;
  const s = setup(items, {
    listPrintBatches: () => [...batches.values()].reverse(),
    createPrintBatch(input) {
      requests.push(input);
      const { p_batch_id: id, p_ordered_item_ids: ids } = input;
      if (batches.has(id)) return { data: batches.get(id) };
      const labels = ids.map((itemId, index) => {
        const row = items.find((entry) => entry.id === itemId);
        row.barcode = `261110${String(++lastBarcode).padStart(3, '0')}`;
        row.wash_label_print_batch_id = id;
        row.wash_label_print_position = index + 1;
        return { item_id: itemId, barcode: row.barcode };
      });
      const batch = { id, print_date: day, batch_number: batches.size + 1, labels };
      batches.set(id, batch);
      if (requests.length === 1) return { error: { message: 'response lost after commit' } };
      return { data: batch };
    },
  });
  s.run(`
    detectSettlementSchemaAvailability = async () => false;
    detectWashAdjustmentSchemaAvailability = async () => false;
  `);
  await s.run('loadLabels()');
  assert.match(s.node('adminLabels').innerHTML, /新建打印批次并导出/);
  assert.equal(s.node('createWashPrintBatchBtn').disabled, true);
  s.run('labelSelectedItems.add("ten"); labelSelectedItems.add("two");');
  await s.node('createWashPrintBatchBtn').click();
  assert.deepEqual(s.downloads, []);
  assert.equal(items.find(({ id }) => id === 'three').barcode.startsWith('pending:'), true);
  await s.node('createWashPrintBatchBtn').click();
  assert.equal(requests[0].p_batch_id, requests[1].p_batch_id);
  assert.deepEqual(requests[1].p_ordered_item_ids, ['two', 'ten']);
  assert.deepEqual(labelColumns(s.downloads[0]), [[1, '261110001', 'two'], [2, '261110002', 'ten']]);

  s.run('labelSelectedItems.add("three")');
  await s.node('createWashPrintBatchBtn').click();
  assert.equal(batches.size, 2);
  assert.deepEqual(labelColumns(s.downloads[1]), [[3, '261110003', 'three']]);
  assert.equal(s.downloads[1].rows[0].批次, '2026-11-10 第 2 批');

  items.find(({ id }) => id === 'ten').orders.building = '1栋';
  s.phones.set('order-ten', '15500001111');
  assert.match(s.node('adminLabels').innerHTML, /第 1 批 · 2 个/);
  assert.match(s.node('adminLabels').innerHTML, /第 2 批 · 1 个/);
  s.node('washPrintBatchSelect').value = requests[0].p_batch_id;
  s.node('washPrintBatchSelect').change();
  await s.node('reprintWashBatchBtn').click();
  assert.deepEqual(labelColumns(s.downloads[2]), labelColumns(s.downloads[0]));
  assert.equal(s.downloads[2].rows[1].电话, '15500001111');
  assert.equal(requests.length, 3);
});
