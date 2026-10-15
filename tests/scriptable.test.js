const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core'),MCP=require('../src/mcp'),Layout=require('../src/layout');
const holidays=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/holidays.json'),'utf8'));
const source=fs.readFileSync(path.join(__dirname,'../src/scriptable.js'),'utf8');
test('birthday content fits all families including a six-row month and hides campaign copy',()=>{
 for(const key of ['2026-10-14','2026-08-31'])for(const family of ['small','medium','large']){
  const model=C.model(key,{days:{[key]:{product:'薯条',icon:'fries'}}},{birthday:key.slice(5)},{},false);
  const p=Layout.plan(model,family,C);
  for(const op of p.ops.filter(o=>['text','image'].includes(o.kind))){
   assert.ok(op.x>=0&&op.y>=0&&op.x+op.width<=p.size.width&&op.y+op.height<=p.size.height,`${family}: ${op.value||op.name}`);
  }
  assert.ok(!p.ops.some(o=>o.value&&o.value.includes('薯条')));
  if(family==='large')assert.equal(p.ops.filter(o=>o.kind==='text'&&/^\d+$/.test(o.value)).length,32);
 }
});
async function run(family,settings,key){
 const calls={text:[],images:[],urls:[],written:[],widget:null};
 const now=new Date(key+'T12:00:00+08:00');
 const keychain=new Map([['maimai-calendar.settings.v1',JSON.stringify(settings)]]);
 const snapshot={source:'mcd-mcp',fetchedAt:now.toISOString(),sourceTime:key+' 12:00:00',days:{[key]:{product:'韩式风味蘸酱',icon:'chicken'}}};
 const manager={libraryDirectory:()=>'/lib',documentsDirectory:()=>'/docs',joinPath:(a,b)=>a+'/'+b,fileExists:()=>true,createDirectory:()=>{},isFileStoredIniCloud:()=>false,readString:()=>JSON.stringify(snapshot),readImage:p=>({path:p}),writeImage:()=>{},writeString:(p,t)=>calls.written.push({p,t})};
 class FakeDate extends Date{constructor(...args){super(...(args.length?args:[now.getTime()]))}static now(){return now.getTime()}}
 class DrawContext{setFillColor(){}fillRect(){}fillEllipse(){}drawImageInRect(image){calls.images.push(image)}setTextColor(){}setFont(){}setTextAlignedCenter(){}setTextAlignedLeft(){}drawTextInRect(text){calls.text.push(text)}getImage(){return {rendered:true}}}
 class ListWidget{setPadding(){}addSpacer(){}set url(value){calls.urls.push(value)}}
 const modules={MaiCalendarCore:C,MaiCalendarMCP:MCP,MaiCalendarLayout:Layout,MaiCalendarHolidays:holidays};
 const context={FileManager:{local:()=>manager,iCloud:()=>manager},Keychain:{contains:k=>keychain.has(k),get:k=>keychain.get(k),set:(k,v)=>keychain.set(k,v)},importModule:p=>modules[path.basename(p,'.js')],DrawContext,ListWidget,Size:class{constructor(w,h){this.width=w;this.height=h}},Rect:class{},Color:class{},Font:{boldRoundedSystemFont:()=>{},systemFont:()=>{}},Script:{setWidget:w=>calls.widget=w,complete:()=>{}},config:{runsInWidget:true,widgetFamily:family},args:{widgetParameter:''},Date:FakeDate,console};
 await vm.runInNewContext('(async()=>{'+source+'})()',context);
 return calls;
}
test('Scriptable three sizes execute through official API-shaped stubs without business links',async()=>{
 for(const family of ['small','medium','large']){
  const calls=await run(family,{skin:'picnic'},'2026-10-14');
  assert.ok(calls.widget);assert.deepEqual(calls.urls,[]);assert.ok(calls.text.some(t=>t.includes('韩式风味蘸酱')));assert.equal(calls.images.length, family==='medium'?0:1);
 }
});
test('birthday is cake, exact greeting, and no candle symbols in any widget size',async()=>{
 for(const family of ['small','medium','large']){
  const calls=await run(family,{skin:'picnic',birthday:'10-14'},'2026-10-14');
  assert.ok(calls.text.join('').includes('祝你生日快乐！'));assert.ok(!calls.text.some(t=>t.includes('🕯')));
  assert.ok(calls.images.some(i=>i.path.endsWith('birthday-v2.png')));
  assert.ok(!calls.text.some(t=>t.includes('韩式风味蘸酱')));
 }
});
test('mid-autumn and spring festival execute on verified dates and preserve all month numbers',async()=>{
 for(const [key,greeting,last] of [['2026-09-25','月亮很圆，快乐也圆','30'],['2026-02-17','新的一年，快乐加满','28']]){
  const calls=await run('large',{skin:'picnic'},key);
  assert.ok(calls.text.includes(greeting));assert.ok(calls.text.includes('24'));assert.ok(calls.text.includes(last));
 }
});
test('all generated day text and markers fit before summary even in six-week months',()=>{
 const m=C.model('2026-08-31',{days:{'2026-08-31':{product:'薯条',icon:'fries'}}},{},{},false);
 const plan=Layout.plan(m,'large',C),marker=plan.ops.find(o=>o.kind==='text'&&o.value==='🍟');
 assert.ok(marker.y+marker.height<=345);assert.equal(m.month.length,42);
});
