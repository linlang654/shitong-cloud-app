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
      let offset, head = false, orFilter = '';
      const query = {
        select(fields, options) { head = Boolean(options?.head); calls.push({ fields, head }); return this; },
        eq(key, value) { filters.push([key, value]); return this; },
        or(value) { orFilter = value; calls.push({ or: value }); return this; },
        in(key, values) { filters.push([key, values]); return this; },
        order() { return this; }, limit() { return this; },
        gt(_key, value) { offset = value; return this; },
        async then(resolve, reject) {
          try {
            if (waitForData) await waitForData;
            if (!head) assert.equal(orFilter, 'source.eq.工厂端,target_team.eq.factory');
            const filtered = data.filter((row) => (head || row.source === '工厂端' || row.target_team === 'factory')
              && filters.every(([key,value]) => Array.isArray(value) ? value.includes(row[key]) : (row[key] ?? (key === 'target_team' ? 'customer_service' : undefined)) === value));
            if (failure) return resolve({ error: new Error(failure) });
            if (head) return resolve({ count: filters.some(([key,value]) => key === 'target_team' && value === 'factory') ? filtered.length : filtered.filter((row) => row.customer_reply || row.resolution).length });
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
  assert.equal(s.calls.filter((call) => call.fields).length, 3);
  assert.equal(s.run('factoryExceptionRows[0].id'), '00700');
  assert.equal((s.node('factoryExceptionList').innerHTML.match(/data-factory-exception-card=/g) || []).length, 20);
  assert.match(s.node('factoryExceptionPageInfo').textContent, /701 条 · 1 \/ 36 页/);
  assert.ok(s.calls.filter((call) => call.fields).every((call) => !call.fields.includes('*')));
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
  assert.equal(s.calls.filter((call) => call.fields).length, 1);
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

test('a multi-item report trusts the selected label, even if the duplicate form fields still hold the first item', async () => {
  const s = setup();
  const lookedUp = [], inserted = [];
  const items = [
    { id: 'item-a', order_id: 'same-order', barcode: '261128306' },
    { id: 'item-b', order_id: 'same-order', barcode: '261128307' },
  ];
  s.context.items = items;
  s.context.client.from = (table) => {
    if (table === 'order_items') {
      return { select: () => ({ eq(_column, id) {
        lookedUp.push(id);
        return { maybeSingle: async () => ({ data: items.find((item) => item.id === id) }) };
      } }) };
    }
    assert.equal(table, 'exception_tickets');
    const query = { eq() { return this; }, in() { return this; }, limit() { return this; }, maybeSingle: async () => ({ data: null }) };
    return { select: () => query, insert(payload) {
      inserted.push(payload);
      return { select: () => ({ single: async () => ({ data: { id: 'new-ticket' } }) }) };
    } };
  };
  s.run(`
    exceptionTicketContext = { type: 'factory-order-search', orderId: 'same-order', items: items.map(item => ({...item})) };
    loadFactoryItems = insertLog = openFactoryExceptionDialog = async () => {};
    document.querySelector = () => null;
  `);
  s.node('exceptionTicketItemId').value = items[0].id;
  s.node('exceptionTicketBarcode').value = items[0].barcode;
  s.node('exceptionTicketDescription').value = '此件存在掉色风险';
  await s.context.submitExceptionTicket();
  assert.deepEqual(lookedUp, []);
  assert.match(s.node('exceptionTicketMessage').innerHTML, /请先选择/);
  s.node('exceptionTicketItemSelect').value = items[1].id;
  items[1].barcode = '261128399';
  await s.context.submitExceptionTicket();
  assert.equal(inserted.length, 0);
  assert.match(s.node('exceptionTicketMessage').innerHTML, /已变更/);
  items[1].barcode = '261128307';
  await s.context.submitExceptionTicket();
  assert.deepEqual(lookedUp, ['item-b', 'item-b']);
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].item_id, 'item-b');
  assert.equal(inserted[0].barcode, '261128307');
  assert.equal(s.run('factoryExceptionSubmission.id'), 'new-ticket');
});

test('a label suffix matches the linked item and excludes another ticket that only mentions that suffix', async () => {
  const s = setup([
    ticket(1, { barcode: '2611283006', description: '这件和 3007、3008 在同一单', order_items: { barcode: '2611283006' } }),
    ticket(2, { barcode: '2611283007', order_items: { barcode: '2611283007' } }),
  ]);
  await s.context.loadFactoryExceptionTickets();
  s.node('factoryExceptionSearch').value = '3007';
  s.context.filterFactoryExceptions();
  assert.match(s.node('factoryExceptionList').innerHTML, /2611283007/);
  assert.doesNotMatch(s.node('factoryExceptionList').innerHTML, /2611283006/);
  s.node('factoryExceptionSearch').value = '3008';
  s.context.filterFactoryExceptions();
  assert.match(s.node('factoryExceptionPageInfo').textContent, /0 条/);
});

test('factory inbox includes backend work, excludes unrelated reports, prioritizes work and combines route with date filters', async () => {
  const rows = [ticket(1, { resolution: '客服已回复' }),
    ticket(2, { source: '后台', target_team: 'factory', factory_progress: 'pending', status: '处理中' }),
    ticket(3, { source: '后台', target_team: 'factory', factory_progress: 'replied', factory_reply: '已核查齐全', status: '处理中' }),
    ticket(4, { source: '后台', target_team: 'customer_service' })];
  const s = setup(rows);
  await s.context.loadFactoryExceptionTickets();
  assert.equal(s.run('factoryExceptionRows.length'), 3);
  assert.equal(s.run('factoryExceptionRows[0].id'), '00002');
  assert.equal(s.node('factoryExceptionWorkCount').textContent, '待处理 1');
  assert.equal(s.node('factoryExceptionFeedbackCount').textContent, '已反馈 1');
  s.node('factoryExceptionQueueFilter').value = 'received';
  s.node('factoryExceptionStatusFilter').value = 'work_replied';
  s.node('factoryExceptionSearch').value = '核查齐全';
  s.node('factoryExceptionDateStart').value = s.node('factoryExceptionDateEnd').value = '2026-11-23';
  s.context.filterFactoryExceptions();
  assert.match(s.node('factoryExceptionPageInfo').textContent, /1 条/);
  assert.match(s.node('factoryExceptionList').innerHTML, /工厂处理结果/);
  assert.ok(!s.node('factoryExceptionList').innerHTML.includes('data-factory-work='));
  s.node('factoryExceptionStatusFilter').value = 'work_pending';
  s.node('factoryExceptionSearch').value = '';
  s.context.filterFactoryExceptions();
  assert.match(s.node('factoryExceptionList').innerHTML, /填写处理结果/);
  assert.match(s.node('factoryExceptionList').innerHTML, /data-work-action="start"/);
});

test('factory work shows safe replies and keeps another handler and closed tickets readonly', () => {
  const s = setup();
  const row = ticket(1, { target_team: 'factory', factory_progress: 'processing', status: '处理中',
    factory_handler_id: 'other-factory', factory_reply: '<img src=x onerror=alert(1)>' });
  const html = s.context.renderFactoryExceptionCard(row);
  assert.match(html, /其他工厂同事正在处理/);
  assert.match(html, /&lt;img/);
  assert.ok(!html.includes('data-factory-work='));
  row.factory_handler_id = 'factory-user';
  assert.match(s.context.renderFactoryExceptionCard(row), /data-work-action="reply"/);
  row.status = '已解决';
  assert.ok(!s.context.renderFactoryExceptionCard(row).includes('data-factory-work='));
});
