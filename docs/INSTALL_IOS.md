# iPhone 安装麦麦日历

当前版本使用 Scriptable，无需 Mac/Xcode，无需付费 Apple 开发者账号。它不是独立 App Store App。

## 1. 安装 Scriptable

从 App Store 安装：https://apps.apple.com/app/scriptable/id1405459188 。首次打开后允许其正常使用 iCloud Drive（若不使用 iCloud，需自行将模块和素材放入 Scriptable 本地文档目录）。本项目不需要定位、相册、通讯录或通知权限。

## 2. 放置安装文件

在 iPhone 下载 `麦麦日历-iPhone安装包.zip`，在“文件”App 点按解压。把解压后的 `Scriptable` 文件夹内以下内容移动/复制到 `iCloud Drive/Scriptable/`：

```text
iCloud Drive/Scriptable/
  麦麦日历.js
  MaiCalendarCore.js
  MaiCalendarMCP.js
  MaiCalendarLayout.js
  MaiCalendarHolidays.js
  MaiCalendarAssets/
    fries.png
    bag.png
    cup.png
    birthday.png
    birthday-v2.png
    moon.png
    lantern.png
```

不要把整个解压目录再次嵌套成 `Scriptable/Scriptable/`。首次使用先等待 iCloud 文件下载完成，再运行脚本。

## 3. 设置

在 Scriptable 里运行“麦麦日历”：

1. 选择“设置 / 更新 MCP Token”，粘贴在麦当劳 MCP 官方网站申请的 Token。Token 只存入钥匙串，不写入脚本或 iCloud 文件。
2. 连接成功后选择日常皮肤。
3. 如愿意，填写公历生日，格式 `MM-DD`，例如 `10-14`；留空删除生日。
4. 选择“预览小组件”，依次检查小、中、大尺寸。

不要在聊天、公开 Issue 或截图中展示 Token。

## 4. 加入桌面

长按 iPhone 桌面空白处 → 编辑/添加小组件 → 搜索 Scriptable → 选择小、中、大尺寸 → 添加 → 长按该组件 → 编辑小组件 → Script 选择“麦麦日历”。

Parameter 可留空，使用设置中的皮肤；也可填 `paper`、`picnic`、`sunshine`，让不同尺寸使用不同日常皮肤。特别日子自动换肤仍受设置控制。

本项目没有领券或点餐跳转入口。Scriptable/iOS 可能为整个小组件设置默认点击行为，这不代表项目提供了独立日期链接。

## 5. 更新和清除

- 手动更新：运行脚本，选择“刷新活动资讯”。
- Token 失效：在菜单重新设置。
- 关闭节日皮肤：关闭“自动特别日子换肤”。
- 清除数据：菜单可分别删除 Token 或清除生日与资讯缓存。
- iOS 决定实际刷新时机，低电量等情况可能延迟；不能承诺午夜准点切换。

## 真机反馈

请记录 iPhone 型号、iOS 版本、Scriptable 版本。反馈三尺寸的日期是否完整、摘要是否截断、素材是否显示、Token 连接是否成功。可截图小组件，**不要截 Token 输入框**。

本机桌面服务的 `127.0.0.1` 地址只用于电脑预览，不是 iPhone 安装地址；请将 ZIP 传到 iPhone，或使用项目公开 Release 下载。

## 生日皮肤 v2 更新

将更新包里的麦麦日历.js 和 MaiCalendarLayout.js 拷贝到 iCloud Drive/Scriptable，选择替换同名文件；将 birthday-v2.png 拷贝到该目录下已有的 MaiCalendarAssets 文件夹。无需删除脚本、旧素材或 Token。等待同步完成后，在 Scriptable 运行麦麦日历，设置生日为当天月日并开启自动特别日子换肤，再预览三种尺寸。测试后恢复自己的生日。
