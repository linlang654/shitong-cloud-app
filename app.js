const CONFIG_KEY = "shitong_cloud_supabase_config";
const AFTER_SALES_PHONE = "15599157072";
const DEFAULT_SUPABASE_CONFIG = {
  url: "https://ukzjgjfefqlyeqecqyiz.supabase.co",
  anonKey: "sb_publishable_OAwXdqIPnQqYHUJj4Md-pw_HAFIMMcO",
};

let sb = null;
let currentUser = null;
let currentProfile = null;
let scanStream = null;
let scanTimer = null;
let recognitionRules = [];

const $ = (id) => document.getElementById(id);

function text(value) {
  return String(value ?? "").replace(/_x000d_/gi, "\n").replace(/\s+/g, " ").trim();
}

function numberValue(value) {
  const matched = String(value ?? "").match(/-?\d+(?:\.\d+)?/);
  return matched ? Number(matched[0]) : 0;
}

function phoneValue(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function pad(value, size = 2) {
  return String(value).padStart(size, "0");
}

function parseDate(value) {
  if (!value && value !== 0) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = raw.replace(/\./g, "-").replace(/\//g, "-");
  const date = new Date(normalized.includes("T") ? normalized : normalized.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateOnly(value) {
  const date = parseDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isoOrNull(value) {
  const date = parseDate(value);
  return date ? date.toISOString() : null;
}

function todayDate() {
  return dateOnly(new Date());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseDateOnly(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function businessBatchDateFromOrder(order) {
  const base = parseDate(order.pay_time) || parseDate(order.order_time) || parseDate(order.created_at);
  if (!base) return "";
  const batchDate = new Date(base);
  if (base.getHours() >= 18) batchDate.setDate(batchDate.getDate() + 1);
  return dateOnly(batchDate);
}

function currentBusinessBatchDate() {
  const now = new Date();
  if (now.getHours() >= 18) now.setDate(now.getDate() + 1);
  return dateOnly(now);
}

function businessBatchWindow(batchDateText) {
  const end = parseDateOnly(batchDateText) || new Date();
  end.setHours(18, 0, 0, 0);
  const start = addDays(end, -1);
  return { start, end };
}

function businessBatchLabel(batchDateText) {
  const { start, end } = businessBatchWindow(batchDateText);
  return `${dateOnly(start)} 18:00 - ${dateOnly(end)} 18:00`;
}

function escapeHtml(value) {
  return text(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function setMessage(targetId, message, tone = "hint") {
  const target = $(targetId);
  if (!target) return;
  target.innerHTML = `<p class="${tone}">${escapeHtml(message)}</p>`;
}

function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}");
    return {
      url: saved.url || DEFAULT_SUPABASE_CONFIG.url,
      anonKey: saved.anonKey || DEFAULT_SUPABASE_CONFIG.anonKey,
    };
  } catch {
    return DEFAULT_SUPABASE_CONFIG;
  }
}

function saveConfig() {
  const config = {
    url: text($("supabaseUrl").value).replace(/\/rest\/v1\/?$/, ""),
    anonKey: text($("supabaseAnonKey").value),
  };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  initSupabase();
  alert("Supabase 连接配置已保存");
}

function initSupabase() {
  const config = loadConfig();
  $("supabaseUrl").value = config.url || "";
  $("supabaseAnonKey").value = config.anonKey || "";
  if (config.url && config.anonKey && window.supabase) {
    sb = window.supabase.createClient(config.url, config.anonKey);
    $("sessionLabel").textContent = "已连接，未登录";
    refreshSession();
  } else {
    sb = null;
    $("sessionLabel").textContent = "未连接";
  }
}

function requireClient() {
  if (!sb) {
    alert("请先填写并保存 Supabase Project URL 和 Publishable key");
    return false;
  }
  return true;
}

async function refreshSession() {
  if (!sb) return;
  const { data } = await sb.auth.getUser();
  currentUser = data.user || null;
  currentProfile = null;
  if (!currentUser) {
    $("signOutBtn").classList.add("hidden");
    $("loginPanel").classList.remove("hidden");
    return;
  }
  const result = await sb.from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
  currentProfile = result.data || null;
  $("sessionLabel").textContent = `${currentProfile?.name || currentUser.email} · ${currentProfile?.role || "未设置角色"}`;
  $("signOutBtn").classList.remove("hidden");
  $("loginPanel").classList.add("hidden");
  await refreshAll();
}

async function login() {
  if (!requireClient()) return;
  const email = text($("loginEmail").value);
  const password = $("loginPassword").value;
  if (!email || !password) return alert("请输入邮箱和密码");
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return alert(`登录失败：${error.message}`);
  await refreshSession();
}

async function signOut() {
  if (!sb) return;
  await sb.auth.signOut();
  currentUser = null;
  currentProfile = null;
  $("sessionLabel").textContent = "已连接，未登录";
  $("signOutBtn").classList.add("hidden");
  $("loginPanel").classList.remove("hidden");
}

function switchView(viewName) {
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewName));
  document.querySelectorAll(".view").forEach((view) => view.classList.add("hidden"));
  $(`${viewName}View`)?.classList.remove("hidden");
}

function applyRouteFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page") || params.get("view");
  const routeMap = {
    admin: "admin",
    courier: "courier",
    factory: "factory",
    student: "student",
    track: "student",
  };
  if (!routeMap[page]) return;
  document.body.classList.add("route-page", `route-${routeMap[page]}`);
  switchView(routeMap[page]);
}

function switchAdminSection(sectionName) {
  document.querySelectorAll(".subtab").forEach((tab) => tab.classList.toggle("active", tab.dataset.adminSection === sectionName));
  document.querySelectorAll(".admin-section").forEach((section) => section.classList.add("hidden"));
  $(`admin${sectionName[0].toUpperCase()}${sectionName.slice(1)}`)?.classList.remove("hidden");
}

function field(row, names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== "") return row[name];
  }
  return "";
}

function paid(row) {
  return text(field(row, ["状态", "订单状态"])) === "已支付";
}

function refunded(row) {
  return numberValue(field(row, ["退款金额", "已退款金额", "退款"])) > 0;
}

function isWashOrder(row) {
  const merchant = text(field(row, ["所属商家", "商家", "门店"]));
  const product = `${field(row, ["商品名称", "商品"])} ${field(row, ["规格", "规格名称"])} ${field(row, ["表单信息", "备注"])}`;
  if (/洗护|洗衣|洗鞋|干洗|事事超级洗护/.test(merchant)) return true;
  if (/自营/.test(merchant) && /鞋|衣|服|精洗|清洗|洗护|洗鞋|羽绒服|大衣|窗帘|毛衣|皮衣/.test(product)) return true;
  return false;
}

function importKey(row) {
  return [
    field(row, ["订单号", "订单编号"]),
    field(row, ["商品名称", "商品"]),
    field(row, ["规格", "规格名称"]),
    field(row, ["实付款", "实际支付", "付款金额"]),
    field(row, ["下单时间", "创建时间"]),
  ].map(text).join("|");
}

function fillSharedFields(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const orderNo = text(field(row, ["订单号", "订单编号"]));
    if (!orderNo) return;
    if (!grouped.has(orderNo)) grouped.set(orderNo, []);
    grouped.get(orderNo).push(row);
  });
  const sharedFields = ["所属商家", "姓名", "电话", "收货地址", "表单信息", "状态", "退款金额", "下单时间", "付款时间", "配送方式"];
  grouped.forEach((items) => {
    sharedFields.forEach((name) => {
      const value = items.map((row) => row[name]).find((item) => text(item));
      if (value === undefined) return;
      items.forEach((row) => {
        if (!text(row[name])) row[name] = value;
      });
    });
  });
  return rows;
}

function chineseNumberToDigit(value) {
  const map = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  if (/^十$/.test(value)) return 10;
  if (/^十[一二三四五六七八九]$/.test(value)) return 10 + map[value[1]];
  if (/^[一二三四五六七八九]十$/.test(value)) return map[value[0]] * 10;
  if (/^[一二三四五六七八九]十[一二三四五六七八九]$/.test(value)) return map[value[0]] * 10 + map[value[2]];
  return map[value] || value;
}

function normalizeSchool(source) {
  if (/师范|师大/.test(source)) return "师大";
  if (/财经|财大/.test(source)) return "财大";
  if (/民族|民大/.test(source)) return "民大";
  if (/理工/.test(source)) return "理工";
  if (/中医|贵中医/.test(source)) return "贵中医";
  if (/科院|贵州科学院|贵科院/.test(source)) return "贵科院";
  if (/人文/.test(source)) return "人文";
  if (/城市学院|职业学院/.test(source)) return "城市学院";
  return "学校未识别";
}

function applyRecognitionRule(source) {
  const rule = recognitionRules.find((item) => item.enabled !== false && item.keyword && source.includes(item.keyword));
  if (!rule) return null;
  return {
    school: rule.school || "学校未识别",
    campus: rule.campus || "校区未识别",
    building: rule.building || "楼栋未识别",
    note: "",
  };
}

function extractDormInfo(row) {
  const form = text(field(row, ["表单信息", "备注", "买家留言"]));
  const address = text(field(row, ["收货地址", "地址"]));
  const source = `${form} ${address}`;
  const learned = applyRecognitionRule(source);
  if (learned) return learned;

  const school = normalizeSchool(source);
  let campus = "";
  let building = "";
  if (/龙文苑/.test(source)) campus = "龙文苑";
  else if (/东校区|东区/.test(source)) campus = "东区";
  else if (/西校区|西区/.test(source)) campus = "西区";
  else if (/南校区|南区/.test(source)) campus = "南区";
  else if (/北校区|北区/.test(source)) campus = "北区";
  else if (/一期/.test(source)) campus = "学生公寓一期";
  else if (/三期|善德居/.test(source)) campus = "学生公寓三期";
  else if (/桂园|橘园|杏园|李园|竹园|桃园|H7|H8|J2|J3/.test(source)) campus = "宿舍区";
  else campus = "校区未识别";

  const cleaned = source.replace(/学校[:：]/g, " ").replace(/校区[:：]/g, " ");
  const patterns = [
    /(玉兰苑|丹桂苑|樱花苑|翠竹苑|文心苑)\s*([0-9一二三四五六七八九十]+)\s*(栋)?/,
    /(桂园|橘园|杏园|李园)\s*([0-9一二三四五六七八九十]+)\s*(栋|号楼)?/,
    /(桃园)\s*([A-D])\s*区/,
    /(学生公寓一期|学生公寓三期)?\s*(H\d{2}-\d|H\d{1,2}|J\d|[A-Z]?\d{1,3}[A-Z]?)\s*(栋|号学生公寓|宿舍|楼|b区|B区)?/,
    /([一二三四五六七八九十]+)\s*(栋|号楼|宿舍)/,
    /(竹园|善德居|J2|J3|H7|H8)/,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (!match) continue;
    if (match[1] && match[2] && /苑|园/.test(match[1])) building = `${match[1]}${chineseNumberToDigit(match[2])}${match[1] === "桃园" ? "区" : "栋"}`;
    else if (match[1] && match[2] && /学生公寓/.test(match[1])) building = `${match[1]}${match[2]}`;
    else if (match[1] && /^[一二三四五六七八九十]+$/.test(match[1])) building = `${chineseNumberToDigit(match[1])}栋`;
    else if (match[2] && /^[A-Z]?\d/.test(match[2])) building = `${match[1] || ""}${match[2]}`;
    else building = match[1];
    break;
  }

  building = text(building)
    .replace(/^([A-Z]?\d{1,3}[A-Z]?)$/, "$1栋")
    .replace(/^J2栋$/, "J2号楼")
    .replace(/^J3栋$/, "J3学生公寓")
    .replace(/^H7\d+栋$/, "H7")
    .replace(/^H8\d*栋$/, "H8");
  if (!building) building = "楼栋未识别";

  const notes = [];
  if (school === "学校未识别") notes.push("未识别学校");
  if (campus === "校区未识别") notes.push("未识别校区");
  if (building === "楼栋未识别") notes.push("未识别楼栋");
  return { school, campus, building, note: notes.join("；") };
}

function extractImages(row) {
  const form = text(field(row, ["表单信息", "备注", "买家留言"]));
  const links = form.match(/https?:\/\/[^\s，,；;]+/g) || [];
  return [...new Set(links)].join("\n");
}

function calculatePickupDate(row) {
  const base = parseDate(field(row, ["付款时间", "支付时间"])) || parseDate(field(row, ["下单时间", "创建时间"]));
  if (!base) return "";
  const pickup = new Date(base);
  if (base.getHours() >= 18) pickup.setDate(pickup.getDate() + 1);
  return dateOnly(pickup);
}

function countFromText(value) {
  const raw = text(value);
  const matches = [...raw.matchAll(/(\d{1,2})\s*(双|件|个|条|套|份|只)/g)];
  if (!matches.length) return 0;
  return Math.max(...matches.map((match) => Number(match[1]) || 0));
}

function itemCount(row) {
  return countFromText(field(row, ["规格", "规格名称"])) || countFromText(field(row, ["商品名称", "商品"])) || Math.max(1, Math.floor(numberValue(field(row, ["数量", "商品数量"]))) || 1);
}

function barcodePrefix(row, pickupDate) {
  const base = parseDate(pickupDate) || parseDate(field(row, ["付款时间", "支付时间"])) || parseDate(field(row, ["下单时间", "创建时间"])) || new Date();
  return `${String(base.getFullYear()).slice(2)}${pad(base.getMonth() + 1)}${pad(base.getDate())}`;
}

async function loadRecognitionRules() {
  if (!sb || !currentUser) return;
  const { data, error } = await sb.from("recognition_rules").select("*").order("created_at", { ascending: false });
  recognitionRules = error ? [] : (data || []);
}

async function loadBarcodeCounters(prefixes) {
  const counters = {};
  for (const prefix of [...new Set(prefixes)]) {
    const { data, error } = await sb.from("order_items").select("barcode").gte("barcode", `${prefix}000`).lt("barcode", `${prefix}999`);
    if (error) throw error;
    counters[prefix] = (data || []).reduce((max, row) => Math.max(max, Number(String(row.barcode || "").slice(-3)) || 0), 0);
  }
  return counters;
}

function nextBarcode(counters, prefix) {
  counters[prefix] = (counters[prefix] || 0) + 1;
  return `${prefix}${pad(counters[prefix], 3)}`;
}

function rowsToWorkItems(rows) {
  const valid = [];
  const seen = new Set();
  fillSharedFields(rows).forEach((row) => {
    const orderNo = text(field(row, ["订单号", "订单编号"]));
    if (!orderNo || !paid(row) || refunded(row) || !isWashOrder(row)) return;
    const key = importKey(row);
    if (seen.has(key)) return;
    seen.add(key);
    valid.push(row);
  });
  const items = [];
  valid.forEach((row) => {
    const dorm = extractDormInfo(row);
    const pickupDate = calculatePickupDate(row);
    for (let index = 1; index <= itemCount(row); index += 1) {
      items.push({ row, dorm, pickupDate, index, prefix: barcodePrefix(row, pickupDate) });
    }
  });
  items.sort((a, b) => `${a.dorm.school}${a.dorm.campus}${a.dorm.building}`.localeCompare(`${b.dorm.school}${b.dorm.campus}${b.dorm.building}`, "zh-Hans-CN", { numeric: true }));
  return items;
}

function diagnoseRows(rows) {
  const stats = { total: rows.length, paid: 0, refunded: 0, wash: 0, usable: 0, merchantCounts: {}, statusCounts: {}, nonWashSamples: [] };
  fillSharedFields(rows).forEach((row) => {
    const status = text(field(row, ["状态", "订单状态"])) || "空状态";
    const merchant = text(field(row, ["所属商家", "商家", "门店"])) || "空商家";
    stats.statusCounts[status] = (stats.statusCounts[status] || 0) + 1;
    stats.merchantCounts[merchant] = (stats.merchantCounts[merchant] || 0) + 1;
    if (paid(row)) stats.paid += 1;
    if (refunded(row)) stats.refunded += 1;
    if (isWashOrder(row)) stats.wash += 1;
    if (text(field(row, ["订单号", "订单编号"])) && paid(row) && !refunded(row) && isWashOrder(row)) stats.usable += 1;
    if (paid(row) && !refunded(row) && !isWashOrder(row) && stats.nonWashSamples.length < 5) {
      stats.nonWashSamples.push(`${merchant}｜${text(field(row, ["商品名称", "商品"]))}｜${text(field(row, ["规格", "规格名称"]))}`);
    }
  });
  return stats;
}

function renderImportDiagnosis(stats, resultText = "") {
  const list = (obj) => Object.entries(obj).map(([name, count]) => `<li>${escapeHtml(name)}：${count}</li>`).join("");
  return `
    <section class="panel diagnosis-panel">
      <h2>本次导入诊断</h2>
      ${resultText ? `<p class="hint">${escapeHtml(resultText)}</p>` : ""}
      <div class="mini-stats">
        <div><strong>${stats.total}</strong><span>总行数</span></div>
        <div><strong>${stats.paid}</strong><span>已支付</span></div>
        <div><strong>${stats.refunded}</strong><span>退款</span></div>
        <div><strong>${stats.wash}</strong><span>洗护行</span></div>
        <div><strong>${stats.usable}</strong><span>可导入行</span></div>
      </div>
      <div class="diagnosis-grid">
        <div><h3>状态统计</h3><ul>${list(stats.statusCounts) || "<li>无</li>"}</ul></div>
        <div><h3>商家统计</h3><ul>${list(stats.merchantCounts) || "<li>无</li>"}</ul></div>
      </div>
      ${stats.nonWashSamples.length ? `<details><summary>已支付但被排除的非洗护样例</summary><ul>${stats.nonWashSamples.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></details>` : ""}
    </section>
  `;
}

async function readWorkbook(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  return workbook.SheetNames.flatMap((sheetName) => XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" }));
}

async function createImportBatch(files, stats) {
  const { data, error } = await sb.from("import_batches").insert({
    name: `${todayDate()} 导入批次`,
    file_names: files.map((file) => file.name).join("，"),
    total_rows: stats.total,
    paid_rows: stats.paid,
    wash_rows: stats.wash,
    imported_orders: 0,
    imported_items: 0,
    operator_id: currentProfile?.id || null,
  }).select("*").single();
  if (error) throw error;
  return data;
}

async function updateImportBatch(id, orders, items) {
  await sb.from("import_batches").update({ imported_orders: orders, imported_items: items }).eq("id", id);
}

async function handleImport(event) {
  if (!requireClient()) return;
  if (!currentUser) return alert("请先用后台账号登录");
  const files = [...event.target.files];
  if (!files.length) return;
  setMessage("adminOverview", "正在读取 Excel 并写入 Supabase...");
  try {
    await loadRecognitionRules();
    const allRows = [];
    for (const file of files) allRows.push(...await readWorkbook(file));
    const diagnosis = diagnoseRows(allRows);
    const workItems = rowsToWorkItems(allRows);
    if (!workItems.length) {
      $("adminOverview").innerHTML = renderImportDiagnosis(diagnosis, "没有可导入的洗护已支付订单。");
      return;
    }
    const batch = await createImportBatch(files, diagnosis);
    const counters = await loadBarcodeCounters(workItems.map((item) => item.prefix));
    const orderCache = new Map();
    let createdItems = 0;
    let skippedItems = 0;
    for (const workItem of workItems) {
      const row = workItem.row;
      const orderNo = text(field(row, ["订单号", "订单编号"]));
      let order = orderCache.get(orderNo);
      if (!order) {
        order = await upsertOrder(row, workItem.dorm, batch.id);
        orderCache.set(orderNo, order);
        await upsertPickupTask(order.id, workItem.pickupDate);
      }
      const sourceKey = `${importKey(row)}|${workItem.index}`;
      const existing = await findOrderItemBySourceKey(sourceKey);
      if (existing) {
        skippedItems += 1;
        continue;
      }
      const item = await upsertOrderItem(order.id, row, nextBarcode(counters, workItem.prefix), sourceKey, workItem.index);
      createdItems += 1;
      await insertLog({ orderId: order.id, itemId: item.id, barcode: item.barcode, status: "待取件", note: workItem.dorm.note || "Excel 导入生成水洗标" });
    }
    await updateImportBatch(batch.id, orderCache.size, createdItems);
    await refreshAll();
    $("adminOverview").insertAdjacentHTML("afterbegin", renderImportDiagnosis(diagnosis, `导入完成：${orderCache.size} 个订单，新增 ${createdItems} 件物品，跳过重复 ${skippedItems} 件。`));
  } catch (error) {
    console.error(error);
    setMessage("adminOverview", `导入失败：${error.message || error}`, "warn");
  } finally {
    event.target.value = "";
  }
}

async function findOrderItemBySourceKey(sourceKey) {
  const { data, error } = await sb.from("order_items").select("*").eq("source_key", sourceKey).maybeSingle();
  if (error) throw error;
  return data;
}

async function upsertOrder(row, dorm, batchId) {
  const payload = {
    order_no: text(field(row, ["订单号", "订单编号"])),
    business_type: "wash_care",
    source: "excel",
    import_batch_id: batchId || null,
    merchant: text(field(row, ["所属商家", "商家", "门店"])),
    customer_name: text(field(row, ["姓名", "收货人"])),
    phone: phoneValue(field(row, ["电话", "手机号", "联系电话"])),
    address: text(field(row, ["收货地址", "地址"])),
    school: dorm.school,
    campus: dorm.campus,
    building: dorm.building,
    paid_amount: numberValue(field(row, ["实付款", "实际支付", "付款金额", "支付金额"])),
    order_time: isoOrNull(field(row, ["下单时间", "创建时间"])),
    pay_time: isoOrNull(field(row, ["付款时间", "支付时间"])),
    order_status: "待取件",
    exception_note: dorm.note,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await sb.from("orders").upsert(payload, { onConflict: "order_no" }).select("*").single();
  if (error) throw error;
  return data;
}

async function upsertOrderItem(orderId, row, barcode, sourceKey, index) {
  const payload = {
    order_id: orderId,
    barcode,
    source_key: sourceKey,
    product_name: text(field(row, ["商品名称", "商品"])),
    spec: text(field(row, ["规格", "规格名称"])),
    item_index: index,
    image_links: extractImages(row),
    item_status: "待取件",
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await sb.from("order_items").upsert(payload, { onConflict: "source_key" }).select("*").single();
  if (error) throw error;
  return data;
}

async function upsertPickupTask(orderId, pickupDate) {
  const { error } = await sb.from("pickup_tasks").upsert({ order_id: orderId, pickup_date: pickupDate || null, status: "待取件", updated_at: new Date().toISOString() }, { onConflict: "order_id" });
  if (error) throw error;
}

async function insertLog({ orderId, itemId = null, barcode = "", status, note = "" }) {
  await sb.from("status_logs").insert({ order_id: orderId, item_id: itemId, barcode, status, note, operator_id: currentProfile?.id || null });
}

async function refreshAll() {
  if (!sb || !currentUser) return;
  await loadRecognitionRules();
  await Promise.all([loadStats(), loadAdmin(), loadCourierTasks(), loadFactoryItems()]);
}

async function loadStats() {
  const today = todayDate();
  const [orders, items, ins, outs] = await Promise.all([
    sb.from("orders").select("*", { count: "exact", head: true }),
    sb.from("order_items").select("*", { count: "exact", head: true }),
    sb.from("factory_scans").select("*", { count: "exact", head: true }).eq("scan_type", "factory_in").gte("created_at", `${today}T00:00:00`),
    sb.from("factory_scans").select("*", { count: "exact", head: true }).eq("scan_type", "factory_out").gte("created_at", `${today}T00:00:00`),
  ]);
  $("statOrders").textContent = orders.count || 0;
  $("statItems").textContent = items.count || 0;
  $("statIn").textContent = ins.count || 0;
  $("statOut").textContent = outs.count || 0;
}

async function loadAdmin() {
  await Promise.all([loadAdminOverview(), loadExceptions(), loadBatches(), loadRules(), loadLabels()]);
}

async function loadAdminOverview() {
  const { data, error } = await sb.from("orders").select("*, order_items(barcode,item_status,product_name,spec)").order("created_at", { ascending: false }).limit(20);
  if (error) return setMessage("adminOverview", error.message, "warn");
  $("adminOverview").innerHTML = `
    <section class="panel table-panel">
      <h2>最近导入订单</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>订单号</th><th>姓名</th><th>电话</th><th>宿舍</th><th>状态</th><th>物品数</th><th>操作</th></tr></thead>
          <tbody>${(data || []).map((order) => `
            <tr>
              <td>${escapeHtml(order.order_no)}</td>
              <td>${escapeHtml(order.customer_name)}</td>
              <td>${escapeHtml(order.phone)}</td>
              <td>${escapeHtml(`${order.school || ""}${order.campus || ""}${order.building || ""}`)}</td>
              <td>${escapeHtml(order.order_status)}</td>
              <td>${order.order_items?.length || 0}</td>
              <td><button class="ghost small" type="button" data-detail="${order.id}">详情</button></td>
            </tr>
          `).join("") || '<tr><td colspan="7">暂无订单</td></tr>'}</tbody>
        </table>
      </div>
    </section>`;
}

async function loadExceptions() {
  const { data, error } = await sb.from("orders").select("*").or("exception_note.neq.,school.eq.学校未识别,campus.eq.校区未识别,building.eq.楼栋未识别,order_status.eq.异常,order_status.eq.未找到").order("created_at", { ascending: false }).limit(100);
  if (error) return setMessage("adminExceptions", error.message, "warn");
  $("adminExceptions").innerHTML = `
    <section class="panel">
      <h2>异常处理中心</h2>
      <p class="hint">可直接修正学校、校区、楼栋和备注。保存时会同步取件任务和水洗标清单显示。</p>
      <div class="card-list">${(data || []).map(renderExceptionCard).join("") || '<p class="hint">暂无异常订单</p>'}</div>
    </section>`;
}

function renderExceptionCard(order) {
  return `
    <article class="task-card alert">
      <div class="card-head"><h3>${escapeHtml(order.customer_name)} · ${escapeHtml(order.phone)}</h3><span>${escapeHtml(order.order_status || "")}</span></div>
      <p>订单号：${escapeHtml(order.order_no)}</p>
      <p>${escapeHtml(order.address || "")}</p>
      <div class="edit-grid">
        <input class="input" data-edit-school="${order.id}" value="${escapeHtml(order.school || "")}" placeholder="学校" />
        <input class="input" data-edit-campus="${order.id}" value="${escapeHtml(order.campus || "")}" placeholder="校区" />
        <input class="input" data-edit-building="${order.id}" value="${escapeHtml(order.building || "")}" placeholder="楼栋" />
        <input class="input" data-edit-note="${order.id}" value="${escapeHtml(order.exception_note || "")}" placeholder="异常备注" />
      </div>
      <div class="actions">
        <button type="button" data-save-dorm="${order.id}">保存修正</button>
        <button class="ghost" type="button" data-detail="${order.id}">详情</button>
        <button class="ghost" type="button" data-learn-rule="${order.id}" data-address="${escapeHtml(order.address || "")}">保存成识别规则</button>
      </div>
    </article>`;
}

async function saveDorm(orderId) {
  const school = text(document.querySelector(`[data-edit-school="${orderId}"]`)?.value);
  const campus = text(document.querySelector(`[data-edit-campus="${orderId}"]`)?.value);
  const building = text(document.querySelector(`[data-edit-building="${orderId}"]`)?.value);
  const note = text(document.querySelector(`[data-edit-note="${orderId}"]`)?.value);
  const { error } = await sb.from("orders").update({ school, campus, building, exception_note: note, updated_at: new Date().toISOString() }).eq("id", orderId);
  if (error) return alert(error.message);
  await insertLog({ orderId, status: "后台修正宿舍", note: `${school}${campus}${building} ${note}` });
  await refreshAll();
}

async function learnRule(orderId, address) {
  const keyword = prompt("请输入可用于识别的关键词，例如：宿舍楼六栋 / 杏园J2 / 民大南区2栋", address.slice(-12));
  if (!keyword) return;
  const school = text(document.querySelector(`[data-edit-school="${orderId}"]`)?.value);
  const campus = text(document.querySelector(`[data-edit-campus="${orderId}"]`)?.value);
  const building = text(document.querySelector(`[data-edit-building="${orderId}"]`)?.value);
  const { error } = await sb.from("recognition_rules").insert({ keyword, school, campus, building, created_by: currentProfile?.id || null });
  if (error) return alert(error.message);
  alert("已保存识别规则，下次导入包含该关键词的地址会自动归类。");
  await refreshAll();
}

async function loadBatches() {
  const { data, error } = await sb.from("import_batches").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) return setMessage("adminBatches", `${error.message}。如果还没执行增量 SQL，请先运行 supabase-admin-upgrade.sql。`, "warn");
  $("adminBatches").innerHTML = `
    <section class="panel table-panel">
      <h2>批次管理</h2>
      <p class="hint">误导入时可以删除整个批次；删除会连同该批次订单、物品、任务一起删除。</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>批次</th><th>文件</th><th>总行</th><th>已支付</th><th>洗护</th><th>订单</th><th>物品</th><th>导入时间</th><th>操作</th></tr></thead>
          <tbody>${(data || []).map((batch) => `
            <tr>
              <td>${escapeHtml(batch.name)}</td><td>${escapeHtml(batch.file_names || "")}</td><td>${batch.total_rows || 0}</td><td>${batch.paid_rows || 0}</td><td>${batch.wash_rows || 0}</td><td>${batch.imported_orders || 0}</td><td>${batch.imported_items || 0}</td><td>${escapeHtml(String(batch.created_at || "").slice(0, 19).replace("T", " "))}</td>
              <td><button class="ghost small danger" type="button" data-delete-batch="${batch.id}">删除批次</button></td>
            </tr>`).join("") || '<tr><td colspan="9">暂无批次</td></tr>'}</tbody>
        </table>
      </div>
    </section>`;
}

async function deleteBatch(batchId) {
  if (!confirm("确定删除这个批次吗？该批次下的订单、物品、取件/送回任务都会删除。")) return;
  const { error } = await sb.from("orders").delete().eq("import_batch_id", batchId);
  if (error) return alert(error.message);
  await sb.from("import_batches").delete().eq("id", batchId);
  await refreshAll();
}

async function loadRules() {
  const rows = recognitionRules;
  $("adminRules").innerHTML = `
    <section class="panel">
      <h2>识别规则维护</h2>
      <p class="hint">用于把用户不规范地址映射为固定学校、校区和楼栋。</p>
      <div class="edit-grid rule-form">
        <input id="ruleKeyword" class="input" placeholder="关键词，例如 宿舍楼六栋" />
        <input id="ruleSchool" class="input" placeholder="学校，例如 师大" />
        <input id="ruleCampus" class="input" placeholder="校区，例如 西区" />
        <input id="ruleBuilding" class="input" placeholder="楼栋，例如 6栋" />
        <button id="addRuleBtn" type="button">新增规则</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>关键词</th><th>学校</th><th>校区</th><th>楼栋</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>${rows.map((rule) => `
            <tr><td>${escapeHtml(rule.keyword)}</td><td>${escapeHtml(rule.school)}</td><td>${escapeHtml(rule.campus)}</td><td>${escapeHtml(rule.building)}</td><td>${rule.enabled === false ? "停用" : "启用"}</td><td><button class="ghost small danger" type="button" data-delete-rule="${rule.id}">删除</button></td></tr>
          `).join("") || '<tr><td colspan="6">暂无规则</td></tr>'}</tbody>
        </table>
      </div>
    </section>`;
  $("addRuleBtn")?.addEventListener("click", addRule);
}

async function addRule() {
  const keyword = text($("ruleKeyword").value);
  const school = text($("ruleSchool").value);
  const campus = text($("ruleCampus").value);
  const building = text($("ruleBuilding").value);
  if (!keyword || !school || !campus || !building) return alert("关键词、学校、校区、楼栋都要填写");
  const { error } = await sb.from("recognition_rules").insert({ keyword, school, campus, building, created_by: currentProfile?.id || null });
  if (error) return alert(error.message);
  await refreshAll();
}

async function deleteRule(ruleId) {
  if (!confirm("确定删除这条识别规则吗？")) return;
  const { error } = await sb.from("recognition_rules").delete().eq("id", ruleId);
  if (error) return alert(error.message);
  await refreshAll();
}

function washLabelCampus(order) {
  const school = order.school || "";
  const campus = order.campus || "";
  const building = order.building || "";
  if (school === "理工" && campus.includes("一期")) return `理工一期:${building.replace("学生公寓一期", "")}`;
  if (school === "理工" && campus.includes("三期")) return `理工三期:${building.replace("学生公寓三期", "")}`;
  if (school === "贵中医" && /桂园/.test(building)) return `贵中医桂园:${building.replace("桂园", "")}`;
  if (school === "贵中医" && /杏园/.test(building)) return `贵中医杏园:${building.replace("杏园", "")}`;
  if (school === "贵中医" && /橘园/.test(building)) return `贵中医橘园:${building.replace("橘园", "")}`;
  if (school === "贵中医" && /桃园/.test(building)) return `贵中医桃园:${building.replace("桃园", "")}`;
  return `${school}${campus}:${building}`;
}

async function loadWashLabelRows(limit = 1000, batchDate = "") {
  const { data, error } = await sb.from("order_items").select("id, barcode, product_name, spec, item_status, item_index, orders(*)").order("barcode", { ascending: true }).limit(limit);
  if (error) return { rows: [], error };
  const rows = (data || []).map((item, index) => {
    const order = item.orders || {};
    const itemBatchDate = businessBatchDateFromOrder(order);
    return {
      序号: index + 1,
      条形编码: item.barcode || "",
      所属商家: order.merchant || "",
      姓名: order.customer_name || "",
      电话: order.phone || "",
      校区: washLabelCampus(order),
      物品: item.spec || item.product_name || "",
      实付款: order.paid_amount ?? "",
      下单时间: order.order_time ? String(order.order_time).replace("T", " ").slice(0, 19) : "",
      售后电话: AFTER_SALES_PHONE,
      item_status: item.item_status || "",
      id: item.id,
      order_id: order.id,
      batch_date: itemBatchDate,
      batch_label: itemBatchDate ? businessBatchLabel(itemBatchDate) : "未识别批次",
    };
  }).filter((row) => !batchDate || row.batch_date === batchDate);
  rows.forEach((row, index) => {
    row.序号 = index + 1;
  });
  return { rows, error: null };
}

async function loadLabels() {
  const allResult = await loadWashLabelRows(5000);
  const rows = allResult.rows;
  const error = allResult.error;
  if (error) return setMessage("adminLabels", error.message, "warn");
  const batchDates = [...new Set(rows.map((row) => row.batch_date).filter(Boolean))].sort().reverse();
  const selectedBatch = $("washBatchSelect")?.value || batchDates[0] || currentBusinessBatchDate();
  const filteredRows = rows.filter((row) => row.batch_date === selectedBatch);
  $("adminLabels").innerHTML = `
    <section class="panel table-panel">
      <h2>水洗标管理</h2>
      <div class="toolbar wrap">
        <select id="washBatchSelect" class="input">
          ${batchDates.map((date) => `<option value="${escapeHtml(date)}" ${date === selectedBatch ? "selected" : ""}>${escapeHtml(date)} 批次（${escapeHtml(businessBatchLabel(date))}）</option>`).join("") || `<option value="${escapeHtml(selectedBatch)}">${escapeHtml(selectedBatch)} 批次</option>`}
        </select>
        <input id="labelSearch" class="input" placeholder="搜索水洗标、姓名、电话、校区" />
      </div>
      <p class="hint">批次规则：昨天 18:00 之后到当天 18:00 之前付款/下单的订单，归为当天批次。</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>条形编码</th><th>所属商家</th><th>姓名</th><th>电话</th><th>校区</th><th>物品</th><th>实付款</th><th>状态</th><th>操作</th></tr></thead>
          <tbody id="labelRows">${renderLabelRows(filteredRows)}</tbody>
        </table>
      </div>
    </section>`;
  $("washBatchSelect")?.addEventListener("change", loadLabels);
  $("labelSearch")?.addEventListener("input", () => {
    const keyword = text($("labelSearch").value).toLowerCase();
    $("labelRows").innerHTML = renderLabelRows(filteredRows.filter((row) => JSON.stringify(row).toLowerCase().includes(keyword)));
  });
}

function renderLabelRows(rows) {
  return rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.条形编码)}</td><td>${escapeHtml(row.所属商家)}</td><td>${escapeHtml(row.姓名)}</td><td>${escapeHtml(row.电话)}</td><td>${escapeHtml(row.校区)}</td><td>${escapeHtml(row.物品)}</td><td>${escapeHtml(row.实付款)}</td><td>${escapeHtml(row.item_status)}</td>
      <td><button class="ghost small" type="button" data-detail="${row.order_id}">详情</button></td>
    </tr>`).join("") || '<tr><td colspan="9">暂无水洗标</td></tr>';
}

async function exportWashLabels() {
  if (!requireClient()) return;
  if (!currentUser) return alert("请先登录后台账号");
  const batchDate = $("washBatchSelect")?.value || currentBusinessBatchDate();
  const { rows, error } = await loadWashLabelRows(5000, batchDate);
  if (error) return alert(`读取水洗标失败：${error.message}`);
  if (!rows.length) return alert(`当前 ${batchDate} 批次暂无水洗标可导出`);
  const exportRows = rows.map((row) => ({
    序号: row.序号,
    批次: `${row.batch_date}（${row.batch_label}）`,
    条形编码: row.条形编码,
    所属商家: row.所属商家,
    姓名: row.姓名,
    电话: row.电话,
    校区: row.校区,
    物品: row.物品,
    实付款: row.实付款,
    下单时间: row.下单时间,
    售后电话: row.售后电话,
  }));
  const sheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, `${batchDate}批次`);
  XLSX.writeFile(workbook, `事事通水洗标清单-${batchDate}批次.xlsx`);
}

async function showOrderDetail(orderId) {
  const [orderResult, itemResult, logResult] = await Promise.all([
    sb.from("orders").select("*").eq("id", orderId).maybeSingle(),
    sb.from("order_items").select("*").eq("order_id", orderId).order("barcode"),
    sb.from("status_logs").select("*").eq("order_id", orderId).order("created_at", { ascending: false }).limit(50),
  ]);
  if (orderResult.error || !orderResult.data) return alert(orderResult.error?.message || "订单不存在");
  const order = orderResult.data;
  $("orderDialogTitle").textContent = `订单详情：${order.order_no}`;
  $("orderDialogBody").innerHTML = `
    <section class="panel">
      <h3>${escapeHtml(order.customer_name)} · ${escapeHtml(order.phone)}</h3>
      <p>${escapeHtml(order.address || "")}</p>
      <p>宿舍：${escapeHtml(`${order.school || ""}${order.campus || ""}${order.building || ""}`)}</p>
      <p>状态：${escapeHtml(order.order_status || "")}　金额：${escapeHtml(order.paid_amount ?? "")}</p>
      ${order.exception_note ? `<p class="warn">异常：${escapeHtml(order.exception_note)}</p>` : ""}
    </section>
    <section class="panel table-panel">
      <h3>物品 / 水洗标</h3>
      <div class="table-wrap"><table><thead><tr><th>水洗标</th><th>商品</th><th>规格</th><th>状态</th><th>图片</th></tr></thead><tbody>${(itemResult.data || []).map((item) => `<tr><td>${escapeHtml(item.barcode)}</td><td>${escapeHtml(item.product_name)}</td><td>${escapeHtml(item.spec)}</td><td>${escapeHtml(item.item_status)}</td><td>${item.image_links ? `<a href="${escapeHtml(item.image_links.split("\n")[0])}" target="_blank">查看</a>` : ""}</td></tr>`).join("")}</tbody></table></div>
    </section>
    <section class="panel">
      <h3>状态时间线</h3>
      <ul class="timeline">${(logResult.data || []).map((log) => `<li><strong>${escapeHtml(log.status)}</strong><span>${escapeHtml(String(log.created_at || "").replace("T", " ").slice(0, 19))}</span><p>${escapeHtml(log.note || "")}</p></li>`).join("") || "<li>暂无记录</li>"}</ul>
    </section>`;
  $("orderDialog").showModal();
}

function matchSearch(content) {
  const keyword = text($("courierSearch").value).toLowerCase();
  return !keyword || content.toLowerCase().includes(keyword);
}

function contactButtons(phone, message) {
  return `<div class="actions"><a class="button-link" href="tel:${escapeHtml(phone)}">打电话</a><a class="button-link" href="sms:${escapeHtml(phone)}?body=${encodeURIComponent(message)}">发短信</a></div>`;
}

async function loadCourierTasks() {
  const pickup = await sb.from("pickup_tasks").select("*, orders(*)").order("pickup_date", { ascending: true });
  const returns = await sb.from("return_tasks").select("*, order_items(*, orders(*))").order("outbound_date", { ascending: false });
  if (!pickup.error) renderPickupTasks(pickup.data || []);
  if (!returns.error) renderReturnTasks(returns.data || []);
}

function renderPickupTasks(tasks) {
  $("pickupTaskList").innerHTML = tasks.filter((task) => {
    const order = task.orders || {};
    return matchSearch(`${order.customer_name} ${order.phone} ${order.school} ${order.campus} ${order.building} ${order.address}`);
  }).map((task) => {
    const order = task.orders || {};
    const sms = `【事事通】同学您好，事事洗护今晚将到${order.school || ""}${order.campus || ""}${order.building || ""}取件，请把衣物/鞋子装袋并放好姓名电话纸条。`;
    return `<article class="task-card ${task.status === "已取件" ? "done" : ""}"><div class="card-head"><h3>${escapeHtml(order.customer_name)} · ${escapeHtml(order.phone)}</h3><span>${escapeHtml(task.status)}</span></div><p>${escapeHtml(`${task.pickup_date || "日期未定"}｜${order.school || ""}｜${order.campus || ""}｜${order.building || ""}`)}</p><p>${escapeHtml(order.address || "")}</p><p>订单号：${escapeHtml(order.order_no || "")}</p>${order.exception_note ? `<p class="warn">异常：${escapeHtml(order.exception_note)}</p>` : ""}${contactButtons(order.phone || "", sms)}<div class="actions"><button type="button" data-pickup="${task.id}" data-order="${order.id}" data-status="已取件">已取到</button><button type="button" data-pickup="${task.id}" data-order="${order.id}" data-status="未找到">未找到</button><button type="button" data-pickup="${task.id}" data-order="${order.id}" data-status="异常">异常</button><button class="ghost" type="button" data-detail="${order.id}">详情</button></div></article>`;
  }).join("") || '<p class="hint">暂无取件任务</p>';
}

function renderReturnTasks(tasks) {
  $("returnTaskList").innerHTML = tasks.filter((task) => {
    const item = task.order_items || {};
    const order = item.orders || {};
    return matchSearch(`${item.barcode} ${order.customer_name} ${order.phone} ${order.school} ${order.campus} ${order.building}`);
  }).map((task) => {
    const item = task.order_items || {};
    const order = item.orders || {};
    const sms = `【事事通】同学您好，您的事事洗护订单已出库，配送员将送回${order.school || ""}${order.campus || ""}${order.building || ""}，请保持电话畅通。`;
    return `<article class="task-card ${task.status === "已送达" ? "done" : ""}"><div class="card-head"><h3>${escapeHtml(order.customer_name)} · ${escapeHtml(order.phone)}</h3><span>${escapeHtml(task.status)}</span></div><p>${escapeHtml(`${task.outbound_date || ""}｜${order.school || ""}｜${order.campus || ""}｜${order.building || ""}`)}</p><p>水洗标：${escapeHtml(item.barcode || "")}｜${escapeHtml(item.spec || item.product_name || "")}</p>${contactButtons(order.phone || "", sms)}<div class="actions"><button type="button" data-return="${task.id}" data-item="${item.id}" data-order="${order.id}" data-status="配送中">配送中</button><button type="button" data-return="${task.id}" data-item="${item.id}" data-order="${order.id}" data-status="已送达">已送达</button><button type="button" data-return="${task.id}" data-item="${item.id}" data-order="${order.id}" data-status="异常">异常</button><button class="ghost" type="button" data-detail="${order.id}">详情</button></div></article>`;
  }).join("") || '<p class="hint">暂无送回任务</p>';
}

async function updatePickup(taskId, orderId, status) {
  const note = status === "未找到" || status === "异常" ? prompt("请输入异常备注", status) || status : "";
  const { error } = await sb.from("pickup_tasks").update({ status, exception_note: note, operator_id: currentProfile?.id || null, updated_at: new Date().toISOString() }).eq("id", taskId);
  if (error) return alert(error.message);
  await sb.from("orders").update({ order_status: status, exception_note: note, updated_at: new Date().toISOString() }).eq("id", orderId);
  if (status === "已取件") await sb.from("order_items").update({ item_status: "已取件", updated_at: new Date().toISOString() }).eq("order_id", orderId);
  await insertLog({ orderId, status, note });
  await refreshAll();
}

async function updateReturn(taskId, itemId, orderId, status) {
  const note = status === "异常" ? prompt("请输入异常备注", "送回异常") || "送回异常" : "";
  const { error } = await sb.from("return_tasks").update({ status, exception_note: note, operator_id: currentProfile?.id || null, updated_at: new Date().toISOString() }).eq("id", taskId);
  if (error) return alert(error.message);
  await sb.from("order_items").update({ item_status: status, updated_at: new Date().toISOString() }).eq("id", itemId);
  await sb.from("orders").update({ order_status: status, exception_note: note, updated_at: new Date().toISOString() }).eq("id", orderId);
  await insertLog({ orderId, itemId, status, note });
  await refreshAll();
}

async function loadFactoryItems() {
  const { data, error } = await sb.from("order_items").select("*, orders(*)").in("item_status", ["已取件", "已入厂", "清洗中"]).order("updated_at", { ascending: false }).limit(60);
  if (error) return setMessage("factoryItemList", error.message, "warn");
  $("factoryItemList").innerHTML = (data || []).map((item) => {
    const order = item.orders || {};
    return `<article class="task-card compact"><div class="card-head"><h3>${escapeHtml(item.barcode)}</h3><span>${escapeHtml(item.item_status)}</span></div><p>${escapeHtml(order.customer_name || "")} · ${escapeHtml(order.phone || "")}</p><p>${escapeHtml(`${order.school || ""}${order.campus || ""}${order.building || ""}`)}</p><p>${escapeHtml(item.spec || item.product_name || "")}</p></article>`;
  }).join("") || '<p class="hint">暂无待处理物品</p>';
}

async function startScanner() {
  if (!("BarcodeDetector" in window)) {
    $("scanResult").textContent = "当前浏览器不支持原生扫码，请使用扫码枪或手动输入水洗标。";
    return;
  }
  try {
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    $("scanVideo").srcObject = scanStream;
    await $("scanVideo").play();
    const detector = new BarcodeDetector({ formats: ["qr_code", "code_128", "code_39", "ean_13"] });
    clearInterval(scanTimer);
    scanTimer = setInterval(async () => {
      const codes = await detector.detect($("scanVideo"));
      if (codes[0]?.rawValue) {
        $("barcodeInput").value = codes[0].rawValue;
        $("scanResult").textContent = `已识别：${codes[0].rawValue}`;
      }
    }, 700);
  } catch (error) {
    $("scanResult").textContent = `摄像头打开失败：${error.message}`;
  }
}

async function factoryScan(scanType) {
  if (!currentUser) return alert("请先登录工厂账号");
  const barcode = text($("barcodeInput").value);
  if (!barcode) return alert("请先扫码或输入水洗标");
  const { data: item, error } = await sb.from("order_items").select("*, orders(*)").eq("barcode", barcode).maybeSingle();
  if (error || !item) return alert("没有找到这个水洗标");
  const status = scanType === "factory_in" ? "已入厂" : "已出库";
  const { error: scanError } = await sb.from("factory_scans").insert({ item_id: item.id, barcode, scan_type: scanType, operator_id: currentProfile?.id || null });
  if (scanError) return alert(scanError.message);
  await sb.from("order_items").update({ item_status: status, updated_at: new Date().toISOString() }).eq("id", item.id);
  await sb.from("orders").update({ order_status: status, updated_at: new Date().toISOString() }).eq("id", item.order_id);
  if (scanType === "factory_out") await sb.from("return_tasks").upsert({ item_id: item.id, outbound_date: todayDate(), status: "待送回", operator_id: currentProfile?.id || null, updated_at: new Date().toISOString() }, { onConflict: "item_id" });
  await insertLog({ orderId: item.order_id, itemId: item.id, barcode, status, note: scanType === "factory_in" ? "工厂扫码入库" : "工厂扫码出库，生成送回任务" });
  $("scanResult").textContent = `${barcode} 已${scanType === "factory_in" ? "入库" : "出库"}`;
  $("barcodeInput").select();
  await refreshAll();
}

async function trackByPhone() {
  if (!requireClient()) return;
  const phone = phoneValue($("studentPhone").value);
  if (!phone) return alert("请输入手机号");
  const { data, error } = await sb.rpc("track_by_phone", { query_phone: phone });
  if (error) return setMessage("trackResults", `查询失败：${error.message}`, "warn");
  $("trackResults").innerHTML = (data || []).map((row) => `<article class="task-card"><div class="card-head"><h3>${escapeHtml(row.customer_name)} · ${escapeHtml(row.order_no)}</h3><span>${escapeHtml(row.item_status || row.order_status)}</span></div><p>${escapeHtml(`${row.school || ""}｜${row.campus || ""}｜${row.building || ""}`)}</p><p>水洗标：${escapeHtml(row.barcode || "未生成")}｜${escapeHtml(row.spec || row.product_name || "")}</p><p>当前订单状态：${escapeHtml(row.order_status || "")}</p>${row.latest_note ? `<p class="hint">最新记录：${escapeHtml(row.latest_note)}</p>` : ""}<p>客服电话：${AFTER_SALES_PHONE}</p></article>`).join("") || '<p class="hint">没有查到订单，请确认手机号是否与下单手机号一致。</p>';
}

function bindEvents() {
  $("saveConfigBtn").addEventListener("click", saveConfig);
  $("loginBtn").addEventListener("click", login);
  $("signOutBtn").addEventListener("click", signOut);
  $("fileInput").addEventListener("change", handleImport);
  $("exportWashLabelsBtn").addEventListener("click", exportWashLabels);
  $("refreshAdminBtn").addEventListener("click", refreshAll);
  $("refreshCourierBtn").addEventListener("click", refreshAll);
  $("courierSearch").addEventListener("input", loadCourierTasks);
  $("startScanBtn").addEventListener("click", startScanner);
  $("factoryInBtn").addEventListener("click", () => factoryScan("factory_in"));
  $("factoryOutBtn").addEventListener("click", () => factoryScan("factory_out"));
  $("trackBtn").addEventListener("click", trackByPhone);
  $("closeOrderDialogBtn").addEventListener("click", () => $("orderDialog").close());
  document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => switchView(tab.dataset.view)));
  document.querySelectorAll(".subtab").forEach((tab) => tab.addEventListener("click", () => switchAdminSection(tab.dataset.adminSection)));
  document.addEventListener("click", (event) => {
    const pickupBtn = event.target.closest("[data-pickup]");
    if (pickupBtn) updatePickup(pickupBtn.dataset.pickup, pickupBtn.dataset.order, pickupBtn.dataset.status);
    const returnBtn = event.target.closest("[data-return]");
    if (returnBtn) updateReturn(returnBtn.dataset.return, returnBtn.dataset.item, returnBtn.dataset.order, returnBtn.dataset.status);
    const detailBtn = event.target.closest("[data-detail]");
    if (detailBtn) showOrderDetail(detailBtn.dataset.detail);
    const saveBtn = event.target.closest("[data-save-dorm]");
    if (saveBtn) saveDorm(saveBtn.dataset.saveDorm);
    const learnBtn = event.target.closest("[data-learn-rule]");
    if (learnBtn) learnRule(learnBtn.dataset.learnRule, learnBtn.dataset.address || "");
    const deleteBatchBtn = event.target.closest("[data-delete-batch]");
    if (deleteBatchBtn) deleteBatch(deleteBatchBtn.dataset.deleteBatch);
    const deleteRuleBtn = event.target.closest("[data-delete-rule]");
    if (deleteRuleBtn) deleteRule(deleteRuleBtn.dataset.deleteRule);
  });
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

bindEvents();
initSupabase();
applyRouteFromUrl();
