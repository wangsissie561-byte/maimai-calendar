# 麦麦日历（手机小组件版）

把今天的小快乐，放在桌面上。

麦麦日历是基于麦当劳 MCP 的 **iOS Scriptable 桌面小组件**。奶白纸感的日历上，用一个小图标标记活动资讯，并用一行文字告诉你今天有什么。它不是网页伪装的小组件，也不是独立上架 App。

> 独立参赛作品，非麦当劳官方产品。当前为 0.1.0 参赛候选版：第一版小、中、大尺寸已由用户安装并提供 iPhone 桌面截图确认；生日新版通过电脑预览与自动检查。iOS 后台刷新与跨日换肤尚未进行持续真机验证。

面向喜欢简约桌面、希望轻松了解麦当劳活动并记录特别日子的 iPhone 用户。无需 Mac，使用 Scriptable 即可安装。

## 特点

- 小、中、大三个桌面尺寸；三套日常皮肤：奶油纸笺、野餐格纹、奶黄晴天。
- 真实调用 `campaign-calendar`，按官方返回顺序，每天只显示第一个可识别产品；同一产品不展开其他活动或数量。
- 日期小图标和一行摘要，没有领券、购物、抽奖或营销跳转入口。
- 主动设置公历生日，生日当天显示不带蜡烛的小蛋糕和“祝你生日快乐！”。
- 生日使用独立贺卡布局：奶油白与淡粉底色、醒目祝福、笑脸餐盒和小蛋糕；大尺寸保留月历，当天不展示活动摘要。
- 春节、中秋限定插画；除夕、端午、重阳、国庆使用节日文字和标记。离线节日日期覆盖 2026—2028 年，不包含法定放假/调休信息。
- 生日优先于节日；可关闭自动换肤；三套日常皮肤可分别绑定不同桌面组件。
- Token 只存 iPhone 钥匙串，手机直连麦当劳官方 MCP；不读取订单、地址或定位，不建立共享账号后台。

## 给 iPhone 用户

1. 从 [App Store 安装 Scriptable](https://apps.apple.com/app/scriptable/id1405459188)。
2. [下载 iPhone 安装包](https://github.com/wangsissie561-byte/maimai-calendar/releases/download/v0.1.0/maimai-calendar-iphone.zip)，在“文件”App 解压。
3. 将 `Scriptable` 文件夹内的 5 个 `.js` 文件及 `MaiCalendarAssets` 文件夹放入 `iCloud Drive/Scriptable/`（放文件，不要再嵌套一层 `Scriptable`）。
4. 在 Scriptable 中运行“麦麦日历”，设置 MCP Token、皮肤和生日，预览三个尺寸。
5. 长按桌面添加 Scriptable 小组件，选择“麦麦日历”脚本。详细步骤见 [iPhone 安装说明](docs/INSTALL_IOS.md)。

脚本没有绑定自动领券、下单或扣积分动作。点按组件的系统行为由 Scriptable/iOS 决定；组件内不设置业务跳转链接。

## 给开发者 / 评审

需要 Node.js 18+、Python 3.10+，无需安装第三方包。

```sh
npm test
npm run build
python scripts/package.py
npm run preview
```

打开 `http://127.0.0.1:8766`，可查看三尺寸、切换皮肤、预览生日/中秋/春节。未配置 Token 时显示日历和特别日子，不伪造真实活动。

### 连接真实 MCP

设置环境变量 `MCD_MCP_TOKEN` 后运行：

```sh
node scripts/sync-live.js
```

本地开发也可指定被 Git 忽略的 Token 文件：

```sh
node scripts/sync-live.js --token-file /absolute/path/to/.env.local
```

预览服务刷新按钮默认读取环境变量；也可设置 `MAI_LOCAL_TOKEN_FILE` 指向上述文件。规范化结果仅保存到忽略的 `.private/live.json`，不上传 GitHub。参赛配置示例见 [mcp-config.example.json](mcp-config.example.json)。

## 示例

“韩式风味蘸酱”在某日的官方资讯中首先被识别时：该日出现一个鸡腿小标记，摘要为“今日 · 韩式风味蘸酱”。它表示活动资讯主题，**不是当天首发、门店可售或优惠资格保证**。

同一天还有麦旋风或咖啡时，不继续展示；标题和正文中没有可识别产品时跳过该条，不凭空编造产品。识别词表可在 `src/core.js` 中扩展。

## 架构

```text
麦当劳 MCP campaign-calendar
    ↓ 初始化 / Bearer 身份验证 / JSON 或 SSE
src/mcp.js → src/core.js → 本机脱敏缓存
                           ↓
                 生日设置 + 离线节日表
                           ↓
                      src/layout.js
                    ↙               ↘
     Scriptable DrawContext      浏览器 Canvas
       真实桌面小组件              开发预览
```

浏览器与手机共用数据、日期和绘图规则，不能替代 iPhone 真机验收。

## 运行边界

- MCP 活动日历是营销资讯排期，不能从中推断附近 3 公里每家门店都参与活动。当前版本没有附近门店功能。
- MCP 返回的日期范围可能不完整，未返回日期保持无标记，不推断“没有活动”。
- 每日识别依赖有序的规则词表，不使用 LLM 生成未经核实的内容。
- 手机缓存 6 小时且跨北京时间日期失效；查询失败保留旧数据文件，过期活动不作为今日资讯显示。
- `refreshAfterDate` 是建议刷新时间，实际由 iOS 决定，不能保证午夜准点换肤。可手动运行脚本刷新。
- 生日为用户主动填写的公历月日；2 月 29 日只在闰年当天展示。
- 麦当劳历史纪念日尚未加入，需先核实官方来源。

## 文档

- [MCP 集成说明](MCP_INTEGRATION.md)
- [隐私与安全](docs/PRIVACY.md)
- [测试与提交状态](docs/VALIDATION.md)
- [演示脚本](docs/DEMO.md)
- [参赛 Issue 草稿](docs/SUBMISSION.md)
- [素材与来源](docs/ASSETS.md)

代码按 MIT 许可发布；麦当劳商标和相关品牌权利仍归各权利人。本项目的插画由 AI 辅助生成，未复制官方媒体库图片。请勿暗示官方授权或背书。
