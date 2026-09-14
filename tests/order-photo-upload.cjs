const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8');
const start = source.indexOf('const orderPhotoUploadsBusy =');
const end = source.indexOf('async function saveOrderAddressFromDialog', start);
async function run({ role = 'admin', files, conflict = false, uploadError = false } = {}) {
  const updates = [], uploads = [], removed = [];
  const message = { textContent: '' };
  const input = { files: files || [{ type: 'image/jpeg', size: 100, name: 'photo.jpg' }] };
  const button = {};
  const items = [{ id: 'a', image_links: 'https://old/photo.jpg' }, { id: 'b', image_links: null }];
  const context = {
    APP_MODE: 'admin', currentProfile: { role }, Set, Array, Error,
    RETURN_DELIVERY_MAX_BYTES: 10485760, RETURN_DELIVERY_STORED_MAX_BYTES: 819200,
    RETURN_DELIVERY_BUCKET: 'return-delivery-proof',
    document: { querySelector: (q) => q.includes('files') ? input : q.includes('message') ? message : button },
    text: (v) => String(v || '').trim(), crypto: { randomUUID: () => 'unique' },
    safeEvidenceFileName: (s) => s, prepareReturnDeliveryPhoto: async (f) => f,
    insertLog: async () => {}, showOrderDetail: async () => {},
    sb: {
      storage: { from: () => ({
        upload: async (path) => { uploads.push(path); return { error: uploadError ? new Error('upload failed') : null }; },
        getPublicUrl: () => ({ data: { publicUrl: 'https://new/photo.jpg' } }),
        remove: async (paths) => { removed.push(...paths); },
      }) },
      from: () => ({
        select: () => ({ eq: async () => ({ data: items }) }),
        update: (data) => {
          updates.push(data);
          const query = { eq: () => query, is: () => query, select: async () => ({ data: conflict ? [] : [{ id: 'a' }] }) };
          return query;
        },
      }),
    },
  };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end), context);
  await context.uploadOrderPhotosFromDialog('order1');
  return { updates, uploads, removed, message: message.textContent, button, input };
}
(async () => {
  const ok = await run();
  assert.equal(ok.updates.length, 2);
  assert.equal(ok.updates[0].image_links, 'https://old/photo.jpg\nhttps://new/photo.jpg');
  assert.equal(ok.updates[1].image_links, 'https://new/photo.jpg');
  assert.deepEqual(Object.keys(ok.updates[0]), ['image_links']);
  assert.equal(ok.button.disabled, false);
  assert.match(ok.message, /已补传 1 张/);
  assert.equal((await run({ role: 'factory' })).uploads.length, 0);
  assert.equal((await run({ files: [] })).uploads.length, 0);
  assert.equal((await run({ files: Array(7).fill({}) })).uploads.length, 0);
  assert.equal((await run({ files: [{ type: 'text/plain', size: 1 }] })).uploads.length, 0);
  assert.equal((await run({ files: [{ type: 'image/jpeg', size: 11000000 }] })).uploads.length, 0);
  assert.equal((await run({ uploadError: true })).updates.length, 0);
  const raced = await run({ conflict: true });
  assert.match(raced.message, /其他人修改/);
  assert.equal(raced.removed.length, 0);
  console.log('Order photo upload: 9 checks passed');
})();
