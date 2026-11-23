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
    if (!nodes.has(id)) nodes.set(id, { value: '', dataset: {}, innerHTML: '',
      classList: { toggle(name, value) { this[name] = value; } }, addEventListener() {} });
    return nodes.get(id);
  };
  const context = vm.createContext({ URL, URLSearchParams, setTimeout, clearTimeout,
    window: { location: { search: '' } }, document: { getElementById: node } });
  const run = (code) => vm.runInContext(code, context);
  run(source.slice(0, startup));
  return { context, run, node };
}

test('date range includes the entire Beijing day independent of the device timezone', () => {
  const { context: c } = setup();
  const filter = { active: true, field: 'created_at', start: '2026-11-23', end: '2026-11-23' };
  for (const date of ['2026-11-22T16:00:00Z', '2026-11-23T15:59:59.999Z', '2026-11-23T23:59:59.999+08:00']) {
    assert.equal(c.exceptionMatchesDate({ created_at: date }, filter), true, date);
  }
  for (const date of ['2026-11-22T15:59:59.999Z', '2026-11-23T16:00:00Z', null, 'invalid']) {
    assert.equal(c.exceptionMatchesDate({ created_at: date }, filter), false, date);
  }
  assert.equal(c.exceptionMatchesDate({}, { active: false }), true);
  assert.equal(c.exceptionMatchesDate({ created_at: '2026-11-25T00:00:00Z' }, { ...filter, end: '' }), true);
  assert.equal(c.exceptionMatchesDate({ created_at: '2026-11-01T00:00:00Z' }, { ...filter, start: '' }), true);
});

test('date basis uses the selected timestamp and never substitutes a report date for missing closure', () => {
  const s = setup(), c = s.context;
  const row = { created_at: '2026-11-21T12:00:00+08:00', updated_at: '2026-11-23T12:00:00+08:00' };
  const filter = { active: true, field: 'created_at', start: '2026-11-23', end: '2026-11-23' };
  assert.equal(c.exceptionMatchesDate(row, filter), false);
  assert.equal(c.exceptionMatchesDate(row, { ...filter, field: 'updated_at' }), true);
  assert.equal(c.exceptionMatchesDate(row, { ...filter, field: 'resolved_at' }), false);
  s.node('exceptionDateStart').value = '2026-11-24';
  s.node('exceptionDateEnd').value = '2026-11-23';
  const invalid = c.readExceptionDateFilter('exception');
  assert.equal(invalid.invalid, true);
  assert.equal(c.exceptionMatchesDate(row, invalid), false);
  c.updateExceptionDateHint('exception', invalid);
  assert.match(s.node('exceptionDateHint').textContent, /不能晚于/);
  c.clearExceptionDateFilters('exception');
  assert.equal(c.readExceptionDateFilter('exception').active, false);
  assert.equal(s.node('exceptionDateField').value, 'created_at');
});

test('admin combines date, decision, status, owner and search without counting hidden customer groups', () => {
  const s = setup();
  const card = (id, day, decision = 'return_wash') => ({ id,
    dataset: { exceptionSearch: '13800000001 材质风险', exceptionHandling: decision,
      exceptionTicketStatus: '已解决', exceptionAssignee: 'admin-a', exceptionCreated: day },
    classList: { toggle(name, value) { this[name] = value; } } });
  const cards = [card('match', '2026-11-23T23:59:00+08:00'), card('yesterday', '2026-11-22T23:59:00+08:00'),
    card('other-decision', '2026-11-23T08:00:00+08:00', 'wash_approved')];
  const count = {}, customerCount = {}, customer = { classList: { toggle() {} },
    querySelectorAll: () => cards, querySelector: () => customerCount };
  const group = { tagName: 'DETAILS', dataset: {}, open: false, classList: { toggle() {} },
    querySelectorAll: (selector) => selector === '[data-exception-search]' ? cards : [customer], querySelector: () => count };
  s.node('adminExceptions').querySelectorAll = () => [group];
  s.node('exceptionSearch').value = '13800000001';
  s.node('exceptionDecisionFilter').value = 'return_wash';
  s.node('exceptionStatusFilter').value = '已解决';
  s.node('exceptionOwnerFilter').value = 'mine';
  s.node('exceptionDateStart').value = s.node('exceptionDateEnd').value = '2026-11-23';
  s.run('currentUser={id:"admin-a"}');
  s.context.applyExceptionSearch();
  assert.equal(cards[0].classList.hidden, false);
  assert.equal(cards[1].classList.hidden, true);
  assert.equal(cards[2].classList.hidden, true);
  assert.equal(customerCount.textContent, '1 单');
  assert.equal(count.textContent, 1);
  assert.equal(group.open, true);
  assert.equal(s.node('exceptionSearchResult').textContent, '找到 1 条记录');
  s.node('exceptionDateStart').value = '2026-11-24';
  s.context.applyExceptionSearch();
  assert.equal(cards[0].classList.hidden, true);
  assert.match(s.node('exceptionSearchResult').textContent, /日期范围有误/);
});

test('factory date and result filters apply before pagination, reset the page and preserve data without requests', () => {
  const s = setup();
  s.run(`factoryExceptionLoaded=true; factoryExceptionPage=3;
    factoryExceptionRows=Array.from({length:45},(_,i)=>({id:String(i),searchText:'测试 退洗',status:'已解决',
      handling_decision:i===0?'wash_approved':'return_wash',evidencePaths:[],
      created_at:'2026-11-20T00:00:00Z',updated_at:i<24?'2026-11-23T15:59:59Z':'2026-11-23T16:00:00Z'}));`);
  s.node('factoryExceptionDateField').value = 'updated_at';
  s.node('factoryExceptionDateStart').value = s.node('factoryExceptionDateEnd').value = '2026-11-23';
  s.node('factoryExceptionDecisionFilter').value = 'return_wash';
  s.node('factoryExceptionSearch').value = '测试';
  s.node('factoryExceptionStatusFilter').value = '已解决';
  s.context.filterFactoryExceptions();
  assert.match(s.node('factoryExceptionPageInfo').textContent, /23 条 · 1 \/ 2 页/);
  assert.equal((s.node('factoryExceptionList').innerHTML.match(/data-factory-exception-card=/g) || []).length, 20);
  s.context.changeFactoryExceptionPage(1);
  assert.match(s.node('factoryExceptionPageInfo').textContent, /2 \/ 2 页/);
  assert.equal((s.node('factoryExceptionList').innerHTML.match(/data-factory-exception-card=/g) || []).length, 3);
  assert.equal(s.run('factoryExceptionRows.length'), 45);
  assert.match(s.node('factoryExceptionDateSummary').textContent, /更新：2026-11-23/);
  s.node('factoryExceptionDateStart').value = '2026-11-24';
  s.context.filterFactoryExceptions();
  assert.match(s.node('factoryExceptionList').innerHTML, /日期范围有误/);
});
