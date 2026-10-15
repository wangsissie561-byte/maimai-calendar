(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined') module.exports = api; else root.MaiMCP = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const ENDPOINT = 'https://mcp.mcd.cn';
  async function calendar(transport, token, core) {
    if (!token || !token.trim()) throw new Error('请先设置 MCP Token');
    let session = null, protocol = '2025-03-26', nextId = 0;
    async function rpc(method, params, notification) {
      const id = ++nextId, body = {jsonrpc: '2.0', method};
      if (!notification) body.id = id;
      if (params !== undefined) body.params = params;
      const headers = {'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: 'Bearer ' + token.trim()};
      if (session) headers['Mcp-Session-Id'] = session;
      if (method !== 'initialize') headers['MCP-Protocol-Version'] = protocol;
      const response = await transport(ENDPOINT, headers, JSON.stringify(body));
      if (response.status === 401 || response.status === 403) throw new Error('Token 无效或未获授权，请重新设置');
      if (response.status < 200 || response.status >= 300) throw new Error('MCP 服务暂不可用');
      for (const key of Object.keys(response.headers || {})) if (key.toLowerCase() === 'mcp-session-id') session = response.headers[key];
      if (notification) return null;
      const obj = core.parseRPC(response.body, id);
      if (!obj || obj.error) throw new Error('MCP 协议请求失败');
      return obj;
    }
    const init = await rpc('initialize', {protocolVersion: protocol, capabilities: {}, clientInfo: {name: 'maimai-calendar', version: '0.1.0'}});
    protocol = init.result.protocolVersion || protocol;
    await rpc('notifications/initialized', undefined, true);
    // Fixed read-only tool. No orders, addresses, lottery, binding or spending tools are exposed.
    const result = await rpc('tools/call', {name: 'campaign-calendar', arguments: {}});
    return core.normalize(result);
  }
  return {calendar};
});
