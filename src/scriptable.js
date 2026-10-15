// Variables used by Scriptable.
// icon-color: yellow; icon-glyph: calendar-alt;
// 麦麦日历 — independent contest work, read-only MCP. No token in source.
const fm = FileManager.local();
const lib = fm.joinPath(fm.libraryDirectory(), 'MaiCalendar');
if (!fm.fileExists(lib)) fm.createDirectory(lib, true);

async function loadLocalModule(name) {
  for (const manager of [FileManager.local(), FileManager.iCloud()]) {
    const path = manager.joinPath(manager.documentsDirectory(), name + '.js');
    if (!manager.fileExists(path)) continue;
    if (manager.isFileStoredIniCloud(path)) await manager.downloadFileFromiCloud(path);
    return importModule(path);
  }
  throw new Error('缺少 ' + name + '.js，请将安装包文件放入 Scriptable 文件夹');
}
const C = await loadLocalModule('MaiCalendarCore');
const MCP = await loadLocalModule('MaiCalendarMCP');
const Layout = await loadLocalModule('MaiCalendarLayout');
const holidayData = await loadLocalModule('MaiCalendarHolidays');
const TOKEN_KEY = 'maimai-calendar.mcp-token.v1';
const SETTINGS_KEY = 'maimai-calendar.settings.v1';
let settings;
try { settings = Keychain.contains(SETTINGS_KEY) ? JSON.parse(Keychain.get(SETTINGS_KEY)) : {}; } catch (_) { settings = {}; }
settings = Object.assign({skin:'picnic',birthday:'',autoTheme:true},settings);
let snapshot = null;
const cachePath = fm.joinPath(lib, 'calendar.json');
try { if (fm.fileExists(cachePath)) snapshot = JSON.parse(fm.readString(cachePath)); } catch (_) { /* recover with live sync */ }

async function alertMessage(title, message) {
  const a = new Alert(); a.title=title; a.message=message; a.addAction('知道了'); await a.presentAlert();
}
async function sync() {
  if (!Keychain.contains(TOKEN_KEY)) throw new Error('请先在 Scriptable 中设置 MCP Token');
  const transport = async (url, headers, body) => {
    const r = new Request(url); r.method='POST'; r.headers=headers; r.body=body; r.timeoutInterval=18;
    const text = await r.loadString();
    return {status:r.response.statusCode, headers:r.response.headers || {}, body:text};
  };
  const next = await MCP.calendar(transport, Keychain.get(TOKEN_KEY), C);
  fm.writeString(cachePath, JSON.stringify(next)); snapshot=next;
}
async function prepareAssets() {
  for (const name of ['fries','bag','cup','birthday','birthday-v2','moon','lantern']) {
    const local=fm.joinPath(lib,name+'.png');
    if(fm.fileExists(local))continue;
    for(const manager of [FileManager.local(),FileManager.iCloud()]){
      const p=manager.joinPath(manager.joinPath(manager.documentsDirectory(),'MaiCalendarAssets'),name+'.png');
      if(!manager.fileExists(p))continue;
      if(manager.isFileStoredIniCloud(p))await manager.downloadFileFromiCloud(p);
      fm.writeImage(local,manager.readImage(p));break;
    }
  }
}
function imageFor(name) {
  const p=fm.joinPath(lib,name+'.png');
  return fm.fileExists(p)?fm.readImage(p):null;
}
function draw(model,family) {
  const plan=Layout.plan(model,family,C),d=new DrawContext();
  d.size=new Size(plan.size.width,plan.size.height);d.opaque=true;d.respectScreenScale=true;
  for(const op of plan.ops){
    if(op.kind==='background'){d.setFillColor(new Color(op.color));d.fillRect(new Rect(0,0,plan.size.width,plan.size.height));}
    else if(op.kind==='rect'){d.setFillColor(new Color(op.color));d.fillRect(new Rect(op.x,op.y,op.width,op.height));}
    else if(op.kind==='ellipse'){d.setFillColor(new Color(op.color));d.fillEllipse(new Rect(op.x,op.y,op.width,op.height));}
    else if(op.kind==='image'){const img=imageFor(op.name);if(img)d.drawImageInRect(img,new Rect(op.x,op.y,op.width,op.height));}
    else if(op.kind==='text'){
      d.setTextColor(new Color(op.color));d.setFont(op.bold?Font.boldRoundedSystemFont(op.font):Font.systemFont(op.font));
      if(op.align==='center')d.setTextAlignedCenter();else d.setTextAlignedLeft();
      d.drawTextInRect(op.value,new Rect(op.x,op.y,op.width,op.height));
    }
  }
  const w=new ListWidget();w.setPadding(0,0,0,0);w.backgroundImage=d.getImage();w.addSpacer();
  const now=new Date(),tomorrow=new Date(Date.parse(C.chinaDate(now)+'T00:00:00+08:00')+86400000);
  w.refreshAfterDate=new Date(Math.min(now.getTime()+3*3600000,tomorrow.getTime()+60000));
  // No url is set: no coupon/ordering links or individual date tap targets.
  return w;
}
async function settingsMenu(){
  while(true){
    const a=new Alert();a.title='麦麦日历';a.message='日期有标记，今天有新鲜事。';
    ['预览小组件','设置 / 更新 MCP Token','选择日常皮肤','设置生日','自动特别日子换肤：'+(settings.autoTheme?'开启':'关闭'),'刷新活动资讯','删除 Token','清除生日与本机缓存'].forEach(s=>a.addAction(s));a.addCancelAction('完成');
    const choice=await a.presentSheet();if(choice<0)return;
    if(choice===0){const p=new Alert();p.title='选择尺寸';['小尺寸','中尺寸','大尺寸'].forEach(s=>p.addAction(s));p.addCancelAction('取消');const n=await p.presentSheet();if(n>=0){const key=C.chinaDate(new Date()),model=C.model(key,snapshot,settings,holidayData.dates,!C.cacheFresh(snapshot,new Date()));const w=draw(model,['small','medium','large'][n]);await w[['presentSmall','presentMedium','presentLarge'][n]]();}}
    if(choice===1){const p=new Alert();p.title='设置 MCP Token';p.message='Token 只存入本机钥匙串，仅发送至 https://mcp.mcd.cn。';p.addSecureTextField('粘贴 Token');p.addAction('保存');p.addCancelAction('取消');if(await p.presentAlert()===0){const value=p.textFieldValue(0).trim();if(value){Keychain.set(TOKEN_KEY,value);try{await sync();await alertMessage('连接成功','活动资讯已更新。');}catch(_){await alertMessage('暂未连接成功','请检查 Token 和网络；现有缓存已保留。');}}}}
    if(choice===2){const p=new Alert();p.title='选择日常皮肤';Object.keys(C.SKINS).forEach(k=>p.addAction(C.SKINS[k].name));p.addCancelAction('取消');const n=await p.presentSheet();if(n>=0)settings.skin=Object.keys(C.SKINS)[n];}
    if(choice===3){const p=new Alert();p.title='你的生日';p.message='填写公历月日，例如 10-14。留空清除；2月29日仅在闰年当天显示。';p.addTextField('MM-DD',settings.birthday);p.addAction('保存');p.addCancelAction('取消');if(await p.presentAlert()===0){const value=p.textFieldValue(0).trim();if(!value||C.birthdayValid(value))settings.birthday=value;else await alertMessage('日期格式不正确','请填写有效公历月日，例如 10-14。');}}
    if(choice===4)settings.autoTheme=!settings.autoTheme;
    if(choice===5){try{await sync();await alertMessage('已更新','仍只展示每天的第一个可识别产品。');}catch(_){await alertMessage('更新失败','已保留之前的资讯。请检查网络或更新 Token。');}}
    if(choice===6){if(Keychain.contains(TOKEN_KEY))Keychain.remove(TOKEN_KEY);await alertMessage('已删除','不再调用麦当劳 MCP，已有缓存暂时保留。');}
    if(choice===7){settings.birthday='';snapshot=null;if(fm.fileExists(cachePath))fm.remove(cachePath);await alertMessage('已清除','生日与活动缓存已清除；Token 未变。');}
    Keychain.set(SETTINGS_KEY,JSON.stringify(settings));
  }
}
await prepareAssets();
if(!config.runsInWidget)await settingsMenu();
else{
  const parameter=String(args.widgetParameter||'').trim();
  if(C.SKINS[parameter])settings.skin=parameter;
  if(!C.cacheFresh(snapshot,new Date())&&Keychain.contains(TOKEN_KEY)){try{await sync();}catch(_){/* cached data stays local; summary indicates staleness */}}
  const model=C.model(C.chinaDate(new Date()),snapshot,settings,holidayData.dates,!C.cacheFresh(snapshot,new Date()));
  const w=draw(model,config.widgetFamily||'medium');Script.setWidget(w);
}
Script.complete();
