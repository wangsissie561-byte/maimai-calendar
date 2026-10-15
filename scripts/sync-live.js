// Read-only MCP integration smoke test / local preview sync. Never print credentials.
const fs = require('node:fs'), path = require('node:path');
const C = require('../src/core'), MCP = require('../src/mcp');
async function main() {
  const args = process.argv.slice(2), index = args.indexOf('--token-file');
  let token = process.env.MCD_MCP_TOKEN;
  if (index >= 0 && args[index+1]) {
    const text = fs.readFileSync(path.resolve(args[index+1]), 'utf8');
    const line = text.split(/\r?\n/).find(l => l.startsWith('MCD_MCP_TOKEN='));
    if (line) token = line.slice('MCD_MCP_TOKEN='.length).trim();
  }
  const transport = async (url, headers, body) => {
    const r = await fetch(url, {method:'POST', headers, body, redirect:'error', signal:AbortSignal.timeout(25000)});
    return {status:r.status, headers:Object.fromEntries(r.headers.entries()), body:await r.text()};
  };
  const snapshot = await MCP.calendar(transport, token, C);
  const folder = path.resolve(__dirname, '../.private'); fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(path.join(folder,'live.json'), JSON.stringify(snapshot,null,2));
  const today = C.chinaDate(new Date());
  console.log(JSON.stringify({success:true, source:snapshot.source, dateCount:Object.keys(snapshot.days).length, today, firstProduct:snapshot.days[today] || null, saved:'.private/live.json'}));
}
main().catch(()=>{console.error('MCP sync failed. Check network / token. Prior snapshot preserved.');process.exitCode=1;});
