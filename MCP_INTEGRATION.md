# MCP 集成说明

## 实际连接

- Server：`https://mcp.mcd.cn`
- Transport：Streamable HTTP，支持 `application/json` 及 SSE `text/event-stream`。
- 身份验证：`Authorization: Bearer ${MCD_MCP_TOKEN}`。iPhone 端从 Scriptable Keychain 读取；开发端从环境变量或明确指定的本地文件读取。
- **实际调用 Tool：`campaign-calendar`，入参 `{}`。** 项目只暴露这一条固定的只读调用。

## 调用流程

1. `initialize`：协商协议版本，携带 clientInfo。
2. `notifications/initialized`：发送初始化完成通知。
3. `tools/call`：调用 `campaign-calendar`。
4. 携带服务端返回的 `Mcp-Session-Id`；按 RPC id 匹配 JSON 或 SSE 结果。
5. 验证 `isError`、`success`、`code` 和 `data.dailyList`，只在成功时替换缓存。

## 使用字段

- `dailyList[].date`：资讯所属展示日期，不自动当作活动首发日或有效期。
- `dailyList[].events[]`：保持官方返回顺序，按 activityCode/resourceId 去重。
- `articleDto.title`、`articleDto.content`：标题优先，其次正文；通过可审查词表取第一个匹配产品。
- `data.currentTime` / `datetime`：记录资讯来源时间。

规范化输出只保留日期、单个产品名和图标类别，不保存 Token、会员 ID、订单、地址、原始完整响应或个人生日。

## 业务价值

把长篇营销资讯转换为日期上的一个小图标与一行中性摘要，减少信息负担。生日与节日逻辑在本机运行，与 MCP 资讯相互独立，不虚构生日优惠、活动资格或到店可售状态。

## 实现与验证

- `src/mcp.js`：手机与 Node 端共享 MCP 客户端。
- `scripts/sync-live.js`：真实连接探测，保存忽略的 `.private/live.json`。
- `src/core.js`：校验、去重、首个产品与日期逻辑。
- `src/scriptable.js`：钥匙串配置、缓存、渲染和系统刷新建议。
- 离线协议测试验证工具限制、请求头、会话和错误处理；真实查询结果见 `docs/VALIDATION.md`。

参考：[麦当劳 MCP 官方文档](https://open.mcd.cn/mcp/doc)。工具和协议可能更新，应以实际服务返回为准。
