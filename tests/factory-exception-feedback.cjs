const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const source = readFileSync(join(__dirname, '../app.js'), 'utf8');
const startup = source.lastIndexOf('\nif ("serviceWorker" in navigator)');

function ticket(i, extra = {}) {
  return { id: String(i).padStart(5, '0'), order_id: `order-${i}`, barcode: `261123${String(i).padStart(3, '0')}`,
    source: '工厂端', status: '待客服', ticket_type: '材质风险', description: '有掉色风险', proposed_solution: '继续清洗',
    created_at: '2026-11-23T00:00:00Z', updated_at: new Date(1795392000000 + i * 60000).toISOString(),
    evidence_paths: ['private/proof.jpg'],
    orders: { id: `order-${i}`, order_no: `ORDER-${i}`, customer_name: `同学${i}`, phone: '13800000001' },
    order_items: { barcode: `261123${String(i).padStart(3, '0')}`, product_name: '羽绒服', spec: '厚款1件', item_status: '已入厂' }, ...extra };
}

function setup(data = [], mode = 'factory') {
  const nodes = new Map(), calls = [], images = [];
  let failure, signedCalls = 0, waitForData;
  const node = (id) => {
    if (!nodes.has(id)) nodes.set(id, { value: '', innerHTML: '', dataset: {}, disabled: false,
      classList: { toggle(_name, hidden) { this.hidden = hidden; } },
      setAttribute() {}, addEventListener() {}, showModal() { this.open = true; }, close() { this.open = false; } });
    return nodes.get(id);
  };
  const client = {
    from(table) {
      assert.equal(table, 'exception_tickets');
      const filters = [];
      let offset, head = false;
      const query = {
        select(fields, options) { head = Boolean(options?.head); calls.push({ fields, head }); return this; },
        eq(key, value) { filters.push([key, value]); return this; },
        or(value) { calls.push({ or: value }); return this; },
        order() { return this; }, limit() { return this; },
        gt(_key, value) { offset = value; return this; },
        async then(resolve, reject) {
          try {
            if (waitForData) await waitForData;
            assert.deepEqual(filters, [['source', '工厂端']]);
            const filtered = data.filter((row) => row.source === '工厂端');
            if (failure) return resolve({ error: new Error(failure) });
            if (head) return resolve({ count: filtered.filter((row) => row.customer_reply || row.resolution).length });
            resolve({ data: filtered.filter((row) => !offset || row.id > offset).slice(0, 300) });
          } catch (error) { reject(error); }
        },
      };
      return query;
    },
    storage: { from(bucket) {
      assert.equal(bucket, 'exception-evidence');
      return { async createSignedUrls(paths) { signedCalls++; return { data: paths.map(() => ({ signedUrl: 'https://example.invalid/signed-proof' })) }; } };
    } },
  };
  const context = vm.createContext({ URL, URLSearchParams, console, client, images, setTimeout, clearTimeout,
    window: { location: { search: '' } }, document: { body: { dataset: { appMode: mode } }, getElementById: node },
  });
  const run = (code) => vm.runInContext(code, context);
  run(source.slice(0, startup));
  run(`sb = client; currentUser = {id:'factory-user'}; currentProfile = {id:'factory-user',role:'factory'};
    exceptionTicketSchemaAvailable = true; showImagePreview = (key) => images.push(key);`);
  return { context, run, node, calls, images, signedCalls: () => signedCalls,
    fail: (message) => { failure = message; }, defer: (promise) => { waitForData = promise; } };
}

test('factory list reads beyond one page, keeps only factory reports, and renders 20 recent cards', async () => {
  const s = setup([...Array.from({ length: 701 }, (_, i) => ticket(i)), ticket(702, { source: '后台' })]);
  await s.context.loadFactoryExceptionTickets();
  assert.equal(s.run('factoryExceptionRows.length'), 701);
  assert.equal(s.calls.length, 3);
  assert.equal(s.run('factoryExceptionRows[0].id'), '00700');
  assert.equal((s.node('factoryExceptionList').innerHTML.match(/data-factory-exception-card=/g) || []).length, 20);
  assert.match(s.node('factoryExceptionPageInfo').textContent, /701 条 · 1 \/ 36 页/);
  assert.ok(s.calls.every((call) => !call.fields.includes('*')));
  assert.equal(s.signedCalls(), 0);
  s.context.changeFactoryExceptionPage(1);
  assert.match(s.node('factoryExceptionPageInfo').textContent, /2 \/ 36/);
});

test('feedback and status filters combine with keywords, replies are searchable, and resolution stays distinct', async () => {
  const rows = [ticket(1), ticket(2, { customer_reply: '客户同意继续清洗', status: '处理中' }),
    ticket(3, { resolution: '原样退回，请勿清洗', status: '已解决' }), ticket(4, { status: '已解决' })];
  const s = setup(rows);
  await s.context.loadFactoryExceptionTickets();
  assert.equal(s.node('factoryExceptionFeedbackCount').textContent, '已反馈 2');
  s.node('factoryExceptionStatusFilter').value = 'feedback';
  s.context.filterFactoryExceptions();
  assert.match(s.node('factoryExceptionPageInfo').textContent, /2 条/);
  s.node('factoryExceptionSearch').value = '同意继续';
  s.context.filterFactoryExceptions();
  assert.match(s.node('factoryExceptionPageInfo').textContent, /1 条/);
  assert.match(s.node('factoryExceptionList').innerHTML, /客户回复 \/ 已确认方案/);
  s.node('factoryExceptionStatusFilter').value = '已解决';
  s.node('factoryExceptionSearch').value = '';
  s.context.filterFactoryExceptions();
  assert.match(s.node('factoryExceptionList').innerHTML, /客服处理结论/);
  assert.match(s.node('factoryExceptionList').innerHTML, /原样退回，请勿清洗/);
  assert.match(s.node('factoryExceptionList').innerHTML, /暂无文字结论/);
  assert.ok(!s.node('factoryExceptionList').innerHTML.includes('data-exception-status='));
  assert.ok(!s.node('factoryExceptionList').innerHTML.includes('data-claim-exception-ticket='));
});

test('badge query reads only a count and errors do not masquerade as zero feedback', async () => {
  const s = setup([ticket(1, { customer_reply: '已确认' })]);
  await s.context.loadFactoryExceptionBadge();
  assert.equal(s.calls[0].head, true);
  assert.equal(s.calls[0].fields, 'id');
  assert.equal(s.node('factoryExceptionFeedbackCount').textContent, '已反馈 1');
  s.fail('unavailable');
  await s.context.loadFactoryExceptionBadge();
  assert.equal(s.node('factoryExceptionFeedbackCount').textContent, '待刷新');
});

test('failed refresh preserves prior records and filter, and a retry fetches new feedback', async () => {
  const data = [ticket(1, { status: '处理中' })], s = setup(data);
  await s.context.loadFactoryExceptionTickets();
  s.node('factoryExceptionStatusFilter').value = '处理中';
  s.fail('network error');
  await s.context.loadFactoryExceptionTickets();
  assert.match(s.node('factoryExceptionMessage').innerHTML, /上次读取/);
  assert.equal(s.run('factoryExceptionRows.length'), 1);
  assert.equal(s.node('refreshFactoryExceptionsBtn').disabled, false);
  s.fail(null);
  data[0].customer_reply = '客户已同意';
  await s.context.loadFactoryExceptionTickets();
  assert.equal(s.node('factoryExceptionStatusFilter').value, '处理中');
  assert.match(s.node('factoryExceptionList').innerHTML, /客户已同意/);
});

test('duplicates share one load and a signed-out account cannot receive stale results', async () => {
  const s = setup([ticket(1)]);
  let release;
  s.defer(new Promise((resolve) => { release = resolve; }));
  const first = s.context.loadFactoryExceptionTickets(), duplicate = s.context.loadFactoryExceptionTickets();
  await new Promise(setImmediate);
  assert.equal(s.calls.length, 1);
  s.run('currentUser = null; resetFactoryExceptionView()');
  release();
  await Promise.all([first, duplicate]);
  assert.equal(s.run('factoryExceptionRows.length'), 0);
  assert.equal(s.node('factoryExceptionList').innerHTML, '');
});

test('evidence loads only on demand, caches valid links, and non-factory pages do not read the list', async () => {
  const s = setup([ticket(1)]);
  await s.context.loadFactoryExceptionTickets();
  const button = {};
  await s.context.loadFactoryExceptionEvidence('00001', button);
  await s.context.loadFactoryExceptionEvidence('00001', button);
  assert.equal(s.signedCalls(), 1);
  assert.equal(s.images.length, 2);
  assert.equal(button.disabled, false);
  const other = setup([ticket(1)], 'admin');
  await other.context.loadFactoryExceptionTickets();
  await other.context.loadFactoryExceptionBadge();
  assert.equal(other.calls.length, 0);
});

test('factory cards escape report and feedback text and retain readonly order and photo actions', () => {
  const s = setup();
  const row = ticket(1, { resolution: '<img src=x onerror=alert(1)>\n原样退回' });
  row.evidencePaths = row.evidence_paths;
  const html = s.context.renderFactoryExceptionCard(row);
  assert.match(html, /&lt;img/);
  assert.ok(!html.includes('<img src=x'));
  assert.match(html, /data-detail="order-1"/);
  assert.match(html, /data-factory-exception-evidence="00001"/);
  assert.match(html, /物品状态 已入厂/);
});

test('a factory submission opens its matching feedback list without reloading admin statistics', async () => {
  const s = setup();
  const inserted = [];
  s.context.client.from = (table) => {
    if (table === 'order_items') return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 'item-1', order_id: 'order-1', barcode: '261123001' } }) }) }) };
    assert.equal(table, 'exception_tickets');
    const query = { eq() { return this; }, in() { return this; }, limit() { return this; }, maybeSingle: async () => ({ data: null }) };
    return {
      select: () => query,
      insert: (payload) => { inserted.push(payload); return { select: () => ({ single: async () => ({ data: { id: 'new-ticket' } }) }) }; },
    };
  };
  s.context.submissionViews = [];
  s.run(`
    loadStats = async () => { throw new Error('unexpected admin statistics'); };
    loadFactoryItems = insertLog = async () => {};
    openFactoryExceptionDialog = async () => { submissionViews.push([$('factoryExceptionSearch').value, $('factoryExceptionStatusFilter').value]); };
    document.querySelector = () => null;
  `);
  s.node('exceptionTicketItemId').value = 'item-1';
  s.node('exceptionTicketBarcode').value = '261123001';
  s.node('exceptionTicketDescription').value = '有掉色风险，请确认';
  s.node('exceptionTicketFiles').files = [];
  await s.context.submitExceptionTicket();
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].source, '工厂端');
  assert.equal(inserted[0].status, '待客服');
  assert.equal(inserted[0].reporter_id, 'factory-user');
  assert.equal(s.context.submissionViews[0][0], '261123001');
  assert.equal(s.context.submissionViews[0][1], '');
});
