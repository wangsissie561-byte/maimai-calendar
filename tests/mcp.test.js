const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../src/core'), MCP=require('../src/mcp');
test('only calendar is called; session, protocol and authorization are carried correctly',async()=>{
  const calls=[];
  const transport=async(url,headers,body)=>{
    const b=JSON.parse(body); calls.push({url,headers,b});
    if(b.method==='initialize')return {status:200,headers:{'Mcp-Session-Id':'session-one'},body:JSON.stringify({id:b.id,result:{protocolVersion:'2025-03-26'}})};
    if(b.method==='notifications/initialized')return {status:202,headers:{},body:''};
    return {status:200,headers:{},body:JSON.stringify({id:b.id,result:{structuredContent:{success:true,code:200,data:{dailyList:[]}}}})};
  };
  const out=await MCP.calendar(transport,'TEST_ONLY_NOT_A_REAL_TOKEN',C);
  assert.equal(out.source,'mcd-mcp');assert.equal(calls.length,3);
  assert.equal(calls[2].b.params.name,'campaign-calendar');
  assert.equal(calls[2].headers['Mcp-Session-Id'],'session-one');
  assert.equal(calls[2].headers.Authorization,'Bearer TEST_ONLY_NOT_A_REAL_TOKEN');
});
test('missing or rejected token cannot trigger successful calendar output',async()=>{
  await assert.rejects(MCP.calendar(()=>{},'',C));
  await assert.rejects(MCP.calendar(async()=>({status:401,headers:{},body:'secret error'}),'TEST',C),/Token/);
});
