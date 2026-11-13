const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '../app.js'), 'utf8');
const startup = source.lastIndexOf('\nif ("serviceWorker" in navigator)');
assert.ok(startup > 0);

function setup(status = '已入厂') {
  const item = { id: 'item-a', order_id: 'order-a', barcode: '261113001', item_status: status, wash_decision: 'normal' };
  const writes = [], logs = [];
  const nodes = new Map();
  const node = (id) => {
    if (!nodes.has(id)) {
      const classes = new Set();
      nodes.set(id, {
        classList: { toggle: (name, visible) => visible ? classes.add(name) : classes.delete(name), contains: (name) => classes.has(name) },
        addEventListener(type, listener) { this[type] = listener; },
      });
    }
    return nodes.get(id);
  };
  Object.assign(node('orderDialog'), { showModal() {}, close() {} });
  const body = node('orderDialogBody');
  Object.defineProperty(body, 'innerHTML', {
    set(html) {
      const select = html.match(/<select id="washAdjustmentDecision"[\s\S]*?<\/select>/)[0];
      node('washAdjustmentDecision').value = select.match(/<option value="([^"]+)" selected>/)[1];
    },
  });
  const context = vm.createContext({
    URL, URLSearchParams, console,
    window: { location: { search: '' } },
    document: { getElementById: node, querySelector: () => null },
    item,
    client: {
      from(table) {
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: item }) }) }),
          update: (payload) => {
            writes.push({ table, ...structuredClone(payload) });
            return { eq: () => ({ in: async () => ({}), not: async () => ({}) }) };
          },
          insert: async (payload) => { assert.equal(table, 'status_logs'); logs.push(structuredClone(payload)); },
        };
      },
    },
  });
  vm.runInContext(source.slice(0, startup), context);
  vm.runInContext(`
    sb = client;
    washAdjustmentSchemaAvailable = true;
    loadLabels = async () => {};
    showOrderDetail = async () => {};
  `, context);
  return { context, item, writes, logs, node };
}

for (const [status, decision, logStatus] of [
  ['已入厂', 'return_pending', '退洗'],
  ['待取件', 'return_cancelled', '已退单'],
]) {
  test(`return from ${status} requires only a reason and records no charge`, async () => {
    const { context, item, writes, logs, node } = setup(status);
    const select = { dataset: { originalStatus: status } };
    await context.updateOrderItemStatus(item.id, item.order_id, item.barcode, '退洗', select);
    assert.equal(node('washAdjustmentDecision').value, decision);
    assert.equal(node('washAdjustmentAmountField').classList.contains('hidden'), true);
    assert.equal(node('washAdjustmentNoteField').classList.contains('hidden'), true);
    assert.equal(node('washAdjustmentFields').classList.contains('hidden'), false);

    node('washAdjustmentReason').value = '  ';
    await context.saveWashAdjustment(item.id);
    assert.match(node('washAdjustmentMessage').innerHTML, /请填写退洗原因/);
    assert.equal(writes.length, 0);

    node('washAdjustmentReason').value = '客户要求原样退回';
    node('washAdjustmentAmount').value = '25';
    node('washAdjustmentNote').value = '上一步未保存的备注';
    await context.saveWashAdjustment(item.id);
    assert.equal(writes[0].wash_decision, decision);
    assert.equal(writes[0].item_status, '退洗');
    assert.equal(writes[0].wash_decision_reason, '客户要求原样退回');
    assert.equal(writes[0].price_adjustment_type, 'none');
    assert.equal(writes[0].price_adjustment_amount, 0);
    assert.equal('wash_decision_note' in writes[0], false);
    assert.equal(logs[0].status, logStatus);
    assert.doesNotMatch(logs[0].note, /金额|备注/);
    assert.deepEqual(writes.slice(1).map(({ table }) => table),
      decision === 'return_cancelled' ? ['pickup_retry_tasks', 'return_tasks'] : []);
  });
}

test('supplement still requires and saves its amount', async () => {
  const { context, item, writes, node } = setup();
  context.openWashAdjustmentDialog(item.id, item);
  node('washAdjustmentDecision').value = 'supplement_pending';
  node('washAdjustmentDecision').change();
  assert.equal(node('washAdjustmentAmountField').classList.contains('hidden'), false);
  node('washAdjustmentReason').value = '特殊材质';
  await context.saveWashAdjustment(item.id);
  assert.match(node('washAdjustmentMessage').innerHTML, /请填写正确的补差金额/);
  assert.equal(writes.length, 0);
  node('washAdjustmentAmount').value = '9.9';
  await context.saveWashAdjustment(item.id);
  assert.equal(writes[0].price_adjustment_type, 'supplement');
  assert.equal(writes[0].price_adjustment_amount, 9.9);
});

test('editing a returned item keeps its delivery status and hides legacy refund amounts', async () => {
  const { context, item, writes, logs, node } = setup('已送达');
  Object.assign(item, { wash_decision: 'returned', price_adjustment_type: 'refund', price_adjustment_amount: 25 });
  assert.doesNotMatch(context.renderLabelRows([item]), /¥25/);
  context.openWashAdjustmentDialog(item.id, item);
  assert.equal(node('washAdjustmentDecision').value, 'returned');
  assert.equal(node('washAdjustmentAmountField').classList.contains('hidden'), true);
  node('washAdjustmentReason').value = '客户要求退洗，已送回';
  await context.saveWashAdjustment(item.id);
  assert.equal(writes[0].wash_decision, 'returned');
  assert.equal('item_status' in writes[0], false);
  assert.equal(writes[0].price_adjustment_amount, 0);
  assert.equal(logs[0].status, '退洗');
});
