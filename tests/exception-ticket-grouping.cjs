const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '../app.js'), 'utf8');
const startup = source.lastIndexOf('\nif ("serviceWorker" in navigator)');

function setup() {
  const nodes = new Map();
  const node = (id) => {
    if (!nodes.has(id)) nodes.set(id, { value: '', innerHTML: '', addEventListener() {}, setAttribute() {}, classList: { toggle() {} } });
    return nodes.get(id);
  };
  const context = vm.createContext({
    URL, URLSearchParams, window: { location: { search: '' } },
    document: { getElementById: node },
  });
  const run = (code) => vm.runInContext(code, context);
  run(source.slice(0, startup));
  return { context, run, node };
}

function ticket(id, phone, extra = {}) {
  return { id, status: '待客服', ticket_type: '材质风险', priority: '普通', created_at: '2026-11-21T08:00:00Z',
    orders: { id: `order-${id}`, order_no: id, customer_name: '同名客户', phone },
    ...extra };
}

test('groups different orders by normalized phone while keeping same names and unknown customers separate', () => {
  const s = setup();
  const tickets = [
    ticket('a', '13800000001'), ticket('b', '13800000002'),
    ticket('c', '+86 (138) 0000-0001'), ticket('d', '００８６１３８０００００００１'),
    ticket('e', '', { orders: { id: 'same-order', customer_name: '同名客户' } }),
    ticket('f', '', { orders: [{ id: 'same-order', customer_name: '同名客户' }] }),
    ticket('g', '未知'), ticket('h', '未知'),
    { id: 'i' }, { id: 'j' },
  ];
  const groups = s.context.groupExceptionTickets(tickets);
  assert.deepEqual(Array.from(groups, (group) => Array.from(group.tickets, (item) => item.id)), [
    ['a', 'c', 'd'], ['b'], ['e', 'f'], ['g'], ['h'], ['i'], ['j'],
  ]);
  assert.equal(groups[0].phone, '13800000001');
  assert.equal(tickets[2].orders.phone, '+86 (138) 0000-0001');
});

test('rendered customer groups retain each ticket action and escape customer content', () => {
  const s = setup();
  const row = ticket('a', '+86 13800000001');
  row.orders.customer_name = '<script>name</script>';
  const html = s.context.renderExceptionTicketGroups([row, ticket('b', '13800000001')]);
  assert.equal((html.match(/data-exception-customer-group/g) || []).length, 1);
  assert.match(html, /data-exception-customer-count>2 单/);
  assert.match(html, /&lt;script&gt;name&lt;\/script&gt;/);
  assert.ok(!html.includes('<script>name'));
  for (const id of ['a', 'b']) assert.match(html, new RegExp(`data-exception-status="${id}" data-status="已解决"`));
  assert.match(html, /data-exception-search="[^"]*13800000001/);
});

test('load keeps urgent customer groups first, tickets adjacent, and closed tickets in the history section', async () => {
  const s = setup();
  const records = [
    ticket('a-old', '13800000001', { created_at: '2026-11-01' }),
    ticket('b', '13800000002', { created_at: '2026-11-02' }),
    ticket('c-urgent', '13800000003', { priority: '紧急', created_at: '2026-11-03' }),
    ticket('a-urgent', '13800000001', { priority: '紧急', created_at: '2026-11-04' }),
    ticket('a-closed-old', '13800000001', { status: '已解决', resolved_at: '2026-11-10' }),
    ticket('b-closed', '13800000002', { status: '已关闭', resolved_at: '2026-11-11' }),
    ticket('a-closed-new', '13800000001', { status: '已解决', resolved_at: '2026-11-12' }),
  ];
  s.context.client = {
    from(table) { return { table, select() { return this; }, or() { return this; } }; },
  };
  s.context.records = records;
  s.run(`
    sb = client; currentUser = { id: 'staff' };
    detectExceptionTicketSchemaAvailability = async () => { exceptionTicketSchemaAvailable = true; };
    loadRowsById = async (createQuery) => ({ data: createQuery().table === 'exception_tickets' ? records : [] });
    applyExceptionSearch = () => {};
  `);
  await s.context.loadExceptions();
  const html = s.node('adminExceptions').innerHTML;
  const open = html.slice(html.indexOf('<section class="exception-worklist"'), html.indexOf('<details class="exception-legacy-section"'));
  const history = html.slice(html.indexOf('<strong>已结案工单</strong>'));
  assert.deepEqual([...open.matchAll(/data-exception-ticket="([^"]+)"/g)].map((match) => match[1]), ['c-urgent', 'a-urgent', 'a-old', 'b']);
  assert.deepEqual([...history.matchAll(/data-exception-ticket="([^"]+)"/g)].map((match) => match[1]), ['a-closed-new', 'a-closed-old', 'b-closed']);
  assert.equal((open.match(/data-exception-customer-group/g) || []).length, 3);
  assert.match(open, /data-exception-match-count>4 单/);
});

test('search hides empty customer groups, updates visible counts, and restores them when cleared', () => {
  const s = setup();
  const make = (dataset = {}) => ({ dataset, classList: { toggle(_name, hidden) { this.hidden = hidden; } } });
  const a1 = make({ exceptionSearch: '客户甲 13800000001 材质风险' });
  const a2 = make({ exceptionSearch: '客户甲 13800000001 退洗' });
  const b1 = make({ exceptionSearch: '客户乙 13800000002 退洗' });
  const customer = (cards) => {
    const count = {};
    return Object.assign(make(), { cards, count, querySelectorAll: () => cards, querySelector: () => count });
  };
  const a = customer([a1, a2]), b = customer([b1]);
  const count = {};
  const group = Object.assign(make(), { tagName: 'SECTION',
    querySelectorAll: (selector) => selector === '[data-exception-search]' ? [a1, a2, b1] : [a, b],
    querySelector: () => count,
  });
  s.node('adminExceptions').querySelectorAll = () => [group];
  s.node('exceptionSearchResult').classList = make().classList;
  s.node('exceptionSearch').value = '13800000001 退洗';
  s.context.applyExceptionSearch();
  assert.equal(a.classList.hidden, false);
  assert.equal(b.classList.hidden, true);
  assert.equal(a.count.textContent, '1 单');
  assert.equal(count.textContent, '1 单');
  assert.equal(s.node('exceptionSearchResult').textContent, '找到 1 条记录');
  s.node('exceptionSearch').value = '';
  s.context.applyExceptionSearch();
  assert.equal(b.classList.hidden, false);
  assert.equal(a.count.textContent, '2 单');
  assert.equal(count.textContent, '3 单');
});
