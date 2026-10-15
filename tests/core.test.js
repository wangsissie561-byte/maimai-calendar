const {test} = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core');
function response(dailyList) { return {result: {structuredContent: {success: true, code: 200, data: {currentTime: '2026-10-14 14:00:00', dailyList}}}}; }
function event(title, content, code) {return {activityCode: code, articleDto: {title, content}};}
test('first product follows official event order, skips non-product promotion, ignores other products', () => {
  const s = C.normalize(response([{date: '2026-10-14', events: [event('联名预告','', 'hat'), event('韩式风味蘸酱上新','鸡薯双全盒，蓝莓麦旋风', 'sauce'), event('麦旋风上新','', 'ice')]}]));
  assert.deepEqual(s.days['2026-10-14'], {product: '韩式风味蘸酱', icon: 'chicken'});
  assert.equal(Object.keys(s.days['2026-10-14']).length, 2);
});
test('match earliest product occurrence, longest specific product wins at same position', () => {
  assert.equal(C.eventProduct(event('蓝莓爆爆珠麦旋风和薯条','')).name, '蓝莓爆爆珠麦旋风');
  assert.equal(C.eventProduct(event('薯条和蓝莓爆爆珠麦旋风','')).name, '薯条');
});
test('business errors and unstructured marketing text fail instead of becoming empty success', () => {
  assert.throws(() => C.normalize({result:{structuredContent:{success:false, code:200}}}));
  assert.throws(() => C.normalize({result:{content:[{type:'text',text:'今天没有问题'}]}}));
});
test('duplicate date entries merge without replacing first matched product', () => {
  const s = C.normalize(response([{date:'2026-10-14',events:[event('薯条','', 'one')]},{date:'2026-10-14',events:[event('甜筒','', 'two')]}]));
  assert.equal(s.days['2026-10-14'].product, '薯条');
});
test('invalid dates rejected; month grid never loses date24 or leap day', () => {
  assert.equal(C.validDate('2026-02-29'),false);
  for (let year=2026; year<=2030; year++) for(let month=1;month<=12;month++) {
    const key=`${year}-${String(month).padStart(2,'0')}-01`, grid=C.monthGrid(key), real=grid.filter(Boolean);
    assert.equal(grid.length%7,0); assert.equal(real.length,new Date(Date.UTC(year,month,0)).getUTCDate());
    assert.equal(new Set(real).size,real.length); assert.ok(real.some(k=>k.endsWith('-24')));
  }
});
test('week crosses month/year correctly; China date changes at UTC16:00', () => {
  assert.deepEqual(C.weekGrid('2027-01-01'), ['2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03']);
  assert.equal(C.chinaDate(new Date('2026-10-13T16:00:00Z')),'2026-10-14');
});
test('birthday > holiday; auto theme off; leap-day birthday never guessed', () => {
  const holidays={'2026-09-25':{id:'mid-autumn',hero:'moon',icon:'moon',greeting:'月亮很圆，快乐也圆'}};
  assert.equal(C.chooseTheme('2026-09-25',{birthday:'09-25'},holidays).special,'birthday');
  assert.equal(C.chooseTheme('2026-09-25',{autoTheme:false},holidays).special,null);
  assert.equal(C.chooseTheme('2026-02-28',{birthday:'02-29'},{}).special,null);
  assert.equal(C.chooseTheme('2028-02-29',{birthday:'02-29'},{}).special,'birthday');
  assert.equal(C.birthdayValid('02-30'),false);
});
test('stale cache suppresses product summary but preserves special greeting', () => {
  const snapshot={days:{'2026-10-14':{product:'薯条',icon:'fries'}}};
  assert.equal(C.model('2026-10-14',snapshot,{}, {},true).summary,'资讯待更新');
  assert.equal(C.model('2026-10-14',snapshot,{birthday:'10-14'}, {},true).summary,'祝你生日快乐！');
});
test('SSE parser selects own response and supports multiline events', () => {
  assert.equal(C.parseRPC('event: message\ndata: {"id":1,"result":{}}\n\nevent: message\ndata: {"id":2,"result":{"ok":true}}\n\n',2).result.ok,true);
  assert.throws(()=>C.parseRPC('data: {"id":3}\n\n',2));
});
test('cache freshness expires on China midnight even within six hours', () => {
  const snapshot={source:'mcd-mcp',fetchedAt:'2026-10-13T15:59:00Z'};
  assert.equal(C.cacheFresh(snapshot,new Date('2026-10-13T16:01:00Z')),false);
});
