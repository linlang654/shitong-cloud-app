const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '../app.js'), 'utf8');
const startup = source.lastIndexOf('\nif ("serviceWorker" in navigator)');
assert.ok(startup > 0);

function element(properties = {}) {
  return {
    classList: { toggle(_name, hidden) { this.hidden = hidden; } },
    dataset: {},
    ...properties,
  };
}

function group(tagName, searchTexts, open = false) {
  const cards = searchTexts.map((exceptionSearch) => element({ dataset: { exceptionSearch } }));
  const count = element();
  return element({ tagName, open, cards, count, querySelectorAll: () => cards, querySelector: () => count });
}

test('exception search finds archived records, supports combined terms, and restores the list when cleared', () => {
  const open = group('SECTION', ['wx100 李同学 13900000001 待客服']);
  const address = group('DETAILS', ['wx200 赵同学 师大 东区 2栋'], true);
  const closed = group('DETAILS', ['wx300 王同学 261112001 已解决 配送异常']);
  const input = { value: 'ＷＸ３００ 配送异常' };
  const result = element();
  const nodes = { exceptionSearch: input, exceptionSearchResult: result, adminExceptions: { querySelectorAll: () => [open, address, closed] } };
  const context = vm.createContext({
    URL, URLSearchParams, window: { location: { search: '' } },
    document: { getElementById: (id) => nodes[id] },
  });
  vm.runInContext(source.slice(0, startup), context);

  context.applyExceptionSearch();
  assert.equal(open.classList.hidden, true);
  assert.equal(address.classList.hidden, true);
  assert.equal(closed.classList.hidden, false);
  assert.equal(closed.open, true);
  assert.equal(result.textContent, '找到 1 条记录');

  input.value = '找不到的号码';
  context.applyExceptionSearch();
  assert.equal(closed.classList.hidden, true);
  assert.match(result.textContent, /未找到匹配/);

  input.value = '';
  context.applyExceptionSearch();
  assert.equal(closed.open, false);
  assert.equal(address.open, true);
  assert.equal(open.count.textContent, '1 单');
  assert.equal(open.cards[0].classList.hidden, false);
  assert.equal(result.classList.hidden, true);
});

test('ticket cards index customer details and both snapshot and current barcodes', () => {
  const context = vm.createContext({
    URL, URLSearchParams, window: { location: { search: '' } }, document: { getElementById: () => null },
  });
  vm.runInContext(source.slice(0, startup), context);
  const html = context.renderExceptionTicketCard({
    id: 'ticket-test', status: '已关闭', ticket_type: '配送异常', description: '地址已核对',
    barcode: '261111001',
    orders: { order_no: 'WX-0123', customer_name: '测试客户', phone: '13800000000' },
    order_items: { barcode: '261112002' },
  });
  assert.match(html, /data-exception-search="[^"]*wx-0123[^"]*测试客户[^"]*13800000000[^"]*261111001[^"]*261112002[^"]*配送异常/);
});
