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

---

# 单个水洗标补差 / 退洗 v55 设计 QA

- Source visual truth: `C:\Users\111\AppData\Local\Temp\codex-clipboard-b0acd930-835a-43e2-bb61-f93ee7ad006a.png`
- Implementation screenshot: `C:\Users\111\Documents\New project\shitong-cloud-app\design-qa-return-wash-v55-final.png`
- Comparison board: `C:\Users\111\Documents\New project\shitong-cloud-app\design-qa-return-wash-v55-comparison.png`
- Viewport / CSS size: 1440 × 900 px，deviceScaleFactor 1。
- State: 同一订单 3 个水洗标中，仅空调被标记为“不洗，待退回”，另外两个物品保持正常流转。

## Full-view comparison evidence

- 原界面只能维护结算品类；新版在每个水洗标操作区增加“差价 / 退洗”，处理对象明确到单件。
- 弹窗同时记录处理方式、补差或退款金额、原因和客服沟通备注，避免只改状态却没有责任记录。
- 水洗标行内显示“不洗，待退回 ¥28”，无需打开详情即可识别异常物品。
- 同订单其他水洗标不联动退洗，满足鞋子继续洗、特殊鞋退回或衣鞋不同进度的真实场景。

## Required fidelity surfaces

- Fonts and typography: 沿用后台现有中文字体、橙色主操作和状态字重。
- Spacing and layout rhythm: 弹窗字段按处理方式、金额/原因、沟通备注分组，底部保存操作固定可见。
- Colors and visual tokens: 退洗使用淡红状态色，补差使用淡黄，已补差使用绿色，与现有业务状态区分清楚。
- Image quality and asset fidelity: 本次不涉及图片资产。
- Copy and content: 使用“不洗，待退回”“待补差，暂不清洗”等可执行文案，避免只写“异常”。

## Primary interactions tested

- “不洗，待退回”显示应退金额与退洗原因。
- “待补差，暂不清洗”切换为应补金额与补差原因。
- “正常洗护”隐藏金额和原因字段。
- 工厂出库阻止仍在待补差的水洗标；退洗水洗标可单件出库并生成送回任务。
- 配送员端把退洗物品单独标识，确认送达后仅该水洗标变为“已退洗并退回”。
- 每日对账按当天实际扫码入库统计，并排除退洗水洗标。
- 正式库字段迁移执行成功；JavaScript 语法检查、Git 差异格式检查通过；预览控制台无错误。

final result: passed

---

# 水洗标批量确认品类 v54 设计 QA

- Source visual truth: `C:\Users\111\AppData\Local\Temp\codex-clipboard-b0acd930-835a-43e2-bb61-f93ee7ad006a.png`
- Implementation screenshot: `C:\Users\111\Documents\New project\shitong-cloud-app\design-qa-label-bulk-v54.png`
- Comparison board: `C:\Users\111\Documents\New project\shitong-cloud-app\design-qa-label-bulk-v54-comparison.png`
- Viewport / CSS size: 1455 × 800 px（浏览器内容截图 1440 × 792 px）
- Source pixels: 1473 × 345 px；implementation pixels: 1440 × 792 px；deviceScaleFactor 1，无密度缩放。
- State: 搜索“卢婷”，同一订单的空调被、普通床单、枕套 3 个水洗标全部选中，尚未执行真实保存。

## Full-view comparison evidence

- 原界面的三个水洗标只能分别点击保存；新版在表格上方增加批量确认区，并在每行增加选择框。
- 点击任一行的“选择本单”后，同订单三个水洗标一起选中，顶部立即显示“已选 3 个水洗标”，一次点击“保存已选”即可共同提交。
- 三行仍保留各自的实际品类、单位和代工价，没有因为批量操作把空调被、床单和枕套合并成相同内容。
- 原有“保存单项”和“详情”继续保留，兼容单条纠正场景。

## Focused region comparison evidence

- 对比板同时展示原始三行表格与新版三行选中状态，可直接核对水洗标、品类名称、单位和代工价是否保持一致。
- 新版橙色左边框、复选框和浅橙底清晰反馈选择状态；批量操作区与现有橙色视觉规范一致。

## Required fidelity surfaces

- Fonts and typography: 沿用项目现有中文字体和字重；批量数量使用橙色加粗，层级清楚。
- Spacing and layout rhythm: 批量栏独立于表格，操作集中；新增选择列后表格仍完整显示全部业务字段。
- Colors and visual tokens: 使用现有橙色主色、浅橙背景和绿色确认状态，没有新增冲突色。
- Image quality and asset fidelity: 本次不涉及图片资产。
- Copy and content: 文案明确说明“不同物品可以分别修改，最后一次保存”，避免误解为整单只能设置同一品类。

## Findings

- 无 P0/P1/P2 问题。
- P3：窄屏下表格仍需横向浏览，这是现有后台表格结构的延续，不影响桌面端批量审核主场景。

## Primary interactions tested

- 搜索同一客户后仅显示 3 个对应水洗标。
- “选择本单”一次选中 3 行，“保存已选”正确启用。
- 批量应用“其他品类”后，三行原有的空调被、普通床单、枕套及代工价均未被覆盖。
- 未点击“保存已选”，避免修改正式订单数据。
- 每日对账已改为读取所选日期实际工厂扫码入库记录，页面显示当天实际入库单数与水洗标数。
- JavaScript 语法检查、Git 差异格式检查通过；浏览器控制台无错误。

final result: passed
