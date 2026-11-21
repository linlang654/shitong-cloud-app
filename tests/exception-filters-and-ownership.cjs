const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '../app.js'), 'utf8');
const startup = source.lastIndexOf('\nif ("serviceWorker" in navigator)');

function setup() {
  const nodes = new Map(), logs = [], alerts = [], writes = [], reads = [];
  const node = (id) => {
    if (!nodes.has(id)) nodes.set(id, { value: '', classList: { toggle() {} }, setAttribute() {}, addEventListener() {} });
    return nodes.get(id);
  };
  const records = new Map();
  let nextError;
  const client = {
    from(table) {
      assert.equal(table, 'exception_tickets');
      return { update(payload) {
        const filters = [];
        const query = {
          eq(field, value) { filters.push([field, value]); return this; },
          is(field, value) { filters.push([field, value]); return this; },
          select() { return this; },
          async maybeSingle() {
            writes.push({ payload, filters });
            await new Promise(setImmediate);
            if (nextError) { const error = nextError; nextError = null; return { error }; }
            const record = [...records.values()].find((row) => filters.every(([key, value]) => (row[key] ?? null) === value));
            if (!record) return { data: null };
            Object.assign(record, payload);
            return { data: { id: record.id } };
          },
        };
        return query;
      } };
    },
  };
  const context = vm.createContext({
    URL, URLSearchParams, client, logs, reads,
    window: { location: { search: '' } },
    document: { getElementById: node },
    alert: (message) => alerts.push(message), prompt: () => '已确认清洗',
  });
  const run = (code) => vm.runInContext(code, context);
  run(source.slice(0, startup));
  run(`sb = client; currentUser = { id: 'admin-a' }; currentProfile = { id:'admin-a', name:'管理员甲', role:'admin' };
    insertLog = async (entry) => logs.push(entry); loadStats = async () => {}; loadExceptions = async () => reads.push('reload');`);
  const addTicket = (id, assignee_id = null, status = '待客服') => {
    const record = { id, assignee_id, status, updated_at: '2026-11-21T00:00:00Z', order_id: 'order-' + id };
    records.set(id, record);
    context.ticket = { ...record };
    run('currentExceptionTickets.push(ticket)');
    return record;
  };
  return { context, run, node, records, addTicket, logs, alerts, writes, reads, failNext: (error) => { nextError = error; } };
}

test('username login uses password auth and email login keeps its existing identifier', async () => {
  const s = setup();
  const signins = [];
  s.context.client.auth = { async signInWithPassword(input) { signins.push(input); return {}; } };
  s.run('refreshSession = async () => {}');
  s.node('loginEmail').value = ' Xiaoshi ';
  s.node('loginPassword').value = 'test-password';
  await s.context.login();
  assert.equal(signins[0].email, 'xiaoshi@staff.shitong.invalid');
  assert.equal(signins[0].password, 'test-password');
  assert.equal(s.node('loginPassword').value, '');
  s.node('loginEmail').value = 'xihu@xihu.com';
  s.node('loginPassword').value = 'test-password';
  await s.context.login();
  assert.equal(signins[1].email, 'xihu@xihu.com');
  s.node('loginEmail').value = 'invalid username!';
  s.node('loginPassword').value = 'test-password';
  await s.context.login();
  assert.equal(signins.length, 2);
});

test('claim assigns only the current account without changing the ticket status', async () => {
  const s = setup();
  const record = s.addTicket('claim');
  const first = s.context.claimExceptionTicket('claim');
  const duplicate = s.context.claimExceptionTicket('claim');
  await Promise.all([first, duplicate]);
  assert.equal(s.writes.length, 1);
  assert.equal(record.assignee_id, 'admin-a');
  assert.equal(record.status, '待客服');
  assert.equal(s.logs.length, 1);
  assert.equal(s.logs[0].status, '认领异常工单');
  assert.equal(s.run('exceptionTicketBusy'), false);
});

test('status changes automatically claim unassigned tickets and preserve an existing assignee', async () => {
  const s = setup();
  const waiting = s.addTicket('waiting');
  const processing = s.addTicket('processing');
  const owned = s.addTicket('owned', 'admin-b', '处理中');
  await s.context.updateExceptionTicketStatus('waiting', '待客户');
  await s.context.updateExceptionTicketStatus('processing', '处理中');
  await s.context.updateExceptionTicketStatus('owned', '已解决');
  assert.equal(waiting.assignee_id, 'admin-a');
  assert.equal(processing.assignee_id, 'admin-a');
  assert.equal(owned.assignee_id, 'admin-b');
  assert.equal(owned.status, '已解决');
  assert.ok(owned.resolved_at);
});

test('concurrent claim or status update conflicts do not overwrite another administrator', async () => {
  for (const action of ['claim', 'status']) {
    const s = setup();
    const record = s.addTicket('conflict');
    record.assignee_id = 'admin-b';
    if (action === 'claim') await s.context.claimExceptionTicket('conflict');
    else await s.context.updateExceptionTicketStatus('conflict', '处理中');
    assert.equal(record.assignee_id, 'admin-b');
    assert.equal(record.status, '待客服');
    assert.equal(s.logs.length, 0);
    assert.equal(s.reads.length, 1);
    assert.match(s.alerts[0], /其他人/);
  }
});

test('failed saves release the action lock and non-admin accounts cannot claim', async () => {
  const s = setup();
  s.addTicket('failed');
  s.failNext(new Error('network error'));
  await s.context.claimExceptionTicket('failed');
  assert.equal(s.run('exceptionTicketBusy'), false);
  assert.equal(s.records.get('failed').assignee_id, null);
  assert.match(s.alerts[0], /network error/);
  s.run('currentProfile.role = "courier"');
  await s.context.claimExceptionTicket('failed');
  await s.context.updateExceptionTicketStatus('failed', '处理中');
  assert.equal(s.writes.length, 1);
});

test('status and my-ticket filters combine with keywords and track the signed-in account', () => {
  const s = setup();
  const card = (status, owner, search) => ({
    dataset: { exceptionTicketStatus: status, exceptionAssignee: owner, exceptionSearch: search },
    classList: { toggle(_className, hidden) { this.hidden = hidden; } },
  });
  const mine = card('待客服', 'admin-a', '13800000001 材质风险');
  const another = card('处理中', 'admin-b', '13800000001 材质风险');
  const unassigned = card('待客服', '', '13800000002 配送异常');
  const legacy = card(undefined, undefined, '历史地址异常');
  const cards = [mine, another, unassigned, legacy], count = {};
  const group = {
    dataset: {}, tagName:'SECTION', classList:{ toggle() {} },
    querySelectorAll: (selector) => selector === '[data-exception-search]' ? cards : [], querySelector: () => count,
  };
  s.node('adminExceptions').querySelectorAll = () => [group];
  s.node('exceptionOwnerFilter').value = 'mine';
  s.context.applyExceptionSearch();
  assert.equal(mine.classList.hidden, false);
  assert.equal(another.classList.hidden, true);
  assert.equal(unassigned.classList.hidden, true);
  assert.equal(legacy.classList.hidden, true);
  assert.equal(count.textContent, '1 单');
  s.run('currentUser = {id:"admin-b"}');
  s.node('exceptionStatusFilter').value = '处理中';
  s.node('exceptionSearch').value = '材质风险';
  s.context.applyExceptionSearch();
  assert.equal(another.classList.hidden, false);
  assert.equal(mine.classList.hidden, true);
  s.node('exceptionStatusFilter').value = '待客服';
  s.context.applyExceptionSearch();
  assert.equal(count.textContent, '0 单');
  s.node('exceptionOwnerFilter').value = '';
  s.node('exceptionStatusFilter').value = '';
  s.node('exceptionSearch').value = '';
  s.context.applyExceptionSearch();
  assert.equal(count.textContent, '4 单');
});
