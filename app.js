const CONFIG_KEY = "shitong_cloud_supabase_config";
const AFTER_SALES_PHONE = "15599157072";
const APP_BUILD = (() => {
  const scriptUrl = document.currentScript?.src || "";
  const scriptVersion = scriptUrl ? new URL(scriptUrl, window.location.href).searchParams.get("v") : "";
  return scriptVersion || new URLSearchParams(window.location.search).get("build") || "";
})();
const DEFAULT_SUPABASE_CONFIG = {
  url: "https://ukzjgjfefqlyeqecqyiz.supabase.co",
  anonKey: "sb_publishable_OAwXdqIPnQqYHUJj4Md-pw_HAFIMMcO",
};
const OVERDUE_HOURS = 48;
const APP_MODE = document.body?.dataset.appMode || new URLSearchParams(window.location.search).get("page") || "admin";
const ROLE_LABELS = {
  admin: "后台",
  courier: "配送员",
  factory: "工厂",
  student: "学生查询",
};
const ROLE_ACCESS = {
  admin: ["admin"],
  courier: ["admin", "courier"],
  factory: ["admin", "factory"],
};
const ORDER_STATUSES = ["待取件", "待补取", "已取件", "未找到", "已入厂", "已出库", "配送中", "已送达", "异常"];
const ITEM_STATUSES = ["待取件", "待补取", "已取件", "未找到", "已入厂", "清洗中", "已出库", "配送中", "已送达", "异常"];
const ORDER_EDITABLE_STATUSES = ORDER_STATUSES.filter((status) => status !== "待补取");
const ITEM_EDITABLE_STATUSES = ITEM_STATUSES.filter((status) => status !== "待补取");
const FACTORY_IN_OVERRIDE_STATUSES = new Set(["待取件", "待补取", "已取件", "未找到", "异常"]);
const FACTORY_OUT_OVERRIDE_STATUSES = new Set(["待取件", "待补取", "已取件", "未找到", "异常", "已入厂", "清洗中"]);
const SETTLEMENT_UNCONFIRMED = "unconfirmed";
const SETTLEMENT_OTHER = "other";
const WASH_DECISION_NORMAL = "normal";
const WASH_DECISION_SUPPLEMENT_PENDING = "supplement_pending";
const WASH_DECISION_SUPPLEMENT_CONFIRMED = "supplement_confirmed";
const WASH_DECISION_RETURN_PENDING = "return_pending";
const WASH_DECISION_RETURNED = "returned";
const RETURN_DELIVERY_BUCKET = "return-delivery-proof";
const RETURN_DELIVERY_MAX_BYTES = 10 * 1024 * 1024;
const RETURN_DELIVERY_TARGET_BYTES = 600 * 1024;
const RETURN_DELIVERY_STORED_MAX_BYTES = 800 * 1024;
const DELIVERY_PROOF_PUBLIC_URL = "https://linlang654.github.io/shitong-cloud-app/p.html?c=";
const EXCEPTION_OPEN_STATUSES = ["待客服", "待客户", "处理中"];
const EXCEPTION_TICKET_TYPES = ["原有破损", "材质风险", "受潮", "漏取/补取", "返洗", "退洗", "补差", "少件/串单", "清洗效果", "配送异常", "其他异常"];
const PICKUP_OPEN_STATUSES = new Set(["待取件", "未找到"]);
const RETRY_PICKUP_OPEN_STATUSES = new Set(["待补取", "未找到"]);
const WASH_DECISION_OPTIONS = [
  { key: WASH_DECISION_NORMAL, label: "正常洗护（无需差价）", adjustmentType: "none" },
  { key: WASH_DECISION_SUPPLEMENT_PENDING, label: "待补差，暂不清洗", adjustmentType: "supplement" },
  { key: WASH_DECISION_SUPPLEMENT_CONFIRMED, label: "已补差，继续清洗", adjustmentType: "supplement" },
  { key: WASH_DECISION_RETURN_PENDING, label: "不洗，待退回", adjustmentType: "refund" },
  { key: WASH_DECISION_RETURNED, label: "已退洗并退回", adjustmentType: "refund" },
];
const DEFAULT_SETTLEMENT_CATEGORIES = [
  { key: "regular_shoe", label: "休闲鞋/运动鞋/帆布鞋/板鞋", shortLabel: "普通鞋", unit: "双", detail: "含网面普通鞋；特殊材质和靴类需另选" },
  { key: "suede_shoe", label: "绒面/鹿皮/翻毛皮", shortLabel: "绒面/鹿皮", unit: "双", detail: "绒面、鹿皮、麂皮、翻毛皮鞋" },
  { key: "short_boot", label: "短靴/雪地靴/大黄靴", shortLabel: "短靴类", unit: "双", detail: "普通短靴、雪地靴、大黄靴、棉靴" },
  { key: "tall_boot", label: "中高靴/高筒靴", shortLabel: "中高靴", unit: "双", detail: "超过脚踝的中筒靴、高筒靴" },
  { key: "tshirt", label: "T恤", shortLabel: "T恤", unit: "件", detail: "T恤、短袖、长袖、Polo衫" },
  { key: "pants_skirt", label: "短裙/短裤/牛仔裤/普通西裤", shortLabel: "裤裙类", unit: "件", detail: "含休闲裤、普通西裤" },
  { key: "knit_shirt", label: "毛衣/卫衣/衬衫", shortLabel: "毛衣衬衫", unit: "件", detail: "毛衣、卫衣、衬衫" },
  { key: "light_outerwear", label: "短夹克/薄外套/防晒衣/普通西装外套", shortLabel: "薄外套", unit: "件", detail: "短夹克、薄外套、防晒衣、普通西装外套" },
  { key: "heavy_outerwear", label: "冲锋衣/风衣/羽绒服/棉服/毛呢大衣", shortLabel: "厚款衣物", unit: "件", detail: "含羊毛、羊绒、呢子大衣" },
  { key: "dress_formal", label: "连衣裙/马面裙/普通礼服", shortLabel: "礼服裙装", unit: "件", detail: "连衣裙、马面裙、普通礼服" },
  { key: "luxury_fur", label: "奢侈品鞋类/皮草护理", shortLabel: "奢侈品/皮草", unit: "件", detail: "奢侈品鞋类和皮草护理" },
  { key: SETTLEMENT_OTHER, label: "其他品类", shortLabel: "其他品类", unit: "件", detail: "未在售或临时收取的物品，需填写实际名称和代工价", isOther: true },
];
let SETTLEMENT_CATEGORIES = DEFAULT_SETTLEMENT_CATEGORIES.map((category, index) => ({ ...category, isActive: true, sortOrder: (index + 1) * 10 }));
let ALL_SETTLEMENT_CATEGORIES = [...SETTLEMENT_CATEGORIES];
const STUDENT_TIMELINE_STEPS = [
  { key: "ordered", label: "下单", statuses: [] },
  { key: "picked", label: "已取件待清洗", statuses: ["已取件"] },
  { key: "factory", label: "已入厂清洗中", statuses: ["已入厂", "清洗中"] },
  { key: "outbound", label: "已出库待配送", statuses: ["已出库", "配送中"] },
  { key: "delivered", label: "已送达", statuses: ["已送达"] },
];

let sb = null;
let currentUser = null;
let currentProfile = null;
let scanStream = null;
let scanTimer = null;
let scanControls = null;
let scanSession = 0;
let torchEnabled = false;
let scannerIsActive = false;
let factoryScanMode = "";
let factoryScanBusy = false;
let factoryCameraExpanded = false;
let factoryScanSuccessCount = 0;
let factoryScanFailureCount = 0;
let factoryLastSeenBarcode = "";
let factoryLastSeenAt = 0;
const factoryLabelBatch = [];
const factoryScanQueue = [];
let factoryDailyScans = [];
let factoryDailyOutboundGroups = [];
let factoryDailyActiveTab = "out";
let factoryItemRows = [];
let factoryItemTotalCount = 0;
let factoryPendingView = "";
let factoryOrderSearchRows = [];
let factoryOrderSearchBusy = false;
const factorySelectedOutboundOrders = new Set();
const factoryProcessedBarcodes = new Set();
const factoryScanHistory = [];
let recognitionRules = [];
const imagePreviewMap = new Map();
let orderManagementRows = [];
let orderDashboardFilter = "";
let courierDashboardFilter = "";
let factoryDashboardFilter = "";
let courierPickupTaskRows = [];
let courierRetryTaskRows = [];
let courierReturnTaskRows = [];
let courierActivePickupAreaKey = "";
let courierPickupDateInitialized = false;
let courierPickupBusyTaskId = "";
let courierPickupScrollToNext = false;
let courierReturnOrderGroups = [];
let courierReturnBusyTaskId = "";
const courierReturnProofFiles = new Map();
let currentExceptionRows = [];
let currentExceptionTickets = [];
let exceptionActionMessage = "";
let exceptionTicketSchemaAvailable = null;
let exceptionTicketSchemaError = "";
let exceptionTicketBusy = false;
let exceptionTicketContext = null;
let retryPickupSchemaAvailable = null;
let retryPickupSchemaError = "";
let reconciliationSummary = null;
let reconciliationRecord = null;
let settlementSchemaAvailable = null;
let settlementSchemaError = "";
let washAdjustmentSchemaAvailable = null;
let washAdjustmentSchemaError = "";
let settlementCatalogAvailable = null;
let settlementCatalogError = "";
const settlementCatalogDraft = new Map();
let settlementCatalogSearch = "";
let settlementCatalogActiveOnly = true;
let labelReviewRows = [];
let labelVisibleRows = [];
const labelSelectedItems = new Set();
let labelBulkSaveBusy = false;

const $ = (id) => document.getElementById(id);
const on = (id, eventName, handler) => $(id)?.addEventListener(eventName, handler);

function text(value) {
  return String(value ?? "").replace(/_x000d_/gi, "\n").replace(/\s+/g, " ").trim();
}

function settlementCategoryDefinition(key) {
  return ALL_SETTLEMENT_CATEGORIES.find((category) => category.key === text(key))
    || DEFAULT_SETTLEMENT_CATEGORIES.find((category) => category.key === text(key))
    || null;
}

function validSettlementCategoryKey(key) {
  return Boolean(settlementCategoryDefinition(text(key)));
}

function selectableSettlementCategoryKey(key) {
  return SETTLEMENT_CATEGORIES.some((category) => category.key === text(key));
}

function settlementCategoryLabel(key, short = false) {
  const category = settlementCategoryDefinition(key);
  if (!category) return "待确认";
  return short ? category.shortLabel : category.label;
}

function settlementCategoryOptions(selectedKey = SETTLEMENT_UNCONFIRMED) {
  const selected = validSettlementCategoryKey(selectedKey) ? selectedKey : SETTLEMENT_UNCONFIRMED;
  const choices = [...SETTLEMENT_CATEGORIES];
  const selectedDefinition = settlementCategoryDefinition(selected);
  if (selectedDefinition && !choices.some((category) => category.key === selectedDefinition.key)) {
    choices.unshift({ ...selectedDefinition, inactive: true });
  }
  return [
    `<option value="${SETTLEMENT_UNCONFIRMED}" ${selected === SETTLEMENT_UNCONFIRMED ? "selected" : ""}>请选择结算品类</option>`,
    ...choices.map((category) => `<option value="${category.key}" ${selected === category.key ? "selected" : ""}>${escapeHtml(category.label)}${category.inactive ? "（已停用）" : ""}</option>`),
  ].join("");
}

function normalizeSettlementCatalogRow(row, index = 0) {
  return {
    key: text(row?.key),
    groupName: text(row?.group_name) || "未分组",
    label: text(row?.label),
    shortLabel: text(row?.short_label) || text(row?.label),
    unit: text(row?.unit) === "双" ? "双" : "件",
    detail: text(row?.detail) || text(row?.group_name),
    retailPrice: row?.retail_price === null || row?.retail_price === undefined ? null : numberValue(row.retail_price),
    costPrice: row?.cost_price === null || row?.cost_price === undefined ? null : numberValue(row.cost_price),
    isActive: Boolean(row?.is_active),
    sortOrder: numberValue(row?.sort_order) || index,
    source: text(row?.source),
    isOther: text(row?.key) === SETTLEMENT_OTHER,
  };
}

async function loadSettlementCatalog(force = false) {
  if (!sb) return false;
  if (!force && settlementCatalogAvailable !== null) return settlementCatalogAvailable;
  const { data, error } = await sb.from("settlement_catalog").select("*").order("sort_order", { ascending: true }).order("label", { ascending: true });
  settlementCatalogAvailable = !error;
  settlementCatalogError = error?.message || "";
  if (error || !(data || []).length) {
    ALL_SETTLEMENT_CATEGORIES = DEFAULT_SETTLEMENT_CATEGORIES.map((category, index) => ({ ...category, isActive: true, sortOrder: (index + 1) * 10 }));
    SETTLEMENT_CATEGORIES = [...ALL_SETTLEMENT_CATEGORIES];
    return false;
  }
  ALL_SETTLEMENT_CATEGORIES = data.map(normalizeSettlementCatalogRow).filter((category) => category.key && category.label);
  SETTLEMENT_CATEGORIES = ALL_SETTLEMENT_CATEGORIES
    .filter((category) => category.isActive || category.isOther)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.label.localeCompare(right.label, "zh-CN"));
  if (!SETTLEMENT_CATEGORIES.some((category) => category.key === SETTLEMENT_OTHER)) {
    const fallbackOther = DEFAULT_SETTLEMENT_CATEGORIES.find((category) => category.key === SETTLEMENT_OTHER);
    SETTLEMENT_CATEGORIES.push({ ...fallbackOther, isActive: true, sortOrder: 9999 });
  }
  return true;
}

async function detectSettlementSchemaAvailability(force = false) {
  if (!sb) return false;
  if (!force && settlementSchemaAvailable !== null) return settlementSchemaAvailable;
  const { error } = await sb.from("order_items").select("settlement_category,settlement_other_name,settlement_other_unit,settlement_cost_snapshot").limit(1);
  settlementSchemaAvailable = !error;
  settlementSchemaError = error?.message || "";
  return settlementSchemaAvailable;
}

function settlementMigrationMessage() {
  return "结算品类数据库字段尚未启用，请在 Supabase SQL Editor 执行最新版 supabase-admin-upgrade.sql 后刷新页面。";
}

async function detectWashAdjustmentSchemaAvailability(force = false) {
  if (!sb) return false;
  if (!force && washAdjustmentSchemaAvailable !== null) return washAdjustmentSchemaAvailable;
  const { error } = await sb.from("order_items").select("wash_decision,price_adjustment_type,price_adjustment_amount,wash_decision_reason,wash_decision_note").limit(1);
  washAdjustmentSchemaAvailable = !error;
  washAdjustmentSchemaError = error?.message || "";
  return washAdjustmentSchemaAvailable;
}

function washAdjustmentMigrationMessage() {
  return "退洗数据库字段尚未启用，请在 Supabase SQL Editor 执行 supabase-return-wash-migration.sql 后刷新页面。";
}

async function detectExceptionTicketSchemaAvailability(force = false) {
  if (!sb) return false;
  if (!force && exceptionTicketSchemaAvailable !== null) return exceptionTicketSchemaAvailable;
  const { error } = await sb.from("exception_tickets").select("id,status,evidence_paths").limit(1);
  exceptionTicketSchemaAvailable = !error;
  exceptionTicketSchemaError = error?.message || "";
  return exceptionTicketSchemaAvailable;
}

function exceptionTicketMigrationMessage() {
  return "异常工单数据库尚未启用，请在 Supabase SQL Editor 执行 supabase-exception-tickets-migration.sql 后刷新页面。地址修正功能仍可继续使用。";
}

async function detectRetryPickupSchemaAvailability(force = false) {
  if (!sb) return false;
  if (!force && retryPickupSchemaAvailable !== null) return retryPickupSchemaAvailable;
  const { error } = await sb.from("pickup_retry_tasks").select("id,status,pickup_date").limit(1);
  retryPickupSchemaAvailable = !error;
  retryPickupSchemaError = error?.message || "";
  return retryPickupSchemaAvailable;
}

function retryPickupMigrationMessage() {
  return "补取任务数据库尚未启用，请先执行 supabase-repickup-migration.sql。普通取件仍可继续使用。";
}

function washDecisionDefinition(key) {
  return WASH_DECISION_OPTIONS.find((option) => option.key === text(key)) || WASH_DECISION_OPTIONS[0];
}

function washDecisionLabel(item) {
  return washDecisionDefinition(item?.wash_decision).label;
}

function washDecisionIsReturn(item) {
  return [WASH_DECISION_RETURN_PENDING, WASH_DECISION_RETURNED].includes(text(item?.wash_decision));
}

function normalizeRecognitionText(value) {
  return text(value).replace(/\s+/g, "").toLowerCase();
}

function isUnresolvedDormValue(value, type) {
  const normalized = text(value);
  if (!normalized) return true;
  if (type === "school") return normalized === "学校未识别";
  if (type === "campus") return normalized === "校区未识别";
  if (type === "building") return normalized === "楼栋未识别";
  return /未识别/.test(normalized);
}

function isDormComplete(values) {
  return !isUnresolvedDormValue(values.school, "school")
    && !isUnresolvedDormValue(values.campus, "campus")
    && !isUnresolvedDormValue(values.building, "building");
}

function isRecognitionReviewNote(value) {
  return /未识别学校|未识别校区|未识别楼栋|地址推测，?待确认|楼栋与校区不匹配，?待确认/.test(text(value));
}

function cleanRecognitionNote(value) {
  return text(value)
    .split(/[；;]/)
    .map(text)
    .filter(Boolean)
    .filter((part) => !/^(未识别学校|未识别校区|未识别楼栋|地址推测，?待确认|楼栋与校区不匹配，?待确认)$/.test(part))
    .join("；");
}

function appendRecognitionNote(value, note) {
  const parts = text(value).split(/[；;]/).map(text).filter(Boolean);
  if (note && !parts.includes(note)) parts.push(note);
  return parts.join("；");
}

function recognitionTier(dorm) {
  if (!isDormComplete(dorm)) return "review";
  if (Number(dorm.recognitionConfidence || 0) >= 90 && !locationNeedsReview(dorm.school, dorm.campus, dorm.building)) return "high";
  if (Number(dorm.recognitionConfidence || 0) > 0 && Number(dorm.recognitionConfidence || 0) < 70) return "review";
  if (isRecognitionReviewNote(dorm.note)) return "confirm";
  if (dorm.recognitionSource === "rule" || dorm.recognitionSource === "form") return "high";
  return "confirm";
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
  const normalized = (raw.includes("T") ? raw : raw.replace(/\./g, "-")).replace(/\//g, "-");
  const isoLike = normalized.includes("T") ? normalized : normalized.replace(" ", "T");
  const browserSafe = isoLike.replace(/(\.\d{3})\d+(?=Z|[+-]\d{2}:\d{2}$)/, "$1");
  const date = new Date(browserSafe);
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

function setConnectionStatus(message, state = "checking") {
  const target = $("connectionStatus");
  if (!target) return;
  target.textContent = message;
  target.dataset.state = state;
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

function populateConfigInputs(config = loadConfig()) {
  if ($("supabaseUrl")) $("supabaseUrl").value = config.url || "";
  if ($("supabaseAnonKey")) $("supabaseAnonKey").value = config.anonKey || "";
}

async function saveConfig() {
  const config = {
    url: text($("supabaseUrl")?.value).replace(/\/rest\/v1\/?$/, ""),
    anonKey: text($("supabaseAnonKey")?.value),
  };
  if (!config.url || !config.anonKey) {
    setMessage("configMessage", "请完整填写 Project URL 和 Publishable Key。", "warn");
    return;
  }
  setMessage("configMessage", "正在检查新连接…");
  try {
    const probe = window.supabase.createClient(config.url, config.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { error } = await probe.from("profiles").select("id").limit(1);
    if (error) throw error;
  } catch (error) {
    setMessage("configMessage", `连接检查失败：${error.message || error}`, "warn");
    return;
  }
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  await initSupabase();
  setMessage("configMessage", "连接配置已保存，数据库连接正常。", "success");
}

async function initSupabase() {
  const config = loadConfig();
  populateConfigInputs(config);
  if (config.url && config.anonKey && window.supabase) {
    sb = window.supabase.createClient(config.url, config.anonKey);
    setConnectionStatus("正在检查数据库连接…", "checking");
    await refreshSession();
    if ($("deliveryProofState")) await loadDeliveryProof();
  } else {
    sb = null;
    if ($("sessionLabel")) $("sessionLabel").textContent = "未连接";
    setConnectionStatus("数据库尚未连接，请联系管理员", "error");
    setAuthGate(false);
  }
}

function requireClient() {
  if (!sb) {
    setMessage("authMessage", "数据库尚未连接，请联系管理员。", "warn");
    return false;
  }
  return true;
}

async function refreshSession() {
  if (!sb) return;
  const { data, error } = await sb.auth.getUser();
  const missingSession = error && /session.*missing|auth session missing/i.test(error.message || "");
  if (error && !missingSession) {
    currentUser = null;
    currentProfile = null;
    if ($("sessionLabel")) $("sessionLabel").textContent = "连接失败";
    setConnectionStatus("数据库连接失败，请联系管理员", "error");
    setMessage("authMessage", "暂时无法连接数据库，请稍后重试或联系管理员。", "warn");
    setAuthGate(false);
    return;
  }
  setConnectionStatus("数据库连接正常", "connected");
  currentUser = data?.user || null;
  currentProfile = null;
  if (!currentUser) {
    if ($("sessionLabel")) $("sessionLabel").textContent = APP_MODE === "student" ? "公开查询" : "已连接，未登录";
    $("signOutBtn")?.classList.add("hidden");
    $("loginPanel")?.classList.remove("hidden");
    setAuthGate(false);
    return;
  }
  const result = await sb.from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
  currentProfile = result.data || null;
  if ($("sessionLabel")) $("sessionLabel").textContent = `${currentProfile?.name || currentUser.email} · ${currentProfile?.role || "未设置角色"}`;
  $("signOutBtn")?.classList.remove("hidden");
  $("loginPanel")?.classList.add("hidden");
  const isAllowed = canUseCurrentPage();
  setAuthGate(isAllowed);
  if (isAllowed) await refreshAll();
}

async function login() {
  if (!requireClient()) return;
  const email = text($("loginEmail").value);
  const password = $("loginPassword").value;
  if (!email || !password) return setMessage("authMessage", "请输入邮箱和密码。", "warn");
  setMessage("authMessage", "正在登录…");
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return setMessage("authMessage", `登录失败：${error.message}`, "warn");
  if ($("loginPassword")) $("loginPassword").value = "";
  await refreshSession();
}

async function signOut() {
  if (!sb) return;
  await sb.auth.signOut();
  currentUser = null;
  currentProfile = null;
  if ($("sessionLabel")) $("sessionLabel").textContent = "已连接，未登录";
  $("signOutBtn")?.classList.add("hidden");
  $("loginPanel")?.classList.remove("hidden");
  setAuthGate(false);
}

function canUseCurrentPage() {
  if (APP_MODE === "student") return true;
  const allowedRoles = ROLE_ACCESS[APP_MODE] || ROLE_ACCESS.admin;
  const role = currentProfile?.role || "";
  return allowedRoles.includes(role);
}

function setAuthGate(isAllowed) {
  const requiresLogin = APP_MODE !== "student";
  document.querySelectorAll("[data-auth-only]").forEach((node) => node.classList.toggle("hidden", requiresLogin && !isAllowed));
  document.querySelectorAll("[data-guest-only]").forEach((node) => node.classList.toggle("hidden", !requiresLogin || isAllowed));
  document.body?.classList.toggle("has-access", requiresLogin && isAllowed);
  if (requiresLogin && currentUser && !isAllowed) {
    setMessage("authMessage", `当前账号角色为“${currentProfile?.role || "未设置"}”，不能进入${ROLE_LABELS[APP_MODE] || "此"}页面。`, "warn");
  } else if (requiresLogin && !currentUser) {
    setMessage("authMessage", `请先登录${ROLE_LABELS[APP_MODE] || "员工"}账号。`);
  } else {
    setMessage("authMessage", "");
  }
}

function switchView(viewName) {
  if (APP_MODE === "admin") {
    const dedicatedPages = {
      courier: "./courier.html",
      factory: "./factory.html",
      student: "./track.html",
    };
    if (dedicatedPages[viewName]) {
      const buildQuery = APP_BUILD ? `?build=${encodeURIComponent(APP_BUILD)}` : "";
      window.location.href = `${dedicatedPages[viewName]}${buildQuery}`;
      return;
    }
  }
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewName));
  document.querySelectorAll(".view").forEach((view) => view.classList.add("hidden"));
  $(`${viewName}View`)?.classList.remove("hidden");
  if (APP_MODE === "admin" && sb && currentUser) {
    if (viewName === "courier") loadCourierTasks();
    if (viewName === "factory") loadFactoryItems();
    if (viewName === "admin") loadAdmin();
  }
}

function applyRouteFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page") || params.get("view");
  if (APP_MODE === "admin" && ["courier", "factory", "student", "track"].includes(page)) {
    const target = page === "student" || page === "track" ? "track" : page;
    window.location.replace(`./${target}.html`);
    return;
  }
  const routeMap = {
    admin: "admin",
    courier: "courier",
    factory: "factory",
    student: "student",
    track: "student",
  };
  if (!routeMap[page] || APP_MODE !== "admin") return;
  document.body.classList.add("route-page", `route-${routeMap[page]}`);
  switchView(routeMap[page]);
}

function switchAdminSection(sectionName) {
  document.querySelectorAll(".subtab").forEach((tab) => tab.classList.toggle("active", tab.dataset.adminSection === sectionName));
  document.querySelectorAll(".admin-section").forEach((section) => section.classList.add("hidden"));
  $(`admin${sectionName[0].toUpperCase()}${sectionName.slice(1)}`)?.classList.remove("hidden");
  if (APP_MODE === "admin" && sb && currentUser) loadAdminSection(sectionName);
}

function openDashboardTarget(target) {
  orderDashboardFilter = "";
  courierDashboardFilter = "";
  factoryDashboardFilter = "";

  if (target === "pickup-today") {
    courierDashboardFilter = "pickup-today";
    if ($("courierPickupDate")) $("courierPickupDate").value = "";
    switchView("courier");
    return;
  }
  if (target === "pending-return") {
    courierDashboardFilter = "pending-return";
    switchView("courier");
    return;
  }
  if (target === "pending-in" || target === "pending-out") {
    factoryDashboardFilter = target;
    switchView("factory");
    return;
  }
  switchView("admin");
  if (target === "exceptions") {
    switchAdminSection("exceptions");
    return;
  }
  if (target === "overdue" || target.startsWith("overdue-")) {
    orderDashboardFilter = target;
    switchAdminSection("orders");
  }
}

function renderActiveFilter(targetId, label, scope) {
  const target = $(targetId);
  if (!target) return;
  if (!label) {
    target.classList.add("hidden");
    target.innerHTML = "";
    return;
  }
  target.innerHTML = `<span>${escapeHtml(label)}</span><button class="ghost small-btn" type="button" data-clear-dashboard-filter="${scope}">清除筛选</button>`;
  target.classList.remove("hidden");
}

function clearDashboardFilter(scope) {
  if (scope === "courier") {
    courierDashboardFilter = "";
    loadCourierTasks();
  }
  if (scope === "factory") {
    factoryDashboardFilter = "";
    loadFactoryItems();
  }
  if (scope === "orders") {
    orderDashboardFilter = "";
    renderActiveFilter("orderActiveFilter", "", "orders");
    applyOrderFilters();
  }
}

function field(row, names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== "") return row[name];
  }
  const entries = Object.entries(row || {});
  for (const name of names) {
    const normalizedName = text(name).replace(/\s+/g, "");
    const matched = entries.find(([key, value]) => {
      const normalizedKey = text(key).replace(/\s+/g, "");
      return normalizedKey.includes(normalizedName) && value !== undefined && value !== null && String(value).trim() !== "";
    });
    if (matched) return matched[1];
  }
  return "";
}

function formField(row) {
  return text(field(row, ["表单信息", "表单内容", "表单", "用户表单", "买家留言", "备注", "订单备注"]));
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
      const value = items.map((row) => field(row, [name])).find((item) => text(item));
      if (value === undefined) return;
      items.forEach((row) => {
        if (!text(field(row, [name]))) row[name] = value;
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
  if (/民族|民大|贵山校区|百川校区/.test(source)) return "民大";
  if (/理工/.test(source)) return "理工";
  if (/贵州中医药大学|贵中医|中医/.test(source)) return "中医";
  if (/科院|贵州科学院|贵科院/.test(source)) return "贵科院";
  if (/人文/.test(source)) return "人文";
  if (/城市学院|职业学院/.test(source)) return "城市学院";
  return "学校未识别";
}

function updateExceptionBadge(count) {
  const badge = $("exceptionTabBadge");
  if (!badge) return;
  const total = Math.max(0, Number(count) || 0);
  badge.textContent = total > 99 ? "99+" : String(total);
  badge.classList.toggle("hidden", total === 0);
  badge.setAttribute("aria-label", `${total} 个待处理异常`);
}

function isTcmSchool(school) {
  return /^(?:中医|贵中医|贵州中医药大学)$/.test(text(school));
}

function defaultCampusForSchool(school) {
  if (school === "贵科院") return "学生公寓";
  if (school === "人文") return "学生宿舍";
  return "";
}

const GUIZHOU_TCM_DORM_CODE_MAP = Object.freeze({
  H1: "橘园1栋（H1）",
  H2: "橘园2栋（H2）",
  H3: "橘园3栋（H3）",
  H4: "橘园4栋（H4）",
  H5: "桂园1栋（H5）",
  H6: "桂园2栋（H6）",
  H7: "桂园3栋（H7）",
  H8: "H8号学生公寓（H8）",
  J1: "杏园1栋（J1）",
  J2: "杏园2栋（J2）",
  J3: "杏园3栋（J3）",
  J4: "李园1栋（J4）",
  J5: "李园2栋（J5）",
});

function guizhouTcmDormCodeEvidence(source) {
  const value = text(source);
  const codeMatch = value.match(/(?:^|[^A-Z0-9])(H[1-8]|J[1-6])(?=$|[^A-Z0-9])/i);
  if (!codeMatch) return null;
  const code = codeMatch[1].toUpperCase();
  if (code === "J6") {
    const areaMatch = value.match(/(?:J6[\s\S]{0,8}?|桃园\s*)([A-D])\s*区?/i);
    if (areaMatch) {
      return {
        building: `桃园${areaMatch[1].toUpperCase()}区（J6）`,
        match: areaMatch[0],
        confidence: 96,
        reason: "贵州中医药大学旧代码J6及A-D分区对应桃园分区",
      };
    }
    return {
      building: "桃园分区未识别（J6）",
      match: codeMatch[0].trim() || code,
      confidence: 55,
      reason: "旧代码J6只能确定为桃园，地址未写明A、B、C或D区",
    };
  }
  const building = GUIZHOU_TCM_DORM_CODE_MAP[code];
  if (!building) return null;
  return {
    building,
    match: codeMatch[0].trim() || code,
    confidence: 97,
    reason: `贵州中医药大学旧宿舍代码${code}对应${building}`,
  };
}

function canonicalCampusName(value, school) {
  const source = text(value);
  const isMinzuUniversity = school === "民大" || /民族|民大/.test(school);
  if (isMinzuUniversity && /贵山(?:校区)?|南校区|南区/.test(source)) return "贵山校区";
  if (isMinzuUniversity && /百川(?:校区)?|北校区|北区/.test(source)) return "百川校区";
  if (isTcmSchool(school)) {
    if (/大学城医院(?:校区)?|医院校区/.test(source)) return "大学城医院校区";
    if (/花溪(?:校区)?|宿舍区/.test(source)) return "花溪校区";
  }
  return source;
}

function orderCampusName(order) {
  return canonicalCampusName(order?.campus, order?.school) || "";
}

function detectCampus(source, school) {
  if (school === "民大") {
    const minzuCampus = canonicalCampusName(source, school);
    if (["贵山校区", "百川校区"].includes(minzuCampus)) return minzuCampus;
  }
  if (isTcmSchool(school)) {
    if (/大学城医院(?:校区)?|医院校区/.test(source)) return "大学城医院校区";
    if (/花溪(?:校区)?|(?:^|[^A-Z0-9])(?:H[1-8]|J[1-6])(?=$|[^A-Z0-9])|桂园|橘园|杏园|李园|竹园|桃园/i.test(source)) return "花溪校区";
  }
  if (/龙文苑/.test(source)) return "龙文苑";
  if (/东校区|东区/.test(source)) return "东区";
  if (/西校区|西区/.test(source)) return "西区";
  if (/南校区|南区/.test(source)) return "南区";
  if (/北校区|北区/.test(source)) return "北区";
  if (/一期/.test(source)) return "学生公寓一期";
  if (/三期|善德居/.test(source)) return "学生公寓三期";
  return defaultCampusForSchool(school);
}

function buildingNumberValue(building) {
  const match = text(building).match(/(\d{1,2})栋(?:（[^）]+）)?$/);
  return match ? Number(match[1]) : 0;
}

function inferMinzuCampusFromBuilding(school, campus, building) {
  if (school !== "民大" || campus !== "校区未识别") return campus;
  if (/^西门公租房/.test(text(building))) return "百川校区";
  const buildingNumber = buildingNumberValue(building);
  return buildingNumber >= 9 && buildingNumber <= 17 ? "贵山校区" : campus;
}

function inferCampusFromBuilding(school, campus, building) {
  const minzuCampus = inferMinzuCampusFromBuilding(school, campus, building);
  if (minzuCampus !== "校区未识别") return minzuCampus;
  if (campus !== "校区未识别") return campus;

  const normalizedBuilding = text(building);
  if (school === "师大") {
    const buildingNumber = buildingNumberValue(normalizedBuilding);
    if ((buildingNumber >= 9 && buildingNumber <= 10) || (buildingNumber >= 14 && buildingNumber <= 18)) return "东区";
    if (/^9[AB]栋$/i.test(normalizedBuilding)) return "西区";
    if (/^龙文苑(?:[1-9])栋$/.test(normalizedBuilding)) return "龙文苑";
  }
  if (school === "财大") {
    if (/^文心苑[1-4]栋$/.test(normalizedBuilding)) return "东区";
    if (/^(?:玉兰苑[1-5]栋|丹桂苑[1-4]栋|樱花苑[1-4]栋|翠竹苑[1-3]栋|D17栋)$/i.test(normalizedBuilding)) return "西区";
  }
  if (school === "理工") {
    if (/^(?:学生公寓三期)?H(?:01-2|02-[1-4])$/i.test(normalizedBuilding)) return "学生公寓三期";
    if (/^(?:学生公寓)?一期[1-5]栋$/.test(normalizedBuilding)) return "学生公寓一期";
  }
  return campus;
}

function minzuLocationNeedsReview(school, campus, building) {
  if (school !== "民大") return false;
  const buildingNumber = buildingNumberValue(building);
  if (!buildingNumber) return false;
  if (campus === "贵山校区") return buildingNumber < 1 || buildingNumber > 17;
  if (campus === "百川校区") return buildingNumber < 1 || buildingNumber > 8;
  return false;
}

function locationNeedsReview(school, campus, building) {
  if (minzuLocationNeedsReview(school, campus, building)) return true;
  const normalizedBuilding = text(building);
  const buildingNumber = buildingNumberValue(normalizedBuilding);

  if (school === "师大") {
    if (campus === "东区" && /^9[AB]栋$/i.test(normalizedBuilding)) return true;
    if (campus === "东区" && buildingNumber > 18) return true;
    if (campus === "西区" && buildingNumber >= 9 && ![11, 12, 13].includes(buildingNumber)) return true;
    if (campus === "龙文苑" && buildingNumber > 9) return true;
  }
  if (school === "财大") {
    const eastBuilding = /^文心苑(\d{1,2})栋$/.exec(normalizedBuilding);
    const westBuilding = /^(玉兰苑|丹桂苑|樱花苑|翠竹苑)(\d{1,2})栋$/.exec(normalizedBuilding);
    if (campus === "西区" && eastBuilding) return true;
    if (campus === "东区" && (westBuilding || /^D17栋$/i.test(normalizedBuilding))) return true;
    if (eastBuilding && Number(eastBuilding[1]) > 4) return true;
    if (westBuilding) {
      const limits = { 玉兰苑: 5, 丹桂苑: 4, 樱花苑: 4, 翠竹苑: 3 };
      if (Number(westBuilding[2]) > limits[westBuilding[1]]) return true;
    }
  }
  if (school === "理工") {
    if (campus === "学生公寓一期" && /^H(?:01|02)-/i.test(normalizedBuilding)) return true;
    if (campus === "学生公寓三期" && /^(?:学生公寓)?一期[1-5]栋$/.test(normalizedBuilding)) return true;
    if (/^H/i.test(normalizedBuilding) && !/^H(?:01-2|02-[1-4])$/i.test(normalizedBuilding)) return true;
    if (campus === "学生公寓一期" && buildingNumber > 5) return true;
  }
  if (isTcmSchool(school)) {
    const gardenBuilding = /^(橘园|桂园|杏园|李园)(\d{1,2})(?:栋)?$/.exec(normalizedBuilding);
    if (gardenBuilding) {
      const limits = { 橘园: 4, 桂园: 3, 杏园: 3, 李园: 2 };
      if (Number(gardenBuilding[2]) > limits[gardenBuilding[1]]) return true;
    }
    const peachBuilding = /^桃园([A-Z])区$/i.exec(normalizedBuilding);
    if (peachBuilding && !/[A-D]/i.test(peachBuilding[1])) return true;
    if (normalizedBuilding === "桃园分区未识别" || normalizedBuilding === "桃园分区未识别（J6）") return true;
    if (/^(?:H[1-8]|J[1-6])(?:栋|号楼|学生公寓)?$/i.test(normalizedBuilding)) return true;
  }
  if (school === "贵科院" && buildingNumber > 14) return true;
  if (school === "人文" && buildingNumber > 8) return true;
  return false;
}

function normalizeBuilding(value) {
  let raw = text(value)
    .replace(/[，,。；;].*$/, "")
    .replace(/宿舍|寝室|学生公寓/g, "")
    .trim();
  raw = raw.replace(/^([一二三四五六七八九十]+)(栋|号楼)?$/, (_, number) => `${chineseNumberToDigit(number)}栋`);
  raw = raw.replace(/^([A-Z]?\d{1,3}[A-Z]?)(栋|号楼)?$/i, (_, code) => `${String(code).toUpperCase()}栋`);
  raw = raw
    .replace(/^J2栋$/, "J2号楼")
    .replace(/^J3栋$/, "J3学生公寓")
    .replace(/^H7\d+栋$/, "H7")
    .replace(/^H8\d*栋$/, "H8");
  return raw || "";
}

function settlementCatalogDraftValue(category) {
  return settlementCatalogDraft.get(category.key) || {
    isActive: category.isActive,
    costPrice: category.costPrice,
  };
}

function renderSettlementCatalogSettings() {
  const container = $("settlementCatalogSettings");
  if (!container) return;
  if (!settlementCatalogAvailable) {
    container.innerHTML = `<div><p class="eyebrow">结算品类</p><h2>在售品类设置</h2></div><p class="warn">结算品类目录尚未启用：${escapeHtml(settlementCatalogError || "请先升级数据库")}</p>`;
    return;
  }
  const keyword = settlementCatalogSearch.toLowerCase();
  const rows = ALL_SETTLEMENT_CATEGORIES.filter((category) => {
    const draft = settlementCatalogDraftValue(category);
    if (settlementCatalogActiveOnly && !draft.isActive && !category.isOther) return false;
    if (!keyword) return true;
    return `${category.groupName} ${category.label} ${category.detail} ${category.source}`.toLowerCase().includes(keyword);
  });
  const activeCount = ALL_SETTLEMENT_CATEGORIES.filter((category) => settlementCatalogDraftValue(category).isActive || category.isOther).length;
  container.innerHTML = `
    <div class="section-heading">
      <div><p class="eyebrow">商品上下架与结算</p><h2>在售品类设置</h2><p class="hint">工厂端和每日对账只显示已启用的品类；停用品类自动汇总到“其他品类”。</p></div>
      <div class="settlement-catalog-summary"><strong>${activeCount}</strong><span>个在售 / 共 ${ALL_SETTLEMENT_CATEGORIES.length} 个</span></div>
    </div>
    <div class="toolbar wrap">
      <input id="settlementCatalogSearch" class="input" value="${escapeHtml(settlementCatalogSearch)}" placeholder="搜索品类、分组" />
      <label class="check-label"><input id="settlementCatalogActiveOnly" type="checkbox" ${settlementCatalogActiveOnly ? "checked" : ""} /> 只看在售品类</label>
      <button id="saveSettlementCatalogBtn" type="button" ${settlementCatalogDraft.size ? "" : "disabled"}>保存品类设置（${settlementCatalogDraft.size}）</button>
    </div>
    <div class="settlement-catalog-list table-wrap">
      <table class="settlement-catalog-table">
        <thead><tr><th>在售</th><th>分组</th><th>结算品类</th><th>单位</th><th>售价</th><th>代工价</th><th>来源</th></tr></thead>
        <tbody>${rows.map((category) => {
          const draft = settlementCatalogDraftValue(category);
          return `<tr class="${draft.isActive || category.isOther ? "active" : ""}">
            <td><input type="checkbox" data-catalog-active="${escapeHtml(category.key)}" ${draft.isActive || category.isOther ? "checked" : ""} ${category.isOther ? "disabled" : ""} aria-label="${escapeHtml(category.label)}是否在售" /></td>
            <td>${escapeHtml(category.groupName)}</td>
            <td><strong>${escapeHtml(category.label)}</strong><small>${escapeHtml(category.detail)}</small></td>
            <td>${escapeHtml(category.unit)}</td>
            <td>${category.retailPrice === null ? "—" : `¥${numberValue(category.retailPrice).toFixed(2)}`}</td>
            <td><input class="input catalog-cost-input" type="number" min="0" step="0.01" value="${draft.costPrice ?? ""}" data-catalog-cost="${escapeHtml(category.key)}" placeholder="未设置" /></td>
            <td>${escapeHtml(category.source || "系统默认")}</td>
          </tr>`;
        }).join("") || '<tr><td colspan="7">没有符合条件的品类</td></tr>'}</tbody>
      </table>
    </div>
    <div id="settlementCatalogMessage" aria-live="polite"></div>`;
  $("settlementCatalogSearch")?.addEventListener("input", (event) => {
    settlementCatalogSearch = event.target.value;
    renderSettlementCatalogSettings();
    $("settlementCatalogSearch")?.focus();
  });
  $("settlementCatalogActiveOnly")?.addEventListener("change", (event) => {
    settlementCatalogActiveOnly = event.target.checked;
    renderSettlementCatalogSettings();
  });
  document.querySelectorAll("[data-catalog-active]").forEach((input) => input.addEventListener("change", () => {
    const category = settlementCategoryDefinition(input.dataset.catalogActive);
    if (!category || category.isOther) return;
    const current = settlementCatalogDraftValue(category);
    settlementCatalogDraft.set(category.key, { ...current, isActive: input.checked });
    renderSettlementCatalogSettings();
  }));
  document.querySelectorAll("[data-catalog-cost]").forEach((input) => input.addEventListener("change", () => {
    const category = settlementCategoryDefinition(input.dataset.catalogCost);
    if (!category) return;
    const current = settlementCatalogDraftValue(category);
    const costPrice = input.value === "" ? null : Math.max(0, numberValue(input.value));
    settlementCatalogDraft.set(category.key, { ...current, costPrice });
    renderSettlementCatalogSettings();
  }));
  $("saveSettlementCatalogBtn")?.addEventListener("click", saveSettlementCatalogSettings);
}

async function saveSettlementCatalogSettings() {
  if (!settlementCatalogDraft.size) return;
  const changes = [...settlementCatalogDraft.entries()];
  const button = $("saveSettlementCatalogBtn");
  if (button) button.disabled = true;
  setMessage("settlementCatalogMessage", `正在保存 ${changes.length} 项品类设置...`, "hint");
  let failed = 0;
  for (let index = 0; index < changes.length; index += 15) {
    const group = changes.slice(index, index + 15);
    const results = await Promise.all(group.map(([key, value]) => sb.from("settlement_catalog").update({
      is_active: key === SETTLEMENT_OTHER ? true : Boolean(value.isActive),
      cost_price: value.costPrice === null || value.costPrice === undefined ? null : numberValue(value.costPrice),
      updated_at: new Date().toISOString(),
    }).eq("key", key)));
    failed += results.filter((result) => result.error).length;
  }
  if (failed) {
    if (button) button.disabled = false;
    return setMessage("settlementCatalogMessage", `有 ${failed} 项保存失败，请重试。`, "warn");
  }
  settlementCatalogDraft.clear();
  await loadSettlementCatalog(true);
  renderSettlementCatalogSettings();
  setMessage("settlementCatalogMessage", "在售品类设置已保存，工厂端和每日对账已同步。", "success");
}

async function loadSystemSettings() {
  populateConfigInputs();
  await loadSettlementCatalog(true);
  settlementCatalogDraft.clear();
  renderSettlementCatalogSettings();
}

function formatExplicitBuildingNumber(value) {
  const converted = chineseNumberToDigit(text(value));
  const numeric = Number(converted);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : text(converted);
}

function unsafeBuildingHint(source) {
  const value = text(source);
  const match = value.match(/负\s*[0-9一二三四五六七八九十]+\s*楼|[0-9一二三四五六七八九十]+\s*(?:单元|号商铺|号铺|层)/);
  return match?.[0] || "";
}

function explicitBuildingEvidence(source, school = "") {
  const value = text(source);
  if (!value) return null;
  if (isTcmSchool(school)) {
    const dormCodeEvidence = guizhouTcmDormCodeEvidence(value);
    if (dormCodeEvidence) return dormCodeEvidence;
  }
  if (school === "民大" && /(?:百川校区|北校区)[\s\S]{0,20}?西门公租房|西门公租房/.test(value)) {
    const housingBuilding = value.match(/西门公租房\s*([0-9一二三四五六七八九十]+)\s*(?:栋|号楼)/);
    const match = housingBuilding?.[0]
      || value.match(/(?:百川校区|北校区)?[\s\S]{0,12}?西门公租房/)?.[0]
      || "西门公租房";
    return {
      building: housingBuilding ? `西门公租房${formatExplicitBuildingNumber(housingBuilding[1])}栋` : "西门公租房",
      match,
      confidence: 98,
      reason: housingBuilding
        ? "地址明确写出贵州民族大学百川校区西门公租房及公租房内部楼栋；楼层仅保留在完整地址中"
        : "地址明确写出贵州民族大学百川校区西门公租房",
    };
  }
  const namedCampus = value.match(/(玉兰苑|丹桂苑|樱花苑|翠竹苑|文心苑|桂园|橘园|杏园|李园)\s*([0-9一二三四五六七八九十]+)\s*(?:栋|号楼)?/);
  if (namedCampus) {
    return {
      building: `${namedCampus[1]}${formatExplicitBuildingNumber(namedCampus[2])}栋`,
      match: namedCampus[0],
      confidence: 96,
      reason: "地址同时出现宿舍区名称和楼栋编号",
    };
  }
  const peachCampus = value.match(/(桃园)\s*([A-D])\s*区/i);
  if (peachCampus) {
    return {
      building: `${peachCampus[1]}${peachCampus[2].toUpperCase()}区`,
      match: peachCampus[0],
      confidence: 96,
      reason: "地址明确写出桃园分区",
    };
  }
  const longwen = value.match(/(龙文苑)\s*([0-9一二三四五六七八九十]+)\s*(?:栋|号楼|宿舍楼)/);
  if (longwen) {
    return {
      building: `${longwen[1]}${formatExplicitBuildingNumber(longwen[2])}栋`,
      match: longwen[0],
      confidence: 96,
      reason: "地址明确写出龙文苑楼栋",
    };
  }
  const studentApartment = value.match(/(学生公寓一期|学生公寓三期)\s*(H\d{2}-\d|H\d{1,2}|J\d|[A-Z]?\d{1,3}[A-Z]?)\s*(?:栋|号楼|号学生公寓|宿舍楼?)?/i);
  if (studentApartment) {
    return {
      building: `${studentApartment[1]}${studentApartment[2].toUpperCase()}`,
      match: studentApartment[0],
      confidence: 94,
      reason: "地址明确写出学生公寓期数和楼栋代码",
    };
  }
  const dormPrefix = value.match(/(?:宿舍|寝室|公寓|学生公寓)\s*(?:楼)?\s*([0-9一二三四五六七八九十]+)\s*(?:栋|号楼|号宿舍楼?|宿舍楼)/);
  if (dormPrefix) {
    return {
      building: `${formatExplicitBuildingNumber(dormPrefix[1])}栋`,
      match: dormPrefix[0],
      confidence: 95,
      reason: "宿舍关键词与楼栋编号直接相邻",
    };
  }
  const codedBuilding = value.match(/(H\d{2}-\d|H\d{1,2}|J\d|[A-Z]\d{1,3}[A-Z]?)\s*(?:栋|号楼|号学生公寓|宿舍楼?|B区)/i);
  if (codedBuilding) {
    const code = codedBuilding[1].toUpperCase();
    return {
      building: code === "J2" ? "J2号楼" : code === "J3" ? "J3学生公寓" : code,
      match: codedBuilding[0],
      confidence: 93,
      reason: "地址明确写出字母楼栋代码和楼栋单位",
    };
  }
  const letterBuilding = value.match(/(?:^|[^A-Z])([A-Z])\s*(栋|号楼|宿舍楼)/i);
  if (letterBuilding) {
    return {
      building: `${letterBuilding[1].toUpperCase()}栋`,
      match: `${letterBuilding[1]}${letterBuilding[2]}`,
      confidence: 92,
      reason: "地址明确写出字母楼栋和楼栋单位",
    };
  }
  const numberedBuilding = value.match(/([0-9一二三四五六七八九十]+)\s*(栋|号楼|号宿舍楼|宿舍楼)/);
  if (numberedBuilding) {
    return {
      building: `${formatExplicitBuildingNumber(numberedBuilding[1])}栋`,
      match: numberedBuilding[0],
      confidence: 95,
      reason: "楼栋编号与“栋、号楼或宿舍楼”直接相邻",
    };
  }
  const knownBuilding = value.match(/竹园|善德居|J2|J3|H7|H8/);
  if (knownBuilding) {
    const building = knownBuilding[0] === "J2" ? "J2号楼" : knownBuilding[0] === "J3" ? "J3学生公寓" : knownBuilding[0];
    return {
      building,
      match: knownBuilding[0],
      confidence: 90,
      reason: "命中学校宿舍名单中的固定楼栋名称",
    };
  }
  return null;
}

function recognitionConfidenceLabel(confidence) {
  if (confidence >= 90) return "高";
  if (confidence >= 70) return "中";
  return "低";
}

function parseDormLine(form) {
  const lines = text(form).split(/[\n\r，,；;]+/).map(text).filter(Boolean);
  const dormLine = lines.find((line) => /[:：]/.test(line) && /(师大|师范|财大|财经|民大|民族|贵中医|中医|理工|贵科院|科院|人文|城市学院|职业学院|东区|西区|南区|北区|贵山|百川|龙文苑)/.test(line));
  if (!dormLine) return null;
  const [left, right] = dormLine.split(/[:：]/);
  const school = normalizeSchool(left);
  const evidence = explicitBuildingEvidence(right, school);
  const building = evidence?.building || "";
  let campus = detectCampus(`${left} ${right}`, school) || "校区未识别";
  campus = inferCampusFromBuilding(school, campus, building);
  const notes = [];
  if (school === "学校未识别") notes.push("未识别学校");
  if (campus === "校区未识别") notes.push("未识别校区");
  if (!building) notes.push("未识别楼栋");
  if (locationNeedsReview(school, campus, building)) notes.push("楼栋与校区不匹配，待确认");
  return {
    school,
    campus,
    building: building || "楼栋未识别",
    note: notes.join("；"),
    recognitionSource: "form",
    recognitionMatch: evidence?.match || unsafeBuildingHint(right) || "未命中明确楼栋表达",
    recognitionConfidence: evidence?.confidence || 20,
    recognitionReason: evidence?.reason || "表单内容没有“栋、号楼或宿舍楼”等明确楼栋单位",
  };
}

function applyRecognitionRule(source) {
  const normalizedSource = normalizeRecognitionText(source);
  const rule = recognitionRules
    .filter((item) => item.enabled !== false && item.keyword && normalizedSource.includes(normalizeRecognitionText(item.keyword)))
    .sort((left, right) => normalizeRecognitionText(right.keyword).length - normalizeRecognitionText(left.keyword).length)[0];
  if (!rule) return null;
  const school = rule.school || "学校未识别";
  const campus = canonicalCampusName(rule.campus, school) || "校区未识别";
  const building = rule.building || "楼栋未识别";
  return {
    school,
    campus,
    building,
    note: locationNeedsReview(school, campus, building) ? "楼栋与校区不匹配，待确认" : "",
    recognitionSource: "rule",
    recognitionRuleId: rule.id || "",
    recognitionMatch: rule.keyword,
    recognitionConfidence: 100,
    recognitionReason: "命中管理员人工确认并保存的地址识别规则",
  };
}

function extractDormInfo(row) {
  const form = formField(row);
  const address = text(field(row, ["收货地址", "地址"]));
  const source = `${form} ${address}`;
  const learned = applyRecognitionRule(source);
  if (learned) return learned;

  const formDorm = parseDormLine(form);
  if (formDorm) return formDorm;

  const school = normalizeSchool(source);
  const cleaned = source.replace(/学校[:：]/g, " ").replace(/校区[:：]/g, " ");
  const detectedCampus = detectCampus(source, school) || "校区未识别";
  const evidence = explicitBuildingEvidence(cleaned, school);
  let building = evidence?.building || "";
  let campus = detectedCampus;
  if (!building) building = "楼栋未识别";
  campus = inferCampusFromBuilding(school, campus, building);
  const campusWasInferred = detectedCampus === "校区未识别" && campus !== "校区未识别";
  const unsafeHint = unsafeBuildingHint(cleaned);
  let recognitionConfidence = evidence?.confidence || (unsafeHint ? 15 : 25);
  if (school === "学校未识别" || campus === "校区未识别") recognitionConfidence = Math.min(recognitionConfidence, 60);
  if (campusWasInferred) recognitionConfidence = Math.min(recognitionConfidence, 78);
  if (locationNeedsReview(school, campus, building)) recognitionConfidence = Math.min(recognitionConfidence, 40);

  const notes = [];
  if (school === "学校未识别") notes.push("未识别学校");
  if (campus === "校区未识别") notes.push("未识别校区");
  if (building === "楼栋未识别") notes.push("未识别楼栋");
  if (locationNeedsReview(school, campus, building)) notes.push("楼栋与校区不匹配，待确认");
  if (!notes.length && recognitionConfidence < 90) notes.push("地址推测，待确认");
  return {
    school,
    campus,
    building,
    note: notes.join("；"),
    recognitionSource: "address",
    recognitionMatch: evidence?.match || unsafeHint || "未命中明确楼栋表达",
    recognitionConfidence,
    recognitionReason: evidence
      ? `${evidence.reason}${campusWasInferred ? "；校区根据楼栋范围推断，仍需确认" : ""}`
      : unsafeHint
        ? `只检测到“${unsafeHint}”，它表示单元、商铺、楼层或地下楼层，不能作为宿舍楼栋`
        : "没有找到数字与“栋、号楼或宿舍楼”直接相邻的明确表达",
  };
}

function recognitionAuditForOrder(order) {
  const candidate = extractDormInfo({ 收货地址: order.address || "" });
  const candidateBuilding = candidate.building || "楼栋未识别";
  const currentBuilding = text(order.building) || "楼栋未识别";
  const currentMismatch = !isUnresolvedDormValue(candidateBuilding, "building")
    && !isUnresolvedDormValue(currentBuilding, "building")
    && normalizeRecognitionText(candidateBuilding) !== normalizeRecognitionText(currentBuilding);
  const confidence = Number(candidate.recognitionConfidence || 0);
  const school = isUnresolvedDormValue(candidate.school, "school") ? (order.school || candidate.school) : candidate.school;
  const campus = isUnresolvedDormValue(candidate.campus, "campus") ? (order.campus || candidate.campus) : candidate.campus;
  const reason = currentMismatch
    ? `${candidate.recognitionReason || "地址存在明确楼栋证据"}；当前保存的“${currentBuilding}”与地址证据不一致`
    : candidate.recognitionReason || "未找到足够明确的楼栋表达，需要人工确认";
  return {
    school,
    campus: canonicalCampusName(campus, school) || campus,
    building: candidateBuilding,
    match: candidate.recognitionMatch || unsafeBuildingHint(order.address) || "未命中明确楼栋表达",
    confidence,
    confidenceLabel: recognitionConfidenceLabel(confidence),
    reason,
    currentMismatch,
  };
}

function extractImages(row) {
  const form = formField(row);
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
  const digitCounts = [...raw.matchAll(/(\d{1,2})\s*(双|件|个|条|套|份|只)/g)]
    .map((match) => Number(match[1]) || 0);
  const chineseCounts = [...raw.matchAll(/([一二三四五六七八九十]{1,3})\s*(双|件|个|条|套|份|只)/g)]
    .map((match) => Number(chineseNumberToDigit(match[1])) || 0);
  const counts = [...digitCounts, ...chineseCounts].filter((count) => count > 0);
  return counts.length ? Math.max(...counts) : 0;
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

function summarizeRecognition(workItems) {
  const uniqueOrders = new Map();
  workItems.forEach((item) => {
    const orderNo = text(field(item.row, ["订单号", "订单编号"]));
    if (orderNo && !uniqueOrders.has(orderNo)) uniqueOrders.set(orderNo, item.dorm);
  });
  const result = { total: uniqueOrders.size, high: 0, confirm: 0, review: 0 };
  uniqueOrders.forEach((dorm) => {
    result[recognitionTier(dorm)] += 1;
  });
  return result;
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
  await ensureXlsx();
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  return workbook.SheetNames.flatMap((sheetName) => XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" }));
}

function ensureXlsx() {
  if (window.XLSX) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-xlsx-loader="true"]');
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", () => reject(new Error("XLSX 组件加载失败，请确认 vendor/xlsx.full.min.js 已上传。")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "./vendor/xlsx.full.min.js";
    script.dataset.xlsxLoader = "true";
    script.onload = resolve;
    script.onerror = () => reject(new Error("XLSX 组件加载失败，请确认 vendor/xlsx.full.min.js 已上传。"));
    document.head.appendChild(script);
  });
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

function chunkArray(items, size = 200) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

async function fetchExistingSourceKeys(sourceKeys) {
  const existing = new Set();
  for (const group of chunkArray([...new Set(sourceKeys)], 120)) {
    const { data, error } = await sb.from("order_items").select("source_key").in("source_key", group);
    if (error) throw error;
    (data || []).forEach((row) => existing.add(row.source_key));
  }
  return existing;
}

async function batchUpsert(tableName, rows, options = {}, size = 200) {
  const result = [];
  for (const group of chunkArray(rows, size)) {
    const query = sb.from(tableName).upsert(group, options);
    const { data, error } = await query.select("*");
    if (error) throw error;
    result.push(...(data || []));
  }
  return result;
}

async function batchInsert(tableName, rows, size = 300) {
  for (const group of chunkArray(rows, size)) {
    const { error } = await sb.from(tableName).insert(group);
    if (error) throw error;
  }
}

function buildOrderPayload(row, dorm, batchId) {
  return {
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
}

function buildItemPayload(orderId, row, barcode, sourceKey, index) {
  const productName = text(field(row, ["商品名称", "商品"]));
  const spec = text(field(row, ["规格", "规格名称"]));
  const payload = {
    order_id: orderId,
    barcode,
    source_key: sourceKey,
    product_name: productName,
    spec,
    item_index: index,
    image_links: extractImages(row),
    item_status: "待取件",
    updated_at: new Date().toISOString(),
  };
  if (settlementSchemaAvailable) {
    const suggestion = inferSettlementCategory({ product_name: productName, spec });
    const definition = settlementCategoryDefinition(suggestion.key);
    payload.settlement_category = suggestion.key;
    payload.settlement_category_confirmed = suggestion.confident;
    payload.settlement_category_updated_by = suggestion.confident ? currentProfile?.id || null : null;
    payload.settlement_category_updated_at = suggestion.confident ? new Date().toISOString() : null;
    payload.settlement_other_name = "";
    payload.settlement_other_unit = "件";
    payload.settlement_cost_snapshot = suggestion.confident && definition?.costPrice !== null ? definition.costPrice : null;
  }
  return payload;
}

async function handleImport(event) {
  if (!requireClient()) return;
  if (!currentUser) return alert("请先用后台账号登录");
  await detectSettlementSchemaAvailability(true);
  const files = [...event.target.files];
  if (!files.length) return;
  setMessage("adminImportStatus", "正在读取 Excel 并写入 Supabase...");
  try {
    await loadRecognitionRules();
    const allRows = [];
    for (const file of files) allRows.push(...await readWorkbook(file));
    const diagnosis = diagnoseRows(allRows);
    const workItems = rowsToWorkItems(allRows);
    if (!workItems.length) {
      $("adminImportStatus").innerHTML = renderImportDiagnosis(diagnosis, "没有可导入的洗护已支付订单。");
      return;
    }
    const batch = await createImportBatch(files, diagnosis);
    setMessage("adminImportStatus", `正在导入：${workItems.length} 件物品，正在批量写入订单...`);
    const counters = await loadBarcodeCounters(workItems.map((item) => item.prefix));
    const orderWorkItems = new Map();
    workItems.forEach((workItem) => {
      const row = workItem.row;
      const orderNo = text(field(row, ["订单号", "订单编号"]));
      if (!orderWorkItems.has(orderNo)) orderWorkItems.set(orderNo, workItem);
    });
    const recognitionSummary = summarizeRecognition(workItems);
    const orderPayloads = [...orderWorkItems.values()].map((workItem) => buildOrderPayload(workItem.row, workItem.dorm, batch.id));
    const orders = await batchUpsert("orders", orderPayloads, { onConflict: "order_no" }, 120);
    const orderCache = new Map(orders.map((order) => [order.order_no, order]));

    setMessage("adminImportStatus", `正在导入：${workItems.length} 件物品，正在生成取件任务...`);
    const pickupPayloads = [...orderWorkItems.entries()].map(([orderNo, workItem]) => ({
      order_id: orderCache.get(orderNo).id,
      pickup_date: workItem.pickupDate || null,
      status: "待取件",
      updated_at: new Date().toISOString(),
    }));
    await batchUpsert("pickup_tasks", pickupPayloads, { onConflict: "order_id" }, 200);

    setMessage("adminImportStatus", `正在导入：${workItems.length} 件物品，正在检查重复水洗标...`);
    const sourceKeys = workItems.map((workItem) => `${importKey(workItem.row)}|${workItem.index}`);
    const existingSourceKeys = await fetchExistingSourceKeys(sourceKeys);
    const itemPayloads = [];
    const itemMeta = new Map();
    let skippedItems = 0;
    workItems.forEach((workItem) => {
      const sourceKey = `${importKey(workItem.row)}|${workItem.index}`;
      if (existingSourceKeys.has(sourceKey)) {
        skippedItems += 1;
        return;
      }
      const orderNo = text(field(workItem.row, ["订单号", "订单编号"]));
      const order = orderCache.get(orderNo);
      const payload = buildItemPayload(order.id, workItem.row, nextBarcode(counters, workItem.prefix), sourceKey, workItem.index);
      itemPayloads.push(payload);
      itemMeta.set(sourceKey, { orderId: order.id, note: workItem.dorm.note || "Excel 导入生成水洗标" });
    });

    setMessage("adminImportStatus", `正在导入：${workItems.length} 件物品，正在批量生成水洗标...`);
    const createdItemRows = itemPayloads.length ? await batchUpsert("order_items", itemPayloads, { onConflict: "source_key" }, 200) : [];
    const logs = createdItemRows.map((item) => {
      const meta = itemMeta.get(item.source_key) || {};
      return {
        order_id: item.order_id || meta.orderId,
        item_id: item.id,
        barcode: item.barcode,
        status: "待取件",
        note: meta.note || "Excel 导入生成水洗标",
        operator_id: currentProfile?.id || null,
      };
    });
    if (logs.length) await batchInsert("status_logs", logs, 300);
    const createdItems = createdItemRows.length;
    await updateImportBatch(batch.id, orderCache.size, createdItems);
    await refreshAll();
    $("adminImportStatus").innerHTML = renderImportDiagnosis(
      diagnosis,
      `导入完成：${orderCache.size} 个订单，新增 ${createdItems} 件物品，跳过重复 ${skippedItems} 件。地址识别：自动通过 ${recognitionSummary.high} 单，快速确认 ${recognitionSummary.confirm} 单，需补充信息 ${recognitionSummary.review} 单。`,
    );
  } catch (error) {
    console.error(error);
    setMessage("adminImportStatus", `导入失败：${error.message || error}`, "warn");
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
  if (!sb || APP_MODE === "student" || !currentUser || !canUseCurrentPage()) return;
  await Promise.all([loadRecognitionRules(), detectSettlementSchemaAvailability(true), detectWashAdjustmentSchemaAvailability(true), detectExceptionTicketSchemaAvailability(true), detectRetryPickupSchemaAvailability(true), loadSettlementCatalog(true)]);
  const tasks = [];
  if (APP_MODE === "admin") tasks.push(loadStats(), loadAdmin(), loadCourierTasks(), loadFactoryItems(), loadFactoryDailyScans());
  if (APP_MODE === "courier") tasks.push(loadCourierTasks());
  if (APP_MODE === "factory") tasks.push(loadFactoryItems(), loadFactoryDailyScans());
  await Promise.all(tasks);
  if (APP_MODE === "factory") $("barcodeInput")?.focus();
}

async function loadStats() {
  const overdueBefore = new Date(Date.now() - OVERDUE_HOURS * 60 * 60 * 1000).toISOString();
  const allPendingPickupsQuery = Promise.all([
    sb.from("pickup_tasks").select("id", { count: "exact", head: true }).in("status", [...PICKUP_OPEN_STATUSES]),
    retryPickupSchemaAvailable
      ? sb.from("pickup_retry_tasks").select("id", { count: "exact", head: true }).in("status", [...RETRY_PICKUP_OPEN_STATUSES])
      : Promise.resolve({ count: 0, error: null }),
  ]).then(([normal, retry]) => ({ count: (normal.count || 0) + (retry.count || 0), error: normal.error || retry.error }));
  const exceptionTicketsQuery = exceptionTicketSchemaAvailable
    ? sb.from("exception_tickets").select("id", { count: "exact", head: true }).in("status", EXCEPTION_OPEN_STATUSES)
    : Promise.resolve({ count: 0, error: null });
  const [pickupToday, pendingIn, pendingOut, pendingReturn, exceptions, exceptionTickets, overdue] = await Promise.all([
    allPendingPickupsQuery,
    sb.from("order_items").select("id", { count: "exact", head: true }).eq("item_status", "已取件"),
    sb.from("order_items").select("id", { count: "exact", head: true }).in("item_status", ["已入厂", "清洗中"]),
    sb.from("return_tasks").select("id", { count: "exact", head: true }).eq("status", "待送回"),
    sb.from("orders").select("id", { count: "exact", head: true }).or("exception_note.neq.,school.eq.学校未识别,campus.eq.校区未识别,building.eq.楼栋未识别,order_status.eq.异常,order_status.eq.未找到"),
    exceptionTicketsQuery,
    sb.from("orders").select("id,order_status,updated_at").neq("order_status", "已送达").lt("updated_at", overdueBefore),
  ]);
  const exceptionTotal = (exceptions.error ? 0 : exceptions.count || 0) + (exceptionTickets.error ? 0 : exceptionTickets.count || 0);
  const dashboardValues = [
    ["dashPickupToday", pickupToday],
    ["dashPendingIn", pendingIn],
    ["dashPendingOut", pendingOut],
    ["dashPendingReturn", pendingReturn],
    ["dashExceptions", { count: exceptionTotal, error: exceptions.error || exceptionTickets.error }],
  ];
  dashboardValues.forEach(([targetId, result]) => {
    if ($(targetId)) $(targetId).textContent = result.error ? "—" : String(result.count || 0);
  });
  updateExceptionBadge(exceptionTotal);
  const overdueRows = overdue.error ? [] : overdue.data || [];
  if ($("dashOverdue")) $("dashOverdue").textContent = overdue.error ? "—" : String(overdueRows.length);
  const overdueBuckets = [
    ["overdue-2", "dashOverdue2", "dashOverdue2Stages"],
    ["overdue-3-5", "dashOverdue3To5", "dashOverdue3To5Stages"],
    ["overdue-5-plus", "dashOverdue5Plus", "dashOverdue5PlusStages"],
  ];
  overdueBuckets.forEach(([bucket, countId, stageId]) => {
    const rows = overdueRows.filter((order) => overdueBucket(order) === bucket);
    if ($(countId)) $(countId).textContent = overdue.error ? "—" : String(rows.length);
    if ($(stageId)) $(stageId).textContent = overdue.error ? "读取失败" : summarizeOverdueStages(rows);
  });
}

function ensurePdfLib() {
  if (window.PDFLib) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-pdf-lib-loader="true"]');
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", () => reject(new Error("PDF 组件加载失败，请检查网络连接。")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js";
    script.dataset.pdfLibLoader = "true";
    script.onload = resolve;
    script.onerror = () => reject(new Error("PDF 组件加载失败，请检查网络连接。"));
    document.head.appendChild(script);
  });
}

async function loadAdmin() {
  await loadAdminOverview();
  const activeSection = document.querySelector(".subtab.active")?.dataset.adminSection || "overview";
  if (activeSection !== "overview") await loadAdminSection(activeSection);
}

async function loadAdminSection(sectionName) {
  if (sectionName === "orders") return loadOrderManagement();
  if (sectionName === "exceptions") return loadExceptions();
  if (sectionName === "batches") return loadBatches();
  if (sectionName === "rules") return loadRules();
  if (sectionName === "labels") return loadLabels();
  if (sectionName === "reconciliation") return loadReconciliation();
  if (sectionName === "settings") return loadSystemSettings();
  return loadAdminOverview();
}

async function loadAdminOverview() {
  const { data, error } = await sb.from("orders").select("*, order_items(barcode,item_status,product_name,spec)").order("created_at", { ascending: false }).limit(20);
  if (error) return setMessage("adminRecentOrders", error.message, "warn");
  $("adminRecentOrders").innerHTML = `
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
              <td>${escapeHtml(`${order.school || ""}${orderCampusName(order)}${order.building || ""}`)}</td>
              <td>${escapeHtml(order.order_status)}</td>
              <td>${order.order_items?.length || 0}</td>
              <td><button class="ghost small" type="button" data-detail="${order.id}">详情</button></td>
            </tr>
          `).join("") || '<tr><td colspan="7">暂无订单</td></tr>'}</tbody>
        </table>
      </div>
    </section>`;
}

async function loadReconciliationSummary(dateText) {
  await detectWashAdjustmentSchemaAvailability();
  const range = factoryTodayRange(dateText);
  const scansResult = await sb.from("factory_scans")
    .select("id,item_id,barcode,scan_type,created_at,order_items(*,orders(id))")
    .eq("scan_type", "factory_in")
    .gte("created_at", range.start)
    .lt("created_at", range.end)
    .order("created_at", { ascending: true })
    .limit(5000);
  if (scansResult.error) throw scansResult.error;
  const latestInboundByItem = new Map();
  (scansResult.data || []).map(normalizeFactoryScanRecord).forEach((record) => {
    latestInboundByItem.set(record.item_id, record);
  });
  const appliedInboundRecords = [...latestInboundByItem.values()].filter(factoryScanStillApplied);
  const returnedWashCount = washAdjustmentSchemaAvailable
    ? appliedInboundRecords.filter((record) => washDecisionIsReturn(record.item)).length
    : 0;
  const inboundRecords = washAdjustmentSchemaAvailable
    ? appliedInboundRecords.filter((record) => !washDecisionIsReturn(record.item))
    : appliedInboundRecords;
  const items = inboundRecords.map((record) => record.item);
  const inboundOrderIds = new Set(inboundRecords.map((record) => factoryDailyOrderKey(record)));
  const counts = Object.fromEntries(SETTLEMENT_CATEGORIES.map((category) => [category.key, 0]));
  const amounts = Object.fromEntries(SETTLEMENT_CATEGORIES.map((category) => [category.key, 0]));
  const otherDetailMap = new Map();
  let unconfirmedCount = 0;
  let suggestedCount = 0;
  items.forEach((item) => {
    const resolved = resolvedSettlementCategory(item);
    if (resolved.confirmed && validSettlementCategoryKey(resolved.storedKey)) {
      const storedDefinition = settlementCategoryDefinition(resolved.storedKey);
      const bucketKey = selectableSettlementCategoryKey(resolved.storedKey) ? resolved.storedKey : SETTLEMENT_OTHER;
      counts[bucketKey] = numberValue(counts[bucketKey]) + 1;
      const rawCost = resolved.costSnapshot ?? storedDefinition?.costPrice;
      const hasCost = rawCost !== null && rawCost !== undefined && rawCost !== "" && Number.isFinite(Number(rawCost));
      const cost = hasCost ? Math.max(0, Number(rawCost)) : 0;
      amounts[bucketKey] = numberValue(amounts[bucketKey]) + cost;
      if (bucketKey === SETTLEMENT_OTHER) {
        const name = resolved.otherName || storedDefinition?.label || washItemShortName(item) || "未填写品类";
        const unit = resolved.storedKey === SETTLEMENT_OTHER ? resolved.otherUnit : storedDefinition?.unit || resolved.otherUnit;
        const mapKey = `${name}\u0000${unit}\u0000${hasCost ? cost : ""}`;
        const detail = otherDetailMap.get(mapKey) || { name, unit, count: 0, cost: hasCost ? cost : null, subtotal: 0 };
        detail.count += 1;
        detail.subtotal += cost;
        otherDetailMap.set(mapKey, detail);
      }
    } else {
      unconfirmedCount += 1;
      if (selectableSettlementCategoryKey(resolved.suggestionKey) && resolved.suggestionKey !== SETTLEMENT_OTHER) suggestedCount += 1;
    }
  });
  const otherDetails = [...otherDetailMap.values()].sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
  const totalCost = Object.values(amounts).reduce((total, value) => total + numberValue(value), 0);

  return {
    date: dateText,
    orderCount: inboundOrderIds.size,
    itemCount: items.length,
    counts,
    amounts,
    otherDetails,
    totalCost,
    unconfirmedCount,
    suggestedCount,
    returnedWashCount,
  };
}

function reconciliationMetricConfig() {
  return SETTLEMENT_CATEGORIES.map((category) => ({
    ...category,
    system: reconciliationSummary?.counts?.[category.key] || 0,
    amount: reconciliationSummary?.amounts?.[category.key] || 0,
  }));
}

function reconciliationBatchSummaryText() {
  const confirmedCount = Object.values(reconciliationSummary?.counts || {}).reduce((total, value) => total + numberValue(value), 0);
  const returnText = reconciliationSummary?.returnedWashCount ? `；另有 ${reconciliationSummary.returnedWashCount} 件退洗，不计入结算` : "";
  return `本日实际扫码入库 ${reconciliationSummary?.orderCount || 0} 单，共 ${reconciliationSummary?.itemCount || 0} 个结算水洗标；已确认 ${confirmedCount} 件，待确认 ${reconciliationSummary?.unconfirmedCount || 0} 件${returnText}。`;
}

function reconciliationActualValue(categoryKey) {
  if (!reconciliationRecord) return "";
  const value = reconciliationRecord.actual_settlement_counts?.[categoryKey];
  return value === null || value === undefined ? "" : value;
}

function renderReconciliationMetric(metric) {
  const otherDetails = metric.key === SETTLEMENT_OTHER ? reconciliationSummary?.otherDetails || [] : [];
  const otherDetailHtml = otherDetails.length ? `<details class="reconciliation-other-details">
    <summary>查看其他品类明细（${otherDetails.length} 类）</summary>
    <div class="table-wrap"><table><thead><tr><th>实际品类</th><th>数量</th><th>单价</th><th>小计</th></tr></thead><tbody>
      ${otherDetails.map((detail) => `<tr><td>${escapeHtml(detail.name)}</td><td>${detail.count}${escapeHtml(detail.unit)}</td><td>${detail.cost === null ? "未填" : `¥${detail.cost.toFixed(2)}`}</td><td>${detail.cost === null ? "—" : `¥${detail.subtotal.toFixed(2)}`}</td></tr>`).join("")}
    </tbody></table></div>
  </details>` : "";
  return `<article id="reconciliationCard-${metric.key}" class="reconciliation-card">
    <div class="reconciliation-card-heading">
      <span>${escapeHtml(metric.label)}</span>
      <small>系统口径：${escapeHtml(metric.detail)}</small>
    </div>
    <strong>${metric.system}<small>${escapeHtml(metric.unit)}</small></strong>
    <p class="reconciliation-cost">系统代工小计：¥${numberValue(metric.amount).toFixed(2)}</p>
    <label for="reconciliationActual-${metric.key}">
      <span>负责人核对数</span>
      <input id="reconciliationActual-${metric.key}" class="input" type="number" min="0" step="1" value="${escapeHtml(reconciliationActualValue(metric.key))}" data-reconciliation-actual="${metric.key}" />
    </label>
    <p id="reconciliationDiff-${metric.key}" class="reconciliation-diff">等待填写</p>
    ${otherDetailHtml}
  </article>`;
}

function settlementCountsSummary(counts = {}) {
  const parts = ALL_SETTLEMENT_CATEGORIES
    .filter((category) => numberValue(counts?.[category.key]) > 0)
    .map((category) => `${category.shortLabel} ${Math.floor(numberValue(counts[category.key]))}${category.unit}`);
  return parts.length ? parts.join("、") : "无已确认品类";
}

function renderReconciliationHistory(records) {
  if (!records.length) return '<p class="hint">暂无历史对账记录。</p>';
  return `<div class="table-wrap"><table class="reconciliation-history-table">
    <thead><tr><th>日期</th><th>系统结算品类</th><th>负责人核对</th><th>系统代工成本</th><th>待确认</th><th>结果</th><th>负责人</th><th>核对时间</th></tr></thead>
    <tbody>${records.map((record) => `<tr>
      <td>${escapeHtml(record.reconcile_date)}</td>
      <td>${escapeHtml(settlementCountsSummary(record.system_settlement_counts))}</td>
      <td>${escapeHtml(settlementCountsSummary(record.actual_settlement_counts))}</td>
      <td>¥${numberValue(record.system_total_cost).toFixed(2)}</td>
      <td>${record.unconfirmed_count || 0}</td>
      <td><span class="reconciliation-status ${record.status === "已核对" ? "matched" : record.status === "待核对" ? "pending" : "mismatch"}">${escapeHtml(record.status)}</span></td>
      <td>${escapeHtml(record.checked_by_name || "—")}</td>
      <td>${escapeHtml(formatDateTime(record.checked_at) || "—")}</td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}

function updateReconciliationDiffUi() {
  if (!reconciliationSummary) return;
  let filled = 0;
  let mismatchCount = 0;
  const metrics = reconciliationMetricConfig();
  metrics.forEach((metric) => {
    const input = $(`reconciliationActual-${metric.key}`);
    const card = $(`reconciliationCard-${metric.key}`);
    const output = $(`reconciliationDiff-${metric.key}`);
    const hasValue = input?.value !== "";
    card?.classList.remove("matched", "mismatch");
    if (!hasValue) {
      if (output) output.textContent = "等待填写";
      return;
    }
    filled += 1;
    const actual = Math.max(0, Math.floor(numberValue(input.value)));
    const difference = actual - metric.system;
    if (difference === 0) {
      card?.classList.add("matched");
      if (output) output.textContent = "一致";
    } else {
      mismatchCount += 1;
      card?.classList.add("mismatch");
      if (output) output.textContent = difference > 0 ? `多 ${difference} ${metric.unit}` : `少 ${Math.abs(difference)} ${metric.unit}`;
    }
  });
  const overall = $("reconciliationOverallStatus");
  if (!overall) return;
  if (filled < metrics.length) {
    overall.className = "reconciliation-overall pending";
    overall.textContent = `还有 ${metrics.length - filled} 项未填写，保存时将自动按 0 处理`;
  } else if (reconciliationSummary.unconfirmedCount > 0) {
    overall.className = "reconciliation-overall pending";
    overall.textContent = `还有 ${reconciliationSummary.unconfirmedCount} 个水洗标未确认结算品类，本次只能保存为待核对`;
  } else if (mismatchCount) {
    overall.className = "reconciliation-overall mismatch";
    overall.textContent = `有 ${mismatchCount} 项存在差异，请填写备注后保存`;
  } else {
    overall.className = "reconciliation-overall matched";
    overall.textContent = "各清洗品类数量一致，可以完成对账";
  }
}

function bindReconciliationEvents() {
  on("reconciliationDate", "change", () => loadReconciliation($("reconciliationDate").value));
  on("refreshReconciliationBtn", "click", () => loadReconciliation($("reconciliationDate").value));
  on("saveReconciliationBtn", "click", saveReconciliation);
  document.querySelectorAll("[data-reconciliation-actual]").forEach((input) => {
    input.addEventListener("input", updateReconciliationDiffUi);
  });
  updateReconciliationDiffUi();
}

async function loadReconciliation(dateText = "") {
  if (!$("adminReconciliation")) return;
  const selectedDate = dateText || $("reconciliationDate")?.value || todayDate();
  $("adminReconciliation").innerHTML = '<section class="panel"><p class="hint">正在读取系统对账数据...</p></section>';
  const [summaryResult, recordsResult] = await Promise.allSettled([
    loadReconciliationSummary(selectedDate),
    sb.from("daily_reconciliations").select("*,system_settlement_counts,actual_settlement_counts,system_other_details,system_total_cost,unconfirmed_count").order("reconcile_date", { ascending: false }).limit(60),
  ]);
  if (summaryResult.status === "rejected") {
    return setMessage("adminReconciliation", `对账数据读取失败：${summaryResult.reason?.message || summaryResult.reason}`, "warn");
  }
  reconciliationSummary = summaryResult.value;
  const tableReady = recordsResult.status === "fulfilled" && !recordsResult.value.error;
  const history = tableReady ? recordsResult.value.data || [] : [];
  reconciliationRecord = history.find((record) => record.reconcile_date === selectedDate) || null;
  const checkerName = reconciliationRecord?.checked_by_name || currentProfile?.name || "";
  const referenceNote = reconciliationRecord?.reference_note || "";
  const settlementReady = tableReady && settlementSchemaAvailable;
  const migrationWarning = settlementReady
    ? ""
    : `<p class="warn">${escapeHtml(settlementMigrationMessage())}</p>`;
  const unconfirmedWarning = reconciliationSummary.unconfirmedCount > 0
    ? `<div class="reconciliation-review-warning"><strong>有 ${reconciliationSummary.unconfirmedCount} 个水洗标待确认结算品类</strong><span>系统建议 ${reconciliationSummary.suggestedCount} 个；未确认项目不计入本日结算数量。</span><button type="button" class="ghost small" data-open-label-review="true">去水洗标管理确认</button></div>`
    : '<p class="success">本日实际入库水洗标的结算品类已全部确认。</p>';

  $("adminReconciliation").innerHTML = `
    <section class="panel reconciliation-panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">洗护店负责人每日核对</p>
          <h2>每日对账</h2>
        </div>
        <div class="toolbar wrap reconciliation-toolbar">
          <input id="reconciliationDate" class="input compact-input" type="date" value="${escapeHtml(selectedDate)}" />
          <button id="refreshReconciliationBtn" class="ghost" type="button">重新读取系统数据</button>
        </div>
      </div>
      <p class="hint">按 ${escapeHtml(selectedDate)} 当天工厂实际扫码入库的水洗标统计；未入库物品不进入对账，每个水洗标计一双鞋或一件衣物。</p>
      <p class="reconciliation-batch-summary">${escapeHtml(reconciliationBatchSummaryText())}</p>
      <p class="reconciliation-total-cost">系统代工成本合计：<strong>¥${numberValue(reconciliationSummary.totalCost).toFixed(2)}</strong></p>
      ${migrationWarning}
      ${unconfirmedWarning}
      <div class="reconciliation-grid">
        ${reconciliationMetricConfig().map(renderReconciliationMetric).join("")}
      </div>
      <div class="reconciliation-form-grid">
        <label class="field-group" for="reconciliationChecker">
          <span>核对负责人</span>
          <input id="reconciliationChecker" class="input" value="${escapeHtml(checkerName)}" placeholder="例如：胖哥" />
        </label>
        <label class="field-group" for="reconciliationReference">
          <span>在线表格链接或备注</span>
          <input id="reconciliationReference" class="input" value="${escapeHtml(referenceNote)}" placeholder="可粘贴在线表格链接，或填写差异原因" />
        </label>
      </div>
      <div class="reconciliation-save-row">
        <p id="reconciliationOverallStatus" class="reconciliation-overall pending">等待填写</p>
        <button id="saveReconciliationBtn" type="button" ${settlementReady ? "" : "disabled"}>保存本日对账</button>
      </div>
      <div id="reconciliationMessage" aria-live="polite"></div>
    </section>
    <section class="panel table-panel">
      <h2>最近对账记录</h2>
      <p class="hint">只展示后台启用的在售品类；已停用品类和临时品类统一汇总到“其他品类”。</p>
      ${renderReconciliationHistory(history)}
    </section>`;
  bindReconciliationEvents();
}

async function saveReconciliation() {
  if (!reconciliationSummary) return;
  const metrics = reconciliationMetricConfig();
  const actualValues = {};
  for (const metric of metrics) {
    const input = $(`reconciliationActual-${metric.key}`);
    if (!input) return alert(`未找到“${metric.label}”核对数量输入框，请刷新页面后重试`);
    if (input.value === "") input.value = "0";
    actualValues[metric.key] = Math.max(0, Math.floor(numberValue(input.value)));
  }
  updateReconciliationDiffUi();
  const checkerName = text($("reconciliationChecker")?.value);
  if (!checkerName) return alert("请填写核对负责人");
  const mismatch = metrics.some((metric) => actualValues[metric.key] !== metric.system);
  const systemCounts = reconciliationSummary.counts;
  const unconfirmedCount = reconciliationSummary.unconfirmedCount || 0;
  const legacySystemSpecial = numberValue(systemCounts.suede_shoe) + numberValue(systemCounts.short_boot) + numberValue(systemCounts.tall_boot);
  const legacyActualSpecial = numberValue(actualValues.suede_shoe) + numberValue(actualValues.short_boot) + numberValue(actualValues.tall_boot);
  const legacySystemThin = numberValue(systemCounts.tshirt) + numberValue(systemCounts.pants_skirt) + numberValue(systemCounts.knit_shirt) + numberValue(systemCounts.light_outerwear) + numberValue(systemCounts.dress_formal);
  const legacyActualThin = numberValue(actualValues.tshirt) + numberValue(actualValues.pants_skirt) + numberValue(actualValues.knit_shirt) + numberValue(actualValues.light_outerwear) + numberValue(actualValues.dress_formal);
  const payload = {
    reconcile_date: reconciliationSummary.date,
    system_settlement_counts: systemCounts,
    actual_settlement_counts: actualValues,
    system_other_details: reconciliationSummary.otherDetails || [],
    system_total_cost: numberValue(reconciliationSummary.totalCost),
    unconfirmed_count: unconfirmedCount,
    system_normal_shoe_count: numberValue(systemCounts.regular_shoe),
    system_special_shoe_count: legacySystemSpecial,
    system_thin_count: legacySystemThin,
    system_thick_count: numberValue(systemCounts.heavy_outerwear),
    system_mixed_count: 0,
    system_other_count: numberValue(systemCounts[SETTLEMENT_OTHER]),
    actual_normal_shoe_count: numberValue(actualValues.regular_shoe),
    actual_special_shoe_count: legacyActualSpecial,
    actual_thin_count: legacyActualThin,
    actual_thick_count: numberValue(actualValues.heavy_outerwear),
    actual_mixed_count: 0,
    actual_other_count: numberValue(actualValues[SETTLEMENT_OTHER]),
    status: unconfirmedCount ? "待核对" : mismatch ? "有差异" : "已核对",
    checked_by: currentProfile?.id || null,
    checked_by_name: checkerName,
    reference_note: text($("reconciliationReference")?.value),
    checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  setMessage("reconciliationMessage", "正在保存对账记录...", "hint");
  const { error } = await sb.from("daily_reconciliations").upsert(payload, { onConflict: "reconcile_date" });
  if (error) return setMessage("reconciliationMessage", `保存失败：${error.message}${/column|schema cache/i.test(error.message || "") ? `；${settlementMigrationMessage()}` : ""}`, "warn");
  await loadReconciliation(reconciliationSummary.date);
  const resultMessage = unconfirmedCount
    ? `已保存为待核对，还有 ${unconfirmedCount} 个水洗标需要确认结算品类。`
    : mismatch
      ? "已保存，当前仍有品类数量差异，请按备注继续核查。"
      : "对账完成，各清洗品类数量一致。";
  setMessage("reconciliationMessage", resultMessage, unconfirmedCount || mismatch ? "warn" : "success");
}

function formatDateTime(value, includeSeconds = false) {
  const date = parseDate(value);
  if (!date) return "";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...(includeSeconds ? { second: "2-digit" } : {}),
    hourCycle: "h23",
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}${includeSeconds ? `:${parts.second}` : ""}`;
}

function orderBusinessTime(order) {
  return parseDate(order.pay_time) || parseDate(order.order_time);
}

function inDateRange(order, startText, endText) {
  const businessTime = orderBusinessTime(order);
  if (!businessTime) return !startText && !endText;
  if (startText) {
    const start = parseDateOnly(startText);
    if (start && businessTime < start) return false;
  }
  if (endText) {
    const end = parseDateOnly(endText);
    if (end) {
      end.setHours(23, 59, 59, 999);
      if (businessTime > end) return false;
    }
  }
  return true;
}

function isOverdueOrder(order) {
  const updatedAt = Date.parse(order.updated_at || "");
  if (!Number.isFinite(updatedAt) || order.order_status === "已送达") return false;
  return updatedAt < Date.now() - OVERDUE_HOURS * 60 * 60 * 1000;
}

function overdueAgeHours(order) {
  const updatedAt = Date.parse(order.updated_at || "");
  return Number.isFinite(updatedAt) ? Math.max(0, (Date.now() - updatedAt) / (60 * 60 * 1000)) : 0;
}

function overdueBucket(order) {
  if (!isOverdueOrder(order)) return "";
  const hours = overdueAgeHours(order);
  if (hours < 72) return "overdue-2";
  if (hours < 120) return "overdue-3-5";
  return "overdue-5-plus";
}

function overdueStage(order) {
  const status = text(order.order_status);
  if (["待取件", "未找到"].includes(status)) return { label: "取件", responsible: "配送员" };
  if (status === "已取件") return { label: "待入库", responsible: "工厂负责人胖哥" };
  if (["已入厂", "清洗中"].includes(status)) return { label: "工厂洗护", responsible: "工厂负责人胖哥" };
  if (status === "已出库") return { label: "出库交接", responsible: "工厂负责人胖哥" };
  if (status === "配送中") return { label: "配送", responsible: "配送员" };
  if (status === "异常") return { label: "异常处理", responsible: "客服＋胖哥" };
  return { label: "后台确认", responsible: "后台人员" };
}

function summarizeOverdueStages(rows) {
  if (!rows.length) return "暂无积压";
  const counts = new Map();
  rows.forEach((order) => {
    const stage = overdueStage(order);
    const key = `${stage.label}｜${stage.responsible}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([key, count]) => {
      const [label, responsible] = key.split("｜");
      return `${label} ${count}（${responsible}）`;
    })
    .join(" · ");
}

function matchesOverdueDashboardFilter(order, filter = orderDashboardFilter) {
  if (!filter) return true;
  if (filter === "overdue") return isOverdueOrder(order);
  if (filter.startsWith("overdue-")) return overdueBucket(order) === filter;
  return true;
}

function overdueFilterLabel(filter = orderDashboardFilter) {
  const labels = {
    overdue: `超过 ${OVERDUE_HOURS} 小时未更新且未送达`,
    "overdue-2": "超时 2 天",
    "overdue-3-5": "超时 3～5 天",
    "overdue-5-plus": "超时 5 天以上",
  };
  return labels[filter] || "";
}

function formatOverdueAge(order) {
  if (!isOverdueOrder(order)) return "—";
  const hours = Math.floor(overdueAgeHours(order));
  const days = Math.floor(hours / 24);
  return `${days} 天 ${hours % 24} 小时`;
}

async function loadOrderManagement() {
  const { data, error } = await sb
    .from("orders")
    .select("*, order_items(id,barcode,item_status,product_name,spec)")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return setMessage("adminOrders", error.message, "warn");
  orderManagementRows = data || [];
  renderOrderManagement();
}

function renderOrderManagement() {
  const keyword = text($("orderSearch")?.value).toLowerCase();
  const selectedStatus = text($("orderStatusFilter")?.value);
  const startDate = text($("orderStartDate")?.value);
  const endDate = text($("orderEndDate")?.value);
  $("adminOrders").innerHTML = `
    <section class="panel table-panel">
      <h2>订单管理</h2>
      <div id="orderActiveFilter" class="active-filter ${orderDashboardFilter ? "" : "hidden"}">
        ${orderDashboardFilter ? `<span>驾驶舱筛选：${escapeHtml(overdueFilterLabel())}</span><button class="ghost small-btn" type="button" data-clear-dashboard-filter="orders">清除筛选</button>` : ""}
      </div>
      <div class="toolbar wrap filter-toolbar">
        <input id="orderSearch" class="input" placeholder="搜索订单号、姓名、电话、学校、楼栋、水洗标" value="${escapeHtml(keyword)}" />
        <select id="orderStatusFilter" class="input">
          <option value="">全部状态</option>
          ${ORDER_STATUSES.map((status) => `<option value="${escapeHtml(status)}" ${status === selectedStatus ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}
        </select>
        <input id="orderStartDate" class="input" type="date" value="${escapeHtml(startDate)}" />
        <input id="orderEndDate" class="input" type="date" value="${escapeHtml(endDate)}" />
        <button id="clearOrderFiltersBtn" class="ghost" type="button">清空筛选</button>
      </div>
      <p id="orderFilterSummary" class="hint">时间筛选优先按付款时间，付款时间为空时按下单时间。</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>订单号</th><th>姓名</th><th>电话</th><th>宿舍</th><th>状态</th><th>积压时长</th><th>责任环节</th><th>付款时间</th><th>下单时间</th><th>物品数</th><th>操作</th></tr></thead>
          <tbody id="orderRows"></tbody>
        </table>
      </div>
    </section>`;
  bindOrderManagementFilters();
  applyOrderFilters();
}

function filteredOrderRows() {
  const keyword = text($("orderSearch")?.value).toLowerCase();
  const selectedStatus = text($("orderStatusFilter")?.value);
  const startDate = text($("orderStartDate")?.value);
  const endDate = text($("orderEndDate")?.value);
  return orderManagementRows.filter((order) => {
    const searchable = `${order.order_no} ${order.customer_name} ${order.phone} ${order.school} ${order.campus} ${orderCampusName(order)} ${order.building} ${order.address} ${(order.order_items || []).map((item) => `${item.barcode} ${item.product_name} ${item.spec}`).join(" ")}`.toLowerCase();
    if (keyword && !searchable.includes(keyword)) return false;
    if (selectedStatus && order.order_status !== selectedStatus) return false;
    if (!matchesOverdueDashboardFilter(order)) return false;
    return inDateRange(order, startDate, endDate);
  });
}

function applyOrderFilters() {
  const rows = filteredOrderRows();
  if ($("orderRows")) $("orderRows").innerHTML = renderOrderRows(rows);
  const prefix = orderDashboardFilter ? `${overdueFilterLabel()}共 ${rows.length} 单；` : `共 ${rows.length} 单；`;
  if ($("orderFilterSummary")) $("orderFilterSummary").textContent = `${prefix}时间筛选优先按付款时间，付款时间为空时按下单时间。`;
}

function renderOrderRows(rows) {
  return rows.map((order) => `
    <tr>
      <td>${escapeHtml(order.order_no)}</td>
      <td>${escapeHtml(order.customer_name)}</td>
      <td>${escapeHtml(order.phone)}</td>
      <td>${escapeHtml(`${order.school || ""}${orderCampusName(order)}${order.building || ""}`)}</td>
      <td>
        <select class="input compact-input" data-order-status="${order.id}">
          ${order.order_status === "待补取" ? '<option value="待补取" selected disabled>待补取（按水洗标处理）</option>' : ""}
          ${ORDER_EDITABLE_STATUSES.map((status) => `<option value="${escapeHtml(status)}" ${status === order.order_status ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}
        </select>
      </td>
      <td>${escapeHtml(formatOverdueAge(order))}</td>
      <td>${escapeHtml(`${overdueStage(order).label}｜${overdueStage(order).responsible}`)}</td>
      <td>${escapeHtml(formatDateTime(order.pay_time))}</td>
      <td>${escapeHtml(formatDateTime(order.order_time))}</td>
      <td>${order.order_items?.length || 0}</td>
      <td><button class="ghost small" type="button" data-detail="${order.id}">详情</button></td>
    </tr>`).join("") || '<tr><td colspan="11">暂无符合条件的订单</td></tr>';
}

function bindOrderManagementFilters() {
  on("orderSearch", "input", applyOrderFilters);
  on("orderStatusFilter", "change", applyOrderFilters);
  on("orderStartDate", "change", applyOrderFilters);
  on("orderEndDate", "change", applyOrderFilters);
  on("clearOrderFiltersBtn", "click", () => {
    orderDashboardFilter = "";
    if ($("orderSearch")) $("orderSearch").value = "";
    if ($("orderStatusFilter")) $("orderStatusFilter").value = "";
    if ($("orderStartDate")) $("orderStartDate").value = "";
    if ($("orderEndDate")) $("orderEndDate").value = "";
    renderActiveFilter("orderActiveFilter", "", "orders");
    applyOrderFilters();
  });
}

async function updateOrderStatus(orderId, status) {
  if (status === "待补取") return alert("待补取必须在订单详情中按单个水洗标安排，不能整单修改。");
  const now = new Date().toISOString();
  const { data: itemRows, error: itemReadError } = await sb.from("order_items").select("id").eq("order_id", orderId);
  if (itemReadError) return alert(`状态同步失败：${itemReadError.message}`);
  const itemIds = (itemRows || []).map((item) => item.id).filter(Boolean);
  const updates = itemIds.length
    ? [sb.from("order_items").update({ item_status: status, updated_at: now }).in("id", itemIds)]
    : [sb.from("orders").update({ order_status: status, updated_at: now }).eq("id", orderId)];
  const pickupStatus = status === "待取件" || status === "未找到"
    ? status
    : ["已取件", "已入厂", "已出库", "配送中", "已送达"].includes(status)
      ? "已取件"
      : "";
  if (pickupStatus) {
    updates.push(sb.from("pickup_tasks").update({ status: pickupStatus, updated_at: now }).eq("order_id", orderId));
  }
  const results = await Promise.all(updates);
  const failure = results.find((result) => result.error)?.error;
  if (failure) {
    await refreshAll();
    return alert(`状态同步失败：${failure.message}`);
  }
  await insertLog({ orderId, status, note: `后台手动改状态为：${status}` });
  await refreshAll();
}

async function updateOrderItemStatus(itemId, orderId, barcode, status, selectElement) {
  if (!itemId || !orderId || !ITEM_STATUSES.includes(status)) return;
  if (status === "待补取") return alert("请使用右侧“安排补取”，系统会同时生成补取路线。");
  if (selectElement) selectElement.disabled = true;
  const { error } = await sb.from("order_items").update({
    item_status: status,
    updated_at: new Date().toISOString(),
  }).eq("id", itemId);
  if (error) {
    if (selectElement) selectElement.disabled = false;
    return alert(`水洗标状态修改失败：${error.message}`);
  }
  await insertLog({
    orderId,
    itemId,
    barcode,
    status,
    note: `后台单独修改水洗标 ${barcode || itemId} 为：${status}`,
  });
  await refreshAll();
  await showOrderDetail(orderId);
}

async function loadExceptions() {
  await detectExceptionTicketSchemaAvailability();
  const [legacyResult, ticketResult] = await Promise.all([
    sb.from("orders").select("*").or("exception_note.neq.,school.eq.学校未识别,campus.eq.校区未识别,building.eq.楼栋未识别,order_status.eq.异常,order_status.eq.未找到").order("created_at", { ascending: false }).limit(300),
    exceptionTicketSchemaAvailable
      ? sb.from("exception_tickets").select("*, orders(id,order_no,customer_name,phone,school,campus,building,address), order_items(id,barcode,product_name,spec,item_status)").order("created_at", { ascending: false }).limit(300)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (legacyResult.error) return setMessage("adminExceptions", legacyResult.error.message, "warn");
  if (ticketResult.error) return setMessage("adminExceptions", ticketResult.error.message, "warn");
  currentExceptionRows = legacyResult.data || [];
  currentExceptionTickets = await hydrateExceptionTicketEvidence(ticketResult.data || []);
  const quickConfirmCount = currentExceptionRows.filter((order) => {
    const audit = recognitionAuditForOrder(order);
    return isDormComplete(audit) && audit.confidence >= 90 && !audit.currentMismatch && isRecognitionReviewNote(order.exception_note);
  }).length;
  const incompleteCount = currentExceptionRows.filter((order) => {
    const audit = recognitionAuditForOrder(order);
    return !isDormComplete(audit) || audit.confidence < 70;
  }).length;
  const operationalCount = currentExceptionRows.length - quickConfirmCount - incompleteCount;
  const openTickets = currentExceptionTickets
    .filter((ticket) => EXCEPTION_OPEN_STATUSES.includes(ticket.status))
    .sort((left, right) => Number(right.priority === "紧急") - Number(left.priority === "紧急")
      || new Date(left.created_at || 0) - new Date(right.created_at || 0));
  const closedTickets = currentExceptionTickets
    .filter((ticket) => !EXCEPTION_OPEN_STATUSES.includes(ticket.status))
    .sort((left, right) => new Date(right.resolved_at || right.updated_at || 0) - new Date(left.resolved_at || left.updated_at || 0));
  const pendingCustomerCount = openTickets.filter((ticket) => ticket.status === "待客户").length;
  const processingCount = openTickets.filter((ticket) => ticket.status === "处理中").length;
  const totalPending = openTickets.length + currentExceptionRows.length;
  updateExceptionBadge(totalPending);
  $("adminExceptions").innerHTML = `
    <section class="panel exception-center">
      <div class="exception-heading">
        <div>
          <p class="eyebrow">统一处理入口</p>
          <h2>异常工单中心</h2>
          <p class="hint">工厂上报、客服沟通、处理结论和原地址修正都集中在这里；微信只作为通知渠道。</p>
        </div>
        <div class="toolbar wrap">
          <button type="button" data-new-exception-ticket ${exceptionTicketSchemaAvailable ? "" : "disabled"}>新建异常工单</button>
          <button class="ghost" type="button" data-reprocess-orders>重新识别地址</button>
        </div>
      </div>
      <div class="mini-stats exception-stats">
        <div class="danger-stat"><strong>${totalPending}</strong><span>全部待处理</span></div>
        <div><strong>${openTickets.filter((ticket) => ticket.status === "待客服").length}</strong><span>待客服</span></div>
        <div><strong>${pendingCustomerCount}</strong><span>待客户</span></div>
        <div><strong>${processingCount}</strong><span>处理中</span></div>
        <div><strong>${currentExceptionRows.length}</strong><span>地址/历史异常</span></div>
      </div>
      ${exceptionTicketSchemaAvailable ? "" : `<p class="warn exception-migration-note">${escapeHtml(exceptionTicketMigrationMessage())}</p>`}
      ${exceptionActionMessage ? `<p class="success-note">${escapeHtml(exceptionActionMessage)}</p>` : ""}
      <section class="exception-worklist" aria-labelledby="openExceptionTicketsTitle">
        <div class="section-heading compact-heading"><div><h3 id="openExceptionTicketsTitle">处理中工单</h3><p class="hint">按提交时间排列，红色“紧急”优先处理。</p></div><strong>${openTickets.length} 单</strong></div>
        <div class="card-list">${openTickets.map(renderExceptionTicketCard).join("") || '<p class="hint empty-state">暂无处理中工单</p>'}</div>
      </section>
      <details class="exception-legacy-section" ${currentExceptionRows.length ? "open" : ""}>
        <summary><span><strong>地址确认与历史异常</strong><small>保留原“异常修正”全部能力</small></span><b>${currentExceptionRows.length}</b></summary>
        <div class="mini-stats exception-stats legacy-stats">
          <div><strong>${quickConfirmCount}</strong><span>快速确认</span></div>
          <div><strong>${incompleteCount}</strong><span>信息不完整</span></div>
          <div><strong>${operationalCount}</strong><span>其他异常</span></div>
        </div>
        <div class="card-list">${currentExceptionRows.map(renderExceptionCard).join("") || '<p class="hint">暂无地址或历史异常</p>'}</div>
      </details>
      ${closedTickets.length ? `<details class="exception-legacy-section"><summary><span><strong>已结案工单</strong><small>仅供查询，不计入红色提醒</small></span><b>${closedTickets.length}</b></summary><div class="card-list">${closedTickets.map(renderExceptionTicketCard).join("")}</div></details>` : ""}
    </section>`;
  exceptionActionMessage = "";
}

function relationOne(value) {
  return Array.isArray(value) ? value[0] || {} : value || {};
}

async function hydrateExceptionTicketEvidence(tickets) {
  if (!tickets.length) return tickets;
  return Promise.all(tickets.map(async (ticket) => {
    const paths = Array.isArray(ticket.evidence_paths) ? ticket.evidence_paths.filter(Boolean) : [];
    if (!paths.length) return { ...ticket, evidenceUrls: [] };
    const { data } = await sb.storage.from("exception-evidence").createSignedUrls(paths, 60 * 60);
    return { ...ticket, evidenceUrls: (data || []).map((entry) => entry.signedUrl).filter(Boolean) };
  }));
}

function exceptionStatusClass(status) {
  if (status === "待客服") return "danger";
  if (status === "待客户") return "warning";
  if (status === "处理中") return "processing";
  return "done";
}

function renderExceptionTicketCard(ticket) {
  const order = relationOne(ticket.orders);
  const item = relationOne(ticket.order_items);
  const barcode = ticket.barcode || item.barcode || "未绑定水洗标";
  const resolved = !EXCEPTION_OPEN_STATUSES.includes(ticket.status);
  return `
    <article class="task-card exception-ticket-card ${ticket.priority === "紧急" ? "urgent" : ""}" data-exception-ticket="${ticket.id}">
      <div class="card-head">
        <div><h3>${escapeHtml(ticket.ticket_type)}${ticket.priority === "紧急" ? '<span class="urgent-label">紧急</span>' : ""}</h3><p class="hint">${escapeHtml(order.customer_name || "未知客户")} · ${escapeHtml(order.phone || "")} · ${escapeHtml(barcode)}</p></div>
        <span class="ticket-status ${exceptionStatusClass(ticket.status)}">${escapeHtml(ticket.status)}</span>
      </div>
      <p class="exception-ticket-description">${escapeHtml(ticket.description || "未填写问题说明")}</p>
      <div class="exception-ticket-meta"><span>订单 ${escapeHtml(order.order_no || "—")}</span><span>${escapeHtml(item.spec || item.product_name || "物品待核对")}</span><span>${escapeHtml(ticket.source || "后台")}</span><span>${escapeHtml(formatDateTime(ticket.created_at, true))}</span></div>
      ${ticket.evidenceUrls?.length ? `<div class="exception-evidence-grid">${ticket.evidenceUrls.map((url, index) => `<button type="button" data-full-image="${escapeHtml(url)}" aria-label="查看异常照片 ${index + 1}"><img src="${escapeHtml(url)}" alt="异常证据 ${index + 1}" /></button>`).join("")}</div>` : '<p class="hint">暂无异常照片</p>'}
      ${ticket.proposed_solution ? `<p><strong>建议方案：</strong>${escapeHtml(ticket.proposed_solution)}</p>` : ""}
      ${ticket.customer_reply ? `<p><strong>客户回复：</strong>${escapeHtml(ticket.customer_reply)}</p>` : ""}
      ${ticket.resolution ? `<p><strong>处理结果：</strong>${escapeHtml(ticket.resolution)}</p>` : ""}
      <div class="actions exception-ticket-actions">
        <button class="ghost" type="button" data-copy-exception-message="${ticket.id}">复制客户沟通内容</button>
        ${item.id && order.id && !resolved ? `<button class="ghost" type="button" data-schedule-retry-item="${escapeHtml(item.id)}" data-retry-order="${escapeHtml(order.id)}" data-retry-ticket="${escapeHtml(ticket.id)}">安排补取</button>` : ""}
        ${resolved ? "" : `<button class="ghost" type="button" data-exception-status="${ticket.id}" data-status="待客户">标记待客户</button><button class="ghost" type="button" data-exception-status="${ticket.id}" data-status="处理中">开始处理</button><button type="button" data-exception-status="${ticket.id}" data-status="已解决">处理完成</button>`}
      </div>
    </article>`;
}

function ensureExceptionTicketDialog() {
  if ($("exceptionTicketDialog")) return $("exceptionTicketDialog");
  document.body.insertAdjacentHTML("beforeend", `
    <dialog id="exceptionTicketDialog" class="exception-ticket-dialog">
      <form method="dialog" class="exception-ticket-form" onsubmit="return false">
        <div class="dialog-heading"><div><p class="eyebrow">绑定到单个水洗标</p><h2>上报异常工单</h2></div><button class="ghost small-btn" type="button" data-close-exception-ticket>关闭</button></div>
        <input id="exceptionTicketItemId" type="hidden" />
        <label id="exceptionTicketItemChoice" class="field-group hidden"><span>选择异常物品</span><select id="exceptionTicketItemSelect" class="input"></select></label>
        <label class="field-group"><span>水洗标</span><input id="exceptionTicketBarcode" class="input" placeholder="扫码或输入水洗标" autocomplete="off" /></label>
        <div class="exception-form-grid">
          <label class="field-group"><span>异常类型</span><select id="exceptionTicketType" class="input">${EXCEPTION_TICKET_TYPES.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("")}</select></label>
          <label class="field-group"><span>优先级</span><select id="exceptionTicketPriority" class="input"><option value="普通">普通</option><option value="紧急">紧急</option></select></label>
        </div>
        <label id="exceptionTicketRetryDateField" class="field-group hidden"><span>补取日期</span><input id="exceptionTicketRetryDate" class="input" type="date" /><small>选中的水洗标会单独进入补取路线，订单内其他物品不受影响。</small></label>
        <label class="field-group"><span>问题说明</span><textarea id="exceptionTicketDescription" class="input" rows="3" placeholder="例如：前后logo存在脱落风险，建议先联系客户确认"></textarea></label>
        <label class="field-group"><span>建议处理方案</span><input id="exceptionTicketSolution" class="input" placeholder="例如：客户确认后继续清洗 / 返洗 / 退洗" /></label>
        <label class="field-group"><span>异常照片（可多选）</span><input id="exceptionTicketFiles" class="input" type="file" accept="image/*" multiple /></label>
        <p id="exceptionTicketMessage" class="hint" role="status" aria-live="polite"></p>
        <div class="actions"><button type="button" data-submit-exception-ticket>提交工单</button><button class="ghost" type="button" data-close-exception-ticket>取消</button></div>
      </form>
    </dialog>`);
  return $("exceptionTicketDialog");
}

function openExceptionTicketDialog(item = null, context = null) {
  if (!exceptionTicketSchemaAvailable) return alert(exceptionTicketMigrationMessage());
  const dialog = ensureExceptionTicketDialog();
  const items = (context?.items?.length ? context.items : item ? [item] : []).filter(Boolean);
  const selectedItem = item || items[0] || null;
  exceptionTicketContext = context ? { ...context, items } : null;
  $("exceptionTicketItemId").value = selectedItem?.id || "";
  $("exceptionTicketBarcode").value = selectedItem?.barcode || "";
  $("exceptionTicketBarcode").readOnly = Boolean(selectedItem?.barcode);
  const itemChoice = $("exceptionTicketItemChoice");
  const itemSelect = $("exceptionTicketItemSelect");
  if (itemChoice && itemSelect) {
    itemChoice.classList.toggle("hidden", items.length <= 1);
    itemSelect.innerHTML = items.map((row) => `<option value="${escapeHtml(row.id || "")}" data-barcode="${escapeHtml(row.barcode || "")}">${escapeHtml(`${row.barcode || "无条码"}｜${row.spec || row.product_name || "物品未填写"}`)}</option>`).join("");
    itemSelect.value = selectedItem?.id || items[0]?.id || "";
  }
  $("exceptionTicketType").value = "原有破损";
  if (context?.type === "courier-pickup") $("exceptionTicketType").value = "漏取/补取";
  if (context?.type === "courier-return") $("exceptionTicketType").value = "配送异常";
  $("exceptionTicketRetryDateField")?.classList.toggle("hidden", context?.type !== "courier-pickup");
  if ($("exceptionTicketRetryDate")) $("exceptionTicketRetryDate").value = todayDate();
  $("exceptionTicketPriority").value = "普通";
  $("exceptionTicketDescription").value = "";
  $("exceptionTicketSolution").value = "";
  $("exceptionTicketFiles").value = "";
  setMessage("exceptionTicketMessage", item?.barcode ? `水洗标 ${item.barcode}` : "输入水洗标后提交", "hint");
  dialog.showModal();
  requestAnimationFrame(() => (selectedItem?.barcode ? $("exceptionTicketDescription") : $("exceptionTicketBarcode"))?.focus());
}

function openCourierPickupException(taskId) {
  const retryTask = courierRetryTaskRows.find((row) => row.id === taskId);
  const task = retryTask || courierPickupTaskRows.find((row) => row.id === taskId);
  const retryItem = retryTask ? relationOne(retryTask.order_items) : null;
  const order = retryTask ? relationOne(retryItem?.orders) : task?.orders || {};
  const items = retryItem ? [retryItem] : sortedOrderItems(order).filter((row) => PICKUP_OPEN_STATUSES.has(text(row.item_status)));
  if (!task || !items.length) return alert("这单还没有水洗标，暂时无法上报异常工单");
  openExceptionTicketDialog(items[0], { type: "courier-pickup", taskId, orderId: order.id, items, isRetry: Boolean(retryTask) });
}

function openCourierReturnException(taskId, itemId, orderId) {
  const record = courierReturnOrderGroups.flatMap((group) => group.records).find(({ task }) => task.id === taskId);
  const item = record?.item || { id: itemId, order_id: orderId };
  if (!item?.id) return alert("没有找到对应的水洗标");
  openExceptionTicketDialog(item, { type: "courier-return", taskId, orderId, items: [item] });
}

function safeEvidenceFileName(name) {
  return text(name).replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80) || "photo.jpg";
}

async function scheduleRetryPickup({ itemId, orderId, pickupDate, reason, parentTaskId = null, exceptionTicketId = null }) {
  if (!retryPickupSchemaAvailable) throw new Error(retryPickupMigrationMessage());
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(text(pickupDate)) ? text(pickupDate) : todayDate();
  const now = new Date().toISOString();
  const { data: existing, error: existingError } = await sb
    .from("pickup_retry_tasks")
    .select("id,attempt_no")
    .eq("item_id", itemId)
    .in("status", [...RETRY_PICKUP_OPEN_STATUSES])
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  let retryId = existing?.id || "";
  if (existing) {
    const { error } = await sb.from("pickup_retry_tasks").update({
      pickup_date: dueDate,
      status: "待补取",
      reason: text(reason) || "漏取补取",
      parent_pickup_task_id: parentTaskId || null,
      exception_ticket_id: exceptionTicketId || null,
      operator_id: currentProfile?.id || null,
      updated_at: now,
    }).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { data: priorRows, error: priorError } = await sb.from("pickup_retry_tasks").select("attempt_no").eq("item_id", itemId).order("attempt_no", { ascending: false }).limit(1);
    if (priorError) throw priorError;
    const attemptNo = numberValue(priorRows?.[0]?.attempt_no) + 1 || 1;
    const { data, error } = await sb.from("pickup_retry_tasks").insert({
      order_id: orderId,
      item_id: itemId,
      parent_pickup_task_id: parentTaskId || null,
      exception_ticket_id: exceptionTicketId || null,
      pickup_date: dueDate,
      status: "待补取",
      reason: text(reason) || "漏取补取",
      attempt_no: attemptNo,
      operator_id: currentProfile?.id || null,
      updated_at: now,
    }).select("id").single();
    if (error) throw error;
    retryId = data.id;
  }
  const { error: itemError } = await sb.from("order_items").update({ item_status: "待补取", updated_at: now }).eq("id", itemId);
  if (itemError) throw itemError;
  const { data: remainingItems, error: remainingError } = await sb.from("order_items").select("id").eq("order_id", orderId).in("item_status", [...PICKUP_OPEN_STATUSES]);
  if (remainingError) throw remainingError;
  if (parentTaskId && !(remainingItems || []).length) {
    const { error: parentError } = await sb.from("pickup_tasks").update({ status: "已取件", operator_id: currentProfile?.id || null, updated_at: now }).eq("id", parentTaskId);
    if (parentError) throw parentError;
  }
  await insertLog({ orderId, itemId, status: "安排补取", note: `${dueDate}；${text(reason) || "漏取补取"}` });
  return retryId;
}

async function scheduleRetryPickupFromUi(itemId, orderId, ticketId = null) {
  if (!retryPickupSchemaAvailable) return alert(retryPickupMigrationMessage());
  const pickupDate = prompt("补取日期（YYYY-MM-DD）", todayDate());
  if (pickupDate === null) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text(pickupDate))) return alert("补取日期格式不正确");
  const reason = prompt("补取原因", "漏取，安排单个水洗标补取");
  if (reason === null) return;
  try {
    await scheduleRetryPickup({ itemId, orderId, pickupDate, reason, exceptionTicketId: ticketId });
    exceptionActionMessage = "已安排单个水洗标补取";
    await Promise.all([loadExceptions(), loadStats(), loadCourierTasks()]);
    if ($("orderDialog")?.open) await showOrderDetail(orderId);
  } catch (error) {
    alert(error?.message || "安排补取失败");
  }
}

async function submitExceptionTicket() {
  if (exceptionTicketBusy) return;
  if (!exceptionTicketSchemaAvailable) return alert(exceptionTicketMigrationMessage());
  const itemId = text($("exceptionTicketItemId")?.value);
  const barcode = text($("exceptionTicketBarcode")?.value);
  const description = text($("exceptionTicketDescription")?.value);
  if (!barcode) return setMessage("exceptionTicketMessage", "请先输入水洗标", "warn");
  if (!description) return setMessage("exceptionTicketMessage", "请填写问题说明", "warn");
  exceptionTicketBusy = true;
  document.querySelector("[data-submit-exception-ticket]")?.setAttribute("disabled", "disabled");
  setMessage("exceptionTicketMessage", "正在保存异常工单和照片...", "hint");
  try {
    let itemQuery = sb.from("order_items").select("id,order_id,barcode,product_name,spec,orders(id,order_no)");
    itemQuery = itemId ? itemQuery.eq("id", itemId) : itemQuery.eq("barcode", barcode);
    const { data: item, error: itemError } = await itemQuery.maybeSingle();
    if (itemError) throw itemError;
    if (!item) throw new Error("没有找到这个水洗标");
    const ticketType = text($("exceptionTicketType")?.value) || "其他异常";
    const createsRetry = exceptionTicketContext?.type === "courier-pickup" && ticketType === "漏取/补取";
    if (createsRetry && !retryPickupSchemaAvailable) throw new Error(retryPickupMigrationMessage());
    const { data: existingTicket, error: existingError } = await sb
      .from("exception_tickets")
      .select("id")
      .eq("item_id", item.id)
      .eq("ticket_type", ticketType)
      .in("status", EXCEPTION_OPEN_STATUSES)
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existingTicket) throw new Error("这个水洗标已有同类型待处理工单，请勿重复上报");
    const files = [...($("exceptionTicketFiles")?.files || [])];
    const evidencePaths = [];
    for (const file of files) {
      const path = `${item.order_id}/${crypto.randomUUID()}-${safeEvidenceFileName(file.name)}`;
      const { error: uploadError } = await sb.storage.from("exception-evidence").upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
      if (uploadError) throw uploadError;
      evidencePaths.push(path);
    }
    const payload = {
      order_id: item.order_id,
      item_id: item.id,
      barcode: item.barcode,
      ticket_type: ticketType,
      description,
      proposed_solution: text($("exceptionTicketSolution")?.value),
      evidence_paths: evidencePaths,
      priority: text($("exceptionTicketPriority")?.value) === "紧急" ? "紧急" : "普通",
      status: "待客服",
      source: exceptionTicketContext?.type === "courier-pickup"
        ? "配送员端-取件"
        : exceptionTicketContext?.type === "courier-return"
          ? "配送员端-送回"
          : APP_MODE === "factory"
            ? "工厂端"
            : "后台",
      reporter_id: currentProfile?.id || null,
      updated_at: new Date().toISOString(),
    };
    let retryId = "";
    if (createsRetry) {
      retryId = await scheduleRetryPickup({
        itemId: item.id,
        orderId: item.order_id,
        pickupDate: text($("exceptionTicketRetryDate")?.value) || todayDate(),
        reason: description,
        parentTaskId: exceptionTicketContext?.isRetry ? null : exceptionTicketContext?.taskId || null,
      });
    }
    const { data: createdTicket, error } = await sb.from("exception_tickets").insert(payload).select("id").single();
    if (error) throw error;
    if (retryId) {
      const { error: linkError } = await sb.from("pickup_retry_tasks").update({ exception_ticket_id: createdTicket.id, updated_at: new Date().toISOString() }).eq("id", retryId);
      if (linkError) throw linkError;
    }
    await insertLog({ orderId: item.order_id, itemId: item.id, barcode: item.barcode, status: "异常工单待处理", note: `${payload.ticket_type}：${description}` });
    $("exceptionTicketDialog")?.close();
    exceptionActionMessage = `异常工单已提交：${item.barcode}`;
    await Promise.all([loadStats(), APP_MODE === "admin" ? loadExceptions() : Promise.resolve(), APP_MODE === "factory" ? loadFactoryItems() : Promise.resolve(), APP_MODE === "courier" ? loadCourierTasks() : Promise.resolve()]);
    if (APP_MODE === "courier") alert(createsRetry ? `已上报异常并生成补取任务：${item.barcode}\n其他正常物品仍可点击“已取到”。` : `异常工单已提交：${item.barcode}\n原任务仍保留，请再按实际结果完成。`);
    exceptionTicketContext = null;
  } catch (error) {
    setMessage("exceptionTicketMessage", error?.message || "异常工单提交失败", "warn");
  } finally {
    exceptionTicketBusy = false;
    document.querySelector("[data-submit-exception-ticket]")?.removeAttribute("disabled");
  }
}

async function updateExceptionTicketStatus(ticketId, status) {
  if (exceptionTicketBusy || !EXCEPTION_OPEN_STATUSES.concat(["已解决", "已关闭"]).includes(status)) return;
  const ticket = currentExceptionTickets.find((row) => row.id === ticketId);
  if (!ticket) return;
  const update = { status, updated_at: new Date().toISOString() };
  if (status === "处理中") {
    const reply = prompt("填写客户回复或已确认方案", ticket.customer_reply || "");
    if (reply === null) return;
    update.customer_reply = text(reply);
    update.assignee_id = currentProfile?.id || ticket.assignee_id || null;
  }
  if (status === "已解决" || status === "已关闭") {
    const resolution = prompt("填写最终处理结果", ticket.resolution || "");
    if (resolution === null || !text(resolution)) return;
    update.resolution = text(resolution);
    update.resolved_at = new Date().toISOString();
    update.assignee_id = currentProfile?.id || ticket.assignee_id || null;
  }
  exceptionTicketBusy = true;
  const { error } = await sb.from("exception_tickets").update(update).eq("id", ticketId);
  exceptionTicketBusy = false;
  if (error) return alert(error.message);
  await insertLog({ orderId: ticket.order_id, itemId: ticket.item_id, barcode: ticket.barcode, status: `异常工单${status}`, note: update.resolution || update.customer_reply || ticket.description });
  exceptionActionMessage = `工单已更新为“${status}”`;
  await Promise.all([loadExceptions(), loadStats()]);
}

async function copyExceptionCustomerMessage(ticketId) {
  const ticket = currentExceptionTickets.find((row) => row.id === ticketId);
  if (!ticket) return;
  const order = relationOne(ticket.orders);
  const customerName = order.customer_name ? `${order.customer_name}同学，您好。` : "您好。";
  const content = `${customerName}您的洗护物品（水洗标：${ticket.barcode || "待核对"}）发现“${ticket.ticket_type}”：${ticket.description}${ticket.proposed_solution ? `。建议处理：${ticket.proposed_solution}` : ""}。请回复确认处理方式，谢谢。`;
  await copyText(content);
  exceptionActionMessage = "客户沟通内容已复制，可直接粘贴到微信";
  await loadExceptions();
}

function renderExceptionCard(order) {
  const audit = recognitionAuditForOrder(order);
  const reasons = [];
  if (!order.school || order.school === "学校未识别") reasons.push("学校未识别");
  if (!order.campus || order.campus === "校区未识别") reasons.push("校区未识别");
  if (!order.building || order.building === "楼栋未识别") reasons.push("楼栋未识别");
  if (/地址推测，?待确认/.test(order.exception_note || "")) reasons.push("系统推测，待确认");
  if (audit.currentMismatch) reasons.push("当前楼栋与地址证据不一致");
  if (audit.confidence < 70) reasons.push("低置信度，必须人工确认");
  if (["异常", "未找到"].includes(order.order_status)) reasons.push(order.order_status);
  if (cleanRecognitionNote(order.exception_note)) reasons.push("有异常备注");
  const suggestedSchool = audit.school || order.school || "学校未识别";
  const suggestedCampus = audit.campus || order.campus || "校区未识别";
  const suggestedBuilding = audit.building || "楼栋未识别";
  const suggestedDorm = { school: suggestedSchool, campus: suggestedCampus, building: suggestedBuilding };
  const quickConfirm = isDormComplete(suggestedDorm) && audit.confidence >= 90 && !audit.currentMismatch && isRecognitionReviewNote(order.exception_note);
  const addressNeedsReview = needsRecognitionReview(order) || audit.currentMismatch || audit.confidence < 90;
  const levelLabel = quickConfirm ? "黄色 · 快速确认" : `红色 · ${audit.confidenceLabel}置信度`;
  return `
    <article class="task-card ${quickConfirm ? "review" : "alert"}" data-exception-card="${order.id}">
      <div class="card-head">
        <h3>${escapeHtml(order.customer_name)} · ${escapeHtml(order.phone)}</h3>
        <span class="confidence-badge ${quickConfirm ? "confirm" : "review"}">${levelLabel}</span>
      </div>
      <p>订单号：${escapeHtml(order.order_no)}｜当前状态：${escapeHtml(order.order_status || "未知")}</p>
      <p class="exception-reasons">${escapeHtml(reasons.join("、") || "需检查")}</p>
      <p>${escapeHtml(order.address || "")}</p>
      <section class="recognition-audit ${audit.confidence >= 90 && !audit.currentMismatch ? "high" : audit.confidence >= 70 ? "medium" : "low"}" aria-label="地址识别依据">
        <div><span>命中的原文片段</span><strong>${escapeHtml(audit.match)}</strong></div>
        <div><span>推断结果</span><strong>${escapeHtml(`${suggestedSchool} / ${suggestedCampus} / ${suggestedBuilding}`)}</strong></div>
        <div><span>置信度</span><strong>${audit.confidence}% · ${escapeHtml(audit.confidenceLabel)}</strong></div>
        <div><span>推断原因</span><strong>${escapeHtml(audit.reason)}</strong></div>
      </section>
      <div class="edit-grid">
        <input class="input" data-edit-school="${order.id}" value="${escapeHtml(suggestedSchool)}" placeholder="学校" />
        <input class="input" data-edit-campus="${order.id}" value="${escapeHtml(suggestedCampus)}" placeholder="校区" />
        <input class="input" data-edit-building="${order.id}" value="${escapeHtml(suggestedBuilding)}" placeholder="楼栋" />
        <input class="input" data-edit-note="${order.id}" value="${escapeHtml(order.exception_note || "")}" placeholder="异常备注" />
      </div>
      <div class="actions">
        ${addressNeedsReview ? `<button type="button" data-confirm-dorm="${order.id}">${isDormComplete(order) ? "确认并下一条" : "补全并下一条"}</button>` : ""}
        <button class="ghost" type="button" data-save-dorm="${order.id}">仅保存</button>
        <button class="ghost" type="button" data-detail="${order.id}">详情</button>
        ${addressNeedsReview ? `<button class="ghost learn-action" type="button" data-learn-rule="${order.id}" data-address="${escapeHtml(order.address || "")}">确认、记住并处理同类</button>` : ""}
      </div>
    </article>`;
}

function readDormEditor(orderId) {
  return {
    school: text(document.querySelector(`[data-edit-school="${orderId}"]`)?.value),
    campus: text(document.querySelector(`[data-edit-campus="${orderId}"]`)?.value),
    building: text(document.querySelector(`[data-edit-building="${orderId}"]`)?.value),
    note: text(document.querySelector(`[data-edit-note="${orderId}"]`)?.value),
  };
}

function focusFirstException() {
  requestAnimationFrame(() => {
    document.querySelector("[data-exception-card] [data-edit-school]")?.focus();
  });
}

async function saveDorm(orderId, options = {}) {
  const editor = readDormEditor(orderId);
  const school = editor.school;
  const campus = canonicalCampusName(editor.campus, school);
  const building = editor.building;
  const normalizedEditor = { ...editor, school, campus, building };
  if (options.confirm && !isDormComplete(normalizedEditor)) {
    return alert("请先把学校、校区和楼栋填写完整，再确认这一单。");
  }
  const note = isDormComplete(normalizedEditor) ? cleanRecognitionNote(editor.note) : editor.note;
  const { error } = await sb.from("orders").update({ school, campus, building, exception_note: note, updated_at: new Date().toISOString() }).eq("id", orderId);
  if (error) return alert(error.message);
  await insertLog({
    orderId,
    status: options.confirm ? "人工确认地址" : "后台修正宿舍",
    note: `${school}/${campus}/${building}${note ? `；${note}` : ""}`,
  });
  exceptionActionMessage = options.confirm ? `已确认 ${school} / ${campus} / ${building}` : "修改已保存";
  await Promise.all([loadStats(), loadExceptions()]);
  if (options.next) focusFirstException();
}

function suggestRecognitionKeyword(address, building) {
  const compactAddress = normalizeRecognitionText(address);
  const variants = [
    normalizeRecognitionText(building),
    normalizeRecognitionText(building).replace(/栋$/, "号楼"),
    normalizeRecognitionText(building).replace(/号楼$/, "栋"),
  ].filter(Boolean);
  for (const variant of variants) {
    const index = compactAddress.indexOf(variant);
    if (index < 0) continue;
    return compactAddress.slice(Math.max(0, index - 10), index + variant.length);
  }
  return compactAddress.slice(-16);
}

function validateRecognitionKeyword(keyword) {
  const normalized = normalizeRecognitionText(keyword);
  if (normalized.length < 4) return "关键词过短，容易误伤其他学校，请至少保留学校/校区和楼栋信息。";
  if (/^(?:[a-z]?\d{1,3}|[一二三四五六七八九十]+)(?:栋|号楼|宿舍)?$/i.test(normalized)) {
    return "不能只用“17栋”这类楼栋名作为规则，请同时包含学校或校区关键词。";
  }
  if (/\d{7,}/.test(normalized)) return "关键词里不能包含手机号、订单号或寝室号等个人信息。";
  return "";
}

function needsRecognitionReview(order) {
  return !isDormComplete(order) || isRecognitionReviewNote(order.exception_note);
}

async function applyRuleToExistingOrders(keyword, mapping) {
  const { data, error } = await sb.from("orders")
    .select("id,address,school,campus,building,exception_note")
    .or("exception_note.neq.,school.eq.学校未识别,campus.eq.校区未识别,building.eq.楼栋未识别")
    .limit(1000);
  if (error) throw error;
  const normalizedKeyword = normalizeRecognitionText(keyword);
  const matches = (data || []).filter((order) => (
    needsRecognitionReview(order)
    && normalizeRecognitionText(order.address).includes(normalizedKeyword)
  ));
  for (const group of chunkArray(matches, 100)) {
    const ids = group.map((order) => order.id);
    const operationalNotes = [...new Set(group.map((order) => cleanRecognitionNote(order.exception_note)))];
    if (operationalNotes.length === 1) {
      const { error: updateError } = await sb.from("orders").update({
        school: mapping.school,
        campus: mapping.campus,
        building: mapping.building,
        exception_note: operationalNotes[0],
        updated_at: new Date().toISOString(),
      }).in("id", ids);
      if (updateError) throw updateError;
      continue;
    }
    await Promise.all(group.map(async (order) => {
      const { error: updateError } = await sb.from("orders").update({
        school: mapping.school,
        campus: mapping.campus,
        building: mapping.building,
        exception_note: cleanRecognitionNote(order.exception_note),
        updated_at: new Date().toISOString(),
      }).eq("id", order.id);
      if (updateError) throw updateError;
    }));
  }
  return matches.length;
}

async function learnRule(orderId, address) {
  const editor = readDormEditor(orderId);
  const school = editor.school;
  const campus = canonicalCampusName(editor.campus, school);
  const building = editor.building;
  const note = cleanRecognitionNote(editor.note);
  if (!school || !campus || !building || /未识别/.test(`${school}${campus}${building}`)) {
    return alert("请先把学校、校区和楼栋填写完整，再保存规则。");
  }
  const suggestedKeyword = suggestRecognitionKeyword(address, building);
  const keyword = prompt(
    "请输入地址里稳定出现、能代表这一地点的关键词。\n例如“贵州师范大学花溪校区东区17栋”，可填“花溪校区东区17栋”。\n不要包含姓名、电话、寝室号。保存后会立即处理同类历史订单。",
    suggestedKeyword,
  );
  if (!text(keyword)) return;
  const normalizedKeyword = text(keyword);
  const validationMessage = validateRecognitionKeyword(normalizedKeyword);
  if (validationMessage) return alert(validationMessage);
  const duplicate = recognitionRules.find((rule) => (
    rule.enabled !== false
    && normalizeRecognitionText(rule.keyword) === normalizeRecognitionText(normalizedKeyword)
  ));
  const mappingChanged = duplicate && (
    duplicate.school !== school
    || duplicate.campus !== campus
    || duplicate.building !== building
  );
  if (mappingChanged && !confirm(`关键词“${normalizedKeyword}”已有其他识别结果，确定替换为 ${school} / ${campus} / ${building} 吗？`)) return;

  const { error: orderError } = await sb.from("orders").update({
    school,
    campus,
    building,
    exception_note: note,
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);
  if (orderError) return alert(orderError.message);

  const rulePayload = { school, campus, building, enabled: true, created_by: currentProfile?.id || null };
  const ruleQuery = duplicate
    ? sb.from("recognition_rules").update(rulePayload).eq("id", duplicate.id)
    : sb.from("recognition_rules").insert({ keyword: normalizedKeyword, ...rulePayload });
  const { error: ruleError } = await ruleQuery;
  if (ruleError) return alert(`当前订单已修正，但规则保存失败：${ruleError.message}`);
  await loadRecognitionRules();
  let appliedCount = 0;
  try {
    appliedCount = await applyRuleToExistingOrders(normalizedKeyword, { school, campus, building });
  } catch (error) {
    return alert(`规则已经保存，但处理同类历史订单时失败：${error.message || error}`);
  }
  await insertLog({ orderId, status: "后台修正并保存识别规则", note: `${normalizedKeyword} → ${school}/${campus}/${building}` });
  exceptionActionMessage = `已记住“${normalizedKeyword}”，并自动处理 ${appliedCount} 个同类历史订单`;
  await Promise.all([loadStats(), loadExceptions()]);
  focusFirstException();
}

function buildRecognitionUpdate(order, candidate) {
  const useFullCandidate = candidate.recognitionSource === "rule";
  const next = {
    school: useFullCandidate || isUnresolvedDormValue(order.school, "school") ? candidate.school : order.school,
    campus: useFullCandidate || isUnresolvedDormValue(order.campus, "campus") ? candidate.campus : order.campus,
    building: useFullCandidate || isUnresolvedDormValue(order.building, "building") ? candidate.building : order.building,
  };
  next.campus = canonicalCampusName(next.campus, next.school) || next.campus;
  let nextNote = cleanRecognitionNote(order.exception_note);
  if (isUnresolvedDormValue(next.school, "school")) nextNote = appendRecognitionNote(nextNote, "未识别学校");
  if (isUnresolvedDormValue(next.campus, "campus")) nextNote = appendRecognitionNote(nextNote, "未识别校区");
  if (isUnresolvedDormValue(next.building, "building")) nextNote = appendRecognitionNote(nextNote, "未识别楼栋");
  if (locationNeedsReview(next.school, next.campus, next.building)) {
    nextNote = appendRecognitionNote(nextNote, "楼栋与校区不匹配，待确认");
  }
  const addressEvidenceMismatch = candidate.recognitionSource === "address"
    && Number(candidate.recognitionConfidence || 0) >= 90
    && !isUnresolvedDormValue(candidate.building, "building")
    && !isUnresolvedDormValue(next.building, "building")
    && normalizeRecognitionText(candidate.building) !== normalizeRecognitionText(next.building);
  if (addressEvidenceMismatch) nextNote = appendRecognitionNote(nextNote, "地址推测，待确认");
  if (isDormComplete(next) && candidate.recognitionSource === "address" && Number(candidate.recognitionConfidence || 0) < 90) {
    nextNote = appendRecognitionNote(nextNote, "地址推测，待确认");
  }
  return { ...next, exception_note: nextNote };
}

async function reprocessUnresolvedOrders() {
  await loadRecognitionRules();
  const { data, error } = await sb.from("orders")
    .select("id,address,school,campus,building,exception_note")
    .or("exception_note.neq.,school.eq.学校未识别,campus.eq.校区未识别,building.eq.楼栋未识别")
    .limit(1000);
  if (error) return alert(`读取待确认订单失败：${error.message}`);
  const updates = [];
  (data || []).filter(needsRecognitionReview).forEach((order) => {
    const candidate = extractDormInfo({ 收货地址: order.address || "" });
    const update = buildRecognitionUpdate(order, candidate);
    const changed = ["school", "campus", "building", "exception_note"].some((key) => text(order[key]) !== text(update[key]));
    if (changed) updates.push({ id: order.id, ...update });
  });
  let updatedCount = 0;
  try {
    for (const group of chunkArray(updates, 25)) {
      await Promise.all(group.map(async (update) => {
        const { id, ...payload } = update;
        const { error: updateError } = await sb.from("orders").update({
          ...payload,
          updated_at: new Date().toISOString(),
        }).eq("id", id);
        if (updateError) throw updateError;
        updatedCount += 1;
      }));
    }
  } catch (updateError) {
    return alert(`重新识别中断：已更新 ${updatedCount} 单；${updateError.message || updateError}`);
  }
  exceptionActionMessage = `重新识别完成：检查 ${(data || []).length} 单，更新 ${updatedCount} 单`;
  await Promise.all([loadStats(), loadExceptions()]);
  if (document.querySelector('.subtab.active')?.dataset.adminSection === "rules") await loadRules();
  alert(`重新识别完成：检查 ${(data || []).length} 单，更新 ${updatedCount} 单。`);
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
              <td>${escapeHtml(batch.name)}</td><td>${escapeHtml(batch.file_names || "")}</td><td>${batch.total_rows || 0}</td><td>${batch.paid_rows || 0}</td><td>${batch.wash_rows || 0}</td><td>${batch.imported_orders || 0}</td><td>${batch.imported_items || 0}</td><td>${escapeHtml(formatDateTime(batch.created_at, true))}</td>
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
      <div class="exception-heading">
        <div>
          <h2>地址识别规则</h2>
          <p class="hint">规则既用于以后导入，也可以一键重新处理已经导入但尚未确认的订单。</p>
        </div>
        <button class="ghost" type="button" data-reprocess-orders>重新识别待确认订单</button>
      </div>
      <div class="rule-explainer">
        <strong>它的作用很简单：</strong>
        <ol>
          <li>导入 Excel 时，系统在“表单信息 + 收货地址”里查找关键词。</li>
          <li>只要地址包含关键词，就自动填入这条规则对应的学校、校区和楼栋。</li>
          <li>人工确认时选择“确认、记住并处理同类”，会立即修正相同写法的历史订单。</li>
        </ol>
        <p><strong>例：</strong>关键词“花溪校区17栋” → 师大 / 东区 / 17栋。</p>
      </div>
      <div class="rule-form">
        <label class="field-group">
          <span>地址关键词</span>
          <input id="ruleKeyword" class="input" placeholder="例如 花溪校区17栋" />
        </label>
        <label class="field-group">
          <span>识别为学校</span>
          <input id="ruleSchool" class="input" placeholder="例如 师大" />
        </label>
        <label class="field-group">
          <span>识别为校区</span>
          <input id="ruleCampus" class="input" placeholder="例如 东区" />
        </label>
        <label class="field-group">
          <span>识别为楼栋</span>
          <input id="ruleBuilding" class="input" placeholder="例如 17栋" />
        </label>
        <button id="addRuleBtn" type="button">新增规则</button>
      </div>
      <p class="hint rule-caution">关键词要尽量具体。不要只填“17栋”这类多个学校都可能出现的词，建议填“花溪校区17栋”。</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>关键词</th><th>学校</th><th>校区</th><th>楼栋</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>${rows.map((rule) => `
            <tr><td>${escapeHtml(rule.keyword)}</td><td>${escapeHtml(rule.school)}</td><td>${escapeHtml(canonicalCampusName(rule.campus, rule.school))}</td><td>${escapeHtml(rule.building)}</td><td>${rule.enabled === false ? "停用" : "启用"}</td><td><button class="ghost small danger" type="button" data-delete-rule="${rule.id}">删除</button></td></tr>
          `).join("") || '<tr><td colspan="6">暂无规则</td></tr>'}</tbody>
        </table>
      </div>
    </section>`;
  $("addRuleBtn")?.addEventListener("click", addRule);
}

async function addRule() {
  const keyword = text($("ruleKeyword").value);
  const school = text($("ruleSchool").value);
  const campus = canonicalCampusName($("ruleCampus").value, school);
  const building = text($("ruleBuilding").value);
  if (!keyword || !school || !campus || !building) return alert("关键词、学校、校区、楼栋都要填写");
  const validationMessage = validateRecognitionKeyword(keyword);
  if (validationMessage) return alert(validationMessage);
  const duplicate = recognitionRules.find((rule) => normalizeRecognitionText(rule.keyword) === normalizeRecognitionText(keyword));
  if (duplicate) return alert(`已经存在关键词“${duplicate.keyword}”，请直接使用或先删除旧规则。`);
  const { error } = await sb.from("recognition_rules").insert({ keyword, school, campus, building, created_by: currentProfile?.id || null });
  if (error) return alert(error.message);
  await loadRecognitionRules();
  let appliedCount = 0;
  try {
    appliedCount = await applyRuleToExistingOrders(keyword, { school, campus, building });
  } catch (applyError) {
    return alert(`规则已保存，但处理历史订单失败：${applyError.message || applyError}`);
  }
  alert(`规则已保存，并处理 ${appliedCount} 个同类历史订单。`);
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
  const campus = canonicalCampusName(order.campus, school) || "";
  const building = order.building || "";
  if (school === "理工" && campus.includes("一期")) return `理工一期:${building.replace("学生公寓一期", "")}`;
  if (school === "理工" && campus.includes("三期")) return `理工三期:${building.replace("学生公寓三期", "")}`;
  if (isTcmSchool(school) && /桂园/.test(building)) return `中医桂园:${building.replace("桂园", "")}`;
  if (isTcmSchool(school) && /杏园/.test(building)) return `中医杏园:${building.replace("杏园", "")}`;
  if (isTcmSchool(school) && /橘园/.test(building)) return `中医橘园:${building.replace("橘园", "")}`;
  if (isTcmSchool(school) && /桃园/.test(building)) return `中医桃园:${building.replace("桃园", "")}`;
  if (isTcmSchool(school)) return `中医${campus}:${building}`;
  return `${school}${campus}:${building}`;
}

function mixedChoiceWashLabel(productName, spec) {
  const compactSpec = text(spec).replace(/\s+/g, "");
  const specMatch = compactSpec.match(/^任选(\d{1,2}|[一二三四五六七八九十]{1,3})件$/);
  if (specMatch) return specMatch[0];
  const compactProduct = text(productName).replace(/\s+/g, "");
  if (!/衣鞋/.test(compactProduct)) return "";
  const productMatch = compactProduct.match(/任选(\d{1,2}|[一二三四五六七八九十]{1,3})件/);
  return productMatch ? productMatch[0] : "";
}

function washItemQuantity(spec) {
  const match = text(spec).replace(/\s+/g, "").match(/(\d{1,2}|[一二三四五六七八九十]{1,3})(双|件)/);
  return match ? `${match[1]}${match[2]}` : "";
}

function settlementSuggestionForActiveCatalog(key, reason) {
  if (selectableSettlementCategoryKey(key)) return { key, confident: true, reason };
  const definition = settlementCategoryDefinition(key);
  return {
    key: SETTLEMENT_OTHER,
    confident: false,
    reason: `${definition?.shortLabel || definition?.label || "识别结果"}当前未设为在售，请按其他品类补充实际名称和代工价`,
  };
}

function inferSettlementCategory(item) {
  const productName = text(item?.product_name);
  const spec = text(item?.spec);
  const source = `${productName} ${spec}`;
  const matches = new Set();
  const add = (key, pattern) => {
    if (pattern.test(source)) matches.add(key);
  };

  add("luxury_fur", /奢侈品|皮草/);
  add("tall_boot", /中高靴|中筒靴|高筒靴|长筒靴/);
  add("short_boot", /短靴|雪地靴|大黄靴|棉靴/);
  add("suede_shoe", /绒面|鹿皮|麂皮|翻毛皮?|反绒/);
  add("tshirt", /T恤|T桖|短袖|长袖|polo衫?/i);
  add("pants_skirt", /短裙|短裤|牛仔裤|休闲裤|普通西裤/);
  add("knit_shirt", /毛衣|卫衣|衬衫/);
  add("light_outerwear", /短夹克|薄外套|防晒衣|普通西装外套/);
  add("heavy_outerwear", /厚款|冲锋衣|风衣|羽绒服|棉服|毛呢大衣|羊毛大衣|羊绒大衣|呢子大衣/);
  add("dress_formal", /连衣裙|马面裙|普通礼服|礼服精洗/);
  add("regular_shoe", /普通材质鞋|普通鞋|休闲鞋|运动鞋|帆布鞋|板鞋|网面鞋|小白鞋|深度精洗/);

  const bundleLike = /衣鞋|组合|套餐|套装|四件套|限一件/.test(source);
  const genericAmbiguous = /特殊材质鞋靴|特殊鞋|薄款衣服|薄款衣物|春秋精洗/.test(source);
  if (genericAmbiguous) {
    return {
      key: SETTLEMENT_UNCONFIRMED,
      confident: false,
      reason: "商品名称覆盖多个结算品类，需要看实物确认",
    };
  }
  if (matches.size === 1 && !(bundleLike && !/^(?:【?秋冬精洗|厚款)/.test(productName))) {
    const key = [...matches][0];
    return settlementSuggestionForActiveCatalog(key, `明确命中“${settlementCategoryLabel(key, true)}”`);
  }
  if (!matches.size && /秋冬精洗/.test(source)) {
    return settlementSuggestionForActiveCatalog("heavy_outerwear", "秋冬精洗统一归入厚款衣物");
  }
  return {
    key: SETTLEMENT_UNCONFIRMED,
    confident: false,
    reason: bundleLike || matches.size > 1 ? "包含多个可能结算品类，需要看实物确认" : "未找到安全匹配规则",
  };
}

function resolvedSettlementCategory(item) {
  const storedKey = validSettlementCategoryKey(item?.settlement_category) ? text(item.settlement_category) : SETTLEMENT_UNCONFIRMED;
  const confirmed = Boolean(item?.settlement_category_confirmed && storedKey !== SETTLEMENT_UNCONFIRMED);
  const suggestion = inferSettlementCategory(item);
  return {
    key: storedKey !== SETTLEMENT_UNCONFIRMED ? storedKey : suggestion.key,
    storedKey,
    confirmed,
    suggestionKey: suggestion.key,
    suggestionReason: suggestion.reason,
    needsConfirmation: !confirmed,
    otherName: text(item?.settlement_other_name),
    otherUnit: text(item?.settlement_other_unit) === "双" ? "双" : "件",
    costSnapshot: item?.settlement_cost_snapshot === null || item?.settlement_cost_snapshot === undefined
      ? null
      : numberValue(item.settlement_cost_snapshot),
  };
}

function settlementDisplayLabel(item, short = false) {
  const resolved = resolvedSettlementCategory(item);
  const key = resolved.confirmed ? resolved.storedKey : resolved.suggestionKey;
  if (key === SETTLEMENT_OTHER && resolved.otherName) return `其他：${resolved.otherName}`;
  return settlementCategoryLabel(key, short);
}

function settlementDetailsAreValid(categoryKey, otherName = "", costValue = null) {
  if (!validSettlementCategoryKey(categoryKey)) return false;
  if (categoryKey !== SETTLEMENT_OTHER) return true;
  return Boolean(text(otherName)) && costValue !== "" && costValue !== null && costValue !== undefined && Number.isFinite(Number(costValue)) && Number(costValue) >= 0;
}

function washItemShortName(item) {
  const productName = text(item?.product_name);
  const spec = text(item?.spec);
  const mixedChoice = mixedChoiceWashLabel(productName, spec);
  if (mixedChoice) return mixedChoice;

  const source = `${productName} ${spec}`;
  const quantity = washItemQuantity(spec);
  let category = "";
  if (/薄款/.test(source)) category = "薄款";
  else if (/厚款|羽绒服|羊绒大衣|羊毛大衣|毛呢大衣|呢子大衣|冲锋衣/.test(source)) category = "厚款";
  else if (/特殊材质|特殊鞋|绒面|翻毛|鹿皮|麂皮|雪地靴|大黄靴|AJ|篮球鞋|高帮鞋|皮面|拼皮/.test(source)) category = "特殊鞋";
  else if (/普通鞋|运动鞋|球鞋|板鞋|网面鞋|帆布鞋|休闲鞋|小白鞋/.test(source)) category = "普通鞋";

  if (category && quantity) return `${category}${quantity}`;
  return spec || productName;
}

function washItemCategoryKey(item) {
  const shortName = washItemShortName(item);
  if (/^任选/.test(shortName)) return "mixed";
  if (/^普通鞋/.test(shortName)) return "normal_shoe";
  if (/^特殊鞋/.test(shortName)) return "special_shoe";
  if (/^薄款/.test(shortName)) return "thin";
  if (/^厚款/.test(shortName)) return "thick";
  return "other";
}

async function loadWashLabelRows(limit = 1000, batchDate = "") {
  const { data, error } = await sb.from("order_items").select("*, orders(*)").order("barcode", { ascending: true }).limit(limit);
  if (error) return { rows: [], error };
  const sortedItems = [...(data || [])].sort((left, right) => {
    const leftOrder = Array.isArray(left.orders) ? left.orders[0] || {} : left.orders || {};
    const rightOrder = Array.isArray(right.orders) ? right.orders[0] || {} : right.orders || {};
    return compareOrderRoute(leftOrder, rightOrder)
      || compareNaturalText(left.barcode, right.barcode);
  });
  const rows = sortedItems.map((item, index) => {
    const order = Array.isArray(item.orders) ? item.orders[0] || {} : item.orders || {};
    const itemBatchDate = businessBatchDateFromOrder(order);
    const settlement = resolvedSettlementCategory(item);
    return {
      序号: index + 1,
      条形编码: item.barcode || "",
      所属商家: order.merchant || "",
      姓名: order.customer_name || "",
      电话: order.phone || "",
      校区: washLabelCampus(order),
      物品: washItemShortName(item),
      实付款: order.paid_amount ?? "",
      下单时间: formatDateTime(order.order_time, true),
      售后电话: AFTER_SALES_PHONE,
      item_status: item.item_status || "",
      settlement_category: settlement.storedKey,
      settlement_selected_key: settlement.confirmed ? settlement.storedKey : settlement.suggestionKey,
      settlement_label: settlementDisplayLabel(item),
      settlement_confirmed: settlement.confirmed,
      settlement_suggestion: settlement.suggestionKey,
      settlement_suggestion_reason: settlement.suggestionReason,
      settlement_needs_confirmation: settlement.needsConfirmation,
      settlement_other_name: settlement.otherName,
      settlement_other_unit: settlement.otherUnit,
      settlement_cost_snapshot: settlement.costSnapshot,
      wash_decision: text(item.wash_decision) || WASH_DECISION_NORMAL,
      price_adjustment_type: text(item.price_adjustment_type) || "none",
      price_adjustment_amount: numberValue(item.price_adjustment_amount),
      wash_decision_reason: text(item.wash_decision_reason),
      wash_decision_note: text(item.wash_decision_note),
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
  await Promise.all([detectSettlementSchemaAvailability(), detectWashAdjustmentSchemaAvailability()]);
  const allResult = await loadWashLabelRows(5000);
  const rows = allResult.rows;
  const error = allResult.error;
  if (error) return setMessage("adminLabels", error.message, "warn");
  const batchDates = [...new Set(rows.map((row) => row.batch_date).filter(Boolean))].sort().reverse();
  const selectedBatch = $("washBatchSelect")?.value || batchDates[0] || currentBusinessBatchDate();
  const filteredRows = rows.filter((row) => row.batch_date === selectedBatch);
  labelReviewRows = filteredRows;
  labelVisibleRows = filteredRows;
  labelSelectedItems.clear();
  const confirmedCount = filteredRows.filter((row) => row.settlement_confirmed).length;
  const suggestedRows = filteredRows.filter((row) => !row.settlement_confirmed
    && selectableSettlementCategoryKey(row.settlement_suggestion)
    && row.settlement_suggestion !== SETTLEMENT_OTHER);
  const pendingCount = filteredRows.length - confirmedCount;
  $("adminLabels").innerHTML = `
    <section class="panel table-panel">
      <h2>水洗标管理</h2>
      <div class="toolbar wrap">
        <select id="washBatchSelect" class="input">
          ${batchDates.map((date) => `<option value="${escapeHtml(date)}" ${date === selectedBatch ? "selected" : ""}>${escapeHtml(date)} 批次（${escapeHtml(businessBatchLabel(date))}）</option>`).join("") || `<option value="${escapeHtml(selectedBatch)}">${escapeHtml(selectedBatch)} 批次</option>`}
        </select>
        <input id="labelSearch" class="input" placeholder="搜索水洗标、姓名、电话、校区" />
        <button id="confirmSuggestedSettlementBtn" class="ghost" type="button" ${settlementSchemaAvailable && suggestedRows.length ? "" : "disabled"}>确认系统建议（${suggestedRows.length}）</button>
      </div>
      <p class="hint">批次规则：昨天 18:00 之后到当天 18:00 之前付款/下单的订单，归为当天批次。</p>
      <div class="settlement-summary"><strong>结算品类：</strong><span class="success">已确认 ${confirmedCount}</span><span class="warn">待确认 ${pendingCount}</span></div>
      <div class="settlement-bulk-bar">
        <div class="settlement-bulk-copy">
          <strong>批量确认品类</strong>
          <span id="labelSelectedCount">已选 0 个水洗标</span>
          <small>不同物品可以分别修改，最后一次保存。</small>
        </div>
        <div class="settlement-bulk-actions">
          <button class="ghost small" type="button" data-select-label-pending ${pendingCount ? "" : "disabled"}>全选当前待确认</button>
          <button class="ghost small" type="button" data-clear-label-selection disabled>清空选择</button>
          <select id="labelBulkCategory" class="input settlement-bulk-select" ${settlementSchemaAvailable ? "" : "disabled"}>${settlementCategoryOptions()}</select>
          <button class="ghost small" type="button" data-apply-label-category disabled>应用到已选</button>
          <button class="primary small" type="button" data-save-label-selection disabled>保存已选</button>
        </div>
      </div>
      ${settlementSchemaAvailable ? "" : `<p class="warn">${escapeHtml(settlementMigrationMessage())}</p>`}
      ${washAdjustmentSchemaAvailable ? "" : `<p class="warn">${escapeHtml(washAdjustmentMigrationMessage())}</p>`}
      <div id="labelReviewMessage" aria-live="polite"></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>选择</th><th>条形编码</th><th>所属商家</th><th>姓名</th><th>电话</th><th>校区</th><th>物品</th><th>结算品类</th><th>确认状态</th><th>实付款</th><th>流转状态</th><th>操作</th></tr></thead>
          <tbody id="labelRows">${renderLabelRows(filteredRows)}</tbody>
        </table>
      </div>
    </section>`;
  $("washBatchSelect")?.addEventListener("change", loadLabels);
  $("confirmSuggestedSettlementBtn")?.addEventListener("click", () => confirmSuggestedSettlementCategories(suggestedRows));
  $("labelSearch")?.addEventListener("input", () => {
    const keyword = text($("labelSearch").value).toLowerCase();
    labelVisibleRows = filteredRows.filter((row) => JSON.stringify(row).toLowerCase().includes(keyword));
    labelSelectedItems.clear();
    $("labelRows").innerHTML = renderLabelRows(labelVisibleRows);
    updateLabelSelectionUi();
  });
}

function renderLabelRows(rows) {
  return rows.map((row) => `
    <tr data-label-row="${escapeHtml(row.id)}" class="${labelSelectedItems.has(row.id) ? "selected" : ""}">
      <td><label class="label-select-cell"><input type="checkbox" data-label-checkbox="${escapeHtml(row.id)}" ${labelSelectedItems.has(row.id) ? "checked" : ""} aria-label="选择水洗标 ${escapeHtml(row.条形编码)}" /></label></td>
      <td>${escapeHtml(row.条形编码)}</td><td>${escapeHtml(row.所属商家)}</td><td>${escapeHtml(row.姓名)}</td><td>${escapeHtml(row.电话)}</td><td>${escapeHtml(row.校区)}</td><td>${escapeHtml(row.物品)}</td>
      <td><div class="settlement-editor">
        <select class="input settlement-category-select" data-settlement-select="${escapeHtml(row.id)}" ${settlementSchemaAvailable ? "" : "disabled"}>${settlementCategoryOptions(row.settlement_selected_key)}</select>
        <div class="settlement-other-fields ${row.settlement_selected_key === SETTLEMENT_OTHER ? "" : "hidden"}" data-settlement-other-fields="${escapeHtml(row.id)}">
          <input class="input" data-settlement-other-name="${escapeHtml(row.id)}" value="${escapeHtml(row.settlement_other_name)}" placeholder="实际品类名称" maxlength="40" />
          <select class="input compact-input" data-settlement-other-unit="${escapeHtml(row.id)}"><option value="件" ${row.settlement_other_unit !== "双" ? "selected" : ""}>件</option><option value="双" ${row.settlement_other_unit === "双" ? "selected" : ""}>双</option></select>
          <input class="input compact-input" type="number" min="0" step="0.01" data-settlement-other-cost="${escapeHtml(row.id)}" value="${row.settlement_cost_snapshot ?? ""}" placeholder="代工价" />
        </div>
      </div></td>
      <td><div class="settlement-status-stack"><span class="settlement-status ${row.settlement_confirmed ? "confirmed" : validSettlementCategoryKey(row.settlement_suggestion) ? "suggested" : "pending"}" title="${escapeHtml(row.settlement_suggestion_reason || "")}">${row.settlement_confirmed ? "已确认" : validSettlementCategoryKey(row.settlement_suggestion) ? "系统建议，待确认" : "待人工选择"}</span>${row.wash_decision !== WASH_DECISION_NORMAL ? `<span class="wash-decision-badge ${escapeHtml(row.wash_decision)}">${escapeHtml(washDecisionLabel(row))}${row.price_adjustment_amount > 0 ? ` ¥${escapeHtml(row.price_adjustment_amount)}` : ""}</span>` : ""}</div></td>
      <td>${escapeHtml(row.实付款)}</td><td>${escapeHtml(row.item_status)}</td>
      <td><div class="actions compact"><button class="ghost small" type="button" data-select-label-order="${escapeHtml(row.order_id)}" ${settlementSchemaAvailable ? "" : "disabled"}>选择本单</button><button class="ghost small" type="button" data-save-settlement="${escapeHtml(row.id)}" ${settlementSchemaAvailable ? "" : "disabled"}>保存单项</button><button class="ghost small ${row.wash_decision === WASH_DECISION_RETURN_PENDING ? "danger" : ""}" type="button" data-wash-adjustment="${escapeHtml(row.id)}" ${washAdjustmentSchemaAvailable ? "" : "disabled"}>差价/退洗</button><button class="ghost small" type="button" data-detail="${row.order_id}">详情</button></div></td>
    </tr>`).join("") || '<tr><td colspan="12">暂无水洗标</td></tr>';
}

function updateLabelSelectionUi() {
  const selectedCount = labelSelectedItems.size;
  const count = $("labelSelectedCount");
  if (count) count.textContent = `已选 ${selectedCount} 个水洗标`;
  document.querySelectorAll("[data-label-checkbox]").forEach((checkbox) => {
    checkbox.checked = labelSelectedItems.has(checkbox.dataset.labelCheckbox);
    checkbox.closest("[data-label-row]")?.classList.toggle("selected", checkbox.checked);
  });
  document.querySelectorAll("[data-clear-label-selection], [data-apply-label-category], [data-save-label-selection]").forEach((control) => {
    control.disabled = !selectedCount || labelBulkSaveBusy || !settlementSchemaAvailable;
  });
}

function selectLabelOrder(orderId) {
  const pendingRows = labelVisibleRows.filter((row) => row.order_id === orderId && !row.settlement_confirmed);
  const rows = pendingRows.length ? pendingRows : labelVisibleRows.filter((row) => row.order_id === orderId);
  rows.forEach((row) => labelSelectedItems.add(row.id));
  updateLabelSelectionUi();
}

function selectVisiblePendingLabels() {
  labelVisibleRows.filter((row) => !row.settlement_confirmed).forEach((row) => labelSelectedItems.add(row.id));
  updateLabelSelectionUi();
}

function clearLabelSelection() {
  labelSelectedItems.clear();
  updateLabelSelectionUi();
}

function applyCategoryToSelectedLabels() {
  const categoryKey = $("labelBulkCategory")?.value || SETTLEMENT_UNCONFIRMED;
  if (!validSettlementCategoryKey(categoryKey)) return alert("请先选择要批量应用的结算品类");
  labelSelectedItems.forEach((itemId) => {
    const select = document.querySelector(`[data-settlement-select="${itemId}"]`);
    if (!select) return;
    select.value = categoryKey;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  setMessage("labelReviewMessage", `已将 ${labelSelectedItems.size} 个水洗标设为“${settlementCategoryLabel(categoryKey)}”，确认内容后点击“保存已选”。`, "hint");
}

function settlementValuesFromRow(itemId) {
  const categoryKey = document.querySelector(`[data-settlement-select="${itemId}"]`)?.value || SETTLEMENT_UNCONFIRMED;
  return {
    itemId,
    categoryKey,
    details: {
      otherName: document.querySelector(`[data-settlement-other-name="${itemId}"]`)?.value || "",
      otherUnit: document.querySelector(`[data-settlement-other-unit="${itemId}"]`)?.value || "件",
      cost: document.querySelector(`[data-settlement-other-cost="${itemId}"]`)?.value ?? null,
    },
  };
}

async function saveSelectedSettlementCategories() {
  if (labelBulkSaveBusy || !labelSelectedItems.size) return;
  const entries = [...labelSelectedItems].map(settlementValuesFromRow);
  const invalidEntry = entries.find((entry) => !validSettlementCategoryKey(entry.categoryKey)
    || !settlementDetailsAreValid(entry.categoryKey, entry.details.otherName, entry.details.cost));
  if (invalidEntry) {
    const row = labelReviewRows.find((entry) => entry.id === invalidEntry.itemId);
    return alert(`${row?.条形编码 || "所选水洗标"} 的结算品类信息不完整，请先补充后再保存`);
  }
  labelBulkSaveBusy = true;
  updateLabelSelectionUi();
  setMessage("labelReviewMessage", `正在保存 ${entries.length} 个水洗标的结算品类...`, "hint");
  let succeeded = 0;
  let failed = 0;
  for (let index = 0; index < entries.length; index += 15) {
    const group = entries.slice(index, index + 15);
    const results = await Promise.all(group.map((entry) => persistSettlementCategory(entry.itemId, entry.categoryKey, entry.details)));
    results.forEach((result) => {
      if (result.error) failed += 1;
      else succeeded += 1;
    });
  }
  labelBulkSaveBusy = false;
  await loadLabels();
  setMessage("labelReviewMessage", failed ? `已保存 ${succeeded} 个，失败 ${failed} 个，请重新选择后重试。` : `已一次保存 ${succeeded} 个水洗标的结算品类。`, failed ? "warn" : "success");
}

function washAdjustmentOptionHtml(row) {
  return WASH_DECISION_OPTIONS
    .filter((option) => option.key !== WASH_DECISION_RETURNED || row.wash_decision === WASH_DECISION_RETURNED)
    .map((option) => `<option value="${option.key}" ${row.wash_decision === option.key ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
    .join("");
}

function updateWashAdjustmentDialogUi() {
  const decision = $("washAdjustmentDecision")?.value || WASH_DECISION_NORMAL;
  const definition = washDecisionDefinition(decision);
  const adjustmentFields = $("washAdjustmentFields");
  adjustmentFields?.classList.toggle("hidden", definition.adjustmentType === "none");
  if ($("washAdjustmentAmountLabel")) {
    $("washAdjustmentAmountLabel").textContent = definition.adjustmentType === "refund" ? "应退金额（元）" : "应补金额（元）";
  }
  if ($("washAdjustmentReasonLabel")) {
    $("washAdjustmentReasonLabel").textContent = definition.adjustmentType === "refund" ? "退洗原因" : "补差原因";
  }
  if ($("washAdjustmentHelp")) {
    $("washAdjustmentHelp").textContent = decision === WASH_DECISION_RETURN_PENDING
      ? "保存后该水洗标标记为不清洗；工厂出库后会作为单件退洗物品送回。"
      : decision === WASH_DECISION_SUPPLEMENT_PENDING
        ? "待客户确认并完成补差前，系统禁止该水洗标出库。"
        : decision === WASH_DECISION_SUPPLEMENT_CONFIRMED
          ? "补差已确认，可继续清洗和正常出库。"
          : "该水洗标按当前结算品类正常清洗。";
  }
}

function openWashAdjustmentDialog(itemId) {
  if (!washAdjustmentSchemaAvailable) return alert(washAdjustmentMigrationMessage());
  const row = labelReviewRows.find((entry) => entry.id === itemId);
  if (!row) return alert("没有找到这个水洗标");
  $("orderDialogTitle").textContent = "单个水洗标差价 / 退洗";
  $("orderDialogBody").innerHTML = `
    <div class="wash-adjustment-summary">
      <strong>${escapeHtml(row.条形编码)}</strong>
      <span>${escapeHtml(row.姓名)} · ${escapeHtml(row.电话)}</span>
      <span>${escapeHtml(row.物品)} · ${escapeHtml(row.校区)}</span>
    </div>
    <label class="field-group" for="washAdjustmentDecision">
      <span>处理方式</span>
      <select id="washAdjustmentDecision" class="input">${washAdjustmentOptionHtml(row)}</select>
    </label>
    <div id="washAdjustmentFields" class="wash-adjustment-fields">
      <label class="field-group" for="washAdjustmentAmount">
        <span id="washAdjustmentAmountLabel">差价金额（元）</span>
        <input id="washAdjustmentAmount" class="input" type="number" min="0.01" step="0.01" value="${row.price_adjustment_amount > 0 ? escapeHtml(row.price_adjustment_amount) : ""}" placeholder="请输入金额" />
      </label>
      <label class="field-group" for="washAdjustmentReason">
        <span id="washAdjustmentReasonLabel">处理原因</span>
        <input id="washAdjustmentReason" class="input" value="${escapeHtml(row.wash_decision_reason)}" maxlength="80" placeholder="例如：实际为绒面鞋，客户不同意补差" />
      </label>
    </div>
    <label class="field-group" for="washAdjustmentNote">
      <span>客服沟通备注</span>
      <textarea id="washAdjustmentNote" class="input" rows="3" maxlength="300" placeholder="记录客户确认结果、退款方式等">${escapeHtml(row.wash_decision_note)}</textarea>
    </label>
    <p id="washAdjustmentHelp" class="hint"></p>
    <div id="washAdjustmentMessage" aria-live="polite"></div>
    <div class="actions wash-adjustment-actions"><button type="button" data-save-wash-adjustment="${escapeHtml(itemId)}">保存处理结果</button><button class="ghost" type="button" data-close-wash-adjustment>取消</button></div>`;
  $("washAdjustmentDecision")?.addEventListener("change", updateWashAdjustmentDialogUi);
  updateWashAdjustmentDialogUi();
  $("orderDialog").showModal();
}

async function saveWashAdjustment(itemId) {
  if (!washAdjustmentSchemaAvailable) return setMessage("washAdjustmentMessage", washAdjustmentMigrationMessage(), "warn");
  const row = labelReviewRows.find((entry) => entry.id === itemId);
  const decision = $("washAdjustmentDecision")?.value || WASH_DECISION_NORMAL;
  const definition = washDecisionDefinition(decision);
  const amount = definition.adjustmentType === "none" ? 0 : Number($("washAdjustmentAmount")?.value);
  const reason = definition.adjustmentType === "none" ? "" : text($("washAdjustmentReason")?.value);
  const note = text($("washAdjustmentNote")?.value);
  if (definition.adjustmentType !== "none" && (!Number.isFinite(amount) || amount <= 0)) {
    return setMessage("washAdjustmentMessage", "请填写正确的补差或退款金额。", "warn");
  }
  if (definition.adjustmentType !== "none" && !reason) {
    return setMessage("washAdjustmentMessage", "请填写补差或退洗原因。", "warn");
  }
  if (decision === WASH_DECISION_RETURN_PENDING && ["已出库", "配送中", "已送达"].includes(row?.item_status)) {
    return setMessage("washAdjustmentMessage", "该物品已经出库，不能再改为待退洗。", "warn");
  }
  setMessage("washAdjustmentMessage", "正在保存处理结果...", "hint");
  const settlementValues = settlementValuesFromRow(itemId);
  if (validSettlementCategoryKey(settlementValues.categoryKey)
    && settlementDetailsAreValid(settlementValues.categoryKey, settlementValues.details.otherName, settlementValues.details.cost)) {
    const settlementResult = await persistSettlementCategory(itemId, settlementValues.categoryKey, settlementValues.details);
    if (settlementResult.error) return setMessage("washAdjustmentMessage", `结算品类保存失败：${settlementResult.error.message}`, "warn");
  }
  const updatedAt = new Date().toISOString();
  const { error } = await sb.from("order_items").update({
    wash_decision: decision,
    price_adjustment_type: definition.adjustmentType,
    price_adjustment_amount: amount,
    wash_decision_reason: reason,
    wash_decision_note: note,
    wash_decision_updated_by: currentProfile?.id || null,
    wash_decision_updated_at: updatedAt,
    updated_at: updatedAt,
  }).eq("id", itemId);
  if (error) return setMessage("washAdjustmentMessage", `保存失败：${error.message}`, "warn");
  const logStatus = definition.adjustmentType === "refund" ? "退洗" : definition.adjustmentType === "supplement" ? "补差" : "正常洗护";
  await insertLog({
    orderId: row?.order_id,
    itemId,
    barcode: row?.条形编码,
    status: logStatus,
    note: `${definition.label}${amount > 0 ? `，金额 ¥${amount.toFixed(2)}` : ""}${reason ? `，原因：${reason}` : ""}${note ? `，备注：${note}` : ""}`,
  });
  $("orderDialog").close();
  await loadLabels();
  setMessage("labelReviewMessage", `${row?.条形编码 || "水洗标"} 已标记为“${definition.label}”。`, "success");
}

async function persistSettlementCategory(itemId, categoryKey, details = {}) {
  if (!settlementSchemaAvailable) return { error: new Error(settlementMigrationMessage()) };
  if (!validSettlementCategoryKey(categoryKey)) return { error: new Error("请先选择结算品类") };
  const definition = settlementCategoryDefinition(categoryKey);
  const otherName = categoryKey === SETTLEMENT_OTHER ? text(details.otherName) : "";
  const otherUnit = categoryKey === SETTLEMENT_OTHER
    ? (text(details.otherUnit) === "双" ? "双" : "件")
    : (definition?.unit === "双" ? "双" : "件");
  const rawCost = categoryKey === SETTLEMENT_OTHER ? details.cost : (details.cost ?? definition?.costPrice);
  const costSnapshot = rawCost === "" || rawCost === null || rawCost === undefined ? null : Number(rawCost);
  if (!settlementDetailsAreValid(categoryKey, otherName, costSnapshot)) {
    return { error: new Error("其他品类必须填写实际名称和代工价") };
  }
  return sb.from("order_items").update({
    settlement_category: categoryKey,
    settlement_category_confirmed: true,
    settlement_other_name: otherName,
    settlement_other_unit: otherUnit,
    settlement_cost_snapshot: Number.isFinite(costSnapshot) ? costSnapshot : null,
    settlement_category_updated_by: currentProfile?.id || null,
    settlement_category_updated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", itemId);
}

async function saveSettlementCategoryFromRow(itemId) {
  const { categoryKey, details } = settlementValuesFromRow(itemId);
  if (!validSettlementCategoryKey(categoryKey)) return alert("请先选择结算品类");
  if (!settlementDetailsAreValid(categoryKey, details.otherName, details.cost)) {
    return alert("选择“其他品类”后，请填写实际品类名称和代工价");
  }
  setMessage("labelReviewMessage", "正在保存结算品类...", "hint");
  const { error } = await persistSettlementCategory(itemId, categoryKey, details);
  if (error) return setMessage("labelReviewMessage", `保存失败：${error.message}`, "warn");
  await loadLabels();
  setMessage("labelReviewMessage", `结算品类已保存为“${settlementCategoryLabel(categoryKey)}”。`, "success");
}

async function confirmSuggestedSettlementCategories(rows) {
  const pendingRows = rows.filter((row) => !row.settlement_confirmed
    && selectableSettlementCategoryKey(row.settlement_suggestion)
    && row.settlement_suggestion !== SETTLEMENT_OTHER);
  if (!pendingRows.length) return;
  setMessage("labelReviewMessage", `正在确认 ${pendingRows.length} 个系统建议...`, "hint");
  let succeeded = 0;
  let failed = 0;
  for (let index = 0; index < pendingRows.length; index += 15) {
    const group = pendingRows.slice(index, index + 15);
    const results = await Promise.all(group.map((row) => persistSettlementCategory(row.id, row.settlement_suggestion)));
    results.forEach((result) => {
      if (result.error) failed += 1;
      else succeeded += 1;
    });
  }
  await loadLabels();
  setMessage("labelReviewMessage", failed ? `已确认 ${succeeded} 个，失败 ${failed} 个，请逐项重试。` : `已确认 ${succeeded} 个系统建议。`, failed ? "warn" : "success");
}

async function exportWashLabels() {
  if (!requireClient()) return;
  if (!currentUser) return alert("请先登录后台账号");
  await ensureXlsx();
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
    结算品类: row.settlement_label,
    结算确认状态: row.settlement_confirmed ? "已确认" : "待确认",
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
  const canEditItemStatus = APP_MODE === "admin" && currentProfile?.role === "admin";
  const canEditAddress = canEditItemStatus;
  $("orderDialogTitle").textContent = `订单详情：${order.order_no}`;
  $("orderDialogBody").innerHTML = `
    <section class="panel">
      <h3>${escapeHtml(order.customer_name)} · ${escapeHtml(order.phone)}</h3>
      <p>${escapeHtml(order.address || "")}</p>
      <p>宿舍：${escapeHtml(`${order.school || ""}${orderCampusName(order)}${order.building || ""}`)}</p>
      <p>状态：${escapeHtml(order.order_status || "")}　金额：${escapeHtml(order.paid_amount ?? "")}</p>
      ${order.exception_note ? `<p class="warn">异常：${escapeHtml(order.exception_note)}</p>` : ""}
      ${canEditAddress ? `<details class="order-address-editor">
        <summary>编辑订单地址</summary>
        <div class="edit-grid order-address-grid">
          <label class="field-group order-address-full"><span>完整地址</span><input class="input" data-detail-address="${escapeHtml(order.id)}" value="${escapeHtml(order.address || "")}" placeholder="完整收货地址" /></label>
          <label class="field-group"><span>学校</span><input class="input" data-detail-school="${escapeHtml(order.id)}" value="${escapeHtml(order.school || "")}" placeholder="学校" /></label>
          <label class="field-group"><span>校区</span><input class="input" data-detail-campus="${escapeHtml(order.id)}" value="${escapeHtml(orderCampusName(order))}" placeholder="校区" /></label>
          <label class="field-group"><span>楼栋 / 地点</span><input class="input" data-detail-building="${escapeHtml(order.id)}" value="${escapeHtml(order.building || "")}" placeholder="楼栋或固定取件地点" /></label>
        </div>
        <div class="actions"><button type="button" data-save-order-address="${escapeHtml(order.id)}">保存地址</button></div>
        <div data-order-address-message="${escapeHtml(order.id)}" aria-live="polite"></div>
      </details>` : ""}
    </section>
    <section class="panel table-panel">
      <h3>物品 / 水洗标</h3>
      ${canEditItemStatus ? '<p class="hint">这里修改只影响当前水洗标；整单状态会按该订单下所有水洗标的最慢进度自动汇总。</p>' : ""}
      <div class="table-wrap"><table><thead><tr><th>水洗标</th><th>商品</th><th>规格</th><th>结算品类</th><th>状态</th><th>图片</th>${canEditItemStatus ? "<th>操作</th>" : ""}</tr></thead><tbody>${(itemResult.data || []).map((item) => `<tr><td>${escapeHtml(item.barcode)}</td><td>${escapeHtml(item.product_name)}</td><td>${escapeHtml(item.spec)}</td><td>${escapeHtml(settlementDisplayLabel(item))}${resolvedSettlementCategory(item).confirmed ? "" : "（待确认）"}</td><td>${canEditItemStatus ? `<select class="input compact-input" data-order-item-status="${escapeHtml(item.id)}" data-order-id="${escapeHtml(order.id)}" data-item-barcode="${escapeHtml(item.barcode)}">${item.item_status === "待补取" ? '<option value="待补取" selected disabled>待补取（由补取任务控制）</option>' : ""}${ITEM_EDITABLE_STATUSES.map((status) => `<option value="${escapeHtml(status)}" ${status === item.item_status ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}</select>` : escapeHtml(item.item_status)}</td><td>${item.image_links ? `<a href="${escapeHtml(item.image_links.split("\n")[0])}" target="_blank">查看</a>` : ""}</td>${canEditItemStatus ? `<td>${["待取件", "未找到", "待补取", "已取件"].includes(item.item_status) ? `<button class="ghost small-btn" type="button" data-schedule-retry-item="${escapeHtml(item.id)}" data-retry-order="${escapeHtml(order.id)}">安排补取</button>` : "—"}</td>` : ""}</tr>`).join("")}</tbody></table></div>
    </section>
    <section class="panel">
      <h3>状态时间线</h3>
      <ul class="timeline">${(logResult.data || []).map((log) => `<li><strong>${escapeHtml(log.status)}</strong><span>${escapeHtml(formatDateTime(log.created_at, true))}</span><p>${escapeHtml(log.note || "")}</p></li>`).join("") || "<li>暂无记录</li>"}</ul>
    </section>`;
  if (!$("orderDialog").open) $("orderDialog").showModal();
}

async function saveOrderAddressFromDialog(orderId) {
  if (APP_MODE !== "admin" || currentProfile?.role !== "admin") return;
  const address = text(document.querySelector(`[data-detail-address="${orderId}"]`)?.value);
  const school = text(document.querySelector(`[data-detail-school="${orderId}"]`)?.value);
  const campus = canonicalCampusName(document.querySelector(`[data-detail-campus="${orderId}"]`)?.value, school);
  const building = text(document.querySelector(`[data-detail-building="${orderId}"]`)?.value);
  const messageTarget = document.querySelector(`[data-order-address-message="${orderId}"]`);
  if (!address || !school || !campus || !building || /未识别/.test(`${school}${campus}${building}`)) {
    if (messageTarget) messageTarget.innerHTML = '<p class="warn">请填写完整地址、学校、校区和楼栋 / 地点。</p>';
    return;
  }
  const saveButton = document.querySelector(`[data-save-order-address="${orderId}"]`);
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = "保存中…";
  }
  const { data: currentOrder, error: readError } = await sb.from("orders").select("exception_note").eq("id", orderId).maybeSingle();
  if (readError) {
    if (messageTarget) messageTarget.innerHTML = `<p class="warn">读取订单失败：${escapeHtml(readError.message)}</p>`;
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = "保存地址";
    }
    return;
  }
  const now = new Date().toISOString();
  const { error } = await sb.from("orders").update({
    address,
    school,
    campus,
    building,
    exception_note: cleanRecognitionNote(currentOrder?.exception_note || ""),
    updated_at: now,
  }).eq("id", orderId);
  if (error) {
    if (messageTarget) messageTarget.innerHTML = `<p class="warn">保存失败：${escapeHtml(error.message)}</p>`;
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = "保存地址";
    }
    return;
  }
  await insertLog({ orderId, status: "后台编辑地址", note: `${school}/${campus}/${building}；${address}` });
  await refreshAll();
  await showOrderDetail(orderId);
  const refreshedMessage = document.querySelector(`[data-order-address-message="${orderId}"]`);
  if (refreshedMessage) refreshedMessage.innerHTML = '<p class="success">地址已保存，并同步到取件、配送和水洗标显示。</p>';
}

function matchSearch(content) {
  const keyword = text($("courierSearch")?.value).toLowerCase();
  return !keyword || content.toLowerCase().includes(keyword);
}

function smsComposeHref(phone, message) {
  const smsSeparator = /iPad|iPhone|iPod/i.test(navigator.userAgent) ? "&" : "?";
  return `sms:${escapeHtml(phone)}${smsSeparator}body=${encodeURIComponent(message)}`;
}

function contactButtons(phone, message, smsLabel = "发短信") {
  return `<div class="actions"><a class="button-link" href="tel:${escapeHtml(phone)}">打电话</a><a class="button-link" href="${smsComposeHref(phone, message)}">${escapeHtml(smsLabel)}</a></div>`;
}

function areaLabel(value, fallback) {
  return text(value) || fallback;
}

function compareNaturalText(left, right) {
  return text(left).localeCompare(text(right), "zh-CN", { numeric: true, sensitivity: "base" });
}

function orderRouteParts(order = {}) {
  return {
    school: areaLabel(order.school, "学校未识别"),
    campus: areaLabel(orderCampusName(order), "校区未识别"),
    building: areaLabel(order.building, "楼栋未识别"),
  };
}

function orderRouteKey(order = {}) {
  const route = orderRouteParts(order);
  return [route.school, route.campus, route.building].map(encodeURIComponent).join("|");
}

function compareOrderRoute(leftOrder = {}, rightOrder = {}) {
  const left = orderRouteParts(leftOrder);
  const right = orderRouteParts(rightOrder);
  return compareNaturalText(left.school, right.school)
    || compareNaturalText(left.campus, right.campus)
    || compareNaturalText(left.building, right.building);
}

function sortedOrderItems(order = {}) {
  return [...(Array.isArray(order.order_items) ? order.order_items : [])]
    .sort((left, right) => compareNaturalText(left.barcode, right.barcode));
}

function firstOrderBarcode(order = {}) {
  return sortedOrderItems(order)[0]?.barcode || "";
}

function comparePickupRecords(left, right) {
  const leftOrder = left.order || {};
  const rightOrder = right.order || {};
  return compareOrderRoute(leftOrder, rightOrder)
    || Number(Boolean(right.isRetry)) - Number(Boolean(left.isRetry))
    || compareNaturalText(left.task?.pickup_date, right.task?.pickup_date)
    || compareNaturalText(left.items?.[0]?.barcode || firstOrderBarcode(leftOrder), right.items?.[0]?.barcode || firstOrderBarcode(rightOrder))
    || compareNaturalText(leftOrder.order_no, rightOrder.order_no)
    || compareNaturalText(leftOrder.customer_name, rightOrder.customer_name);
}

function pickupAreaAfterCurrent(areas) {
  if (!areas.length) return null;
  const current = courierActivePickupAreaKey.split("|").map((value) => {
    try {
      return decodeURIComponent(value);
    } catch (_) {
      return value;
    }
  });
  if (current.length !== 3) return areas[0];
  const next = areas.find((area) => {
    const schoolComparison = compareNaturalText(area.school, current[0]);
    if (schoolComparison) return schoolComparison > 0;
    const campusComparison = compareNaturalText(area.campus, current[1]);
    if (campusComparison) return campusComparison > 0;
    return compareNaturalText(area.building, current[2]) > 0;
  });
  return next || areas[0];
}

function ensureCourierActivePickupArea(areas) {
  if (!areas.length) {
    courierActivePickupAreaKey = "";
    return null;
  }
  const active = areas.find((area) => area.key === courierActivePickupAreaKey) || pickupAreaAfterCurrent(areas);
  courierActivePickupAreaKey = active.key;
  return active;
}

function pickupAreaLabel(area) {
  return `${area.school} / ${area.campus} / ${area.building}`;
}

function collectOrderImages(order) {
  const items = Array.isArray(order.order_items) ? order.order_items : [];
  return [...new Set(items.flatMap((item) => text(item.image_links).split(/[\n,，\s]+/).filter((url) => /^https?:\/\//i.test(url))))];
}

function previewButton(key, images) {
  if (!images.length) return "";
  imagePreviewMap.set(key, images);
  return `<button class="ghost" type="button" data-preview-images="${escapeHtml(key)}">看图片</button>`;
}

function ensureImageDialog() {
  let dialog = $("imagePreviewDialog");
  if (dialog) return dialog;
  dialog = document.createElement("dialog");
  dialog.id = "imagePreviewDialog";
  dialog.className = "modal image-modal";
  dialog.innerHTML = `
    <div class="modal-head">
      <h2>图片预览</h2>
      <button id="closeImagePreviewBtn" class="ghost" type="button">关闭</button>
    </div>
    <div id="imagePreviewBody" class="image-preview-body"></div>`;
  document.body.appendChild(dialog);
  $("closeImagePreviewBtn").addEventListener("click", () => dialog.close());
  return dialog;
}

function showImagePreview(key) {
  const images = imagePreviewMap.get(key) || [];
  if (!images.length) return alert("这个订单暂无图片");
  const dialog = ensureImageDialog();
  $("imagePreviewBody").innerHTML = `
    <p class="hint">单击查看缩略图，双击图片可在新窗口放大。</p>
    <div class="image-preview-grid">
      ${images.map((url, index) => `<img src="${escapeHtml(url)}" alt="订单图片 ${index + 1}" data-full-image="${escapeHtml(url)}" loading="lazy" />`).join("")}
    </div>`;
  dialog.showModal();
}

function selectedCourierPickupDate() {
  return $("courierPickupDate")?.value || "";
}

function resetCourierPickupDate() {
  courierDashboardFilter = "";
  courierActivePickupAreaKey = "";
  const input = $("courierPickupDate");
  if (input) input.value = "";
  loadCourierTasks();
}

async function loadCourierTasks() {
  const [pickup, retries, returns] = await Promise.all([
    sb
      .from("pickup_tasks")
      .select("*, orders(*, order_items(id,barcode,image_links,product_name,spec,item_status))")
      .order("pickup_date", { ascending: true })
      .limit(800),
    retryPickupSchemaAvailable
      ? sb.from("pickup_retry_tasks").select("*, order_items(id,order_id,barcode,image_links,product_name,spec,item_status,orders(*))").order("pickup_date", { ascending: true }).limit(800)
      : Promise.resolve({ data: [], error: null }),
    sb.from("return_tasks").select("*, order_items(*, orders(*))").order("outbound_date", { ascending: false }),
  ]);
  let pickupRows = pickup.data || [];
  let retryRows = retries.data || [];
  let returnRows = returns.data || [];
  let activeLabel = "";
  if (courierDashboardFilter === "pickup-today") {
    pickupRows = pickupRows.filter((task) => PICKUP_OPEN_STATUSES.has(text(task.status)));
    retryRows = retryRows.filter((task) => RETRY_PICKUP_OPEN_STATUSES.has(text(task.status)));
    returnRows = [];
    activeLabel = "驾驶舱筛选：全部未完成取件";
  } else if (courierDashboardFilter === "pending-return") {
    pickupRows = [];
    retryRows = [];
    returnRows = returnRows.filter((task) => task.status === "待送回");
    activeLabel = "驾驶舱筛选：待送回";
  }
  renderActiveFilter("courierActiveFilter", activeLabel, "courier");
  courierPickupTaskRows = pickup.error ? [] : pickupRows;
  courierRetryTaskRows = retries.error ? [] : retryRows;
  courierReturnTaskRows = returns.error ? [] : returnRows;
  renderCourierRouteTasks();
}

function renderPickupCard(record, processed = false) {
  const { task, order, isRetry } = record;
  const sms = `【事事通】同学您好，事事洗护今晚将到${order.school || ""}${orderCampusName(order)}${order.building || ""}取件，请把衣物/鞋子装袋并放好姓名电话纸条。`;
  const images = collectOrderImages(order);
  const previewKey = `pickup-${task.id}`;
  if (images.length) imagePreviewMap.set(previewKey, images);
  const items = record.items || sortedOrderItems(order);
  const isBusy = courierPickupBusyTaskId === task.id;
  const processedClass = task.status === "已取件" ? "done" : task.status === "异常" || task.status === "未找到" ? "alert" : "";
  return `<article class="task-card pickup-task-card courier-route-card courier-pickup-card ${processedClass}" data-pickup-card="${escapeHtml(task.id)}" data-route-task-card="pickup-${escapeHtml(task.id)}" ${isBusy ? 'aria-busy="true"' : ""}>
    <div class="card-head"><h3>${escapeHtml(order.customer_name)} · ${escapeHtml(order.phone)}</h3><span>${escapeHtml(isBusy ? "提交中…" : task.status)}</span></div>
    <p class="pickup-card-route">${isRetry ? `<b class="pickup-retry-tag">补取第 ${escapeHtml(task.attempt_no || 1)} 次</b>　${escapeHtml(task.pickup_date || "")}` : `本单 ${items.length} 件`}</p>
    <div class="courier-card-address courier-pickup-address"><span>取件地址</span><p>${escapeHtml(order.address || "未填写完整地址")}</p></div>
    <ul class="courier-item-list pickup-label-list">${items.map((item) => `<li><strong>${escapeHtml(item.barcode || "无条码")}</strong><span>${escapeHtml(item.spec || item.product_name || "物品未填写")}</span><em>${escapeHtml(item.item_status || task.status)}</em></li>`).join("") || "<li><span>该订单尚未生成水洗标</span></li>"}</ul>
    ${order.exception_note ? `<p class="warn">备注：${escapeHtml(order.exception_note)}</p>` : ""}
    <div class="pickup-primary-tools">
      ${images.length ? `<button class="pickup-photo-button" type="button" data-preview-images="${escapeHtml(previewKey)}">看图片（${images.length}）</button>` : '<button class="ghost pickup-photo-button" type="button" disabled>暂无图片</button>'}
      <button class="ghost" type="button" data-detail="${escapeHtml(order.id)}">订单详情</button>
    </div>
    <details class="pickup-card-detail"><summary>查看订单号</summary><p>订单号：${escapeHtml(order.order_no || "")}</p></details>
    ${contactButtons(order.phone || "", sms)}
    ${processed ? "" : isRetry
      ? `<div class="actions pickup-status-actions"><button type="button" data-retry-pickup="${escapeHtml(task.id)}" data-item="${escapeHtml(items[0]?.id || "")}" data-order="${escapeHtml(order.id)}" data-status="已补取" ${isBusy ? "disabled" : ""}>补取完成</button><button class="ghost" type="button" data-retry-pickup="${escapeHtml(task.id)}" data-item="${escapeHtml(items[0]?.id || "")}" data-order="${escapeHtml(order.id)}" data-status="未找到" ${isBusy ? "disabled" : ""}>未找到</button><button class="ghost" type="button" data-reschedule-retry="${escapeHtml(task.id)}" ${isBusy ? "disabled" : ""}>改约</button><button class="ghost danger" type="button" data-report-pickup-exception="${escapeHtml(task.id)}" ${isBusy ? "disabled" : ""}>上报异常</button></div>`
      : `<div class="actions pickup-status-actions"><button type="button" data-pickup="${escapeHtml(task.id)}" data-order="${escapeHtml(order.id)}" data-status="已取件" ${isBusy ? "disabled" : ""}>已取到</button><button class="ghost" type="button" data-pickup="${escapeHtml(task.id)}" data-order="${escapeHtml(order.id)}" data-status="未找到" ${isBusy ? "disabled" : ""}>未找到</button><button class="ghost danger" type="button" data-report-pickup-exception="${escapeHtml(task.id)}" ${isBusy ? "disabled" : ""}>上报异常</button></div>`}
  </article>`;
}

function selectCourierPickupArea(areaKey) {
  courierActivePickupAreaKey = areaKey;
  renderCourierRouteTasks();
  requestAnimationFrame(() => {
    document.querySelector(".courier-route-area.active")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function aggregateCourierReturnOrders(records) {
  const groups = new Map();
  records.forEach((record) => {
    const key = text(record.order.id || record.task.id);
    if (!groups.has(key)) groups.set(key, { key, order: record.order, records: [] });
    groups.get(key).records.push(record);
  });
  return [...groups.values()].map((group) => {
    const statuses = group.records.map((record) => record.task.status);
    group.status = statuses.every((status) => status === "已送达")
      ? "已送达"
      : statuses.includes("异常")
        ? "异常"
        : statuses.includes("配送中") || statuses.includes("已送达")
          ? "配送中"
          : "待送回";
    return group;
  });
}

const COURIER_RETURN_FINISHED_STATUSES = new Set(["已送达", "异常"]);

function courierLocalDate(value) {
  const date = parseDate(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function courierReturnRecordFinished(record) {
  return COURIER_RETURN_FINISHED_STATUSES.has(text(record?.task?.status));
}

function courierReturnGroupHasPending(group) {
  return group.records.some((record) => !courierReturnRecordFinished(record));
}

function courierReturnGroupFinishedOnDate(group, dateText) {
  return group.records.some(({ task }) => task.outbound_date === dateText || courierLocalDate(task.updated_at) === dateText);
}

function courierPickupRecordOpen(record) {
  return record.isRetry
    ? RETRY_PICKUP_OPEN_STATUSES.has(text(record.task?.status))
    : PICKUP_OPEN_STATUSES.has(text(record.task?.status));
}

function courierPickupRecordDue(record) {
  const dueDate = text(record.task?.pickup_date);
  return !dueDate || dueDate <= todayDate();
}

function courierPickupRecordFinishedOnDate(record, dateText) {
  return record.task?.pickup_date === dateText || courierLocalDate(record.task?.updated_at) === dateText;
}

function filteredCourierPickupRecords(tasks = courierPickupTaskRows, retryTasks = courierRetryTaskRows) {
  const normalRecords = tasks.filter((task) => {
    const order = task.orders || {};
    const items = sortedOrderItems(order);
    return matchSearch(`${order.customer_name} ${order.phone} ${order.school} ${order.campus} ${orderCampusName(order)} ${order.building} ${order.address} ${order.order_no} ${items.map((item) => `${item.barcode} ${item.product_name} ${item.spec}`).join(" ")}`);
  }).map((task) => ({ task, order: task.orders || {}, items: sortedOrderItems(task.orders || {}), isRetry: false }));
  const retryRecords = retryTasks.map((task) => {
    const item = relationOne(task.order_items);
    const order = relationOne(item.orders);
    return { task, order, item, items: [item], isRetry: true };
  }).filter(({ task, item, order }) => matchSearch(`${task.reason || ""} ${item.barcode || ""} ${item.product_name || ""} ${item.spec || ""} ${order.order_no || ""} ${order.customer_name || ""} ${order.phone || ""} ${order.school || ""} ${orderCampusName(order)} ${order.building || ""} ${order.address || ""}`));
  return normalRecords.concat(retryRecords).sort(comparePickupRecords);
}

function filteredCourierReturnRecords(tasks = courierReturnTaskRows) {
  return tasks.filter((task) => {
    const item = task.order_items || {};
    const order = item.orders || {};
    return matchSearch(`${item.barcode} ${item.spec} ${item.product_name} ${order.order_no} ${order.customer_name} ${order.phone} ${order.school} ${order.campus} ${orderCampusName(order)} ${order.building} ${order.address}`);
  }).map((task) => ({ task, item: task.order_items || {}, order: task.order_items?.orders || {} }));
}

function buildCourierRouteAreas(pickupRecords = [], returnGroups = []) {
  const areas = new Map();
  const ensureArea = (order) => {
    const route = orderRouteParts(order || {});
    const key = orderRouteKey(order || {});
    if (!areas.has(key)) areas.set(key, { key, ...route, pickups: [], returns: [] });
    return areas.get(key);
  };
  pickupRecords.forEach((record) => ensureArea(record.order).pickups.push(record));
  returnGroups.forEach((group) => ensureArea(group.order).returns.push(group));
  return [...areas.values()]
    .map((area) => {
      area.pickups.sort(comparePickupRecords);
      area.returns.sort((left, right) => compareOrderRoute(left.order, right.order)
        || compareNaturalText(firstOrderBarcode({ order_items: left.records.map(({ item }) => item) }), firstOrderBarcode({ order_items: right.records.map(({ item }) => item) }))
        || compareNaturalText(left.order?.customer_name, right.order?.customer_name));
      return area;
    })
    .sort((left, right) => compareNaturalText(left.school, right.school)
      || compareNaturalText(left.campus, right.campus)
      || compareNaturalText(left.building, right.building));
}

function courierAreaTaskCount(area) {
  return area.pickups.length + area.returns.length;
}

function courierRouteBuildingCounts(area, processed = false) {
  const prefix = processed ? "" : "待";
  return `${prefix}送回 ${area.returns.length}单｜${prefix}取件 ${area.pickups.length}单`;
}

function renderCourierRouteCockpit(pendingPickups, pendingReturns, processedPickups, processedReturns, areas, activeArea) {
  const completed = processedPickups.length + processedReturns.length;
  const pending = pendingPickups.length + pendingReturns.length;
  const total = completed + pending;
  const percent = total ? Math.round((completed / total) * 100) : 100;
  const activeIndex = activeArea ? areas.findIndex((area) => area.key === activeArea.key) : -1;
  const nextArea = activeIndex >= 0 ? areas[activeIndex + 1] : null;
  const retryCount = pendingPickups.filter((record) => record.isRetry).length;
  return `<section class="pickup-cockpit courier-route-cockpit ${pending ? "" : "complete"}">
    <div class="pickup-cockpit-head">
      <div><span class="pickup-eyebrow">当前楼栋</span><strong>${activeArea ? escapeHtml(pickupAreaLabel(activeArea)) : "今日路线已完成"}</strong></div>
      <span class="pickup-current-count">${activeArea ? escapeHtml(courierRouteBuildingCounts(activeArea)) : "全部完成"}</span>
    </div>
    <div class="courier-route-stats">
      <div><strong>${pendingPickups.length}</strong><span>全部待取</span></div>
      <div><strong>${retryCount}</strong><span>其中补取</span></div>
      <div><strong>${pendingReturns.length}</strong><span>待送回</span></div>
      <div><strong>${completed}</strong><span>今日已完成</span></div>
    </div>
    <div class="pickup-progress-track"><i style="width:${percent}%"></i></div>
    <p>${nextArea ? `下一楼栋：${escapeHtml(pickupAreaLabel(nextArea))}` : pending ? "当前是最后一个待处理楼栋" : "所有任务均已处理，可在下方查看已处理记录"}</p>
  </section>`;
}

function returnDeliveryPhotoUrl(task) {
  const path = text(task?.delivery_photo_path);
  if (!path || !sb?.storage) return "";
  return sb.storage.from(RETURN_DELIVERY_BUCKET).getPublicUrl(path)?.data?.publicUrl || "";
}

function returnDeliveryShortUrl(code) {
  return text(code) ? `${DELIVERY_PROOF_PUBLIC_URL}${encodeURIComponent(text(code))}` : "";
}

function courierReturnOrderMessage(order, records, photoUrl) {
  const itemCount = records.length;
  return `【事事通】同学您好，您的洗护订单本次共 ${itemCount} 件已送达至${order.school || ""}${orderCampusName(order)}${order.building || ""}。送达照片：${photoUrl} 请及时到约定位置领取并核对。如有问题请联系售后${AFTER_SALES_PHONE}。尚未出库的其他物品将按实际进度另行送回。`;
}

function renderCourierReturnCard(group, processed = false) {
  const { order } = group;
  const records = [...group.records].sort((left, right) => compareNaturalText(left.item?.barcode, right.item?.barcode));
  const deliveredCount = records.filter(({ task }) => task.status === "已送达").length;
  const pendingRecords = records.filter((record) => !courierReturnRecordFinished(record));
  const allDelivered = deliveredCount === records.length;
  const hasException = records.some(({ task }) => task.status === "异常");
  const groupBusy = records.some(({ task }) => courierReturnBusyTaskId === task.id);
  const cardStatus = allDelivered ? "已送达" : pendingRecords.length ? `已送达 ${deliveredCount}/${records.length}件` : hasException ? "异常" : group.status;
  const images = [...new Set(records.flatMap(({ item }) => text(item.image_links).split(/[\n,，\s]+/).filter((url) => /^https?:\/\//i.test(url))))];
  const imageBtn = previewButton(`return-order-${group.key}`, images);
  const proofState = courierReturnProofFiles.get(group.key);
  const deliveredRecord = records.find(({ task }) => text(task.delivery_photo_path));
  const deliveredPhotoUrl = returnDeliveryPhotoUrl(deliveredRecord?.task);
  const deliveredShareUrl = returnDeliveryShortUrl(deliveredRecord?.task?.delivery_short_code) || deliveredPhotoUrl;
  const deliveredBatchRecords = deliveredRecord
    ? records.filter(({ task }) => text(task.delivery_photo_path) === text(deliveredRecord.task.delivery_photo_path))
    : [];
  const deliveredMessage = deliveredPhotoUrl ? courierReturnOrderMessage(order, deliveredBatchRecords, deliveredShareUrl) : "";
  return `<article class="task-card courier-order-card courier-route-card courier-return-card ${allDelivered ? "done" : ""} ${hasException && !pendingRecords.length ? "alert" : ""}" data-route-task-card="return-${escapeHtml(group.key)}" ${groupBusy ? 'aria-busy="true"' : ""}>
    <div class="card-head"><h3>${escapeHtml(order.customer_name)} · ${escapeHtml(order.phone)}</h3><span>${escapeHtml(groupBusy ? "提交中…" : cardStatus)}</span></div>
    <p class="courier-card-summary">本单 ${records.length} 件｜订单号：${escapeHtml(order.order_no || "")}</p>
    <div class="courier-card-address courier-return-address"><span>送达地址</span><p>${escapeHtml(order.address || "未填写完整地址")}</p></div>
    <ul class="courier-item-list courier-return-item-list">${records.map(({ task, item }) => {
      const itemBusy = courierReturnBusyTaskId === task.id;
      const finished = COURIER_RETURN_FINISHED_STATUSES.has(task.status);
      return `<li class="courier-return-item ${task.status === "已送达" ? "done" : task.status === "异常" ? "alert" : ""}">
        <div class="courier-return-item-main"><strong>${escapeHtml(item.barcode || "无条码")}</strong><span>${washDecisionIsReturn(item) ? '<b class="wash-return-tag">退洗</b>' : ""}${escapeHtml(item.spec || item.product_name || "物品未填写")}</span><em>${escapeHtml(itemBusy ? "提交中…" : task.status || "待送回")}</em></div>
        ${finished ? "" : `<div class="courier-return-item-actions"><button class="ghost danger" type="button" data-report-return-exception="${escapeHtml(task.id)}" data-item="${escapeHtml(item.id)}" data-order="${escapeHtml(order.id)}" ${itemBusy || groupBusy ? "disabled" : ""}>此件异常</button></div>`}
      </li>`;
    }).join("")}</ul>
    ${pendingRecords.length ? `<div class="courier-return-proof ${proofState ? "ready" : ""}">
      <div class="courier-return-proof-picker">
        ${proofState ? `<img src="${escapeHtml(proofState.previewUrl)}" alt="待上传的送达照片" /><span>照片已选择，上传时自动压缩</span>` : '<div><strong>送达照片</strong><span>整单确认前必须拍摄楼下交付照片，上传后不超过 800KB</span></div>'}
        <label class="button-link ghost"><input type="file" accept="image/*" capture="environment" data-return-proof="${escapeHtml(group.key)}" />${proofState ? "重拍" : "拍照 / 选择照片"}</label>
      </div>
      <button class="courier-return-confirm" type="button" data-confirm-return-order="${escapeHtml(group.key)}" ${proofState && !groupBusy ? "" : "disabled"}>${groupBusy ? "正在上传并确认…" : `上传照片并整单确认送达（${pendingRecords.length}件）`}</button>
      <p>只确认本次已经出库的 ${pendingRecords.length} 件；尚未出库的物品不会提前送达。</p>
    </div>` : deliveredPhotoUrl ? `<div class="courier-return-proof-complete"><img src="${escapeHtml(deliveredPhotoUrl)}" alt="送达照片" /><div><strong>整单已送达</strong><span>送达照片已保存，可再次通知学生。</span></div><a class="button-link" href="${smsComposeHref(order.phone || "", deliveredMessage)}">发送已送达短信</a></div>` : ""}
    <div class="actions courier-card-secondary-actions"><a class="button-link" href="tel:${escapeHtml(order.phone || "")}">打电话</a>${imageBtn}<button class="ghost" type="button" data-detail="${escapeHtml(order.id)}">详情</button></div>
  </article>`;
}

function renderCourierRouteAreaContent(area, processed = false) {
  const returnItemCount = area.returns.reduce((sum, group) => sum + group.records.filter((record) => processed || !courierReturnRecordFinished(record)).length, 0);
  return `<div class="courier-route-area-content">
    ${area.returns.length ? `<section class="courier-route-section courier-route-return-section">
      <div class="courier-route-section-head"><div><strong>${processed ? "已处理送回" : "先送回"}</strong><span>${area.returns.length} 单 / ${returnItemCount} 件</span></div></div>
      <div class="card-list">${area.returns.map((group) => renderCourierReturnCard(group, processed)).join("")}</div>
    </section>` : ""}
    ${area.pickups.length ? `<section class="courier-route-section courier-route-pickup-section">
      <div class="courier-route-section-head"><div><strong>${processed ? "已处理取件" : "再取件"}</strong><span>${area.pickups.length} 单</span></div></div>
      <div class="card-list">${area.pickups.map((record) => renderPickupCard(record, processed)).join("")}</div>
    </section>` : ""}
  </div>`;
}

function renderCourierRouteTree(areas, processed = false) {
  const schools = new Map();
  areas.forEach((area) => {
    if (!schools.has(area.school)) schools.set(area.school, { count: 0, campuses: new Map() });
    const school = schools.get(area.school);
    school.count += courierAreaTaskCount(area);
    if (!school.campuses.has(area.campus)) school.campuses.set(area.campus, { count: 0, buildings: [] });
    const campus = school.campuses.get(area.campus);
    campus.count += courierAreaTaskCount(area);
    campus.buildings.push(area);
  });
  return [...schools.entries()].map(([schoolName, school]) => {
    const schoolActive = !processed && school.campuses.values() && [...school.campuses.values()].some((campus) => campus.buildings.some((area) => area.key === courierActivePickupAreaKey));
    return `<details class="delivery-group school-group courier-route-school" ${schoolActive ? "open" : ""}>
      <summary>${escapeHtml(schoolName)} <span>${school.count} 项任务</span></summary>
      <div class="group-nest">${[...school.campuses.entries()].map(([campusName, campus]) => {
        const campusActive = !processed && campus.buildings.some((area) => area.key === courierActivePickupAreaKey);
        return `<details class="delivery-group campus-group courier-route-campus" ${campusActive ? "open" : ""}>
          <summary>${escapeHtml(campusName)} <span>${campus.count} 项任务</span></summary>
          <div class="group-nest">${campus.buildings.map((area) => {
            const active = !processed && area.key === courierActivePickupAreaKey;
            return `<details class="delivery-group building-group courier-route-area ${active ? "active" : ""}" ${active ? "open" : ""} data-route-area="${escapeHtml(area.key)}">
              <summary ${processed ? "" : `data-select-pickup-area="${escapeHtml(area.key)}"`}><strong>${escapeHtml(area.building)}</strong><span>${escapeHtml(courierRouteBuildingCounts(area, processed))}</span></summary>
              ${renderCourierRouteAreaContent(area, processed)}
            </details>`;
          }).join("")}</div>
        </details>`;
      }).join("")}</div>
    </details>`;
  }).join("");
}

function renderCourierRouteTasks() {
  const target = $("courierRouteTaskList");
  if (!target) return;
  const pickupRecords = filteredCourierPickupRecords();
  const pendingPickups = pickupRecords.filter((record) => courierPickupRecordOpen(record) && courierPickupRecordDue(record));
  const futurePickups = pickupRecords.filter((record) => courierPickupRecordOpen(record) && !courierPickupRecordDue(record));
  const selectedDate = selectedCourierPickupDate();
  const activityDate = selectedDate || todayDate();
  const hasSearch = Boolean(text($("courierSearch")?.value));
  const processedPickups = pickupRecords.filter((record) => !courierPickupRecordOpen(record) && (hasSearch || courierPickupRecordFinishedOnDate(record, activityDate)));
  const returnRecords = filteredCourierReturnRecords();
  courierReturnOrderGroups = aggregateCourierReturnOrders(returnRecords);
  const pendingReturns = courierReturnOrderGroups.filter(courierReturnGroupHasPending);
  const processedReturns = courierReturnOrderGroups.filter((group) => !courierReturnGroupHasPending(group) && (hasSearch || courierReturnGroupFinishedOnDate(group, activityDate)));
  const availableKeys = new Set(pendingReturns.map((group) => group.key));
  [...courierReturnProofFiles.keys()].forEach((key) => {
    if (!availableKeys.has(key)) clearCourierReturnProof(key);
  });
  const pendingAreas = buildCourierRouteAreas(pendingPickups, pendingReturns);
  const processedAreas = buildCourierRouteAreas(processedPickups, processedReturns);
  const activeArea = ensureCourierActivePickupArea(pendingAreas);
  const hasAnyTask = pendingPickups.length || futurePickups.length || processedPickups.length || pendingReturns.length || processedReturns.length;
  if (!hasAnyTask) {
    target.innerHTML = `<p class="hint">当前没有未完成取件或送回任务${selectedDate ? `，${escapeHtml(selectedDate)} 也没有处理记录` : ""}。</p>`;
    return;
  }
  const completed = processedPickups.length + processedReturns.length;
  target.innerHTML = `
    ${renderCourierRouteCockpit(pendingPickups, pendingReturns, processedPickups, processedReturns, pendingAreas, activeArea)}
    <div class="courier-route-list">${pendingAreas.length ? renderCourierRouteTree(pendingAreas) : '<p class="success-note">当前没有到期的未完成任务。</p>'}</div>
    ${futurePickups.length ? `<details class="pickup-processed courier-future-pickups"><summary><strong>未来预约</strong><span>${futurePickups.length} 项</span></summary><div class="pickup-processed-body">${buildCourierRouteAreas(futurePickups, []).map((area) => `<p><strong>${escapeHtml(pickupAreaLabel(area))}</strong> · ${area.pickups.length} 项</p>`).join("")}</div></details>` : ""}
    ${completed ? `<details class="pickup-processed courier-route-processed" ${pendingAreas.length ? "" : "open"}>
      <summary><strong>已处理</strong><span>${completed} 项任务</span></summary>
      <div class="pickup-processed-body">${renderCourierRouteTree(processedAreas, true)}</div>
    </details>` : ""}`;
  if (courierPickupScrollToNext) {
    courierPickupScrollToNext = false;
    requestAnimationFrame(() => {
      document.querySelector(".courier-route-area.active [data-route-task-card]")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
}

async function updatePickup(taskId, orderId, status) {
  if (courierPickupBusyTaskId) return;
  const note = status === "未找到" || status === "异常" ? prompt("请输入异常备注", status) || status : "";
  const now = new Date().toISOString();
  courierPickupBusyTaskId = taskId;
  renderCourierRouteTasks();
  const results = await Promise.all([
    sb.from("pickup_tasks").update({ status, exception_note: note, operator_id: currentProfile?.id || null, updated_at: now }).eq("id", taskId),
    sb.from("order_items").update({ item_status: status, updated_at: now }).eq("order_id", orderId).in("item_status", [...PICKUP_OPEN_STATUSES]),
    note ? sb.from("orders").update({ exception_note: note, updated_at: now }).eq("id", orderId) : Promise.resolve({ error: null }),
  ]);
  const failure = results.find((result) => result.error)?.error;
  if (failure) {
    courierPickupBusyTaskId = "";
    renderCourierRouteTasks();
    return alert(failure.message);
  }
  await insertLog({ orderId, status, note });
  courierPickupBusyTaskId = "";
  courierPickupScrollToNext = true;
  await loadCourierTasks();
}

async function updateRetryPickup(taskId, itemId, orderId, status) {
  if (courierPickupBusyTaskId) return;
  const note = status === "未找到" ? prompt("请输入未找到原因", "补取未找到") : "";
  if (status === "未找到" && note === null) return;
  const now = new Date().toISOString();
  courierPickupBusyTaskId = taskId;
  renderCourierRouteTasks();
  const itemStatus = status === "已补取" ? "已取件" : "待补取";
  const retryUpdate = { status, operator_id: currentProfile?.id || null, updated_at: now };
  if (text(note)) retryUpdate.reason = text(note);
  const results = await Promise.all([
    sb.from("pickup_retry_tasks").update(retryUpdate).eq("id", taskId),
    sb.from("order_items").update({ item_status: itemStatus, updated_at: now }).eq("id", itemId),
  ]);
  const failure = results.find((result) => result.error)?.error;
  if (failure) {
    courierPickupBusyTaskId = "";
    renderCourierRouteTasks();
    return alert(failure.message);
  }
  await insertLog({ orderId, itemId, status, note: text(note) || "单个水洗标补取完成" });
  courierPickupBusyTaskId = "";
  courierPickupScrollToNext = true;
  await loadCourierTasks();
}

async function rescheduleRetryPickup(taskId) {
  const task = courierRetryTaskRows.find((row) => row.id === taskId);
  if (!task || courierPickupBusyTaskId) return;
  const pickupDate = prompt("新的补取日期（YYYY-MM-DD）", task.pickup_date || todayDate());
  if (pickupDate === null) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text(pickupDate))) return alert("补取日期格式不正确");
  const reason = prompt("改约备注", task.reason || "客户改约补取");
  if (reason === null) return;
  courierPickupBusyTaskId = taskId;
  renderCourierRouteTasks();
  const { error } = await sb.from("pickup_retry_tasks").update({ pickup_date: pickupDate, status: "待补取", reason: text(reason), operator_id: currentProfile?.id || null, updated_at: new Date().toISOString() }).eq("id", taskId);
  courierPickupBusyTaskId = "";
  if (error) {
    renderCourierRouteTasks();
    return alert(error.message);
  }
  const item = relationOne(task.order_items);
  const order = relationOne(item.orders);
  await insertLog({ orderId: order.id, itemId: item.id, barcode: item.barcode, status: "补取改约", note: `${pickupDate}；${text(reason)}` });
  await loadCourierTasks();
}

function clearCourierReturnProof(groupKey) {
  const current = courierReturnProofFiles.get(groupKey);
  if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
  courierReturnProofFiles.delete(groupKey);
}

function selectCourierReturnProof(groupKey, file) {
  if (!file) return;
  if (!String(file.type || "").startsWith("image/")) return alert("请选择照片文件。");
  if (file.size > RETURN_DELIVERY_MAX_BYTES) return alert("照片不能超过 10MB，请降低清晰度后重拍。");
  clearCourierReturnProof(groupKey);
  courierReturnProofFiles.set(groupKey, { file, previewUrl: URL.createObjectURL(file) });
  renderCourierRouteTasks();
  requestAnimationFrame(() => document.querySelector(`[data-route-task-card="return-${groupKey}"]`)?.scrollIntoView({ block: "center" }));
}

async function prepareReturnDeliveryPhoto(file) {
  if (!file || file.size <= RETURN_DELIVERY_TARGET_BYTES) return file;
  try {
    let source;
    if (typeof createImageBitmap === "function") {
      source = await createImageBitmap(file);
    } else {
      source = await new Promise((resolve, reject) => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);
        image.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(image);
        };
        image.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("照片读取失败"));
        };
        image.src = objectUrl;
      });
    }
    const sourceWidth = source.width || source.naturalWidth;
    const sourceHeight = source.height || source.naturalHeight;
    const maxSide = 1280;
    const ratio = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sourceWidth * ratio));
    canvas.height = Math.max(1, Math.round(sourceHeight * ratio));
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    source.close?.();
    let blob = null;
    for (const quality of [0.72, 0.62, 0.52, 0.44]) {
      blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob?.size <= RETURN_DELIVERY_TARGET_BYTES) break;
    }
    return blob ? new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "delivery"}.jpg`, { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

function showReturnDeliverySuccess(order, records, photoUrl, shareUrl) {
  const dialog = $("returnDeliveryDialog");
  const message = courierReturnOrderMessage(order, records, shareUrl || photoUrl);
  if ($("returnDeliveryPhoto")) $("returnDeliveryPhoto").src = photoUrl;
  if ($("returnDeliverySummary")) $("returnDeliverySummary").textContent = `本次 ${records.length} 件已整单送达，照片已保存。`;
  if ($("returnDeliverySmsBtn")) $("returnDeliverySmsBtn").href = smsComposeHref(order.phone || "", message);
  if (dialog && !dialog.open) dialog.showModal();
}

async function confirmCourierReturnOrder(groupKey) {
  if (courierReturnBusyTaskId) return;
  const group = courierReturnOrderGroups.find((entry) => entry.key === groupKey);
  const proofState = courierReturnProofFiles.get(groupKey);
  const pendingRecords = group?.records.filter((record) => !courierReturnRecordFinished(record)) || [];
  if (!group || !pendingRecords.length) return alert("这单已经处理完成，请刷新任务。");
  if (!proofState?.file) return alert("请先拍摄或选择送达照片。");
  courierReturnBusyTaskId = pendingRecords[0].task.id;
  renderCourierRouteTasks();

  const taskIds = pendingRecords.map(({ task }) => task.id).filter(Boolean);
  const itemIds = pendingRecords.map(({ item }) => item.id).filter(Boolean);
  const now = new Date().toISOString();
  let uploadedPath = "";
  let deliveryCommitted = false;
  const deliveryShortCode = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  try {
    const uploadFile = await prepareReturnDeliveryPhoto(proofState.file);
    if (uploadFile.size > RETURN_DELIVERY_STORED_MAX_BYTES) {
      throw new Error("照片压缩后仍超过 800KB，请重拍并减少画面内容。");
    }
    uploadedPath = `${group.order.id}/${todayDate()}/${crypto.randomUUID()}-${safeEvidenceFileName(uploadFile.name)}`;
    const { error: uploadError } = await sb.storage.from(RETURN_DELIVERY_BUCKET).upload(uploadedPath, uploadFile, {
      contentType: uploadFile.type || "image/jpeg",
      upsert: false,
    });
    if (uploadError) throw new Error(`送达照片上传失败：${uploadError.message}`);
    const photoUrl = sb.storage.from(RETURN_DELIVERY_BUCKET).getPublicUrl(uploadedPath)?.data?.publicUrl || "";
    if (!photoUrl) throw new Error("没有生成送达照片链接");

    const returnResult = await sb.from("return_tasks").update({
      status: "已送达",
      delivery_photo_path: uploadedPath,
      delivery_short_code: deliveryShortCode,
      delivered_at: now,
      operator_id: currentProfile?.id || null,
      updated_at: now,
    }).in("id", taskIds);
    if (returnResult.error) {
      const missingDeliveryField = /delivery_photo_path|delivery_short_code/i.test(returnResult.error.message);
      throw new Error(missingDeliveryField ? "请先执行送达照片数据库迁移" : returnResult.error.message);
    }
    const itemResult = await sb.from("order_items").update({ item_status: "已送达", updated_at: now }).in("id", itemIds);
    if (itemResult.error) {
      await Promise.all(pendingRecords.map(({ task }) => sb.from("return_tasks").update({
        status: task.status,
        delivery_photo_path: task.delivery_photo_path || "",
        delivery_short_code: task.delivery_short_code || "",
        delivered_at: task.delivered_at || null,
        updated_at: new Date().toISOString(),
      }).eq("id", task.id)));
      throw new Error(itemResult.error.message);
    }
    deliveryCommitted = true;

    if (washAdjustmentSchemaAvailable && itemIds.length) {
      await sb.from("order_items").update({
        wash_decision: WASH_DECISION_RETURNED,
        wash_decision_updated_at: now,
        updated_at: now,
      }).in("id", itemIds).eq("wash_decision", WASH_DECISION_RETURN_PENDING);
    }
    await sb.rpc("sync_order_flow_state", { target_order_id: group.order.id });
    await Promise.all(pendingRecords.map(({ item }) => insertLog({
      orderId: group.order.id,
      itemId: item.id,
      barcode: item.barcode,
      status: "已送达",
      note: `配送员整单确认本次送达；送达照片：${photoUrl}`,
    })));
    clearCourierReturnProof(groupKey);
    courierReturnBusyTaskId = "";
    courierPickupScrollToNext = true;
    await loadCourierTasks();
    showReturnDeliverySuccess(group.order, pendingRecords, photoUrl, returnDeliveryShortUrl(deliveryShortCode));
  } catch (error) {
    if (uploadedPath && !deliveryCommitted) await sb.storage.from(RETURN_DELIVERY_BUCKET).remove([uploadedPath]);
    courierReturnBusyTaskId = "";
    renderCourierRouteTasks();
    alert(deliveryCommitted
      ? `整单送达已保存，但后续刷新出现异常：${error?.message || "请刷新页面确认"}`
      : error?.message || "整单送达失败，请重试");
  }
}

function renderFactoryPendingItems() {
  const pendingIn = factoryItemRows.filter((item) => item.item_status === "已取件").length;
  const pendingOut = factoryItemRows.filter((item) => ["已入厂", "清洗中"].includes(item.item_status)).length;
  const rows = factoryItemRows.filter((item) => {
    if (factoryPendingView === "pending-in") return item.item_status === "已取件";
    if (factoryPendingView === "pending-out") return ["已入厂", "清洗中"].includes(item.item_status);
    return false;
  });
  document.querySelectorAll("[data-factory-pending-view]").forEach((button) => {
    const active = button.dataset.factoryPendingView === factoryPendingView;
    button.setAttribute("aria-pressed", String(active));
    button.classList.toggle("active", active);
  });
  if ($("factoryPendingInQuickCount")) $("factoryPendingInQuickCount").textContent = `${pendingIn} 件`;
  if ($("factoryPendingOutQuickCount")) $("factoryPendingOutQuickCount").textContent = `${pendingOut} 件`;
  if ($("factoryPendingOverviewCount")) $("factoryPendingOverviewCount").textContent = `入 ${pendingIn} / 出 ${pendingOut}`;
  if ($("factoryPendingOverviewHint")) {
    const loadedNote = factoryItemTotalCount > factoryItemRows.length ? `，当前加载最近 ${factoryItemRows.length} 件` : "";
    $("factoryPendingOverviewHint").textContent = factoryPendingView
      ? `${factoryPendingView === "pending-in" ? "待入库" : "待出库"}共 ${rows.length} 件${loadedNote}`
      : "选择上方“待入库”或“待出库”后再显示明细；查单请使用订单查询。";
  }
  if (!$("factoryItemList")) return;
  $("factoryItemList").innerHTML = rows.map((item) => {
    const order = Array.isArray(item.orders) ? item.orders[0] || {} : item.orders || {};
    const decisionTag = item.wash_decision && item.wash_decision !== WASH_DECISION_NORMAL
      ? `<p class="factory-wash-decision ${escapeHtml(item.wash_decision)}">${escapeHtml(washDecisionLabel(item))}${numberValue(item.price_adjustment_amount) > 0 ? ` · ¥${escapeHtml(numberValue(item.price_adjustment_amount))}` : ""}</p>`
      : "";
    return `<article class="task-card compact"><div class="card-head"><h3>${escapeHtml(item.barcode)}</h3><span>${escapeHtml(item.item_status)}</span></div><p>${escapeHtml(order.customer_name || "")} · ${escapeHtml(order.phone || "")}</p><p>${escapeHtml(`${order.school || ""}${orderCampusName(order)}${order.building || ""}`)}</p><p>${escapeHtml(item.spec || item.product_name || "")}</p>${decisionTag}<div class="actions factory-item-actions"><button class="ghost danger" type="button" data-report-exception="${escapeHtml(item.id)}">上报异常</button></div></article>`;
  }).join("") || `<p class="factory-pending-empty">${factoryPendingView ? "当前作业类型暂无待处理物品" : "暂不展示全部物品，避免列表过长。"}</p>`;
}

function selectFactoryPendingView(view) {
  const nextView = ["pending-in", "pending-out"].includes(view) ? view : "";
  factoryPendingView = factoryPendingView === nextView ? "" : nextView;
  if ($("factoryPendingPanel")) $("factoryPendingPanel").open = true;
  renderFactoryPendingItems();
}

async function loadFactoryItems() {
  let query = sb.from("order_items").select("*, orders(*)", { count: "exact" }).order("updated_at", { ascending: false });
  if (factoryDashboardFilter === "pending-in") {
    query = query.eq("item_status", "已取件");
  } else if (factoryDashboardFilter === "pending-out") {
    query = query.in("item_status", ["已入厂", "清洗中"]);
  } else {
    query = query.in("item_status", ["已取件", "已入厂", "清洗中"]);
  }
  const { data, error, count } = await query.limit(500);
  if (error) return setMessage("factoryItemList", error.message, "warn");
  let rows = data || [];
  let activeLabel = "";
  let queueTitle = "待处理概览";
  if (factoryDashboardFilter === "pending-in") {
    rows = rows.filter((item) => item.item_status === "已取件");
    activeLabel = "驾驶舱筛选：待入库";
    queueTitle = "待入库物品";
    factoryPendingView = "pending-in";
  } else if (factoryDashboardFilter === "pending-out") {
    rows = rows.filter((item) => ["已入厂", "清洗中"].includes(item.item_status));
    activeLabel = "驾驶舱筛选：待出库";
    queueTitle = "待出库物品";
    factoryPendingView = "pending-out";
  }
  renderActiveFilter("factoryActiveFilter", activeLabel, "factory");
  if ($("factoryQueueTitle")) $("factoryQueueTitle").textContent = queueTitle;
  factoryItemRows = rows;
  factoryItemTotalCount = count ?? rows.length;
  if (factoryDashboardFilter && $("factoryPendingPanel")) $("factoryPendingPanel").open = true;
  renderFactoryPendingItems();
}

function factoryMaskedPhone(value) {
  const phone = text(value);
  if (phone.length < 7) return phone || "未留电话";
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function factorySearchTerm(value) {
  return text(value).replace(/[,()%'"]/g, " ").replace(/\s+/g, " ").trim();
}

function factorySearchOrderItems(order) {
  return (Array.isArray(order?.order_items) ? order.order_items : [])
    .slice()
    .sort((left, right) => compareNaturalText(left.barcode || "", right.barcode || ""));
}

function renderFactoryOrderSearchResults() {
  const target = $("factoryOrderSearchResults");
  if (!target) return;
  if (!factoryOrderSearchRows.length) {
    target.innerHTML = '<p class="factory-search-empty">没有查到匹配订单，请核对订单号、手机号或水洗标。</p>';
    return;
  }
  target.innerHTML = factoryOrderSearchRows.map((order) => {
    const items = factorySearchOrderItems(order);
    const images = collectOrderImages(order);
    const previewKey = `factory-search-${order.id}`;
    if (images.length) imagePreviewMap.set(previewKey, images);
    const route = [order.school, orderCampusName(order), order.building].map(text).filter(Boolean).join(" · ") || "地址待确认";
    return `<article class="factory-order-search-card" data-factory-search-order="${escapeHtml(order.id)}">
      <div class="factory-order-search-card-head">
        <div><h3>${escapeHtml(order.customer_name || "未填写姓名")} · ${escapeHtml(factoryMaskedPhone(order.phone))}</h3><p>${escapeHtml(route)}</p></div>
        <div class="factory-order-search-tags"><span class="status-tag">${escapeHtml(order.order_status || "状态待更新")}</span><span class="count-tag">共${items.length}件</span></div>
      </div>
      <p class="factory-search-order-no">订单号　${escapeHtml(order.order_no || "—")}</p>
      <div class="factory-search-item-list">${items.map((item) => `<div><strong>${escapeHtml(item.barcode || "未生成条码")}</strong><span>${escapeHtml(item.spec || item.product_name || "物品未填写")}</span><b>${escapeHtml(item.item_status || "状态待更新")}</b></div>`).join("") || '<p class="hint">订单暂无水洗标</p>'}</div>
      <div class="factory-search-actions">
        <button class="ghost" type="button" data-factory-search-detail="${escapeHtml(order.id)}">订单详情</button>
        <button class="ghost image-action" type="button" ${images.length ? `data-factory-search-images="${escapeHtml(previewKey)}"` : "disabled"}>${images.length ? "查看图片" : "暂无图片"}</button>
        <button class="ghost danger" type="button" data-factory-order-exception="${escapeHtml(order.id)}" ${items.length ? "" : "disabled"}>上报异常</button>
      </div>
    </article>`;
  }).join("");
}

function openFactoryOrderSearchDialog() {
  if (!currentUser) return alert("请先登录工厂账号");
  const dialog = $("factoryOrderSearchDialog");
  if (!dialog) return;
  if (!dialog.open) dialog.showModal();
  requestAnimationFrame(() => $("factoryOrderSearchInput")?.focus());
}

function closeFactoryOrderSearchDialog() {
  if ($("factoryOrderSearchDialog")?.open) $("factoryOrderSearchDialog").close();
}

async function searchFactoryOrders() {
  if (!currentUser || factoryOrderSearchBusy) return;
  const keyword = factorySearchTerm($("factoryOrderSearchInput")?.value);
  if (keyword.length < 2) {
    setMessage("factoryOrderSearchMessage", "请至少输入2个字符。", "warn");
    $("factoryOrderSearchInput")?.focus();
    return;
  }
  factoryOrderSearchBusy = true;
  if ($("factoryOrderSearchSubmitBtn")) {
    $("factoryOrderSearchSubmitBtn").disabled = true;
    $("factoryOrderSearchSubmitBtn").textContent = "查询中…";
  }
  setMessage("factoryOrderSearchMessage", "正在查询订单和水洗标…", "hint");
  try {
    const selectFields = "*, order_items(*)";
    const [ordersResult, itemResult] = await Promise.all([
      sb.from("orders")
        .select(selectFields)
        .or(`order_no.ilike.%${keyword}%,phone.ilike.%${keyword}%,customer_name.ilike.%${keyword}%,address.ilike.%${keyword}%`)
        .order("created_at", { ascending: false })
        .limit(20),
      sb.from("order_items")
        .select("order_id")
        .or(`barcode.ilike.%${keyword}%,product_name.ilike.%${keyword}%,spec.ilike.%${keyword}%`)
        .limit(50),
    ]);
    if (ordersResult.error) throw ordersResult.error;
    if (itemResult.error) throw itemResult.error;
    const merged = new Map((ordersResult.data || []).map((order) => [order.id, order]));
    const missingOrderIds = [...new Set((itemResult.data || []).map((item) => item.order_id).filter(Boolean))]
      .filter((orderId) => !merged.has(orderId));
    if (missingOrderIds.length) {
      const extraResult = await sb.from("orders").select(selectFields).in("id", missingOrderIds).limit(50);
      if (extraResult.error) throw extraResult.error;
      (extraResult.data || []).forEach((order) => merged.set(order.id, order));
    }
    factoryOrderSearchRows = [...merged.values()]
      .sort((left, right) => parseDate(right.created_at) - parseDate(left.created_at))
      .slice(0, 30);
    renderFactoryOrderSearchResults();
    setMessage("factoryOrderSearchMessage", factoryOrderSearchRows.length ? `查到 ${factoryOrderSearchRows.length} 个订单。` : "没有查到匹配订单。", factoryOrderSearchRows.length ? "success" : "hint");
  } catch (error) {
    factoryOrderSearchRows = [];
    renderFactoryOrderSearchResults();
    setMessage("factoryOrderSearchMessage", `查询失败：${error?.message || "请稍后重试"}`, "warn");
  } finally {
    factoryOrderSearchBusy = false;
    if ($("factoryOrderSearchSubmitBtn")) {
      $("factoryOrderSearchSubmitBtn").disabled = false;
      $("factoryOrderSearchSubmitBtn").textContent = "查询";
    }
  }
}

function openFactoryOrderException(orderId) {
  const order = factoryOrderSearchRows.find((row) => row.id === orderId);
  const items = factorySearchOrderItems(order);
  if (!order || !items.length) return alert("这单暂无可绑定的水洗标");
  closeFactoryOrderSearchDialog();
  openExceptionTicketDialog(items[0], { type: "factory-order-search", orderId, items });
}

function factoryTodayRange(dateText = todayDate()) {
  const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(text(dateText)) ? text(dateText) : todayDate();
  const now = new Date(`${normalizedDate}T00:00:00`);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = addDays(start, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function normalizeFactoryScanRecord(scan) {
  const item = Array.isArray(scan?.order_items) ? scan.order_items[0] : scan?.order_items || {};
  const order = Array.isArray(item?.orders) ? item.orders[0] : item?.orders || {};
  return { ...scan, item, order };
}

function factoryScanStillApplied(record) {
  const status = text(record?.item?.item_status);
  if (!status) return false;
  if (record.scan_type === "factory_in") return !["待取件", "已取件"].includes(status);
  if (record.scan_type === "factory_out") return !["待取件", "已取件", "已入厂", "清洗中"].includes(status);
  return false;
}

function factoryDailyOrderKey(record) {
  return text(record?.order?.id || record?.item?.order_id || `item-${record?.item_id || record?.id}`);
}

function factoryDailyGroups(scanType) {
  const groups = new Map();
  factoryDailyScans
    .filter((record) => record.scan_type === scanType)
    .forEach((record) => {
      const key = factoryDailyOrderKey(record);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          order: record.order || {},
          scans: [],
          firstScannedAt: record.created_at,
        });
      }
      groups.get(key).scans.push(record);
    });
  return [...groups.values()]
    .map((group) => ({
      ...group,
      scans: group.scans.sort((left, right) => new Date(left.created_at) - new Date(right.created_at)),
      firstScannedAt: group.scans[0]?.created_at || group.firstScannedAt,
    }))
    .sort((left, right) => new Date(left.firstScannedAt) - new Date(right.firstScannedAt));
}

function factoryDailyTime(value) {
  const date = parseDate(value);
  return date
    ? date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
    : "";
}

function renderFactoryDailyItems(group) {
  return group.scans.map((record) => {
    const item = record.item || {};
    const scannedAt = text(record.created_at || item.updated_at);
    return `<div class="factory-daily-item">
      <code>${escapeHtml(record.barcode || item.barcode || "")}</code>
      <span>${escapeHtml(item.spec || item.product_name || "物品未填写")}</span>
      <time datetime="${escapeHtml(scannedAt)}">${escapeHtml(factoryDailyTime(scannedAt))}</time>
    </div>`;
  }).join("");
}

function renderFactoryDailyOrder(group, selectable = false) {
  const order = group.order || {};
  const orderNo = text(order.order_no) || `订单 ${group.key.slice(-8)}`;
  const customer = [order.customer_name, order.phone].map(text).filter(Boolean).join(" · ") || "客户信息未填写";
  const address = `${text(order.school)}${orderCampusName(order)}${text(order.building)}` || "地址未识别";
  const selected = selectable && factorySelectedOutboundOrders.has(group.key);
  const content = `<div class="factory-daily-order-body">
    <div class="factory-daily-order-title">
      <strong>${escapeHtml(orderNo)}</strong>
      <span>${group.scans.length} 件 · ${escapeHtml(factoryDailyTime(group.firstScannedAt))}</span>
    </div>
    <p class="factory-daily-customer">${escapeHtml(customer)}</p>
    <p class="factory-daily-address">${escapeHtml(address)}</p>
    <div class="factory-daily-items">${renderFactoryDailyItems(group)}</div>
  </div>`;
  if (!selectable) return `<article class="factory-daily-order">${content}</article>`;
  return `<label class="factory-daily-order selectable ${selected ? "selected" : ""}">
    <input type="checkbox" data-factory-outbound-order="${escapeHtml(group.key)}" ${selected ? "checked" : ""} />
    ${content}
  </label>`;
}

function selectedFactoryOutboundGroups() {
  return factoryDailyOutboundGroups.filter((group) => factorySelectedOutboundOrders.has(group.key));
}

function rebuildFactoryLabelBatchFromSelection() {
  factoryLabelBatch.length = 0;
  selectedFactoryOutboundGroups().forEach((group) => {
    group.scans.forEach((record) => {
      factoryLabelBatch.push(factoryLabelData({ ...record.item, orders: record.order }, record.created_at));
    });
  });
  return factoryLabelBatch;
}

function updateFactoryOutboundSelectionUi() {
  const selectedGroups = selectedFactoryOutboundGroups();
  const pageCount = selectedGroups.reduce((total, group) => total + group.scans.length, 0);
  if ($("factorySelectedPrintCount")) {
    $("factorySelectedPrintCount").textContent = `已选 ${selectedGroups.length} 单 / ${pageCount} 页`;
  }
  if ($("printFactoryLabelBtn")) $("printFactoryLabelBtn").disabled = pageCount === 0;
  if ($("downloadFactoryLabelBtn")) $("downloadFactoryLabelBtn").disabled = pageCount === 0;
  if ($("selectAllFactoryOutBtn")) $("selectAllFactoryOutBtn").disabled = factoryDailyOutboundGroups.length === 0;
  if ($("clearFactoryOutSelectionBtn")) $("clearFactoryOutSelectionBtn").disabled = selectedGroups.length === 0;
}

function switchFactoryDailyTab(tabName = "out") {
  factoryDailyActiveTab = tabName === "in" ? "in" : "out";
  document.querySelectorAll("[data-factory-daily-tab]").forEach((button) => {
    const active = button.dataset.factoryDailyTab === factoryDailyActiveTab;
    button.setAttribute("aria-selected", String(active));
    button.classList.toggle("ghost", !active);
  });
  document.querySelectorAll("[data-factory-daily-view]").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.factoryDailyView !== factoryDailyActiveTab);
  });
}

function renderFactoryDailyLists() {
  const inboundGroups = factoryDailyGroups("factory_in");
  factoryDailyOutboundGroups = factoryDailyGroups("factory_out");
  const validOutboundKeys = new Set(factoryDailyOutboundGroups.map((group) => group.key));
  [...factorySelectedOutboundOrders].forEach((key) => {
    if (!validOutboundKeys.has(key)) factorySelectedOutboundOrders.delete(key);
  });
  const inboundItems = inboundGroups.reduce((total, group) => total + group.scans.length, 0);
  const outboundItems = factoryDailyOutboundGroups.reduce((total, group) => total + group.scans.length, 0);
  if ($("factoryDailyDate")) $("factoryDailyDate").textContent = `${todayDate()} · 按今日实际完成的扫码记录统计`;
  if ($("factoryTodayInCount")) $("factoryTodayInCount").textContent = `${inboundGroups.length} 单 / ${inboundItems} 件`;
  if ($("factoryTodayOutCount")) $("factoryTodayOutCount").textContent = `${factoryDailyOutboundGroups.length} 单 / ${outboundItems} 件`;
  if ($("factoryTodayInTabCount")) $("factoryTodayInTabCount").textContent = `${inboundItems} 件`;
  if ($("factoryTodayOutTabCount")) $("factoryTodayOutTabCount").textContent = `${outboundItems} 件`;
  if ($("factoryDailySummaryIn")) $("factoryDailySummaryIn").textContent = String(inboundItems);
  if ($("factoryDailySummaryOut")) $("factoryDailySummaryOut").textContent = String(outboundItems);
  if ($("factoryTodayInList")) {
    $("factoryTodayInList").innerHTML = inboundGroups.length
      ? inboundGroups.map((group) => renderFactoryDailyOrder(group)).join("")
      : '<p class="hint">今天还没有完成入库的订单。</p>';
  }
  if ($("factoryTodayOutList")) {
    $("factoryTodayOutList").innerHTML = factoryDailyOutboundGroups.length
      ? factoryDailyOutboundGroups.map((group) => renderFactoryDailyOrder(group, true)).join("")
      : '<p class="hint">今天还没有完成出库的订单。</p>';
  }
  updateFactoryOutboundSelectionUi();
  switchFactoryDailyTab(factoryDailyActiveTab);
}

function toggleFactoryDailyPanel(forceExpanded = null) {
  const panel = document.querySelector(".factory-daily-panel");
  const button = $("factoryDailyCollapseBtn");
  if (!panel || !button) return;
  const expanded = forceExpanded === null ? panel.classList.contains("is-collapsed") : Boolean(forceExpanded);
  panel.classList.toggle("is-collapsed", !expanded);
  button.setAttribute("aria-expanded", String(expanded));
  button.textContent = expanded ? "收起" : "展开";
}

async function loadFactoryDailyScans() {
  if (!$("factoryTodayInList") && !$("factoryTodayOutList")) return;
  const range = factoryTodayRange();
  const { data, error } = await sb
    .from("factory_scans")
    .select("id,item_id,barcode,scan_type,created_at,order_items(*,orders(*))")
    .gte("created_at", range.start)
    .lt("created_at", range.end)
    .order("created_at", { ascending: true })
    .limit(2000);
  if (error) {
    const message = `<p class="warn">今日清单加载失败：${escapeHtml(error.message)}</p>`;
    if ($("factoryTodayInList")) $("factoryTodayInList").innerHTML = message;
    if ($("factoryTodayOutList")) $("factoryTodayOutList").innerHTML = message;
    return;
  }
  const latestByItemAndType = new Map();
  (data || []).map(normalizeFactoryScanRecord).forEach((record) => {
    latestByItemAndType.set(`${record.scan_type}:${record.item_id}`, record);
  });
  factoryDailyScans = [...latestByItemAndType.values()]
    .filter(factoryScanStillApplied)
    .sort((left, right) => new Date(left.created_at) - new Date(right.created_at));
  renderFactoryDailyLists();
}

function toggleFactoryOutboundOrder(key, checked) {
  if (checked) factorySelectedOutboundOrders.add(key);
  else factorySelectedOutboundOrders.delete(key);
  renderFactoryDailyLists();
  const selectedGroups = selectedFactoryOutboundGroups();
  const pages = selectedGroups.reduce((total, group) => total + group.scans.length, 0);
  setFactoryLabelStatus(
    pages ? `已选择 ${selectedGroups.length} 个订单，共生成 ${pages} 页贴纸。` : "请从今日出库清单中勾选需要打印的订单。",
    pages ? "ready" : "",
  );
}

function selectAllFactoryOutboundOrders() {
  factorySelectedOutboundOrders.clear();
  factoryDailyOutboundGroups.forEach((group) => factorySelectedOutboundOrders.add(group.key));
  renderFactoryDailyLists();
  const pages = factoryDailyOutboundGroups.reduce((total, group) => total + group.scans.length, 0);
  setFactoryLabelStatus(`已选择今日全部 ${factoryDailyOutboundGroups.length} 个订单，共 ${pages} 页。`, "ready");
}

function clearFactoryOutboundSelection() {
  factorySelectedOutboundOrders.clear();
  factoryLabelBatch.length = 0;
  renderFactoryDailyLists();
  setFactoryLabelStatus("已取消选择。");
}

function factoryModeLabel(mode = factoryScanMode) {
  return mode === "factory_in" ? "批量入库" : mode === "factory_out" ? "批量出库" : "";
}

function updateFactoryScanModeUi() {
  const inButton = $("factoryInBtn");
  const outButton = $("factoryOutBtn");
  const modeStatus = $("factoryModeStatus");
  if (inButton) inButton.setAttribute("aria-pressed", String(factoryScanMode === "factory_in"));
  if (outButton) outButton.setAttribute("aria-pressed", String(factoryScanMode === "factory_out"));
  if (inButton) inButton.disabled = factoryScanBusy;
  if (outButton) outButton.disabled = factoryScanBusy;
  if ($("manualScanBtn")) $("manualScanBtn").disabled = factoryScanBusy;
  if ($("startScanBtn")) $("startScanBtn").disabled = factoryScanBusy;
  if ($("stopScanBtn")) $("stopScanBtn").disabled = factoryScanBusy;
  if (modeStatus) {
    modeStatus.className = `scan-mode-status ${factoryScanMode === "factory_in" ? "in" : factoryScanMode === "factory_out" ? "out" : ""}`.trim();
    modeStatus.textContent = factoryScanMode
      ? `当前模式：${factoryModeLabel()}。扫码只加入待提交批次，确认整批后才会${factoryScanMode === "factory_in" ? "入库；配送员未点取件也可入库" : "出库；前序状态漏点也可直接出库"}。`
      : "请先选择本轮作业模式";
  }
  if ($("factoryScanCount")) $("factoryScanCount").textContent = `待提交 ${factoryScanQueue.length} 件`;
  if ($("factoryQueueCount")) $("factoryQueueCount").textContent = `${factoryScanQueue.length} 件`;
  if ($("factorySuccessCount")) $("factorySuccessCount").textContent = String(factoryScanSuccessCount);
  if ($("factoryFailureCount")) $("factoryFailureCount").textContent = String(factoryScanFailureCount);
  if ($("factoryPendingCount")) $("factoryPendingCount").textContent = String(factoryScanQueue.length);
  $("factoryCameraPanel")?.classList.toggle("hidden", !factoryScanMode || !factoryCameraExpanded);
  if ($("factoryCameraToggleBtn")) {
    $("factoryCameraToggleBtn").classList.toggle("hidden", !factoryScanMode);
    $("factoryCameraToggleBtn").innerHTML = factoryCameraExpanded
      ? '<i class="ri-camera-off-line" aria-hidden="true"></i><span>收起手机摄像头</span>'
      : '<i class="ri-camera-line" aria-hidden="true"></i><span>打开手机摄像头扫码</span>';
  }
  if ($("submitFactoryScanBatchBtn")) {
    const loadingCount = factoryScanQueue.filter((entry) => entry.loading).length;
    $("submitFactoryScanBatchBtn").disabled = !factoryScanMode || factoryScanQueue.length === 0 || factoryScanBusy || loadingCount > 0;
    $("submitFactoryScanBatchBtn").textContent = factoryScanMode
      ? loadingCount
        ? `正在读取品类（${loadingCount} 件）`
        : `确认整批${factoryScanMode === "factory_in" ? "入库" : "出库"}（${factoryScanQueue.length} 件）`
      : "确认整批处理";
  }
  const queueIsLoading = factoryScanQueue.some((entry) => entry.loading);
  if ($("undoFactoryScanBtn")) $("undoFactoryScanBtn").disabled = factoryScanQueue.length === 0 || factoryScanBusy || queueIsLoading;
  if ($("clearFactoryScanBatchBtn")) $("clearFactoryScanBatchBtn").disabled = factoryScanQueue.length === 0 || factoryScanBusy || queueIsLoading;
}

function renderFactoryScanQueue() {
  const list = $("factoryScanQueue");
  const empty = $("factoryScanQueueEmpty");
  if (list) {
    list.innerHTML = factoryScanQueue.map((entry, index) => `<li>
      <span class="factory-scan-queue-index">${index + 1}</span>
      <div class="factory-scan-queue-main"><strong class="factory-scan-queue-barcode">${escapeHtml(entry.barcode)}</strong><span class="factory-scan-queue-source">${escapeHtml(entry.itemName || entry.source || "扫码")}</span></div>
      ${entry.loading ? '<span class="factory-scan-queue-source">正在读取物品与结算品类...</span>' : settlementSchemaAvailable ? `<div class="factory-queue-settlement">
        <div class="factory-queue-settlement-heading"><select class="input" data-factory-queue-settlement="${index}">${settlementCategoryOptions(entry.settlementCategory)}</select><span class="settlement-status ${validSettlementCategoryKey(entry.settlementCategory) ? entry.settlementConfirmed ? "confirmed" : "suggested" : "pending"}">${validSettlementCategoryKey(entry.settlementCategory) ? entry.settlementConfirmed ? "已确认" : "提交批次时确认" : "请选择品类"}</span></div>
        <div class="settlement-other-fields ${entry.settlementCategory === SETTLEMENT_OTHER ? "" : "hidden"}" data-factory-other-fields="${index}">
          <input class="input" data-factory-other-name="${index}" value="${escapeHtml(entry.settlementOtherName || "")}" placeholder="实际品类名称" maxlength="40" />
          <select class="input compact-input" data-factory-other-unit="${index}"><option value="件" ${entry.settlementOtherUnit !== "双" ? "selected" : ""}>件</option><option value="双" ${entry.settlementOtherUnit === "双" ? "selected" : ""}>双</option></select>
          <input class="input compact-input" type="number" min="0" step="0.01" data-factory-other-cost="${index}" value="${entry.settlementCostSnapshot ?? ""}" placeholder="代工价" />
        </div>
      </div>` : ""}
    </li>`).join("");
    list.classList.toggle("hidden", factoryScanQueue.length === 0);
  }
  empty?.classList.toggle("hidden", factoryScanQueue.length > 0);
  updateFactoryScanModeUi();
}

async function queueFactoryBarcode(value, source = "扫码") {
  const barcode = text(value);
  if (!factoryScanMode) return factoryScanFailure(barcode, "请先选择批量入库或批量出库模式");
  if (!barcode) return factoryScanFailure("", "没有识别到水洗标");
  if (factoryScanBusy) return false;
  if (factoryProcessedBarcodes.has(barcode)) {
    return factoryScanFailure(barcode, "已经在本批次中，请继续扫描下一件");
  }
  factoryProcessedBarcodes.add(barcode);
  const entry = { barcode, source, loading: true, addedAt: new Date().toISOString() };
  factoryScanQueue.push(entry);
  if ($("barcodeInput")) $("barcodeInput").value = "";
  renderFactoryScanQueue();
  setFactoryScanFeedback(`${barcode} 已加入第 ${factoryScanQueue.length} 件，正在读取结算品类；可继续扫描。`, "processing");
  const { data: item, error } = await sb.from("order_items").select("*").eq("barcode", barcode).maybeSingle();
  if (error || !item) {
    const failedIndex = factoryScanQueue.indexOf(entry);
    if (failedIndex >= 0) factoryScanQueue.splice(failedIndex, 1);
    factoryProcessedBarcodes.delete(barcode);
    renderFactoryScanQueue();
    return factoryScanFailure(barcode, error?.message || "没有找到这个水洗标");
  }
  if (!factoryScanQueue.includes(entry)) return false;
  const settlement = resolvedSettlementCategory(item);
  const storedDefinition = settlementCategoryDefinition(settlement.storedKey);
  const storedIsActive = selectableSettlementCategoryKey(settlement.storedKey);
  const queueCategory = settlement.confirmed && storedIsActive
    ? settlement.storedKey
    : selectableSettlementCategoryKey(settlement.suggestionKey)
      ? settlement.suggestionKey
      : SETTLEMENT_OTHER;
  Object.assign(entry, {
    itemId: item.id,
    itemName: washItemShortName(item),
    settlementCategory: queueCategory,
    settlementConfirmed: settlement.confirmed && storedIsActive,
    settlementOtherName: queueCategory === SETTLEMENT_OTHER
      ? settlement.otherName || (!storedIsActive && storedDefinition ? storedDefinition.label : "")
      : "",
    settlementOtherUnit: queueCategory === SETTLEMENT_OTHER
      ? settlement.otherUnit || storedDefinition?.unit || "件"
      : (settlementCategoryDefinition(queueCategory)?.unit || "件"),
    settlementCostSnapshot: settlement.costSnapshot ?? storedDefinition?.costPrice ?? null,
    settlementReason: settlement.suggestionReason,
    loading: false,
  });
  factoryScanSuccessCount += 1;
  renderFactoryScanQueue();
  const queuePosition = factoryScanQueue.indexOf(entry) + 1;
  addFactoryScanHistory(`${barcode} 已加入待提交批次第 ${queuePosition} 件`, "success");
  setFactoryScanFeedback(`${barcode} 已加入第 ${queuePosition} 件，继续扫描；扫完后点击“确认整批处理”。`, "success");
  notifyFactoryScan(true);
  return true;
}

function removeLastFactoryQueuedBarcode() {
  if (!factoryScanQueue.length || factoryScanBusy) return;
  const removed = factoryScanQueue.pop();
  factoryProcessedBarcodes.delete(removed.barcode);
  factoryScanSuccessCount = Math.max(0, factoryScanSuccessCount - 1);
  if (factoryLastSeenBarcode === removed.barcode) {
    factoryLastSeenBarcode = "";
    factoryLastSeenAt = 0;
  }
  renderFactoryScanQueue();
  addFactoryScanHistory(`${removed.barcode} 已从待提交批次移除`, "undo");
  setFactoryScanFeedback(`${removed.barcode} 已移除，当前待提交 ${factoryScanQueue.length} 件。`, "idle");
}

function clearFactoryScanQueue(options = {}) {
  if (!factoryScanQueue.length || factoryScanBusy) return;
  if (!options.silent && !confirm(`确定清空当前 ${factoryScanQueue.length} 件待提交扫码吗？尚未修改订单状态。`)) return;
  factoryScanQueue.length = 0;
  factoryProcessedBarcodes.clear();
  factoryLastSeenBarcode = "";
  factoryLastSeenAt = 0;
  factoryScanSuccessCount = 0;
  factoryScanFailureCount = 0;
  renderFactoryScanQueue();
  if (!options.silent) {
    addFactoryScanHistory("已清空待提交批次", "undo");
    setFactoryScanFeedback("待提交批次已清空，可重新扫码。", "idle");
  }
}

function setFactoryScanFeedback(message, state = "idle") {
  const target = $("scanResult");
  if (!target) return;
  target.className = `scan-feedback ${state}`;
  target.textContent = message;
}

function renderFactoryScanHistory() {
  const target = $("factoryScanHistory");
  if (!target) return;
  if (!factoryScanHistory.length) {
    target.innerHTML = '<li class="empty">本轮还没有处理记录</li>';
    return;
  }
  target.innerHTML = factoryScanHistory.slice(0, 8).map((entry) => `
    <li class="${entry.state}">
      <span>${escapeHtml(entry.message)}</span>
      <time>${escapeHtml(entry.time)}</time>
    </li>`).join("");
}

function addFactoryScanHistory(message, state = "success") {
  factoryScanHistory.unshift({
    message,
    state,
    time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
  });
  renderFactoryScanHistory();
}

function factoryLabelData(item, scannedAt = "") {
  const order = Array.isArray(item?.orders) ? item.orders[0] : item?.orders || {};
  return {
    barcode: text(item?.barcode),
    campus: washLabelCampus(order),
    customerName: text(order.customer_name),
    phone: text(order.phone),
    itemName: text(item?.spec || item?.product_name),
    afterSalesPhone: AFTER_SALES_PHONE,
    scannedAt: scannedAt || new Date().toISOString(),
  };
}

function setFactoryLabelStatus(message, tone = "") {
  const target = $("factoryLabelStatus");
  if (!target) return;
  target.className = `factory-label-status ${tone}`.trim();
  target.textContent = message;
}

function validFactoryBatchLabel(label) {
  return Boolean(label && typeof label === "object" && text(label.barcode));
}

function factoryLabelFields(label) {
  return [
    ["条码", label.barcode, "barcode-value"],
    ["校区", label.campus, ""],
    ["姓名", label.customerName, ""],
    ["电话", label.phone, ""],
    ["物品", label.itemName, ""],
    ["售后", label.afterSalesPhone, ""],
  ];
}

function factoryLabelPageMarkup(label, index) {
  return `<section class="label-page" aria-label="第 ${index + 1} 页贴纸">
    <table>
      <colgroup><col style="width: 14mm" /><col style="width: 38mm" /></colgroup>
      <tbody>
        <tr><th colspan="2">事事通超级洗护馆</th></tr>
        ${factoryLabelFields(label).map(([name, value, className]) => `<tr><td>${name}</td><td class="${className}">${escapeHtml(value)}</td></tr>`).join("")}
      </tbody>
    </table>
  </section>`;
}

function factoryLabelPrintDocument(labels) {
  const pages = (Array.isArray(labels) ? labels : []).filter(validFactoryBatchLabel);
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>出库贴纸批次 - ${pages.length} 页</title>
    <style>
      @page { size: 60mm 60mm; margin: 0; }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        color: #000;
        font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
      }
      .label-page {
        width: 60mm;
        height: 60mm;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: #fff;
        break-after: page;
        page-break-after: always;
      }
      .label-page:last-child {
        break-after: auto;
        page-break-after: auto;
      }
      table {
        width: 52mm;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 9.5pt;
        font-weight: 700;
      }
      th, td {
        border: 0.35mm solid #000;
        padding: 1.05mm 1mm;
        line-height: 1.15;
        text-align: center;
        overflow-wrap: anywhere;
        word-break: break-all;
      }
      th {
        padding: 1.45mm 1mm;
        font-size: 14pt;
        font-weight: 900;
      }
      td:first-child { width: 14mm; }
      td:last-child { width: 38mm; }
      .barcode-value {
        font-family: Consolas, "Courier New", monospace;
        font-size: 8.3pt;
        letter-spacing: 0.05mm;
        white-space: nowrap;
      }
      @media screen {
        body { padding: 4mm 0; background: #dfe3e6; }
        .label-page {
          margin: 0 auto 4mm;
          box-shadow: 0 2mm 6mm rgba(0, 0, 0, 0.18);
        }
      }
      @media print {
        html, body { background: #fff; }
        .label-page { margin: 0; box-shadow: none; }
      }
    </style>
  </head>
  <body>${pages.map(factoryLabelPageMarkup).join("")}</body>
</html>`;
}

function drawFittedLabelText(context, value, centerX, centerY, maxWidth, options = {}) {
  const family = options.family || '"Microsoft YaHei", "PingFang SC", sans-serif';
  const weight = options.weight || 700;
  const minSize = options.minSize || 13;
  let fontSize = options.maxSize || 20;
  let content = text(value) || "-";
  const setFont = () => {
    context.font = `${weight} ${fontSize}px ${family}`;
  };
  setFont();
  while (fontSize > minSize && context.measureText(content).width > maxWidth) {
    fontSize -= 1;
    setFont();
  }
  if (context.measureText(content).width > maxWidth) {
    let shortened = content;
    while (shortened.length > 1 && context.measureText(`${shortened}…`).width > maxWidth) shortened = shortened.slice(0, -1);
    content = `${shortened}…`;
  }
  context.fillText(content, centerX, centerY);
}

function factoryLabelPaperSize() {
  const selected = text($("factoryLabelPaperSize")?.value) || "60x60";
  const sizes = {
    "60x60": { widthMm: 60, heightMm: 60 },
    "60x50": { widthMm: 60, heightMm: 50 },
    "60x40": { widthMm: 60, heightMm: 40 },
  };
  const size = sizes[selected] || sizes["60x60"];
  return {
    ...size,
    key: `${size.widthMm}x${size.heightMm}`,
    label: `${size.widthMm}×${size.heightMm} mm`,
  };
}

function renderFactoryLabelCanvas(label, paperSize = factoryLabelPaperSize()) {
  const dpi = 203;
  const pixelsPerMillimeter = dpi / 25.4;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(paperSize.widthMm * pixelsPerMillimeter);
  canvas.height = Math.round(paperSize.heightMm * pixelsPerMillimeter);
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#000";
  context.strokeStyle = "#000";
  context.lineWidth = Math.max(2, Math.round(pixelsPerMillimeter * 0.32));
  context.textAlign = "center";
  context.textBaseline = "middle";

  // 满版布局：仅保留约 1.8 mm 校准安全边距，其余空间全部用于表格和文字。
  const safeMargin = Math.round(1.8 * pixelsPerMillimeter);
  const tableX = safeMargin;
  const tableY = safeMargin;
  const tableWidth = canvas.width - safeMargin * 2;
  const tableHeight = canvas.height - safeMargin * 2;
  const firstColumnWidth = Math.round(tableWidth * 0.31);
  const titleHeight = Math.round(tableHeight * 0.18);
  const rows = factoryLabelFields(label);
  const rowHeight = (tableHeight - titleHeight) / rows.length;
  const rightColumnWidth = tableWidth - firstColumnWidth;
  const titleFontSize = Math.min(36, Math.floor(titleHeight * 0.48));
  const rowFontSize = Math.min(30, Math.floor(rowHeight * 0.58));

  context.strokeRect(tableX + 1, tableY + 1, tableWidth - 2, tableHeight - 2);
  context.beginPath();
  context.moveTo(tableX, tableY + titleHeight);
  context.lineTo(tableX + tableWidth, tableY + titleHeight);
  for (let index = 1; index < rows.length; index += 1) {
    const y = tableY + titleHeight + rowHeight * index;
    context.moveTo(tableX, y);
    context.lineTo(tableX + tableWidth, y);
  }
  context.moveTo(tableX + firstColumnWidth, tableY + titleHeight);
  context.lineTo(tableX + firstColumnWidth, tableY + tableHeight);
  context.stroke();

  drawFittedLabelText(context, "事事通超级洗护馆", tableX + tableWidth / 2, tableY + titleHeight / 2, tableWidth - 12, {
    maxSize: titleFontSize,
    minSize: Math.max(20, titleFontSize - 8),
    weight: 900,
  });

  rows.forEach(([name, value, className], index) => {
    const centerY = tableY + titleHeight + rowHeight * index + rowHeight / 2;
    drawFittedLabelText(context, name, tableX + firstColumnWidth / 2, centerY, firstColumnWidth - 8, {
      maxSize: Math.max(20, rowFontSize - 2),
      minSize: Math.max(14, rowFontSize - 9),
      weight: 800,
    });
    drawFittedLabelText(context, value, tableX + firstColumnWidth + rightColumnWidth / 2, centerY, rightColumnWidth - 10, {
      maxSize: className === "barcode-value" ? Math.max(20, rowFontSize - 1) : rowFontSize,
      minSize: Math.max(13, rowFontSize - 12),
      family: className === "barcode-value" ? 'Consolas, "Courier New", monospace' : undefined,
      weight: 800,
    });
  });
  return canvas;
}

async function buildFactoryLabelPdfBlob(labels) {
  await ensurePdfLib();
  if (document.fonts?.ready) await document.fonts.ready;
  const pdfDocument = await window.PDFLib.PDFDocument.create();
  const paperSize = factoryLabelPaperSize();
  const pageWidthPoints = paperSize.widthMm * 72 / 25.4;
  const pageHeightPoints = paperSize.heightMm * 72 / 25.4;
  pdfDocument.setTitle(`事事通出库贴纸_${labels.length}页`);
  pdfDocument.setSubject(`XP-420B ${paperSize.label} 出库贴纸`);
  for (const label of labels.filter(validFactoryBatchLabel)) {
    const page = pdfDocument.addPage([pageWidthPoints, pageHeightPoints]);
    const canvas = renderFactoryLabelCanvas(label, paperSize);
    const image = await pdfDocument.embedPng(canvas.toDataURL("image/png"));
    page.drawImage(image, { x: 0, y: 0, width: pageWidthPoints, height: pageHeightPoints });
  }
  const bytes = await pdfDocument.save();
  return new Blob([bytes], { type: "application/pdf" });
}

async function printFactoryLabelBatch() {
  rebuildFactoryLabelBatchFromSelection();
  if (!factoryLabelBatch.length) {
    setFactoryLabelStatus("请先从今日出库清单勾选需要打印的订单。", "error");
    return false;
  }
  const frame = $("factoryLabelPrintFrame");
  if (!frame) {
    setFactoryLabelStatus("打印组件未加载，请刷新页面后重试。", "error");
    return false;
  }
  const labels = factoryLabelBatch.map((label) => ({ ...label }));
  const paperSize = factoryLabelPaperSize();
  setFactoryLabelStatus(`正在生成 ${labels.length} 页 ${paperSize.label} PDF……`, "ready");
  try {
    const blob = await buildFactoryLabelPdfBlob(labels);
    const url = URL.createObjectURL(blob);
    frame.onload = () => {
      window.setTimeout(() => {
        try {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
          setFactoryLabelStatus(`已打开 ${labels.length} 页 PDF 打印窗口。XP-420B 请选择“${paperSize.label}、实际大小”。`, "printed");
        } catch {
          setFactoryLabelStatus("PDF 已生成，但浏览器阻止了自动打印；请使用“生成 PDF 打印文件”后手动打印。", "error");
        }
      }, 700);
    };
    frame.src = url;
    window.setTimeout(() => URL.revokeObjectURL(url), 120000);
    return true;
  } catch (error) {
    setFactoryLabelStatus(`生成 PDF 失败：${error.message}`, "error");
    return false;
  }
}

function factoryLabelBatchFileName() {
  const now = new Date();
  const paperSize = factoryLabelPaperSize();
  return `出库贴纸_${paperSize.key}mm_${dateOnly(now)}_${pad(now.getHours())}${pad(now.getMinutes())}_${factoryLabelBatch.length}页.pdf`;
}

async function downloadFactoryLabelBatch() {
  rebuildFactoryLabelBatchFromSelection();
  if (!factoryLabelBatch.length) {
    setFactoryLabelStatus("请先从今日出库清单勾选需要生成贴纸的订单。", "error");
    return;
  }
  const paperSize = factoryLabelPaperSize();
  setFactoryLabelStatus(`正在生成 ${factoryLabelBatch.length} 页 ${paperSize.label} PDF……`, "ready");
  try {
    const blob = await buildFactoryLabelPdfBlob(factoryLabelBatch);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = factoryLabelBatchFileName();
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    setFactoryLabelStatus(`已下载 ${factoryLabelBatch.length} 页 PDF。打印时选择 XP-420B、${paperSize.label}、实际大小。`, "printed");
  } catch (error) {
    setFactoryLabelStatus(`生成 PDF 失败：${error.message}`, "error");
  }
}

function playFactoryScanTone(success = true) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = success ? 880 : 220;
    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + (success ? 0.12 : 0.28));
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + (success ? 0.12 : 0.28));
    oscillator.addEventListener("ended", () => audioContext.close(), { once: true });
  } catch {
    // 声音反馈不可用时仍保留震动和文字反馈。
  }
}

function notifyFactoryScan(success) {
  playFactoryScanTone(success);
  if (navigator.vibrate) navigator.vibrate(success ? 90 : [120, 70, 120]);
}

async function refreshFactoryAfterScan() {
  await Promise.all([loadFactoryItems(), loadFactoryDailyScans()]);
  if (APP_MODE === "admin") await loadStats();
}

async function activateFactoryScanMode(mode) {
  if (!currentUser) return alert("请先登录工厂账号");
  if (!["factory_in", "factory_out"].includes(mode)) return;
  if (factoryScanQueue.length && factoryScanMode && factoryScanMode !== mode) {
    return alert(`当前还有 ${factoryScanQueue.length} 件待提交，请先确认处理或清空本批，再切换模式。`);
  }
  const changed = factoryScanMode !== mode;
  factoryScanMode = mode;
  if (changed) {
    factoryLastSeenBarcode = "";
    factoryLastSeenAt = 0;
    factoryScanHistory.length = 0;
    factoryScanSuccessCount = factoryScanQueue.length;
    factoryScanFailureCount = 0;
    renderFactoryScanHistory();
  }
  renderFactoryScanQueue();
  updateFactoryScanModeUi();
  const batchNotice = factoryScanQueue.length ? ` 当前已有 ${factoryScanQueue.length} 件，将继续追加。` : "";
  setFactoryScanFeedback(`${factoryModeLabel()}已就绪，可用扫码枪、手动输入或打开手机摄像头。${batchNotice}`, "processing");
  $("barcodeInput")?.focus();
}

function endFactoryScanSession() {
  stopScanner();
  factoryCameraExpanded = false;
  updateFactoryScanModeUi();
  setFactoryScanFeedback(
    factoryScanQueue.length
      ? `摄像头已停止，${factoryScanQueue.length} 件仍在待提交批次中；确认无误后统一处理。`
      : "摄像头已停止，当前没有待提交条码。",
    "idle",
  );
}

function toggleFactoryCamera() {
  if (factoryCameraExpanded || scannerIsActive) endFactoryScanSession();
  else startScanner();
}

async function startScanner() {
  if (!factoryScanMode) {
    setFactoryScanFeedback("请先选择“批量入库”或“批量出库”。", "error");
    return;
  }
  if (!window.isSecureContext) {
    setFactoryScanFeedback("摄像头只能在 HTTPS 页面中使用，请通过已发布的网站地址打开。", "error");
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    setFactoryScanFeedback("当前浏览器不能持续调用摄像头，请改用 Safari/Chrome，或点击“拍照识别”。", "error");
    return;
  }
  factoryCameraExpanded = true;
  updateFactoryScanModeUi();
  stopScanner();
  const session = scanSession;
  setFactoryScanFeedback("正在请求后置摄像头权限，支持二维码和条形码...", "processing");
  try {
    await startNativeScanner(session);
  } catch (nativeError) {
    if (session !== scanSession) return;
    try {
      await startZxingScanner(session);
    } catch (zxingError) {
      if (session !== scanSession) return;
      setFactoryScanFeedback(cameraErrorMessage(zxingError || nativeError), "error");
    }
  }
}

function stopScanner() {
  scanSession += 1;
  scannerIsActive = false;
  clearInterval(scanTimer);
  scanTimer = null;
  if (scanControls?.stop) scanControls.stop();
  scanControls = null;
  if (scanStream) scanStream.getTracks().forEach((track) => track.stop());
  scanStream = null;
  const video = $("scanVideo");
  if (video) {
    video.pause();
    video.srcObject = null;
  }
  torchEnabled = false;
  const torchButton = $("toggleTorchBtn");
  if (torchButton) {
    torchButton.textContent = "打开补光灯";
    torchButton.classList.add("hidden");
  }
}

function loadZxing() {
  if (window.ZXingBrowser) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-zxing-loader="true"]');
    if (existing) {
      if (existing.dataset.state === "loaded") return resolve();
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", () => reject(new Error("备用扫码组件加载失败")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@zxing/browser@0.2.0/umd/zxing-browser.min.js";
    script.dataset.zxingLoader = "true";
    script.onload = () => {
      script.dataset.state = "loaded";
      resolve();
    };
    script.onerror = () => {
      script.remove();
      reject(new Error("扫码组件加载失败，请检查网络后重试"));
    };
    document.head.appendChild(script);
  });
}

function rearCameraConstraints() {
  return {
    audio: false,
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 24, max: 30 },
    },
  };
}

async function acceptScannedBarcode(rawValue, source = "摄像头") {
  const value = text(rawValue);
  if (!value) return;
  if (factoryScanBusy) return;
  const now = Date.now();
  if (value === factoryLastSeenBarcode && now - factoryLastSeenAt < 2500) return;
  factoryLastSeenBarcode = value;
  factoryLastSeenAt = now;
  if ($("barcodeInput")) $("barcodeInput").value = value;
  if (!factoryScanMode) {
    setFactoryScanFeedback(`${source}已识别 ${value}，请先选择批量入库或批量出库模式。`, "error");
    notifyFactoryScan(false);
    return;
  }
  if (factoryProcessedBarcodes.has(value)) {
    if (source !== "摄像头") {
      setFactoryScanFeedback(`${value} 已经在待提交批次中，请换下一件。`, "error");
      notifyFactoryScan(false);
    }
    return;
  }
  await queueFactoryBarcode(value, source);
}

function cameraErrorMessage(error) {
  const name = error?.name || "";
  const inAppBrowser = /MicroMessenger|QQ\//i.test(navigator.userAgent);
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "摄像头权限被拒绝。请在浏览器的网站设置中允许相机后重试，或使用“拍照识别”。";
  }
  if (name === "NotReadableError" || name === "AbortError") {
    return "摄像头正被其他应用占用。请关闭微信扫一扫、相机等应用后重试。";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "没有找到可用的后置摄像头，请使用“拍照识别”或手动输入水洗标。";
  }
  if (inAppBrowser) {
    return "微信/QQ 内置浏览器的摄像头兼容性受限，请点右上角用 Safari 或 Chrome 打开，或使用“拍照识别”。";
  }
  return `摄像头扫码不可用：${error?.message || "未知错误"}。可使用“拍照识别”或手动输入水洗标。`;
}

function updateTorchButton() {
  const button = $("toggleTorchBtn");
  const track = $("scanVideo")?.srcObject?.getVideoTracks?.()[0];
  const supportsTorch = Boolean(track?.getCapabilities?.().torch && scanControls?.switchTorch);
  button?.classList.toggle("hidden", !supportsTorch);
}

async function toggleTorch() {
  if (!scanControls?.switchTorch) return;
  try {
    await scanControls.switchTorch();
    torchEnabled = !torchEnabled;
    if ($("toggleTorchBtn")) $("toggleTorchBtn").textContent = torchEnabled ? "关闭补光灯" : "打开补光灯";
  } catch {
    $("toggleTorchBtn")?.classList.add("hidden");
    setFactoryScanFeedback("当前手机不支持网页控制补光灯，请保持环境明亮。", "error");
  }
}

async function startZxingScanner(session) {
  setFactoryScanFeedback("正在加载二维码/条形码兼容识别组件...", "processing");
  await loadZxing();
  if (!window.ZXingBrowser?.BrowserMultiFormatReader) throw new Error("备用扫码组件不可用");
  const reader = new ZXingBrowser.BrowserMultiFormatReader();
  const controls = await reader.decodeFromConstraints(rearCameraConstraints(), $("scanVideo"), (result) => {
    const value = result?.getText?.() || "";
    if (value) void acceptScannedBarcode(value);
  });
  if (session !== scanSession) {
    controls.stop();
    return;
  }
  scanControls = controls;
  scannerIsActive = true;
  updateTorchButton();
  setFactoryScanFeedback(`${factoryModeLabel()}进行中，支持二维码和Code-128条形码，请将码放在画面中央。`, "processing");
}

async function startNativeScanner(session) {
  if (!("BarcodeDetector" in window)) throw new Error("当前浏览器不支持条码识别");
  const wantedFormats = ["qr_code", "code_128", "data_matrix", "code_39", "ean_13"];
  const supportedFormats = await BarcodeDetector.getSupportedFormats();
  const formats = wantedFormats.filter((format) => supportedFormats.includes(format));
  if (!formats.length) throw new Error("当前浏览器不支持水洗标条码格式");
  const stream = await navigator.mediaDevices.getUserMedia(rearCameraConstraints());
  if (session !== scanSession) {
    stream.getTracks().forEach((track) => track.stop());
    return;
  }
  scanStream = stream;
  $("scanVideo").srcObject = stream;
  await $("scanVideo").play();
  const detector = new BarcodeDetector({ formats });
  let detecting = false;
  scanTimer = setInterval(async () => {
    if (detecting || session !== scanSession) return;
    detecting = true;
    try {
      const codes = await detector.detect($("scanVideo"));
      if (codes[0]?.rawValue) void acceptScannedBarcode(codes[0].rawValue);
    } catch (error) {
      clearInterval(scanTimer);
      scanTimer = null;
      scannerIsActive = false;
      setFactoryScanFeedback(cameraErrorMessage(error), "error");
    } finally {
      detecting = false;
    }
  }, 250);
  scannerIsActive = true;
  setFactoryScanFeedback(`${factoryModeLabel()}进行中，支持二维码和Code-128条形码，请将码放在画面中央。`, "processing");
}

async function handleBarcodePhoto(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  let objectUrl = "";
  if (!factoryScanMode) {
    setFactoryScanFeedback("请先选择入库或出库模式，再拍照识别。", "error");
    event.target.value = "";
    return;
  }
  setFactoryScanFeedback("正在识别照片中的二维码或条形码...", "processing");
  try {
    await loadZxing();
    if (!window.ZXingBrowser?.BrowserMultiFormatReader) throw new Error("扫码组件不可用");
    objectUrl = URL.createObjectURL(file);
    const reader = new ZXingBrowser.BrowserMultiFormatReader();
    const result = await reader.decodeFromImageUrl(objectUrl);
    await acceptScannedBarcode(result?.getText?.() || "", "照片");
  } catch {
    setFactoryScanFeedback("照片中没有识别到二维码或条形码。请靠近水洗标、保持清晰和光线充足后重拍。", "error");
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    event.target.value = "";
  }
}

function returnTaskPayload(task) {
  if (!task) return null;
  return {
    id: task.id,
    item_id: task.item_id,
    outbound_date: task.outbound_date,
    status: task.status,
    exception_note: task.exception_note || "",
    operator_id: task.operator_id || null,
    updated_at: task.updated_at,
  };
}

async function restoreFactoryState(action) {
  if (!action?.itemId) return;
  await sb.from("order_items").update({ item_status: action.previousItemStatus, updated_at: new Date().toISOString() }).eq("id", action.itemId);
  if (action.scanType !== "factory_out") return;
  if (action.previousReturnTask) {
    await sb.from("return_tasks").upsert(returnTaskPayload(action.previousReturnTask), { onConflict: "item_id" });
  } else {
    await sb.from("return_tasks").delete().eq("item_id", action.itemId);
  }
}

function factoryScanFailure(barcode, message) {
  const prefix = barcode ? `${barcode}：` : "";
  factoryScanFailureCount += 1;
  updateFactoryScanModeUi();
  setFactoryScanFeedback(`${prefix}${message}`, "error");
  addFactoryScanHistory(`${prefix}${message}`, "error");
  notifyFactoryScan(false);
  return false;
}

function factoryScanStatusCheck(scanType, itemStatus) {
  const status = text(itemStatus);
  if (scanType === "factory_in") {
    if (status === "已入厂" || status === "清洗中") return { allowed: false, message: "已经入库，无需重复操作" };
    if (["已出库", "配送中", "已送达"].includes(status)) return { allowed: false, message: `当前状态为“${status}”，不能倒退为入库` };
    return FACTORY_IN_OVERRIDE_STATUSES.has(status)
      ? { allowed: true, override: status !== "已取件" }
      : { allowed: false, message: `当前状态为“${status || "未知"}”，无法确认能否入库` };
  }
  if (status === "已出库") return { allowed: false, message: "已经出库；如需贴纸，请在今日出库清单中勾选" };
  if (["配送中", "已送达"].includes(status)) return { allowed: false, message: `当前状态为“${status}”，不能重复出库` };
  return FACTORY_OUT_OVERRIDE_STATUSES.has(status)
    ? { allowed: true, override: !["已入厂", "清洗中"].includes(status) }
    : { allowed: false, message: `当前状态为“${status || "未知"}”，无法确认能否出库` };
}

async function factoryScan(scanType, suppliedBarcode = "", options = {}) {
  if (!currentUser) {
    alert("请先登录工厂账号");
    return false;
  }
  const barcode = text(suppliedBarcode || $("barcodeInput")?.value);
  if (!barcode) return factoryScanFailure("", "请先扫码或输入水洗标");
  if (!["factory_in", "factory_out"].includes(scanType)) return factoryScanFailure(barcode, "请先选择入库或出库模式");
  if (factoryScanBusy && !options.batchCommit) return false;

  if (!options.batchCommit) factoryScanBusy = true;
  updateFactoryScanModeUi();
  setFactoryScanFeedback(`${options.source || "整批提交"}：正在处理 ${barcode}...`, "processing");

  let rollbackAction = null;
  try {
    const { data: item, error } = await sb.from("order_items").select("*, orders(*)").eq("barcode", barcode).maybeSingle();
    if (error) throw new Error(error.message);
    if (!item) throw new Error("没有找到这个水洗标");
    const returningWithoutWash = washDecisionIsReturn(item);

    if (scanType === "factory_out" && item.wash_decision === WASH_DECISION_SUPPLEMENT_PENDING) {
      throw new Error("该水洗标正在等待客户补差，确认已补差后才能出库");
    }

    const statusCheck = factoryScanStatusCheck(scanType, item.item_status);
    if (!statusCheck.allowed) throw new Error(statusCheck.message);

    let previousReturnTask = null;
    if (scanType === "factory_out") {
      const { data: task, error: taskError } = await sb.from("return_tasks").select("*").eq("item_id", item.id).maybeSingle();
      if (taskError) throw new Error(taskError.message);
      previousReturnTask = task;
    }

    const status = scanType === "factory_in" ? "已入厂" : "已出库";
    rollbackAction = {
      itemId: item.id,
      orderId: item.order_id,
      barcode,
      scanType,
      resultStatus: status,
      previousItemStatus: item.item_status,
      previousReturnTask,
    };

    const updatedAt = new Date().toISOString();
    const { error: itemError } = await sb.from("order_items").update({ item_status: status, updated_at: updatedAt }).eq("id", item.id);
    if (itemError) throw new Error(itemError.message);

    const { error: flowError } = await sb.rpc("sync_order_flow_state", { target_order_id: item.order_id });
    if (flowError) {
      await restoreFactoryState(rollbackAction);
      rollbackAction = null;
      throw new Error(`订单状态同步失败：${flowError.message}`);
    }

    if (scanType === "factory_out") {
      const { error: returnError } = await sb.from("return_tasks").upsert({
        item_id: item.id,
        outbound_date: todayDate(),
        status: "待送回",
        exception_note: "",
        operator_id: currentProfile?.id || null,
        updated_at: updatedAt,
      }, { onConflict: "item_id" });
      if (returnError) {
        await restoreFactoryState(rollbackAction);
        rollbackAction = null;
        throw new Error(returnError.message);
      }
    }

    const { error: scanError } = await sb.from("factory_scans").insert({
      item_id: item.id,
      barcode,
      scan_type: scanType,
      operator_id: currentProfile?.id || null,
    });
    if (scanError) {
      await restoreFactoryState(rollbackAction);
      rollbackAction = null;
      throw new Error(scanError.message);
    }

    await insertLog({
      orderId: item.order_id,
      itemId: item.id,
      barcode,
      status,
      note: scanType === "factory_in"
        ? `工厂批量扫码入库${statusCheck.override ? `（工厂优先：原状态 ${item.item_status || "未知"}）` : ""}`
        : returningWithoutWash
          ? `退洗物品批量扫码出库，生成送回任务${statusCheck.override ? `（工厂优先：原状态 ${item.item_status || "未知"}）` : ""}`
          : `工厂批量扫码出库，生成送回任务${statusCheck.override ? `（工厂优先：原状态 ${item.item_status || "未知"}）` : ""}`,
    });

    if ($("barcodeInput")) $("barcodeInput").value = "";
    setFactoryScanFeedback(
      `成功：${barcode} 已${scanType === "factory_in" ? "入库" : returningWithoutWash ? "作为退洗物品出库并进入送回清单" : "出库并进入今日出库清单"}。`,
      "success",
    );
    addFactoryScanHistory(`${barcode} 已${scanType === "factory_in" ? "入库" : "出库"}`, "success");
    if (!options.batchCommit) notifyFactoryScan(true);
    if (!options.suppressRefresh) await refreshFactoryAfterScan();
    return true;
  } catch (error) {
    return factoryScanFailure(barcode, error?.message || "处理失败，请重试");
  } finally {
    if (!options.batchCommit) factoryScanBusy = false;
    updateFactoryScanModeUi();
  }
}

async function processManualFactoryScan() {
  const barcode = text($("barcodeInput")?.value);
  await queueFactoryBarcode(barcode, "手动输入");
}

async function submitFactoryScanBatch() {
  if (!factoryScanMode) return factoryScanFailure("", "请先选择批量入库或批量出库模式");
  if (!factoryScanQueue.length || factoryScanBusy) return false;
  if (factoryScanQueue.some((entry) => entry.loading)) {
    setFactoryScanFeedback("还有水洗标正在读取，请稍候再确认整批处理。", "processing");
    return false;
  }
  if (settlementSchemaAvailable) {
    const missingCategories = factoryScanQueue.filter((entry) => !validSettlementCategoryKey(entry.settlementCategory)
      || !settlementDetailsAreValid(entry.settlementCategory, entry.settlementOtherName, entry.settlementCostSnapshot));
    if (missingCategories.length) {
      setFactoryScanFeedback(`还有 ${missingCategories.length} 件未完成结算品类；其他品类需填写实际名称和代工价。`, "error");
      return false;
    }
  }
  const scanType = factoryScanMode;
  const queued = factoryScanQueue.map((entry) => ({ ...entry }));
  const completed = [];
  const failed = [];
  stopScanner();
  factoryScanBusy = true;
  updateFactoryScanModeUi();
  try {
    for (let index = 0; index < queued.length; index += 1) {
      const entry = queued[index];
      setFactoryScanFeedback(
        `正在统一${scanType === "factory_in" ? "入库" : "出库"}：${index + 1}/${queued.length} · ${entry.barcode}`,
        "processing",
      );
      if (settlementSchemaAvailable) {
        const categoryResult = await persistSettlementCategory(entry.itemId, entry.settlementCategory, {
          otherName: entry.settlementOtherName,
          otherUnit: entry.settlementOtherUnit,
          cost: entry.settlementCostSnapshot,
        });
        if (categoryResult.error) {
          factoryScanFailure(entry.barcode, `结算品类保存失败：${categoryResult.error.message}`);
          failed.push(entry);
          continue;
        }
      }
      const succeeded = await factoryScan(scanType, entry.barcode, {
        source: "整批提交",
        batchCommit: true,
        suppressRefresh: true,
      });
      if (succeeded) completed.push(entry);
      else failed.push(entry);
    }
  } finally {
    factoryScanQueue.length = 0;
    factoryScanQueue.push(...failed);
    factoryProcessedBarcodes.clear();
    failed.forEach((entry) => factoryProcessedBarcodes.add(entry.barcode));
    factoryScanSuccessCount = completed.length;
    factoryScanFailureCount = failed.length;
    factoryScanBusy = false;
    renderFactoryScanQueue();
  }
  factoryDailyActiveTab = scanType === "factory_in" ? "in" : "out";
  await refreshFactoryAfterScan();
  if (completed.length) notifyFactoryScan(true);
  if (failed.length) {
    setFactoryScanFeedback(
      `整批处理完成：成功 ${completed.length} 件，失败 ${failed.length} 件。失败条码已保留，请查看记录后移除或重试。`,
      "error",
    );
  } else {
    setFactoryScanFeedback(
      `整批${scanType === "factory_in" ? "入库" : "出库"}完成，共 ${completed.length} 件。已更新今日清单。`,
      "success",
    );
  }
  return failed.length === 0;
}

function undoLastFactoryScan() {
  removeLastFactoryQueuedBarcode();
}

async function copyText(value) {
  const content = String(value || "");
  if (!content) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(content);
    } else {
      const input = document.createElement("textarea");
      input.value = content;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    alert("客服电话已复制");
  } catch (error) {
    alert(`复制失败，请手动复制：${content}`);
  }
}

function hydrateStaticContent() {
  document.querySelectorAll("[data-service-phone]").forEach((node) => {
    node.textContent = AFTER_SALES_PHONE;
  });
  document.querySelectorAll("[data-service-phone-link]").forEach((node) => {
    node.setAttribute("href", `tel:${AFTER_SALES_PHONE}`);
  });
  document.querySelectorAll("details.student-qr-card").forEach((details) => {
    details.addEventListener("toggle", () => {
      if (!details.open) return;
      const image = details.querySelector("img[data-lazy-src]");
      if (image && !image.getAttribute("src")) image.setAttribute("src", image.dataset.lazySrc);
    });
  });
}

async function loadStudentTimeline(phone) {
  const { data, error } = await sb.rpc("track_timeline_by_phone", { query_phone: phone });
  if (error) return [];
  return data || [];
}

function groupStudentOrders(rows, logs) {
  const grouped = new Map();
  rows.forEach((row) => {
    const key = row.order_no || `${row.customer_name}-${row.order_time}`;
    if (!grouped.has(key)) grouped.set(key, { ...row, items: [], logs: [] });
    grouped.get(key).items.push(row);
  });
  logs.forEach((log) => {
    const order = grouped.get(log.order_no);
    if (order) order.logs.push(log);
  });
  return [...grouped.values()];
}

function currentTimelineIndex(order) {
  const status = order.order_status || "";
  if (status === "已送达") return 4;
  if (status === "已出库" || status === "配送中") return 3;
  if (status === "已入厂" || status === "清洗中") return 2;
  if (status === "已取件") return 1;
  return 0;
}

function findStepTime(order, step) {
  if (step.key === "ordered") return order.order_time;
  const hit = (order.logs || [])
    .filter((log) => step.statuses.includes(log.status))
    .sort((a, b) => parseDate(a.created_at) - parseDate(b.created_at))[0];
  return hit?.created_at || "";
}

function renderStudentTimeline(order) {
  const currentIndex = currentTimelineIndex(order);
  return `<ol class="student-timeline">
    ${STUDENT_TIMELINE_STEPS.map((step, index) => {
      const time = findStepTime(order, step);
      const done = Boolean(time) || index <= currentIndex;
      const current = index === currentIndex;
      return `<li class="${done ? "done" : ""} ${current ? "current" : ""}">
        <span class="timeline-dot"></span>
        <div><strong>${escapeHtml(step.label)}</strong><time>${escapeHtml(formatDateTime(time) || (done ? "进行中" : "待更新"))}</time></div>
      </li>`;
    }).join("")}
  </ol>`;
}

function renderStudentOrder(order) {
  const uniqueItems = order.items.filter((item, index, array) =>
    array.findIndex((other) => `${other.barcode}-${other.spec}-${other.product_name}` === `${item.barcode}-${item.spec}-${item.product_name}`) === index,
  );
  return `<article class="task-card student-order-card">
    <div class="card-head">
      <h3>${escapeHtml(order.customer_name)} · ${escapeHtml(order.order_no)}</h3>
      <span>${escapeHtml(order.order_status || "状态更新中")}</span>
    </div>
    <p>${escapeHtml(`${order.school || ""}｜${orderCampusName(order)}｜${order.building || ""}`)}</p>
    <div class="student-items">
      ${uniqueItems.map((item) => `<p>水洗标：${escapeHtml(item.barcode || "未生成")}｜${escapeHtml(item.spec || item.product_name || "")}｜${escapeHtml(item.item_status || "")}</p>`).join("")}
    </div>
    ${renderStudentTimeline(order)}
    ${order.latest_note ? `<p class="hint">最新记录：${escapeHtml(order.latest_note)}</p>` : ""}
    <p>客服电话：<a class="inline-link" href="tel:${AFTER_SALES_PHONE}">${AFTER_SALES_PHONE}</a></p>
  </article>`;
}

async function loadDeliveryProof() {
  const code = text(new URLSearchParams(window.location.search).get("c")).toLowerCase();
  const state = $("deliveryProofState");
  if (!state || !sb) return;
  if (!/^[a-f0-9]{10}$/.test(code)) {
    state.textContent = "送达凭证链接无效，请检查短信中的完整链接。";
    state.className = "warn";
    return;
  }
  state.textContent = "正在读取送达照片…";
  const { data, error } = await sb.rpc("get_return_delivery_proof", { target_code: code });
  const proof = Array.isArray(data) ? data[0] : null;
  if (error || !proof?.delivery_photo_path) {
    state.textContent = "没有找到该送达凭证，链接可能有误或照片已失效。";
    state.className = "warn";
    return;
  }
  const photoUrl = sb.storage.from(RETURN_DELIVERY_BUCKET).getPublicUrl(proof.delivery_photo_path)?.data?.publicUrl || "";
  if (!photoUrl) {
    state.textContent = "送达照片暂时无法打开，请稍后重试。";
    state.className = "warn";
    return;
  }
  if ($("deliveryProofPhoto")) {
    $("deliveryProofPhoto").src = photoUrl;
    $("deliveryProofPhoto").classList.remove("hidden");
  }
  if ($("deliveryProofTime")) $("deliveryProofTime").textContent = formatDateTime(proof.delivered_at) || "刚刚送达";
  state.textContent = "该照片由配送员完成送达时上传";
  state.className = "success";
}

async function trackByPhone() {
  if (!requireClient()) return;
  const phone = phoneValue($("studentPhone").value);
  if (!phone) return alert("请输入手机号");
  setMessage("trackResults", "正在查询订单进度...", "hint");
  const { data, error } = await sb.rpc("track_by_phone", { query_phone: phone });
  if (error) return setMessage("trackResults", `查询失败：${error.message}`, "warn");
  const rows = data || [];
  if (!rows.length) {
    $("trackResults").innerHTML = '<p class="hint">没有查到订单，请确认手机号是否与下单手机号一致。</p>';
    return;
  }
  const logs = await loadStudentTimeline(phone);
  $("trackResults").innerHTML = groupStudentOrders(rows, logs).map(renderStudentOrder).join("");
}

function bindEvents() {
  on("saveConfigBtn", "click", saveConfig);
  on("loginBtn", "click", login);
  on("signOutBtn", "click", signOut);
  on("fileInput", "change", handleImport);
  on("exportWashLabelsBtn", "click", exportWashLabels);
  on("refreshAdminBtn", "click", refreshAll);
  on("refreshCourierBtn", "click", refreshAll);
  on("refreshFactoryBtn", "click", refreshAll);
  on("refreshFactoryDailyBtn", "click", loadFactoryDailyScans);
  on("factoryDailyCollapseBtn", "click", () => toggleFactoryDailyPanel());
  on("factoryItemSearch", "input", renderFactoryPendingItems);
  on("factoryItemStatusFilter", "change", renderFactoryPendingItems);
  on("courierSearch", "input", () => {
    courierActivePickupAreaKey = "";
    renderCourierRouteTasks();
  });
  on("courierPickupDate", "change", () => {
    courierDashboardFilter = "";
    courierActivePickupAreaKey = "";
    loadCourierTasks();
  });
  on("courierTodayBtn", "click", resetCourierPickupDate);
  on("startScanBtn", "click", startScanner);
  on("barcodePhotoInput", "click", stopScanner);
  on("barcodePhotoInput", "change", handleBarcodePhoto);
  on("toggleTorchBtn", "click", toggleTorch);
  on("stopScanBtn", "click", endFactoryScanSession);
  on("factoryCameraToggleBtn", "click", toggleFactoryCamera);
  on("factoryInBtn", "click", () => activateFactoryScanMode("factory_in"));
  on("factoryOutBtn", "click", () => activateFactoryScanMode("factory_out"));
  on("manualScanBtn", "click", processManualFactoryScan);
  on("submitFactoryScanBatchBtn", "click", submitFactoryScanBatch);
  on("undoFactoryScanBtn", "click", undoLastFactoryScan);
  on("clearFactoryScanBatchBtn", "click", () => clearFactoryScanQueue());
  on("printFactoryLabelBtn", "click", () => printFactoryLabelBatch());
  on("downloadFactoryLabelBtn", "click", downloadFactoryLabelBatch);
  on("selectAllFactoryOutBtn", "click", selectAllFactoryOutboundOrders);
  on("clearFactoryOutSelectionBtn", "click", clearFactoryOutboundSelection);
  on("factoryOrderSearchBtn", "click", openFactoryOrderSearchDialog);
  on("factoryPendingOrderSearchBtn", "click", openFactoryOrderSearchDialog);
  on("factoryOrderSearchSubmitBtn", "click", searchFactoryOrders);
  on("factoryOrderSearchInput", "keydown", (event) => {
    if (event.key === "Enter") searchFactoryOrders();
  });
  on("barcodeInput", "keydown", (event) => {
    if (event.key === "Enter") processManualFactoryScan();
  });
  on("trackBtn", "click", trackByPhone);
  on("copyServicePhoneBtn", "click", () => copyText(AFTER_SALES_PHONE));
  on("studentPhone", "keydown", (event) => {
    if (event.key === "Enter") trackByPhone();
  });
  on("loginPassword", "keydown", (event) => {
    if (event.key === "Enter") login();
  });
  on("closeOrderDialogBtn", "click", () => $("orderDialog")?.close());
  document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => switchView(tab.dataset.view)));
  document.querySelectorAll(".subtab").forEach((tab) => tab.addEventListener("click", () => switchAdminSection(tab.dataset.adminSection)));
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-factory-order-search]")) closeFactoryOrderSearchDialog();
    const factorySearchDetailBtn = event.target.closest("[data-factory-search-detail]");
    if (factorySearchDetailBtn) {
      closeFactoryOrderSearchDialog();
      showOrderDetail(factorySearchDetailBtn.dataset.factorySearchDetail);
    }
    const factorySearchImagesBtn = event.target.closest("[data-factory-search-images]");
    if (factorySearchImagesBtn) {
      closeFactoryOrderSearchDialog();
      showImagePreview(factorySearchImagesBtn.dataset.factorySearchImages);
    }
    const factoryOrderExceptionBtn = event.target.closest("[data-factory-order-exception]");
    if (factoryOrderExceptionBtn) openFactoryOrderException(factoryOrderExceptionBtn.dataset.factoryOrderException);
    const factoryPendingViewBtn = event.target.closest("[data-factory-pending-view]");
    if (factoryPendingViewBtn) selectFactoryPendingView(factoryPendingViewBtn.dataset.factoryPendingView);
    const newExceptionTicketBtn = event.target.closest("[data-new-exception-ticket]");
    if (newExceptionTicketBtn) openExceptionTicketDialog();
    const reportExceptionBtn = event.target.closest("[data-report-exception]");
    if (reportExceptionBtn) openExceptionTicketDialog(factoryItemRows.find((item) => item.id === reportExceptionBtn.dataset.reportException) || null);
    const pickupExceptionBtn = event.target.closest("[data-report-pickup-exception]");
    if (pickupExceptionBtn) openCourierPickupException(pickupExceptionBtn.dataset.reportPickupException);
    const returnExceptionBtn = event.target.closest("[data-report-return-exception]");
    if (returnExceptionBtn) openCourierReturnException(returnExceptionBtn.dataset.reportReturnException, returnExceptionBtn.dataset.item, returnExceptionBtn.dataset.order);
    if (event.target.closest("[data-submit-exception-ticket]")) submitExceptionTicket();
    if (event.target.closest("[data-close-exception-ticket]")) {
      exceptionTicketContext = null;
      $("exceptionTicketDialog")?.close();
    }
    const exceptionStatusBtn = event.target.closest("[data-exception-status]");
    if (exceptionStatusBtn) updateExceptionTicketStatus(exceptionStatusBtn.dataset.exceptionStatus, exceptionStatusBtn.dataset.status);
    const copyExceptionBtn = event.target.closest("[data-copy-exception-message]");
    if (copyExceptionBtn) copyExceptionCustomerMessage(copyExceptionBtn.dataset.copyExceptionMessage);
    const scheduleRetryBtn = event.target.closest("[data-schedule-retry-item]");
    if (scheduleRetryBtn) scheduleRetryPickupFromUi(scheduleRetryBtn.dataset.scheduleRetryItem, scheduleRetryBtn.dataset.retryOrder, scheduleRetryBtn.dataset.retryTicket || null);
    const exceptionEvidenceBtn = event.target.closest("[data-full-image]");
    if (exceptionEvidenceBtn) window.open(exceptionEvidenceBtn.dataset.fullImage, "_blank", "noopener,noreferrer");
    const dashboardTarget = event.target.closest("[data-dashboard-target]");
    if (dashboardTarget) openDashboardTarget(dashboardTarget.dataset.dashboardTarget);
    const clearDashboardBtn = event.target.closest("[data-clear-dashboard-filter]");
    if (clearDashboardBtn) clearDashboardFilter(clearDashboardBtn.dataset.clearDashboardFilter);
    const pickupBtn = event.target.closest("[data-pickup]");
    if (pickupBtn) updatePickup(pickupBtn.dataset.pickup, pickupBtn.dataset.order, pickupBtn.dataset.status);
    const retryPickupBtn = event.target.closest("[data-retry-pickup]");
    if (retryPickupBtn) updateRetryPickup(retryPickupBtn.dataset.retryPickup, retryPickupBtn.dataset.item, retryPickupBtn.dataset.order, retryPickupBtn.dataset.status);
    const rescheduleRetryBtn = event.target.closest("[data-reschedule-retry]");
    if (rescheduleRetryBtn) rescheduleRetryPickup(rescheduleRetryBtn.dataset.rescheduleRetry);
    const pickupAreaBtn = event.target.closest("[data-select-pickup-area]");
    if (pickupAreaBtn) {
      event.preventDefault();
      selectCourierPickupArea(pickupAreaBtn.dataset.selectPickupArea);
    }
    const confirmReturnOrderBtn = event.target.closest("[data-confirm-return-order]");
    if (confirmReturnOrderBtn) confirmCourierReturnOrder(confirmReturnOrderBtn.dataset.confirmReturnOrder);
    if (event.target.closest("[data-close-return-delivery]")) $("returnDeliveryDialog")?.close();
    const previewBtn = event.target.closest("[data-preview-images]");
    if (previewBtn) showImagePreview(previewBtn.dataset.previewImages);
    const detailBtn = event.target.closest("[data-detail]");
    if (detailBtn) showOrderDetail(detailBtn.dataset.detail);
    const saveOrderAddressBtn = event.target.closest("[data-save-order-address]");
    if (saveOrderAddressBtn) saveOrderAddressFromDialog(saveOrderAddressBtn.dataset.saveOrderAddress);
    const factoryDailyTab = event.target.closest("[data-factory-daily-tab]");
    if (factoryDailyTab) switchFactoryDailyTab(factoryDailyTab.dataset.factoryDailyTab);
    const settlementSaveBtn = event.target.closest("[data-save-settlement]");
    if (settlementSaveBtn) saveSettlementCategoryFromRow(settlementSaveBtn.dataset.saveSettlement);
    const selectLabelOrderBtn = event.target.closest("[data-select-label-order]");
    if (selectLabelOrderBtn) selectLabelOrder(selectLabelOrderBtn.dataset.selectLabelOrder);
    if (event.target.closest("[data-select-label-pending]")) selectVisiblePendingLabels();
    if (event.target.closest("[data-clear-label-selection]")) clearLabelSelection();
    if (event.target.closest("[data-apply-label-category]")) applyCategoryToSelectedLabels();
    if (event.target.closest("[data-save-label-selection]")) saveSelectedSettlementCategories();
    const washAdjustmentBtn = event.target.closest("[data-wash-adjustment]");
    if (washAdjustmentBtn) openWashAdjustmentDialog(washAdjustmentBtn.dataset.washAdjustment);
    const saveWashAdjustmentBtn = event.target.closest("[data-save-wash-adjustment]");
    if (saveWashAdjustmentBtn) saveWashAdjustment(saveWashAdjustmentBtn.dataset.saveWashAdjustment);
    if (event.target.closest("[data-close-wash-adjustment]")) $("orderDialog")?.close();
    if (event.target.closest("[data-open-label-review]")) switchAdminSection("labels");
    const confirmDormBtn = event.target.closest("[data-confirm-dorm]");
    if (confirmDormBtn) saveDorm(confirmDormBtn.dataset.confirmDorm, { confirm: true, next: true });
    const saveBtn = event.target.closest("[data-save-dorm]");
    if (saveBtn) saveDorm(saveBtn.dataset.saveDorm);
    const learnBtn = event.target.closest("[data-learn-rule]");
    if (learnBtn) learnRule(learnBtn.dataset.learnRule, learnBtn.dataset.address || "");
    const reprocessBtn = event.target.closest("[data-reprocess-orders]");
    if (reprocessBtn) reprocessUnresolvedOrders();
    const deleteBatchBtn = event.target.closest("[data-delete-batch]");
    if (deleteBatchBtn) deleteBatch(deleteBatchBtn.dataset.deleteBatch);
    const deleteRuleBtn = event.target.closest("[data-delete-rule]");
    if (deleteRuleBtn) deleteRule(deleteRuleBtn.dataset.deleteRule);
  });
  document.addEventListener("dblclick", (event) => {
    const image = event.target.closest("[data-full-image]");
    if (image) window.open(image.dataset.fullImage, "_blank", "noopener,noreferrer");
  });
  document.addEventListener("change", (event) => {
    const returnProofInput = event.target.closest("[data-return-proof]");
    if (returnProofInput) {
      selectCourierReturnProof(returnProofInput.dataset.returnProof, returnProofInput.files?.[0]);
      return;
    }
    if (event.target.matches("#exceptionTicketItemSelect")) {
      const option = event.target.selectedOptions?.[0];
      if ($("exceptionTicketItemId")) $("exceptionTicketItemId").value = event.target.value || "";
      if ($("exceptionTicketBarcode")) $("exceptionTicketBarcode").value = option?.dataset.barcode || "";
    }
    if (event.target.matches("#exceptionTicketType") && exceptionTicketContext?.type === "courier-pickup") {
      $("exceptionTicketRetryDateField")?.classList.toggle("hidden", event.target.value !== "漏取/补取");
    }
    const labelCheckbox = event.target.closest("[data-label-checkbox]");
    if (labelCheckbox) {
      if (labelCheckbox.checked) labelSelectedItems.add(labelCheckbox.dataset.labelCheckbox);
      else labelSelectedItems.delete(labelCheckbox.dataset.labelCheckbox);
      updateLabelSelectionUi();
    }
    const settlementSelect = event.target.closest("[data-settlement-select]");
    if (settlementSelect) {
      document.querySelector(`[data-settlement-other-fields="${settlementSelect.dataset.settlementSelect}"]`)
        ?.classList.toggle("hidden", settlementSelect.value !== SETTLEMENT_OTHER);
    }
    const factoryOutboundOrder = event.target.closest("[data-factory-outbound-order]");
    if (factoryOutboundOrder) {
      toggleFactoryOutboundOrder(factoryOutboundOrder.dataset.factoryOutboundOrder, factoryOutboundOrder.checked);
    }
    const statusSelect = event.target.closest("[data-order-status]");
    if (statusSelect) updateOrderStatus(statusSelect.dataset.orderStatus, statusSelect.value);
    const itemStatusSelect = event.target.closest("[data-order-item-status]");
    if (itemStatusSelect) updateOrderItemStatus(
      itemStatusSelect.dataset.orderItemStatus,
      itemStatusSelect.dataset.orderId,
      itemStatusSelect.dataset.itemBarcode,
      itemStatusSelect.value,
      itemStatusSelect,
    );
    const factorySettlementSelect = event.target.closest("[data-factory-queue-settlement]");
    if (factorySettlementSelect) {
      const entry = factoryScanQueue[Number(factorySettlementSelect.dataset.factoryQueueSettlement)];
      if (entry) {
        entry.settlementCategory = factorySettlementSelect.value;
        entry.settlementConfirmed = false;
        const definition = settlementCategoryDefinition(entry.settlementCategory);
        if (entry.settlementCategory !== SETTLEMENT_OTHER) {
          entry.settlementOtherName = "";
          entry.settlementOtherUnit = definition?.unit || "件";
          entry.settlementCostSnapshot = definition?.costPrice ?? null;
        }
        renderFactoryScanQueue();
      }
    }
    const factoryOtherName = event.target.closest("[data-factory-other-name]");
    if (factoryOtherName) {
      const entry = factoryScanQueue[Number(factoryOtherName.dataset.factoryOtherName)];
      if (entry) entry.settlementOtherName = text(factoryOtherName.value);
    }
    const factoryOtherUnit = event.target.closest("[data-factory-other-unit]");
    if (factoryOtherUnit) {
      const entry = factoryScanQueue[Number(factoryOtherUnit.dataset.factoryOtherUnit)];
      if (entry) entry.settlementOtherUnit = factoryOtherUnit.value === "双" ? "双" : "件";
    }
    const factoryOtherCost = event.target.closest("[data-factory-other-cost]");
    if (factoryOtherCost) {
      const entry = factoryScanQueue[Number(factoryOtherCost.dataset.factoryOtherCost)];
      if (entry) entry.settlementCostSnapshot = factoryOtherCost.value;
    }
  });
  document.addEventListener("input", (event) => {
    const factoryOtherName = event.target.closest("[data-factory-other-name]");
    if (factoryOtherName) {
      const entry = factoryScanQueue[Number(factoryOtherName.dataset.factoryOtherName)];
      if (entry) entry.settlementOtherName = factoryOtherName.value;
    }
    const factoryOtherCost = event.target.closest("[data-factory-other-cost]");
    if (factoryOtherCost) {
      const entry = factoryScanQueue[Number(factoryOtherCost.dataset.factoryOtherCost)];
      if (entry) entry.settlementCostSnapshot = factoryOtherCost.value;
    }
  });
}

if ("serviceWorker" in navigator) {
navigator.serviceWorker
    .register("./sw.js?v=65", { updateViaCache: "none" })
    .then((registration) => registration.update())
    .catch(() => {});
}

window.addEventListener("beforeunload", stopScanner);

hydrateStaticContent();
renderFactoryScanQueue();
bindEvents();
if (APP_MODE === "factory") toggleFactoryDailyPanel(!window.matchMedia("(max-width: 640px)").matches);
initSupabase();
applyRouteFromUrl();
