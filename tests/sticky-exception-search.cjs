const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '../app.js'), 'utf8');
const startup = source.lastIndexOf('\nif ("serviceWorker" in navigator)');

test('search offset follows header resizing and replaces the previous observer on reload', () => {
  let height = 82.4;
  let offset;
  const observers = [];
  const header = { getBoundingClientRect: () => ({ height }) };
  const container = { style: { setProperty(name, value) {
    assert.equal(name, '--exception-top-offset'); offset = value;
  } } };
  class ResizeObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(element) { assert.equal(element, header); }
    disconnect() { this.disconnected = true; }
  }
  const context = vm.createContext({ URL, URLSearchParams, ResizeObserver,
    window: { location: { search: '' } },
    document: { getElementById: () => container, querySelector: () => header },
  });
  vm.runInContext(source.slice(0, startup), context);
  context.updateExceptionSearchOffset();
  assert.equal(offset, '83px');
  height = 64;
  observers[0].callback();
  assert.equal(offset, '64px');
  context.updateExceptionSearchOffset();
  assert.equal(observers[0].disconnected, true);
  assert.equal(observers.length, 2);
});

test('search initializes without ResizeObserver and tolerates a missing header', () => {
  let offset;
  let header = { getBoundingClientRect: () => ({ height: 76 }) };
  const context = vm.createContext({ URL, URLSearchParams,
    window: { location: { search: '' } },
    document: {
      getElementById: () => ({ style: { setProperty(_name, value) { offset = value; } } }),
      querySelector: () => header,
    },
  });
  vm.runInContext(source.slice(0, startup), context);
  context.updateExceptionSearchOffset();
  assert.equal(offset, '76px');
  header = null;
  assert.doesNotThrow(() => context.updateExceptionSearchOffset());
});
