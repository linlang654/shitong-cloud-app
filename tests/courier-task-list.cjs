const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '../app.js'), 'utf8');
const startup = source.lastIndexOf('\nif ("serviceWorker" in navigator)');
assert.ok(startup > 0);

function setup(tasks, failingTable) {
  const panel = { innerHTML: '' };
  const errors = [];
  const reads = [];
  const client = {
    from(table) {
      return {
        select() { return this; },
        order(field, { ascending }) {
          assert.equal(field, 'id');
          assert.equal(ascending, true);
          return this;
        },
        limit(size) { this.size = size; return this; },
        gt(field, id) {
          assert.equal(field, 'id');
          this.after = id;
          return this;
        },
        then(resolve) {
          reads.push([table, this.after]);
          if (table === failingTable) return resolve({ error: { message: 'timeout' } });
          const rows = tasks[table] || [];
          resolve({ data: rows.filter((row) => !this.after || row.id > this.after).slice(0, this.size) });
        },
      };
    },
  };
  const context = vm.createContext({
    client,
    URL,
    URLSearchParams,
    navigator: { userAgent: 'test' },
    window: { location: { search: '' } },
    document: {
      body: { dataset: { appMode: 'courier' } },
      getElementById: (id) => id === 'courierRouteTaskList' ? panel : null,
    },
    console: { error: (...args) => errors.push(args) },
  });
  vm.runInContext(source.slice(0, startup), context);
  vm.runInContext(`sb = client;
    currentUser = { id: 'courier' };
    retryPickupSchemaAvailable = true;
    todayDate = () => '2026-11-11';
  `, context);
  return { context, panel, reads, errors };
}

function oldTasks(status) {
  return Array.from({ length: 1005 }, (_, index) => ({
    id: String(index).padStart(4, '0'),
    pickup_date: '2026-10-01',
    outbound_date: '2026-10-01',
    status,
  }));
}

function order(id, customer_name) {
  return { id, customer_name, school: '师大', campus: '东区', building: '2栋', order_items: [] };
}

test('courier reads past old task limits and counts future appointments separately from the due route', async () => {
  const { context, panel, reads } = setup({
    pickup_tasks: [
      ...oldTasks('已取件'),
      { id: 'new-1', pickup_date: '2026-11-11', status: '待取件', orders: order('p1', '今日取件') },
      { id: 'new-2', pickup_date: '2026-11-12', status: '待取件', orders: order('p2', '明天取件') },
    ],
    pickup_retry_tasks: [
      ...oldTasks('已补取'),
      { id: 'new-3', pickup_date: '2026-11-11', status: '待补取', order_items: { id: 'i1', orders: order('p3', '今日补取') } },
    ],
    return_tasks: [
      ...oldTasks('已送达'),
      { id: 'new-4', outbound_date: '2026-11-11', status: '待送回', order_items: { id: 'i2', orders: order('p4', '今日送回') } },
    ],
  });
  await context.loadCourierTasks();
  for (const table of ['pickup_tasks', 'pickup_retry_tasks', 'return_tasks']) {
    assert.deepEqual(reads.filter(([name]) => name === table).map(([, after]) => after), [
      undefined, '0299', '0599', '0899',
    ]);
  }
  assert.match(panel.innerHTML, /<strong>3<\/strong><span>全部待取/);
  assert.match(panel.innerHTML, /已到期取件 2 · 未来预约 1/);
  assert.match(panel.innerHTML, /<strong>1<\/strong><span>其中补取/);
  assert.match(panel.innerHTML, /<strong>1<\/strong><span>待送回/);
  assert.match(panel.innerHTML, /今日取件/);
  assert.match(panel.innerHTML, /今日补取/);
  assert.match(panel.innerHTML, /今日送回/);
  assert.doesNotMatch(panel.innerHTML, /明天取件/);
});

test('a failed courier request shows a load error instead of an empty-list claim', async () => {
  const { context, panel, errors } = setup({}, 'pickup_tasks');
  await context.loadCourierTasks();
  assert.equal(errors.length, 1);
  assert.match(panel.innerHTML, /取件任务加载失败/);
  assert.doesNotMatch(panel.innerHTML, /当前没有未完成/);
});
