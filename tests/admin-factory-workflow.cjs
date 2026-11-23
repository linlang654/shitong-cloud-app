const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const source = readFileSync(join(__dirname, '../app.js'), 'utf8');
const startup = source.lastIndexOf('\nif ("serviceWorker" in navigator)');

function setup(mode = 'admin') {
  const nodes = new Map(), calls = [], refreshed = [], alerts = [];
  let error, hold;
  const node = (id) => {
    if (!nodes.has(id)) nodes.set(id, { value: '', innerHTML: '', dataset: {}, files: [],
      classList: { toggle() {} }, showModal() { this.open = true; }, close() { this.open = false; } });
    return nodes.get(id);
  };
  const client = { from(table) {
    if (table !== 'order_items') throw new Error('Use atomic RPC for backend-to-factory work');
    return { select() { return this; }, eq() { return this; }, async maybeSingle() { return { data: { id: 'item', order_id: 'order', barcode: '261123001' } }; } };
  }, async rpc(name, args) {
    calls.push({ name, args }); if (hold) await hold;
    return { data: error ? null : name === 'create_factory_exception' ? { ticket_id: args.p_ticket_id, target_team: 'factory' }
      : { ticket_id: args.p_ticket_id, factory_progress: { start: 'processing', reply: 'replied', reopen: 'pending' }[args.p_action] }, error };
  } };
  const context = vm.createContext({ URL, URLSearchParams, client, refreshed, setTimeout, clearTimeout,
    window: { location: { search: '' } }, document: { body: { dataset: { appMode: mode } }, getElementById: node,
      querySelector: () => null, querySelectorAll: () => [] }, alert: (value) => alerts.push(value) });
  const run = (code) => vm.runInContext(code, context);
  run(source.slice(0, startup));
  run(`sb=client;currentUser={id:'admin-a'};currentProfile={id:'admin-a',role:'${mode === 'factory' ? 'factory' : 'admin'}'};
    exceptionTicketSchemaAvailable=true;loadExceptions=async()=>refreshed.push('admin');loadStats=async()=>{};
    loadFactoryExceptionTickets=async()=>refreshed.push('factory');`);
  return { context, run, node, calls, refreshed, alerts, fail: (value) => error = value, defer: (value) => hold = value };
}

test('backend creates factory work atomically with a retained request ID and retries without a second ticket identifier', async () => {
  const s = setup();
  s.run("exceptionTicketContext={type:'admin-to-factory',requestId:'request-one'}");
  s.node('exceptionTicketBarcode').value = '261123001';
  s.node('exceptionTicketDescription').value = '请核查漏装衣物';
  s.node('exceptionTicketType').value = '少件/串单';
  s.node('exceptionTicketSolution').value = '核对后回复';
  s.fail({ message: 'network failed' });
  await s.context.submitExceptionTicket();
  assert.equal(s.calls.length, 1);
  assert.equal(s.calls[0].name, 'create_factory_exception');
  assert.equal(s.calls[0].args.p_item_id, 'item');
  assert.equal(s.calls[0].args.p_ticket_id, 'request-one');
  assert.equal(s.run('exceptionTicketContext.requestId'), 'request-one');
  s.fail(null);
  await s.context.submitExceptionTicket();
  assert.equal(s.calls[1].args.p_ticket_id, 'request-one');
  assert.equal(s.node('exceptionTicketDialog').open, false);
  assert.deepEqual(s.refreshed, ['admin']);
});

test('factory and courier pages cannot send backend work even with a forged dialog context', async () => {
  for (const mode of ['factory', 'courier']) {
    const s = setup(mode);
    s.run("exceptionTicketContext={type:'admin-to-factory',requestId:'forged'}");
    await s.context.submitExceptionTicket();
    assert.equal(s.calls.length, 0);
  }
});

test('factory reply uses a snapshot, sends one RPC while busy and refreshes only the factory inbox', async () => {
  const s = setup('factory');
  s.run("factoryWorkContext={client:sb,userId:currentUser.id,ticket:{id:'ticket',updated_at:'2026-11-23T00:00:00Z'},action:'reply'}");
  let release;
  s.defer(new Promise((resolve) => release = resolve));
  const context = s.run('factoryWorkContext');
  const save = s.context.performFactoryWorkAction(context, '已核实找到漏装衣物');
  await s.context.performFactoryWorkAction(context, '重复回复');
  assert.equal(s.calls.length, 1);
  assert.equal(s.calls[0].name, 'act_on_factory_exception');
  assert.equal(s.calls[0].args.p_expected_updated_at, '2026-11-23T00:00:00Z');
  assert.ok(!('p_status' in s.calls[0].args));
  release(); await save;
  assert.deepEqual(s.refreshed, ['factory']);
  assert.equal(s.run('factoryWorkBusy'), false);
});

test('empty replies never write, stale saves keep the draft and logout discards late UI results', async () => {
  const s = setup('factory');
  s.run("factoryWorkContext={client:sb,userId:currentUser.id,ticket:{id:'ticket',updated_at:'old'},action:'reply'}");
  const context = s.run('factoryWorkContext');
  s.node('factoryWorkMessage').value = '草稿保留';
  await s.context.performFactoryWorkAction(context, '  ');
  assert.equal(s.calls.length, 0);
  s.fail({ code: '40001', message: '工单已被更新，请刷新核对' });
  await s.context.performFactoryWorkAction(context, '草稿保留');
  assert.match(s.node('factoryWorkMessageStatus').innerHTML, /已被更新/);
  assert.equal(s.node('factoryWorkMessage').value, '草稿保留');
  let release; s.fail(null); s.defer(new Promise((resolve) => release = resolve));
  const save = s.context.performFactoryWorkAction(context, '草稿保留');
  s.run('currentUser=null;factoryWorkContext=null');release();await save;
  assert.deepEqual(s.refreshed, []);
  assert.equal(s.run('factoryWorkBusy'), false);
});

test('backend cannot confirm before a factory reply and uses the reply as the confirmation draft', () => {
  const s = setup();
  s.run("currentExceptionTickets=[{id:'ticket',status:'处理中',target_team:'factory',factory_progress:'pending',handling_decision:'pending'}]");
  s.context.openExceptionHandlingDialog('ticket', '已解决');
  assert.match(s.alerts[0], /等待工厂回复/);
  assert.ok(!s.node('exceptionHandlingDialog').open);
  s.run("currentExceptionTickets[0].factory_progress='replied';currentExceptionTickets[0].factory_reply='已找到，核对齐全'");
  s.context.openExceptionHandlingDialog('ticket', '已解决');
  assert.equal(s.node('exceptionHandlingDialog').open, true);
  assert.equal(s.node('exceptionHandlingDecision').value, 'other');
  assert.equal(s.node('exceptionHandlingReason').value, '已找到，核对齐全');
  assert.match(s.node('exceptionHandlingSummary').textContent, /工厂回复：已找到/);
});

test('a successful factory write waits for any older read, then fetches a fresh inbox', async () => {
  const s = setup('factory');
  let release;
  s.context.olderRead = new Promise((resolve) => release = resolve);
  s.run("factoryExceptionLoad={promise:olderRead};factoryWorkContext={client:sb,userId:currentUser.id,ticket:{id:'ticket',updated_at:'old'},action:'reply'}");
  const save = s.context.performFactoryWorkAction(s.run('factoryWorkContext'), '已处理');
  await new Promise(setImmediate);
  assert.equal(s.calls.length, 1);
  assert.deepEqual(s.refreshed, []);
  s.run('factoryExceptionLoad=null');release();await save;
  assert.deepEqual(s.refreshed, ['factory']);
});
