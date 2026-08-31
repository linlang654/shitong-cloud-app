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

# 配送员地址常显 v62 设计 QA

- Source visual truth: `C:\Users\111\AppData\Local\Temp\codex-clipboard-2d683523-0f14-415f-81f9-38c29958eb77.png`
- Implementation screenshot: `C:\Users\111\Documents\New project\shitong-cloud-app\design-qa-courier-address-v62.png`
- Comparison board: `C:\Users\111\Documents\New project\shitong-cloud-app\design-qa-courier-address-v62-comparison.png`
- Viewport / CSS size: 430 × 900 px；deviceScaleFactor 1。
- Source pixels: 552 × 554 px；implementation pixels: 430 × 900 px；对照板聚焦同一送回订单卡片并按可读宽度归一。
- State: 同一订单含 2 个待送回水洗标，完整送达地址常显，订单操作按钮保持可见。

## Full-view comparison evidence

- 原卡片把完整地址放在“查看送达位置与订单号”的折叠区域；新版在客户信息和订单号下方直接显示“送达地址”。
- 地址采用浅绿色信息条，与送回任务语义一致；长地址自动换行，没有挤压水洗标操作按钮。
- 取件卡片同步使用橙色“取件地址”信息条，取送两种任务的核对位置一致。

## Focused region comparison evidence

- 对照板并排展示调整前后的同一订单卡片，可直接确认地址是否无需点击即可阅读。
- 地址区域、两个水洗标的编辑短信/确认送达/上报异常，以及底部电话、图片、详情操作均在同一视区内可读。

## Required fidelity surfaces

- Fonts and typography: 沿用现有中文字体；地址标签 11 px 加粗，正文 12 px、1.45 行高，长地址完整换行。
- Spacing and layout rhythm: 地址条与订单摘要、水洗标列表保持 5–6 px 紧凑间距，没有增加多余卡片层级。
- Colors and visual tokens: 送回地址使用现有绿色语义，取件地址使用现有橙色语义，正文对比度清晰。
- Image quality and asset fidelity: 本次不涉及图片或图标资产。
- Copy and content: “送达地址 / 取件地址”直接说明用途；订单号保留在摘要或折叠详情中。

## Findings

- 无 P0/P1/P2 问题。
- P3：极长地址会增加一到两行卡片高度，但保留完整信息比省略号更适合现场核对。

## Primary interactions tested

- 430 × 900 手机视口下地址常显并完整换行。
- 两件水洗标的单件确认送达、编辑短信和异常入口未被遮挡。
- 浏览器控制台无错误；JavaScript 语法检查与 Git 差异格式检查通过。

final result: passed

---

# 工厂手机端紧凑作业台与订单查询 v60 设计 QA

- Source visual truth: `C:\Users\111\.codex\generated_images\019f835a-addc-70d2-b292-e172812a6fc5\exec-8673540d-1d1f-451b-91bd-43218bea2d6c.png`
- Implementation screenshot: `C:\Users\111\Documents\New project\shitong-cloud-app\design-qa-factory-mobile-v60.png`
- Comparison board: `C:\Users\111\Documents\New project\shitong-cloud-app\design-qa-factory-mobile-v60-comparison.png`
- Viewport / CSS size: 430 × 900 px；deviceScaleFactor 1。
- Source pixels: 852 × 1846 px，按宽度归一为 430 × 932 px；implementation pixels: 430 × 900 px。
- State: 已选择批量入库，本轮有 2 个待提交水洗标；订单查询底部面板打开并显示一个 3 件订单。

## Full-view comparison evidence

- 首屏沿用源图的“入库 / 出库—扫码输入—处理—当前批次”作业顺序，同时把状态统计压缩成一行，手机 430 px 宽度无横向溢出。
- 订单查询使用底部面板，保留源图中的订单号/手机号/水洗标搜索、订单状态、物品状态、订单详情、查看图片和上报异常。
- 实现保留正式业务需要的结算品类审核，但把批次明细限制在滚动区域内；今日清单和待处理物品均在首屏下方压缩为可展开摘要。

## Focused region comparison evidence

- 对比板将源图与同宽实现并排放置，可直接核对顶部作业模式、主输入、橙色处理按钮、底部查询面板、结果卡片与三个核心动作。
- 订单查询结果使用真实多件订单状态，三个水洗标均完整显示；手机号在列表中脱敏，详情页仍按现有权限展示完整业务信息。

## Required fidelity surfaces

- Fonts and typography: 沿用现有系统中文字体；标题、条码、状态和辅助文字层级与源图一致，窄屏无异常换行。
- Spacing and layout rhythm: 扫码首屏显著收紧，主按钮和输入仍满足手机触控；查询面板的卡片间距、圆角和底部安全区完整。
- Colors and visual tokens: 入库绿色、出库蓝色、处理橙色、异常红色与现有项目语义一致。
- Image quality and asset fidelity: 本次无新增图片资产；功能图标统一使用 Remix Icon，订单图片沿用正式上传资源。
- Copy and content: 明确区分扫码枪、手动输入与按需开启手机摄像头；查询结果展示订单、路线、水洗标、物品和状态。

## Findings

- 无 P0/P1/P2 问题。
- P3：源图把单条扫码成功做成独立大卡片；实现用现有反馈条和批次滚动列表承载，信息更紧凑，属于用户要求的有意取舍。

## Primary interactions tested

- 选择入库模式不会自动占用摄像头；“打开手机摄像头扫码”按需出现。
- 两个水洗标可连续加入当前批次，未点击“确认整批入库”，未修改正式订单状态。
- 订单号、水洗标和手机号查询链路可用；多件订单按条码显示全部物品状态。
- 订单详情、查看图片、上报异常均可从查询结果进入；异常表单可选择单个水洗标，未提交真实工单。
- 今日清单默认折叠并可展开；待处理物品继续使用原有折叠区。
- 手机端和 1365 px 桌面端均无横向溢出；浏览器控制台无错误。
- JavaScript 语法检查与 Git 差异格式检查通过。

final result: passed

---

# 统一异常工单中心 v58 设计 QA

- Source visual truth: `C:\Users\111\AppData\Local\Temp\codex-clipboard-66094c48-91f8-4923-b848-be5a3261a96c.png`
- Courier entry screenshot: `C:\Users\111\Documents\New project\shitong-cloud-app\audit\01-courier-exception-entry.png`
- Courier form screenshot: `C:\Users\111\Documents\New project\shitong-cloud-app\audit\02-courier-exception-form-viewport.png`
- Admin center screenshot: `C:\Users\111\Documents\New project\shitong-cloud-app\audit\03-admin-exception-center.png`
- Viewports: courier 390 × 844 px；admin 1440 × 900 px。

## Full-flow evidence

- 原“异常修正”已更名为“异常工单”，保持原导航样式并增加红色待处理数量气泡。
- 配送员取件和送回均使用“上报异常”，上报对象绑定到单个水洗标；多件订单可先选择具体物品。
- 上报异常不再覆盖取件或送回的正常流转状态，避免异常处理状态与物理履约状态互相污染。
- 工厂端、配送员端和后台创建的工单集中在同一页面，显示来源、问题、照片、建议方案、客户沟通和处理结果。
- 紧急工单优先排列；待客服、待客户、处理中和已结案分层，地址确认和历史异常保留在折叠区。

## Findings

- 无 P0/P1/P2 视觉或交互问题。
- 手机端异常表单在 390 px 宽度完整显示，无横向溢出；主要按钮满足触控尺寸。
- 控制台无错误；JavaScript 语法检查和现有自动测试通过。
- 数据库迁移未执行前，统一工单会显示明确启用提示，原地址修正仍可使用。

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

---

# 工厂待处理概览 v61 设计 QA

- Source visual truth: `C:\Users\111\AppData\Local\Temp\codex-clipboard-8ba0dcb8-5deb-47b0-8358-e9ea30782979.png`
- Implementation screenshot: `C:\Users\111\Documents\New project\shitong-cloud-app\design-qa-factory-pending-v61.png`
- Comparison board: `C:\Users\111\Documents\New project\shitong-cloud-app\design-qa-factory-pending-v61-comparison.png`
- Viewport / CSS size: 430 × 900 px；comparison focused crop 430 × 300 px；deviceScaleFactor 1。
- Source pixels: 527 × 428 px，按宽度归一为 430 × 349 px；implementation focused crop: 430 × 300 px。
- State: 待处理区域展开，待入库 30 件、待出库 63 件，尚未选择作业类型。

## Full-view comparison evidence

- 旧版展开后立即显示搜索框、状态下拉和全部 93 件卡片；新版先显示待入库、待出库两个作业入口，不再加载整页明细。
- 查询具体订单和刷新数量保留为独立操作；只有选择待入库或待出库后，才显示对应物品列表。
- 区域高度由持续滚动的长列表压缩为单屏概览，工厂人员可先判断当前工作量再进入明细。

## Focused region comparison evidence

- 对比板在同宽手机画布中并排展示旧版与新版，可直接核对数量、入口层级、按钮尺寸和空状态。
- 新版待入库使用绿色、待出库使用蓝色，与扫码作业模式保持一致；查询继续使用系统橙色主按钮。

## Required fidelity surfaces

- Fonts and typography: 数量、作业类型和辅助说明形成清晰三级层级，窄屏无文字溢出。
- Spacing and layout rhythm: 两个作业入口等宽排列，查询与刷新同排；默认空状态替代长卡片列表。
- Colors and visual tokens: 沿用现有绿色、蓝色、橙色业务语义和圆角边框。
- Image quality and asset fidelity: 本次不涉及图片资产；搜索和刷新使用 Remix Icon。
- Copy and content: 明确说明“选择作业后再显示明细”，并把单件查找统一引导到订单查询。

## Findings

- 无 P0/P1/P2 问题。
- P3：极窄屏下“查询具体订单 / 水洗标”文字较长，但 430 px 常用手机宽度完整显示。

## Primary interactions tested

- 默认不渲染全部待处理卡片。
- 点击待入库只筛选“已取件”；点击待出库筛选“已入厂、清洗中”。
- 再次点击当前作业入口可收起明细。
- 查询具体订单复用顶部订单查询面板。
- JavaScript 语法检查与 Git 差异格式检查通过。

final result: passed
