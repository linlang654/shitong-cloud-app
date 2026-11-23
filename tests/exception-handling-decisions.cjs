const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const source = readFileSync(join(__dirname, '../app.js'), 'utf8');
const startup = source.lastIndexOf('\nif ("serviceWorker" in navigator)');

function setup() {
  const nodes = new Map(), calls = [], refreshed = [];
  let error;
  const node = (id) => {
    if (!nodes.has(id)) nodes.set(id, { value: '', dataset: {}, disabled: false, classList: { toggle() {} },
      showModal() { this.open = true; }, close() { this.open = false; } });
    return nodes.get(id);
  };
  const client = {
    from() { throw new Error('Handling must use one atomic RPC'); },
    async rpc(name, args) { calls.push({ name, args }); return { data: error ? null : { ticket_id: args.p_ticket_id, handling_decision: args.p_decision }, error }; },
  };
  const context = vm.createContext({ URL, URLSearchParams, client, refreshed,
    window: { location: { search: '' } }, document: { getElementById: node } });
  const run = (code) => vm.runInContext(code, context);
  run(source.slice(0, startup));
  run(`sb=client; currentUser={id:'admin-a'};currentProfile={id:'admin-a',role:'admin'};
    currentExceptionTickets=[{id:'ticket',order_id:'order',item_id:'item',status:'待客服',handling_decision:'pending',
      updated_at:'2026-11-23T00:00:00Z',assignee_id:'admin-b',orders:{customer_name:'测试客户'},order_items:{barcode:'261123001'}}];
    loadExceptions=async()=>refreshed.push('exceptions');loadStats=async()=>refreshed.push('stats');`);
  return { context, run, node, calls, refreshed, fail: (value) => { error = value; } };
}

test('processing and completion open structured options instead of writing a free-form conclusion', async () => {
  const s = setup();
  await s.context.updateExceptionTicketStatus('ticket', '处理中');
  assert.equal(s.node('exceptionHandlingDialog').open, true);
  assert.equal(s.node('exceptionHandlingStatus').value, '处理中');
  assert.equal(s.calls.length, 0);
  await s.context.updateExceptionTicketStatus('ticket', '已解决');
  s.node('exceptionHandlingDecision').value = 'return_wash';
  s.context.updateExceptionHandlingDialog();
  assert.equal(s.node('exceptionHandlingStatus').value, '已解决');
  assert.equal(s.node('exceptionHandlingReasonLabel').textContent, '退洗原因（必填）');
  assert.match(s.node('exceptionHandlingHelp').textContent, /不涉及金额/);
});

test('return needs a reason and saves decision, ownership snapshot, and item synchronization in one RPC', async () => {
  const s = setup();
  s.context.openExceptionHandlingDialog('ticket', '已解决');
  s.node('exceptionHandlingDecision').value = 'return_wash';
  s.node('exceptionHandlingStatus').value = '已解决';
  await s.context.saveExceptionHandling();
  assert.equal(s.calls.length, 0);
  assert.match(s.node('exceptionHandlingMessage').innerHTML, /退洗原因/);
  s.node('exceptionHandlingReason').value = '客户要求原样退回';
  await s.context.saveExceptionHandling();
  assert.equal(s.calls.length, 1);
  assert.equal(s.calls[0].name, 'save_exception_ticket_handling');
  assert.equal(s.calls[0].args.p_decision, 'return_wash');
  assert.equal(s.calls[0].args.p_expected_assignee_id, 'admin-b');
  assert.equal(s.calls[0].args.p_expected_updated_at, '2026-11-23T00:00:00Z');
  assert.equal(s.node('exceptionHandlingDialog').open, false);
  assert.deepEqual(s.refreshed, ['exceptions', 'stats']);
});

test('pending cannot close, other requires details, and errors keep the chosen conclusion for review', async () => {
  const s = setup();
  s.context.openExceptionHandlingDialog('ticket', '已解决');
  s.node('exceptionHandlingDecision').value = 'pending';
  s.node('exceptionHandlingStatus').value = '已解决';
  await s.context.saveExceptionHandling();
  assert.equal(s.calls.length, 0);
  s.node('exceptionHandlingDecision').value = 'other';
  await s.context.saveExceptionHandling();
  assert.equal(s.calls.length, 0);
  s.node('exceptionHandlingReason').value = '另行联系客户';
  s.fail({ code: '40001', message: '工单已被更新，请重新核对' });
  await s.context.saveExceptionHandling();
  assert.equal(s.node('exceptionHandlingDialog').open, true);
  assert.equal(s.node('exceptionHandlingDecision').value, 'other');
  assert.equal(s.node('saveExceptionHandlingBtn').disabled, false);
  assert.match(s.node('exceptionHandlingMessage').innerHTML, /重新核对/);
});

test('historical wording is never inferred as approval, and a physical return overrides a conflicting ticket choice', () => {
  const s = setup();
  assert.equal(s.context.exceptionHandlingDecision({ status: '已解决', resolution: '已同意继续清洗' }), 'legacy');
  assert.equal(s.context.exceptionHandlingDecision({ status: '处理中', handling_decision: 'pending', customer_reply: '同意清洗' }), 'pending');
  const row = { status: '已解决', handling_decision: 'wash_approved', order_items: { item_status: '退洗', wash_decision: 'return_pending' }, evidencePaths: [] };
  assert.equal(s.context.effectiveExceptionHandlingDecision(row), 'return_wash');
  const html = s.context.renderFactoryExceptionCard(row);
  assert.match(html, /handling-decision return_wash/);
  assert.match(html, /物品已标记退洗/);
});

test('factory decision filter identifies all return items independently of ticket progress', () => {
  const s = setup();
  s.run(`factoryExceptionLoaded=true;factoryExceptionRows=[
    {id:'a',handling_decision:'return_wash',status:'已解决',searchText:'退洗',evidencePaths:[]},
    {id:'b',handling_decision:'wash_approved',status:'处理中',searchText:'清洗',evidencePaths:[]},
    {id:'c',handling_decision:null,status:'待客服',searchText:'退洗',evidencePaths:[],order_items:{wash_decision:'returned',item_status:'已送达'}}
  ];`);
  s.node('factoryExceptionDecisionFilter').value = 'return_wash';
  s.context.renderFactoryExceptionTickets();
  assert.match(s.node('factoryExceptionPageInfo').textContent, /2 条/);
  s.node('factoryExceptionStatusFilter').value = '已解决';
  s.context.renderFactoryExceptionTickets();
  assert.match(s.node('factoryExceptionPageInfo').textContent, /1 条/);
});

test('return-awaiting-outbound excludes already shipped, delivered, and unpicked cancelled items', () => {
  const s = setup();
  const row = (status, key) => ({ handling_decision: 'return_wash', order_items: { item_status: status, wash_decision: key } });
  assert.equal(s.context.factoryTicketMatchesHandling(row('退洗', 'return_pending'), 'return_pending'), true);
  for (const value of [row('已出库', 'return_pending'), row('已送达', 'returned'), row('退洗', 'return_cancelled')]) {
    assert.equal(s.context.factoryTicketMatchesHandling(value, 'return_pending'), false);
    assert.equal(s.context.factoryTicketMatchesHandling(value, 'return_wash'), true);
  }
});
