const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist'),ios=path.join(dist,'Scriptable');
fs.mkdirSync(ios,{recursive:true});
for(const [source,dest] of [['core.js','MaiCalendarCore.js'],['mcp.js','MaiCalendarMCP.js'],['layout.js','MaiCalendarLayout.js'],['scriptable.js','麦麦日历.js']]){
 const content=fs.readFileSync(path.join(root,'src',source),'utf8');
 if(source==='scriptable.js')new vm.Script('(async()=>{'+content+'})()');else new vm.Script(content);
 fs.writeFileSync(path.join(ios,dest),content);
}
const holidays=JSON.parse(fs.readFileSync(path.join(root,'data/holidays.json'),'utf8'));
fs.writeFileSync(path.join(ios,'MaiCalendarHolidays.js'),'module.exports = '+JSON.stringify(holidays)+';\n');
fs.mkdirSync(path.join(ios,'MaiCalendarAssets'),{recursive:true});
for(const name of ['fries','bag','cup','birthday','birthday-v2','moon','lantern'])fs.copyFileSync(path.join(root,'assets',name+'.png'),path.join(ios,'MaiCalendarAssets',name+'.png'));
fs.copyFileSync(path.join(root,'docs/INSTALL_IOS.md'),path.join(dist,'iPhone安装说明.md'));
fs.copyFileSync(path.join(root,'docs/PRIVACY.md'),path.join(dist,'隐私说明.md'));
console.log('Built Scriptable installation folder; all JS syntax checked.');
