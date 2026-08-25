# 配送员“今日路线”与单件送达 v51 设计 QA

- Source visual truth: `C:\Users\111\AppData\Local\Temp\codex-clipboard-5e44f456-7123-4183-aa63-1026a1a4539c.png`
- Implementation screenshot: `C:\Users\111\Documents\New project\shitong-cloud-app\design-qa-courier-unified-route-v51-viewport.png`
- Full-page screenshot: `C:\Users\111\Documents\New project\shitong-cloud-app\design-qa-courier-unified-route-v51-final.png`
- Comparison board: `C:\Users\111\Documents\New project\shitong-cloud-app\design-qa-courier-unified-route-v51-comparison.png`
- Viewport / CSS size: 424 × 883 px
- Source pixels: 428 × 893 px；implementation pixels: 424 × 883 px；deviceScaleFactor 1，无密度缩放。
- State: 当前路线为“师大 / 东区 / 3栋”，同楼栋包含 1 个待送回订单（3 个水洗标）和 2 个待取件订单。

## Full-view comparison evidence

- 原界面只呈现取件路线；新版在同一个学校、校区和楼栋层级内合并展示送回与取件任务，避免配送员到楼下后遗漏另一类任务。
- 顶部驾驶舱统一展示待取件、待送回和今日已完成，并明确当前楼栋与下一楼栋。
- 当前楼栋先显示绿色“先送回”，再显示橙色“再取件”；两类任务完成后才会进入下一栋。
- 同一订单以一张卡片呈现，但每个水洗标都有独立的物品、状态、编辑短信、确认送达和异常操作，不会把仍在洗护或运输中的其他物品误改为已送达。
- 已处理任务默认折叠，不占用主作业区；批量辅助工具放在送回区域末尾并默认收起。

## Focused region comparison evidence

- 对比板左侧保留旧版取件卡片，右侧展示新版统一路线的首屏和单件送达操作，因此可直接核对路线结构、信息密度和核心操作位置。
- 当前 424 px 手机视口横向溢出为 0，学校、校区、楼栋以及待送回/待取件计数均完整可见。

## Required fidelity surfaces

- Fonts and typography: 沿用项目现有中文字体与字号层级；当前楼栋、任务计数、水洗标和状态重点明确。
- Spacing and layout rhythm: 手机端压缩面板与嵌套留白，楼栋标题和任务卡保持足够触控空间，同时显著减少空白。
- Colors and visual tokens: 送回使用绿色语义，取件使用橙色语义；异常仍使用红色边框，状态区分清晰。
- Image quality and asset fidelity: 本次未新增图片资产；“看图片”入口继续保留在订单卡片中。
- Copy and content: 顶部改为“今日路线”；单件短信明确具体物品已送达，并提示同单其他物品将按实际洗护进度另行送回。

## Findings

- 无 P0/P1/P2 问题。
- P3：批量选择工具仍保留给特殊批量作业，但默认折叠且位于送回卡片之后，不干扰日常单件确认。

## Primary interactions tested

- 当前楼栋内容顺序为“先送回”→“再取件”。
- 当前示例有 3 个单件确认送达按钮、0 个整单确认送达按钮。
- 搜索水洗标后只保留对应物品；清空搜索后恢复完整路线并正确定位当前楼栋。
- 已处理区域默认折叠；批量辅助工具可展开、收起。
- 单件短信链接包含物品、楼栋、售后电话及“同单其他物品另行送回”说明。
- 手机端横向溢出为 0；浏览器控制台无错误。
- JavaScript 语法检查和 Git 差异格式检查通过。
- 未点击真实订单的“确认送达”，避免修改现有业务数据；写入继续使用既有水洗标状态同步链路。

final result: passed
