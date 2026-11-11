const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '../app.js'), 'utf8');
const startup = source.lastIndexOf('\nif ("serviceWorker" in navigator)');
assert.ok(startup > 0);

function setup({ role = 'admin', original = false, confirmed = true, result, pending = false } = {}) {
  const order = { id: 'order-a', order_no: 'DY-261111-A', source: 'douyin' };
  const confirmations = [], calls = [], refreshes = [];
  let closeCount = 0, finish;
  const response = pending ? new Promise((resolve) => { finish = resolve; })
    : Promise.resolve(result ?? { data: { id: order.id } });
  const button = {
    disabled: false,
    dataset: { deleteOrder: order.id },
  };
  let activeButton = button;
  const dialog = {
    open: true,
    querySelector: () => activeButton,
    close() { this.open = false; closeCount += 1; },
  };
  const message = {}, status = {};
  const nodes = { orderDialog: dialog, orderDeleteMessage: message, adminOrderDeleteStatus: status };
  const confirm = (message) => { confirmations.push(message); return confirmed; };
  const client = {
    from(table) {
      calls.push(['from', table]);
      return { delete() {
        calls.push(['delete']);
        return { eq(column, value) {
          calls.push(['eq', column, value]);
          return { select(columns) {
            calls.push(['select', columns]);
            return { maybeSingle: () => response };
          } };
        } };
      } };
    },
  };
  const context = vm.createContext({
    URL,
    URLSearchParams,
    window: { location: { search: original ? '?env=original' : '' } },
    document: {
      getElementById: (id) => nodes[id],
      querySelector: () => null,
      querySelectorAll: () => [],
    },
    localStorage: { getItem: () => null },
    client, role, confirm, refreshes,
  });
  vm.runInContext(source.slice(0, startup), context);
  vm.runInContext(`
    sb = client;
    currentUser = { id: "staff" };
    currentProfile = { role };
    refreshAll = async () => refreshes.push("all");
  `, context);
  return {
    button, dialog, confirmations, calls, refreshes, finish, message, status,
    get closeCount() { return closeCount; },
    renderOrder(id) {
      activeButton = { disabled: id === order.id, dataset: { deleteOrder: id } };
      return activeButton;
    },
    remove: () => context.deleteOrderFromDialog(order, button),
  };
}

test('delete order requires the current business project, admin role and confirmation', async () => {
  for (const options of [{ role: 'courier' }, { original: true }]) {
    const s = setup(options);
    await s.remove();
    assert.deepEqual(s.calls, []);
    assert.deepEqual(s.confirmations, []);
    assert.equal(s.dialog.open, true);
  }
  const s = setup({ confirmed: false });
  await s.remove();
  assert.match(s.confirmations[0], /DY-261111-A/);
  assert.match(s.confirmations[0], /抖音券码仍会保留/);
  assert.deepEqual(s.calls, []);
  assert.equal(s.dialog.open, true);
});

test('deletes only the selected ID, closes its dialog and refreshes after success', async () => {
  const s = setup();
  await s.remove();
  assert.deepEqual(s.calls, [['from', 'orders'], ['delete'], ['eq', 'id', 'order-a'], ['select', 'id']]);
  assert.equal(s.closeCount, 1);
  assert.deepEqual(s.refreshes, ['all']);
  assert.match(s.status.innerHTML, /已删除订单 DY-261111-A/);
});

test('a missing or rejected deletion leaves the dialog usable', async () => {
  for (const result of [{ data: null }, { error: { code: '42501', message: 'permission denied' } }]) {
    const s = setup({ result });
    await s.remove();
    assert.equal(s.calls.length, 4);
    assert.equal(s.dialog.open, true);
    assert.equal(s.button.disabled, false);
    assert.deepEqual(s.refreshes, []);
    assert.match(s.message.innerHTML, /未确认删除/);
  }
});

test('an in-flight deletion is deduplicated and leaves a different order dialog open', async () => {
  const s = setup({ pending: true });
  const first = s.remove();
  assert.equal(s.button.disabled, true);
  const duplicate = s.remove();
  assert.equal(s.calls.length, 4);
  s.renderOrder('order-b');
  s.finish({ data: { id: 'order-a' } });
  await Promise.all([first, duplicate]);
  assert.equal(s.dialog.open, true);
  assert.equal(s.closeCount, 0);
  assert.deepEqual(s.refreshes, ['all']);
});

test('a rerendered dialog for the same order recovers after a failed request', async () => {
  const s = setup({ pending: true });
  const request = s.remove();
  const replacement = s.renderOrder('order-a');
  assert.equal(replacement.disabled, true);
  s.finish({ data: null });
  await request;
  assert.equal(replacement.disabled, false);
  assert.equal(s.dialog.open, true);
  assert.match(s.message.innerHTML, /未确认删除/);
});
