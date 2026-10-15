# 素材与数据来源

## 插画

`assets/` 中六张透明 PNG 由内置 imagegen 根据项目自有概念稿生成，用于日常薯条、餐盒、饮料杯和生日、中秋、春节皮肤。生成提示词保存在 `design-prompts/`。没有下载、复制或打包麦当劳官网媒体库图片。

设计参考：

- 麦当劳官方品牌标识：https://www.mcdonalds.com.cn/page/Brand-identity
- Pearlfisher 包装案例：https://pearlfisher.com/zh-hans/work/mcdonalds/
- Turner Duckworth 品牌案例：https://turnerduckworth.com/work/mcdonalds

麦当劳标识与品牌权利属于相应权利人。AI 辅助生成不等于取得商标授权；本项目明确标注独立参赛作品，禁止暗示官方产品或官方背书。代码 MIT 许可不授予麦当劳品牌权利。

## 日期

`data/holidays.json` 为香港天文台开放公农历对照表派生的节日日期（2026—2028）。生成器 `scripts/fetch-holidays.py` 可重新核对并生成。

- 数据入口：https://www.hko.gov.hk/sc/gts/time/conversion.htm
- 数据集：https://data.gov.hk/tc-data/dataset/hk-hko-rss-gregorian-lunar-calendar-conversion-table
- CSV：https://data.weather.gov.hk/weatherAPI/hko_data/calendar/nongli_calendar_2026.csv （年份替换为2027/2028）
- 使用条款：https://www.hko.gov.hk/sc/abouthko/disclaimer.htm

这些是节日日期，不是内地法定放假或补班安排。没有加入未经核实的品牌历史纪念日。

## 活动

实时活动资讯来源于麦当劳 MCP 官方服务。发布源码不包含个人查询原始记录；没有伪造库存、门店参与范围、优惠资格或首发日期。
