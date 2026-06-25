const seed = Array.isArray(window.INVENTORY_SEED) ? window.INVENTORY_SEED : [];
const deliverySeed = Array.isArray(window.DELIVERY_SEED) ? window.DELIVERY_SEED : [];
const movementStorageKey = "vendorInventoryMovements.v1";
const deliveryEditStorageKey = "vendorDeliveryEdits.v1";
const customProductStorageKey = "vendorCustomProducts.v1";
const customDeliveryStorageKey = "vendorCustomDeliveries.v1";
const deletedVendorStorageKey = "vendorDeletedVendors.v1";
const deletedProductStorageKey = "vendorDeletedProducts.v1";
const baseStockEditStorageKey = "vendorBaseStockEdits.v1";
const deletedDeliveryStorageKey = "vendorDeletedDeliveries.v1";
const stockCorrectionVersionStorageKey = "vendorStockCorrectionVersion.v1";
const stockCorrectionVersion = 1;
const stockCorrectionTargets = [
  { vendor: "경도", productCode: "20007735", available: 124 },
  { vendor: "경도", productCode: "20006459", available: 68 },
  { vendor: "경도", productCode: "60359116", available: 313 },
];

const els = {
  authScreen: document.querySelector("#authScreen"),
  authForm: document.querySelector("#authForm"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  authMessage: document.querySelector("#authMessage"),
  signUpButton: document.querySelector("#signUpButton"),
  appView: document.querySelector("#appView"),
  signedInUser: document.querySelector("#signedInUser"),
  syncStatus: document.querySelector("#syncStatus"),
  signOutButton: document.querySelector("#signOutButton"),
  manageUsersButton: document.querySelector("#manageUsersButton"),
  userDialog: document.querySelector("#userDialog"),
  closeUserDialog: document.querySelector("#closeUserDialog"),
  userList: document.querySelector("#userList"),
  metricProducts: document.querySelector("#metricProducts"),
  metricVendors: document.querySelector("#metricVendors"),
  metricShortages: document.querySelector("#metricShortages"),
  metricStock: document.querySelector("#metricStock"),
  form: document.querySelector("#movementForm"),
  vendorInput: document.querySelector("#vendorInput"),
  productInput: document.querySelector("#productInput"),
  productList: document.querySelector("#productList"),
  typeInput: document.querySelector("#typeInput"),
  qtyInput: document.querySelector("#qtyInput"),
  dateInput: document.querySelector("#dateInput"),
  memoInput: document.querySelector("#memoInput"),
  vendorFilter: document.querySelector("#vendorFilter"),
  searchInput: document.querySelector("#searchInput"),
  clearSearch: document.querySelector("#clearSearch"),
  historyDateFilters: document.querySelector("#historyDateFilters"),
  historyDateFrom: document.querySelector("#historyDateFrom"),
  historyDateTo: document.querySelector("#historyDateTo"),
  clearHistoryDates: document.querySelector("#clearHistoryDates"),
  productNavigation: document.querySelector("#productNavigation"),
  backToPrevious: document.querySelector("#backToPrevious"),
  backToAll: document.querySelector("#backToAll"),
  tableHead: document.querySelector("#tableHead"),
  tableBody: document.querySelector("#tableBody"),
  emptyState: document.querySelector("#emptyState"),
  exportCsv: document.querySelector("#exportCsv"),
  resetData: document.querySelector("#resetData"),
  newProductButton: document.querySelector("#newProductButton"),
  manageItemsButton: document.querySelector("#manageItemsButton"),
  manageDialog: document.querySelector("#manageDialog"),
  manageVendor: document.querySelector("#manageVendor"),
  manageProduct: document.querySelector("#manageProduct"),
  manageProductList: document.querySelector("#manageProductList"),
  manageRecord: document.querySelector("#manageRecord"),
  deleteVendorButton: document.querySelector("#deleteVendorButton"),
  deleteProductButton: document.querySelector("#deleteProductButton"),
  closeManageDialog: document.querySelector("#closeManageDialog"),
  cancelManageDialog: document.querySelector("#cancelManageDialog"),
  productDialog: document.querySelector("#productDialog"),
  productForm: document.querySelector("#productForm"),
  newVendor: document.querySelector("#newVendor"),
  newVendorNameField: document.querySelector("#newVendorNameField"),
  newVendorName: document.querySelector("#newVendorName"),
  newProductCode: document.querySelector("#newProductCode"),
  newLocation: document.querySelector("#newLocation"),
  newInitialStock: document.querySelector("#newInitialStock"),
  newOrderQty: document.querySelector("#newOrderQty"),
  newDueDate: document.querySelector("#newDueDate"),
  newSpecialNote: document.querySelector("#newSpecialNote"),
  newRemarks: document.querySelector("#newRemarks"),
  closeProductDialog: document.querySelector("#closeProductDialog"),
  cancelProductDialog: document.querySelector("#cancelProductDialog"),
  deliveryDialog: document.querySelector("#deliveryDialog"),
  deliveryEditForm: document.querySelector("#deliveryEditForm"),
  editRecordId: document.querySelector("#editRecordId"),
  editVendor: document.querySelector("#editVendor"),
  editProductCode: document.querySelector("#editProductCode"),
  editBaseStock: document.querySelector("#editBaseStock"),
  editOrderQty: document.querySelector("#editOrderQty"),
  editProductState: document.querySelector("#editProductState"),
  editDueDate: document.querySelector("#editDueDate"),
  editDeliveredDate: document.querySelector("#editDeliveredDate"),
  editSpecialNote: document.querySelector("#editSpecialNote"),
  editRemarks: document.querySelector("#editRemarks"),
  closeDialog: document.querySelector("#closeDialog"),
  cancelDialog: document.querySelector("#cancelDialog"),
  stockDialog: document.querySelector("#stockDialog"),
  stockEditForm: document.querySelector("#stockEditForm"),
  stockVendor: document.querySelector("#stockVendor"),
  stockProductCode: document.querySelector("#stockProductCode"),
  stockVendorValue: document.querySelector("#stockVendorValue"),
  stockProductValue: document.querySelector("#stockProductValue"),
  stockCurrentValue: document.querySelector("#stockCurrentValue"),
  stockExactQty: document.querySelector("#stockExactQty"),
  stockType: document.querySelector("#stockType"),
  stockQty: document.querySelector("#stockQty"),
  stockDate: document.querySelector("#stockDate"),
  stockMemo: document.querySelector("#stockMemo"),
  closeStockDialog: document.querySelector("#closeStockDialog"),
  cancelStockDialog: document.querySelector("#cancelStockDialog"),
};

let activeView = "stock";
let selectedProductCode = "";
let previousViewState = null;
let movements = loadJson(movementStorageKey, []);
let deliveryEdits = loadJson(deliveryEditStorageKey, {});
let customProducts = loadJson(customProductStorageKey, []);
let customDeliveries = loadJson(customDeliveryStorageKey, []);
let deletedVendors = loadJson(deletedVendorStorageKey, []);
let deletedProducts = loadJson(deletedProductStorageKey, []);
let baseStockEdits = loadJson(baseStockEditStorageKey, {});
let deletedDeliveryIds = loadJson(deletedDeliveryStorageKey, []);
let appliedStockCorrectionVersion = Number(loadJson(stockCorrectionVersionStorageKey, 0));
let supabaseClient = null;
let signedInProfile = null;
let cloudReady = false;
let cloudSaveTimer = null;
let applyingCloudState = false;
let stateChannel = null;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function loadJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function saveMovements() {
  localStorage.setItem(movementStorageKey, JSON.stringify(movements));
  scheduleCloudSave();
}

function saveDeliveryEdits() {
  localStorage.setItem(deliveryEditStorageKey, JSON.stringify(deliveryEdits));
  scheduleCloudSave();
}

function saveCustomData() {
  localStorage.setItem(customProductStorageKey, JSON.stringify(customProducts));
  localStorage.setItem(customDeliveryStorageKey, JSON.stringify(customDeliveries));
  scheduleCloudSave();
}

function saveDeletedItems() {
  localStorage.setItem(deletedVendorStorageKey, JSON.stringify(deletedVendors));
  localStorage.setItem(deletedProductStorageKey, JSON.stringify(deletedProducts));
  scheduleCloudSave();
}

function saveBaseStockEdits() {
  localStorage.setItem(baseStockEditStorageKey, JSON.stringify(baseStockEdits));
  scheduleCloudSave();
}

function saveDeletedDeliveries() {
  localStorage.setItem(deletedDeliveryStorageKey, JSON.stringify(deletedDeliveryIds));
  scheduleCloudSave();
}

function saveStockCorrectionVersion() {
  localStorage.setItem(stockCorrectionVersionStorageKey, JSON.stringify(appliedStockCorrectionVersion));
  scheduleCloudSave();
}

function sharedStatePayload() {
  return {
    movements,
    deliveryEdits,
    customProducts,
    customDeliveries,
    deletedVendors,
    deletedProducts,
    baseStockEdits,
    deletedDeliveryIds,
    appliedStockCorrectionVersion,
  };
}

function applySharedState(payload = {}) {
  applyingCloudState = true;
  movements = Array.isArray(payload.movements) ? payload.movements : [];
  deliveryEdits = payload.deliveryEdits || {};
  customProducts = Array.isArray(payload.customProducts) ? payload.customProducts : [];
  customDeliveries = Array.isArray(payload.customDeliveries) ? payload.customDeliveries : [];
  deletedVendors = Array.isArray(payload.deletedVendors) ? payload.deletedVendors : [];
  deletedProducts = Array.isArray(payload.deletedProducts) ? payload.deletedProducts : [];
  baseStockEdits = payload.baseStockEdits || {};
  deletedDeliveryIds = Array.isArray(payload.deletedDeliveryIds) ? payload.deletedDeliveryIds : [];
  appliedStockCorrectionVersion = Number(payload.appliedStockCorrectionVersion || 0);
  localStorage.setItem(movementStorageKey, JSON.stringify(movements));
  localStorage.setItem(deliveryEditStorageKey, JSON.stringify(deliveryEdits));
  localStorage.setItem(customProductStorageKey, JSON.stringify(customProducts));
  localStorage.setItem(customDeliveryStorageKey, JSON.stringify(customDeliveries));
  localStorage.setItem(deletedVendorStorageKey, JSON.stringify(deletedVendors));
  localStorage.setItem(deletedProductStorageKey, JSON.stringify(deletedProducts));
  localStorage.setItem(baseStockEditStorageKey, JSON.stringify(baseStockEdits));
  localStorage.setItem(deletedDeliveryStorageKey, JSON.stringify(deletedDeliveryIds));
  localStorage.setItem(stockCorrectionVersionStorageKey, JSON.stringify(appliedStockCorrectionVersion));
  applyingCloudState = false;
}

function setSyncStatus(message, isError = false) {
  els.syncStatus.textContent = message;
  els.syncStatus.classList.toggle("error", isError);
}

function scheduleCloudSave() {
  if (!cloudReady || applyingCloudState || !supabaseClient) return;
  clearTimeout(cloudSaveTimer);
  setSyncStatus("저장 중");
  cloudSaveTimer = setTimeout(saveCloudState, 250);
}

async function saveCloudState() {
  const { data: authData } = await supabaseClient.auth.getUser();
  const user = authData?.user;
  if (!user || !cloudReady) return;
  const { error } = await supabaseClient.from("inventory_state").upsert({
    id: "main",
    payload: sharedStatePayload(),
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  });
  setSyncStatus(error ? "저장 실패" : "저장됨", Boolean(error));
  if (error) console.error(error);
}

function stockSnapshot(vendor, productCode) {
  const rows = rowsWithStock();
  return rows.find((row) => row.vendor === vendor && row.productCode === productCode)
    || rows.find((row) => stockKey(row) === stockKey(productCode));
}

function sendInventoryAlert(payload) {
  if (!cloudReady || !supabaseClient) return;
  const alertPayload = {
    ...payload,
    actor: signedInProfile?.email || "",
    createdAt: new Date().toISOString(),
  };
  supabaseClient.functions.invoke("telegram-alert", { body: alertPayload })
    .then(({ error }) => {
      if (error) console.warn("Telegram alert failed", error);
    })
    .catch((error) => console.warn("Telegram alert failed", error));
}

function notifyMovement(movement) {
  const stock = stockSnapshot(movement.vendor, movement.productCode);
  sendInventoryAlert({
    kind: movementTypeLabel(movement.type) || "재고변경",
    vendor: movement.vendor,
    productCode: movement.productCode,
    qty: movement.qty,
    previousQty: movement.previousQty,
    currentStock: stock?.available,
    orderQty: stock?.orderQty,
    deliveredQty: stock?.deliveredQty,
    date: movement.date,
    memo: movement.memo,
  });
}

async function loadCloudState(user) {
  setSyncStatus("불러오는 중");
  const { data, error } = await supabaseClient.from("inventory_state").select("payload").eq("id", "main").maybeSingle();
  if (error) throw error;
  if (data?.payload) {
    applySharedState(data.payload);
  } else {
    const { error: createError } = await supabaseClient.from("inventory_state").insert({
      id: "main",
      payload: sharedStatePayload(),
      updated_by: user.id,
    });
    if (createError) throw createError;
  }
  cloudReady = true;
  if (applyOneTimeStockCorrections()) {
    scheduleCloudSave();
  }
  setSyncStatus("저장됨");
}

function subscribeToCloudState() {
  if (stateChannel) supabaseClient.removeChannel(stateChannel);
  stateChannel = supabaseClient
    .channel("inventory-state")
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "inventory_state", filter: "id=eq.main" }, (change) => {
      if (!change.new?.payload) return;
      applySharedState(change.new.payload);
      populateSelects();
      render();
      setSyncStatus("동기화됨");
    })
    .subscribe();
}

function fmtNum(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) ? n.toLocaleString("ko-KR") : n.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function allVendors() {
  return [...new Set([...inventoryRows().map((item) => item.vendor), ...deliveryRows().map((item) => item.vendor)])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "ko"));
}

function inventoryVendors() {
  return [...new Set(inventoryRows().map((item) => item.vendor))].filter(Boolean).sort((a, b) => a.localeCompare(b, "ko"));
}

function inventoryRows() {
  return [...seed, ...customProducts].filter((item) => !isDeleted(item.vendor, item.productCode));
}

function itemKey(item) {
  return `${item.vendor}::${item.productCode}`;
}

function stockKey(item) {
  const productCode = typeof item === "string" ? item : item?.productCode;
  return String(productCode || "").trim().toLowerCase();
}

function sameProductItems(productCode) {
  const key = stockKey(productCode);
  return inventoryRows().filter((item) => stockKey(item) === key);
}

function shouldShareProductStock(productCode) {
  const key = stockKey(productCode);
  const vendors = new Set([
    ...inventoryRows().filter((item) => stockKey(item) === key).map((item) => item.vendor),
    ...baseDeliveryRows().filter((item) => stockKey(item) === key).map((item) => item.vendor),
  ]);
  return vendors.size > 1;
}

function isDeleted(vendor, productCode) {
  return deletedVendors.includes(vendor) || deletedProducts.includes(`${vendor}::${productCode}`);
}

function movementTotalsMap() {
  const map = new Map();
  for (const movement of movements.filter((row) => !row.shareByProduct)) {
    const key = `${movement.vendor}::${movement.productCode}`;
    const totals = map.get(key) || { inbound: 0, outbound: 0 };
    if (movement.type === "in") totals.inbound += Number(movement.qty || 0);
    if (movement.type === "out") totals.outbound += Number(movement.qty || 0);
    map.set(key, totals);
  }
  return map;
}

function sharedMovementTotalsMap() {
  const map = new Map();
  for (const movement of movements.filter((row) => row.shareByProduct)) {
    const key = stockKey(movement);
    const totals = map.get(key) || { inbound: 0, outbound: 0 };
    if (movement.type === "in") totals.inbound += Number(movement.qty || 0);
    if (movement.type === "out") totals.outbound += Number(movement.qty || 0);
    map.set(key, totals);
  }
  return map;
}

function movementTotalsForItem(item, vendorTotals = movementTotalsMap(), productTotals = sharedMovementTotalsMap()) {
  const own = vendorTotals.get(itemKey(item)) || { inbound: 0, outbound: 0 };
  const shared = productTotals.get(stockKey(item)) || { inbound: 0, outbound: 0 };
  return {
    inbound: own.inbound + shared.inbound,
    outbound: own.outbound + shared.outbound,
  };
}

function outboundMovementsMap() {
  const map = new Map();
  for (const movement of movements.filter((row) => row.type === "out" && !row.shareByProduct)) {
    const key = `${movement.vendor}::${movement.productCode}`;
    const current = map.get(key) || { qty: 0, lastDate: "" };
    current.qty += Number(movement.qty || 0);
    if (!current.lastDate || movement.date > current.lastDate) current.lastDate = movement.date;
    map.set(key, current);
  }
  return map;
}

function sharedOutboundMovementsMap() {
  const map = new Map();
  for (const movement of movements.filter((row) => row.type === "out" && row.shareByProduct)) {
    const key = stockKey(movement);
    const current = map.get(key) || { qty: 0, lastDate: "" };
    current.qty += Number(movement.qty || 0);
    if (!current.lastDate || movement.date > current.lastDate) current.lastDate = movement.date;
    map.set(key, current);
  }
  return map;
}

function orderQtyAdjustmentMap() {
  const map = new Map();
  for (const record of [...deliverySeed, ...customDeliveries]) {
    const editedQty = deletedDeliveryIds.includes(record.id)
      ? 0
      : Number(deliveryEdits[record.id]?.orderQty ?? record.orderQty ?? 0);
    const originalQty = Number(record.orderQty || 0);
    const difference = editedQty - originalQty;
    if (difference) map.set(itemKey(record), (map.get(itemKey(record)) || 0) + difference);
  }
  return map;
}

function baseDeliveryRows() {
  return [...deliverySeed, ...customDeliveries]
    .filter((record) => !deletedDeliveryIds.includes(record.id))
    .filter((record) => !isDeleted(record.vendor, record.productCode))
    .map((record) => ({ ...record, ...(deliveryEdits[record.id] || {}) }));
}

function deliveryProgressMap(records = baseDeliveryRows()) {
  const outboundByItem = outboundMovementsMap();
  const outboundByProduct = sharedOutboundMovementsMap();
  const recordsByItem = new Map();
  const recordsByProduct = new Map();
  for (const record of records) {
    const key = itemKey(record);
    const itemRecords = recordsByItem.get(key) || [];
    itemRecords.push(record);
    recordsByItem.set(key, itemRecords);

    const productKey = stockKey(record);
    const productRecords = recordsByProduct.get(productKey) || [];
    productRecords.push(record);
    recordsByProduct.set(productKey, productRecords);
  }

  const progress = new Map();
  for (const [key, productRecords] of recordsByProduct.entries()) {
    let remainingOutbound = outboundByProduct.get(key)?.qty || 0;
    if (!remainingOutbound) continue;
    const deliveredDate = outboundByProduct.get(key)?.lastDate || "";
    const sorted = [...productRecords].sort((a, b) =>
      (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99")
        || a.vendor.localeCompare(b.vendor, "ko")
        || a.sourceRow - b.sourceRow,
    );

    for (const record of sorted) {
      const originalQty = Number(record.orderQty || 0);
      if (isDelivered(record)) {
        progress.set(record.id, {
          shippedQty: 0,
          remainingOrderQty: originalQty,
          deliveredDate: record.deliveredDate,
          productState: record.productState,
        });
        continue;
      }

      const shippedQty = Math.min(originalQty, remainingOutbound);
      remainingOutbound -= shippedQty;
      const remainingOrderQty = originalQty - shippedQty;
      progress.set(record.id, {
        shippedQty,
        remainingOrderQty,
        deliveredDate: remainingOrderQty === 0 && shippedQty > 0 ? deliveredDate : record.deliveredDate,
        productState: shippedQty > 0 ? (remainingOrderQty === 0 ? "납품완료" : "일부납품") : record.productState,
      });
    }
  }

  for (const [key, itemRecords] of recordsByItem.entries()) {
    let remainingOutbound = outboundByItem.get(key)?.qty || 0;
    if (!remainingOutbound) continue;
    const deliveredDate = outboundByItem.get(key)?.lastDate || "";
    const sorted = [...itemRecords].sort((a, b) =>
      (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99") || a.sourceRow - b.sourceRow,
    );

    for (const record of sorted) {
      const existing = progress.get(record.id);
      const originalQty = Number(existing?.remainingOrderQty ?? record.orderQty ?? 0);
      if (isDelivered(record)) {
        progress.set(record.id, {
          shippedQty: 0,
          remainingOrderQty: Number(record.orderQty || 0),
          deliveredDate: record.deliveredDate,
          productState: record.productState,
        });
        continue;
      }

      const shippedQty = Math.min(originalQty, remainingOutbound);
      remainingOutbound -= shippedQty;
      const remainingOrderQty = originalQty - shippedQty;
      progress.set(record.id, {
        shippedQty: Number(existing?.shippedQty || 0) + shippedQty,
        remainingOrderQty,
        deliveredDate: remainingOrderQty === 0 && shippedQty > 0 ? deliveredDate : record.deliveredDate,
        productState: shippedQty > 0 ? (remainingOrderQty === 0 ? "납품완료" : "일부납품") : record.productState,
      });
    }
  }
  return progress;
}

function rowsWithStock() {
  const movementTotals = movementTotalsMap();
  const sharedMovementTotals = sharedMovementTotalsMap();
  const orderAdjustments = orderQtyAdjustmentMap();
  const baseRecords = baseDeliveryRows();
  const progressByRecord = deliveryProgressMap(baseRecords);
  const recordsByItem = new Map();
  for (const record of baseRecords) {
    const key = itemKey(record);
    const records = recordsByItem.get(key) || [];
    records.push(record);
    recordsByItem.set(key, records);
  }
  const dueDates = new Map();
  const deliveryStates = new Map();
  for (const record of baseRecords) {
    const key = itemKey(record);
    const progress = progressByRecord.get(record.id);
    const remainingOrderQty = progress?.remainingOrderQty ?? Number(record.orderQty || 0);
    const effectiveState = progress?.productState || record.productState;
    const effectiveDeliveredDate = progress?.deliveredDate || record.deliveredDate;
    const meaningful = Number(record.orderQty || 0) > 0 || record.dueDate || effectiveDeliveredDate || effectiveState;
    if (meaningful) {
      const states = deliveryStates.get(key) || [];
      states.push({ ...record, orderQty: remainingOrderQty, productState: effectiveState, deliveredDate: effectiveDeliveredDate });
      deliveryStates.set(key, states);
    }
    if (!isDelivered({ ...record, productState: effectiveState, deliveredDate: effectiveDeliveredDate }) && remainingOrderQty > 0 && record.dueDate) {
      const dates = dueDates.get(key) || [];
      if (!dates.includes(record.dueDate)) dates.push(record.dueDate);
      dueDates.set(key, dates);
    }
  }
  function sameProductOpenRecordsForItem(item) {
    return baseRecords
      .map((record) => {
        const progress = progressByRecord.get(record.id);
        return {
          ...record,
          orderQty: progress?.remainingOrderQty ?? Number(record.orderQty || 0),
          productState: progress?.productState || record.productState,
          deliveredDate: progress?.deliveredDate || record.deliveredDate,
        };
      })
      .filter((record) => stockKey(record) === stockKey(item))
      .filter((record) => itemKey(record) !== itemKey(item))
      .filter((record) => !isDelivered(record) && Number(record.orderQty || 0) > 0);
  }

  function effectiveDeliveryRecord(record) {
    const progress = progressByRecord.get(record.id);
    const productState = progress?.productState || record.productState;
    const deliveredDate = progress?.deliveredDate || record.deliveredDate;
    const orderQty = progress?.remainingOrderQty ?? Number(record.orderQty || 0);
    return {
      ...record,
      orderQty,
      productState,
      deliveredDate,
      shippedQty: progress?.shippedQty || 0,
    };
  }

  function committedQtyForRecord(record) {
    const effective = effectiveDeliveryRecord(record);
    if (isDelivered(effective)) return Number(record.orderQty || 0);
    if (isPacked(effective) || isPacked(record)) return Number(effective.shippedQty || 0) + Number(effective.orderQty || 0);
    return Number(effective.shippedQty || 0);
  }

  function sharedCommittedQtyForItem(item) {
    return baseRecords.reduce((sum, record) => {
      if (!deliveryEdits[record.id]?.shareByProduct && !record.shareByProduct) return sum;
      if (stockKey(record) !== stockKey(item) || itemKey(record) === itemKey(item)) return sum;
      return sum + committedQtyForRecord(record);
    }, 0);
  }

  return inventoryRows().map((item) => {
    const totals = movementTotalsForItem(item, movementTotals, sharedMovementTotals);
    const adjustment = totals.inbound - totals.outbound;
    const orderAdjustment = orderAdjustments.get(itemKey(item)) || 0;
    const storedBaseStock = Number(baseStockEdits[itemKey(item)] ?? item.baseStock ?? 0);
    const baseStock = storedBaseStock + totals.inbound;
    const records = recordsByItem.get(itemKey(item)) || [];
    const hasRecords = records.length > 0;
    const deliveredQty = records.reduce((sum, record) => {
      const progress = progressByRecord.get(record.id);
      return sum + (isDelivered(record) ? Number(record.orderQty || 0) : Number(progress?.shippedQty || 0));
    }, 0);
    const openOrderQty = records.reduce((sum, record) => {
      if (isDelivered(record)) return sum;
      const progress = progressByRecord.get(record.id);
      return sum + Number(progress?.remainingOrderQty ?? record.orderQty ?? 0);
    }, 0);
    const originalOpenQty = records.reduce((sum, record) => sum + (isDelivered(record) ? 0 : Number(record.orderQty || 0)), 0);
    const extraOutbound = Math.max(0, totals.outbound - originalOpenQty);
    const fallbackOrderQty = Math.max(0, Number(item.orderQty || 0) + orderAdjustment - totals.outbound);
    const fallbackDeliveredQty = Math.min(Number(item.orderQty || 0) + orderAdjustment, totals.outbound);
    const orderQty = hasRecords ? openOrderQty : fallbackOrderQty;
    const displayDeliveredQty = hasRecords
      ? deliveredQty + extraOutbound
      : fallbackDeliveredQty + Math.max(0, totals.outbound - fallbackDeliveredQty);
    const dates = (dueDates.get(itemKey(item)) || []).sort();
    const displayRecords = deliveryStates.get(itemKey(item)) || [];
    const packedOpenQty = displayRecords.reduce((sum, record) => (
      !isDelivered(record) && isPacked(record) ? sum + Number(record.orderQty || 0) : sum
    ), 0);
    const committedQty = hasRecords
      ? records.reduce((sum, record) => sum + committedQtyForRecord(record), 0)
      : displayDeliveredQty;
    const sharedCommittedQty = sharedCommittedQtyForItem(item);
    const deliveredCount = displayRecords.filter(isDelivered).length;
    const hasPartial = displayRecords.some((record) => record.productState.includes("일부납품"));
    const hasPacked = displayRecords.some((record) => !isDelivered(record) && isPacked(record));
    const sameProductOpenRecords = sameProductOpenRecordsForItem(item);
    const hasSameProductPacked = sameProductOpenRecords.some((record) => isPacked(record));
    const hasSameProductOpen = sameProductOpenRecords.length > 0;
    const allDeliveriesCompleted = hasRecords && displayRecords.length > 0 && deliveredCount === displayRecords.length && orderQty === 0 && !hasSameProductOpen;
    const available = hasRecords
      ? baseStock - committedQty - sharedCommittedQty - extraOutbound
      : baseStock - displayDeliveredQty;
    const shortageDemand = Math.max(0, orderQty - packedOpenQty);
    const shortage = Math.max(0, shortageDemand - available);
    const stockStatus = shortage > 0 ? "부족" : hasPacked ? "포장완료" : orderQty > 0 ? "포장가능" : available === 0 ? "소진" : "보유";
    const canPackOpenOrder = stockStatus === "포장가능";
    const deliveryStatus = hasPartial || (deliveredCount > 0 && deliveredCount < displayRecords.length)
      ? `일부납품${canPackOpenOrder ? ", 포장가능" : ""}`
      : hasPacked || hasSameProductPacked
        ? "포장완료"
        : hasSameProductOpen
          ? "미납있음"
          : displayRecords.length > 0 && deliveredCount === displayRecords.length
            ? `납품${canPackOpenOrder ? ", 포장가능" : ""}`
            : stockStatus;
    return {
      ...item,
      baseStock,
      orderQty,
      deliveredQty: displayDeliveredQty,
      adjustment,
      available,
      dueDate: dates.length ? `${dates[0]}${dates.length > 1 ? " 외" : ""}` : "",
      shortage,
      status: deliveryStatus,
      hasOpenOrder: orderQty > 0,
      allDeliveriesCompleted,
      hasSameProductOpen,
    };
  });
}

function deliveryRows() {
  const records = baseDeliveryRows();
  const progressByRecord = deliveryProgressMap(records);
  return records.map((record) => {
    if (isDelivered(record)) return { ...record, shippedQty: Number(record.orderQty || 0) };
    const progress = progressByRecord.get(record.id);
    if (!progress || progress.shippedQty <= 0) return { ...record, shippedQty: 0 };
    return {
      ...record,
      orderQty: progress.remainingOrderQty,
      shippedQty: progress.shippedQty,
      productState: progress.productState,
      deliveredDate: progress.deliveredDate,
    };
  });
}

function movementTypeLabel(type) {
  if (type === "in") return "완성품 추가";
  if (type === "out") return "출하";
  if (type === "adjust") return "재고변경";
  return "";
}

function setAvailableStockEdit(vendor, productCode, targetAvailable) {
  const item = rowsWithStock().find((row) => row.vendor === vendor && row.productCode === productCode);
  if (!item) return false;
  const key = `${vendor}::${productCode}`;
  const storedBaseStock = Number(baseStockEdits[key] ?? item.baseStock ?? 0);
  baseStockEdits[key] = storedBaseStock + (targetAvailable - Number(item.available || 0));
  return true;
}

function applyOneTimeStockCorrections() {
  if (appliedStockCorrectionVersion >= stockCorrectionVersion) return false;
  let changed = false;
  for (const target of stockCorrectionTargets) {
    changed = setAvailableStockEdit(target.vendor, target.productCode, target.available) || changed;
  }
  appliedStockCorrectionVersion = stockCorrectionVersion;
  localStorage.setItem(baseStockEditStorageKey, JSON.stringify(baseStockEdits));
  localStorage.setItem(stockCorrectionVersionStorageKey, JSON.stringify(appliedStockCorrectionVersion));
  return changed;
}

function isDelivered(record) {
  return record.productState.includes("납품완료") || Boolean(record.deliveredDate);
}

function isDeliveryMenuItem(record) {
  return String(record.productState || "").includes("납품") || Boolean(record.deliveredDate);
}

function isPacked(record) {
  return String(record.productState || "").includes("포장");
}

function populateSelects() {
  const entryOptions = inventoryVendors()
    .map((vendor) => `<option value="${escapeHtml(vendor)}">${escapeHtml(vendor)}</option>`)
    .join("");
  const filterOptions = allVendors()
    .map((vendor) => `<option value="${escapeHtml(vendor)}">${escapeHtml(vendor)}</option>`)
    .join("");
  els.vendorInput.innerHTML = entryOptions;
  els.newVendor.innerHTML = `${filterOptions}<option value="__new__">새 업체 등록</option>`;
  els.vendorFilter.innerHTML = `<option value="all">전체 업체</option>${filterOptions}`;
  updateProductList();
}

function updateProductList() {
  const vendor = els.vendorInput.value;
  const products = inventoryRows()
    .filter((item) => item.vendor === vendor)
    .map((item) => item.productCode)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b, "ko"));
  els.productList.innerHTML = products.map((code) => `<option value="${escapeHtml(code)}"></option>`).join("");
}

function renderMetrics() {
  const rows = visibleStockRows();
  els.metricProducts.textContent = fmtNum(rows.length);
  els.metricVendors.textContent = fmtNum(allVendors().length);
  els.metricShortages.textContent = fmtNum(rows.filter((row) => row.shortage > 0).length);
  els.metricStock.textContent = fmtNum(rows.reduce((sum, row) => sum + row.available, 0));
}

function matchesFilter(row, fields) {
  const query = els.searchInput.value.trim().toLowerCase();
  const vendor = els.vendorFilter.value;
  const vendorOk = vendor === "all" || row.vendor === vendor;
  const text = fields.map((field) => row[field] || "").join(" ").toLowerCase();
  return vendorOk && (!query || text.includes(query));
}

function visibleStockRows(includeCompleted = false) {
  return rowsWithStock().filter((row) => includeCompleted || !row.allDeliveriesCompleted);
}

function filteredStockRows() {
  const hasSearch = Boolean(els.searchInput.value.trim());
  return visibleStockRows(hasSearch).filter((row) => matchesFilter(row, ["productCode", "location", "note"]));
}

function filteredDeliveryRows() {
  return deliveryRows().filter((row) =>
    matchesFilter(row, ["productCode", "location", "productState", "dueDate", "deliveredDate", "remarks", "specialNote"]),
  );
}

function filteredProductRows() {
  const query = els.searchInput.value.trim().toLowerCase();
  const vendor = els.vendorFilter.value;
  if (!query) return [];
  return deliveryRows().filter((row) => {
    const vendorOk = vendor === "all" || row.vendor === vendor;
    const productCode = row.productCode.toLowerCase();
    const productOk = selectedProductCode ? productCode === selectedProductCode.toLowerCase() : productCode.includes(query);
    return vendorOk && productOk;
  });
}

function filteredMovements() {
  const dateFrom = els.historyDateFrom.value;
  const dateTo = els.historyDateTo.value;
  return movements
    .filter((row) => matchesFilter(row, ["productCode", "memo", "date"]))
    .filter((row) => (!dateFrom || row.date >= dateFrom) && (!dateTo || row.date <= dateTo))
    .sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`));
}

function render() {
  renderMetrics();
  els.emptyState.textContent = "조회 결과가 없습니다.";
  els.productNavigation.hidden = activeView !== "product" || !selectedProductCode;
  els.historyDateFilters.hidden = activeView !== "history";
  els.backToPrevious.disabled = !previousViewState;
  els.clearSearch.hidden = !els.searchInput.value.trim();
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === activeView);
  });

  const stockRows = filteredStockRows();
  const records = filteredDeliveryRows();
  if (activeView === "stock") renderStock(stockRows);
  if (activeView === "shortage") renderShortage(stockRows.filter((row) => row.shortage > 0));
  if (activeView === "product") renderProductSearch(filteredProductRows());
  if (activeView === "schedule") renderDelivery(records, false);
  if (activeView === "packed") renderDelivery(records.filter(isPacked), false);
  if (activeView === "delivered") renderDelivery(records.filter(isDeliveryMenuItem), true);
  if (activeView === "history") renderMovements(filteredMovements());
}

function renderProductSearch(rows) {
  const stockRows = rowsWithStock();
  const stockRowsByItem = new Map(stockRows.map((row) => [itemKey(row), row]));
  const stockRowsByProduct = new Map();
  for (const row of stockRows) {
    if (!stockRowsByProduct.has(stockKey(row))) stockRowsByProduct.set(stockKey(row), row);
  }
  const stockForRecord = (row) => stockRowsByItem.get(itemKey(row)) || stockRowsByProduct.get(stockKey(row));
  const displayDate = (row) => row.deliveredDate || row.dueDate || "";
  const sorted = [...rows].sort((a, b) => {
    const left = displayDate(a);
    const right = displayDate(b);
    if (!left && right) return 1;
    if (left && !right) return -1;
    return left.localeCompare(right) || a.vendor.localeCompare(b.vendor, "ko") || a.sourceRow - b.sourceRow;
  });
  setHead(["업체", "품번", "소번지", "제품상태", "발주수량", "납품수량", "기존재고", "현재재고", "부족수량", "납기일자", "납품일자", "비고", "특이사항", "재고변경", "수정"]);
  setBody(sorted, (row) => [
    textCell(row.vendor),
    productLink(row.productCode),
    textCell(row.location),
    deliveryStatusBadge(productSearchRecordStatus(stockForRecord(row), row)),
    numCell(row.orderQty),
    numCell(row.shippedQty || 0),
    numCell(stockForRecord(row)?.baseStock ?? 0),
    numCell(stockForRecord(row)?.available ?? row.currentStock),
    numCell(stockForRecord(row)?.shortage ?? 0),
    textCell(row.dueDate),
    textCell(row.deliveredDate),
    textCell(row.remarks),
    textCell(row.specialNote),
    `<button class="row-stock-btn" type="button" data-stock-vendor="${escapeHtml(row.vendor)}" data-stock-code="${escapeHtml(row.productCode)}">변경</button>`,
    `<button class="row-edit-btn" type="button" data-edit-id="${escapeHtml(row.id)}">수정</button>`,
  ]);
  if (!els.searchInput.value.trim()) {
    els.emptyState.textContent = "조회할 품번을 입력하세요.";
  }
}

function renderStock(rows) {
  setHead(["업체", "품번", "소번지", "기존재고", "발주수량", "현재재고", "부족수량", "납기일자", "상태", "특이사항"]);
  setBody(rows, (row) => [
    textCell(row.vendor),
    productLink(row.productCode),
    textCell(row.location),
    numCell(row.baseStock),
    numCell(row.orderQty),
    numCell(row.available),
    numCell(row.shortage),
    textCell(row.dueDate),
    statusBadge(row.status),
    textCell(row.note),
  ]);
}

function renderShortage(rows) {
  setHead(["업체", "품번", "소번지", "기존재고", "발주수량", "현재재고", "부족수량", "납기일자", "상태", "특이사항"]);
  setBody(rows.sort((a, b) => b.shortage - a.shortage), (row) => [
    textCell(row.vendor),
    productLink(row.productCode),
    textCell(row.location),
    numCell(row.baseStock),
    numCell(row.orderQty),
    numCell(row.available),
    numCell(row.shortage),
    textCell(row.dueDate),
    statusBadge(row.status),
    textCell(row.note),
  ]);
}

function renderDelivery(rows, completedOnly) {
  const sorted = [...rows].sort((a, b) => {
    const left = completedOnly ? a.deliveredDate : a.dueDate;
    const right = completedOnly ? b.deliveredDate : b.dueDate;
    return (right || "0000-00-00").localeCompare(left || "0000-00-00") || a.vendor.localeCompare(b.vendor, "ko");
  });
  setHead(["업체", "품번", "제품상태", "발주수량", "납품수량", "납기일자", "납품일자", "비고", "특이사항", "수정"]);
  setBody(sorted, (row) => [
    textCell(row.vendor),
    productLink(row.productCode),
    deliveryStatusBadge(row.productState),
    numCell(row.orderQty),
    numCell(row.shippedQty || 0),
    textCell(row.dueDate),
    textCell(row.deliveredDate),
    textCell(row.remarks),
    textCell(row.specialNote),
    `<button class="row-edit-btn" type="button" data-edit-id="${escapeHtml(row.id)}">수정</button>`,
  ]);
}

function renderMovements(rows) {
  setHead(["일자", "업체", "품번", "구분", "수량", "비고", "삭제"]);
  setBody(rows, (row) => [
    textCell(row.date),
    textCell(row.vendor),
    productLink(row.productCode),
    textCell(movementTypeLabel(row.type)),
    numCell(row.qty),
    textCell(row.memo),
    `<button class="row-delete-btn" type="button" data-delete-movement="${escapeHtml(row.id)}">삭제</button>`,
  ]);
}

function setHead(labels) {
  els.tableHead.innerHTML = `<tr>${labels.map((label) => `<th>${escapeHtml(label)}</th>`).join("")}</tr>`;
}

function setBody(rows, mapper) {
  els.emptyState.style.display = rows.length ? "none" : "block";
  els.tableBody.innerHTML = rows.map((row) => `<tr>${mapper(row).map((value) => `<td>${value}</td>`).join("")}</tr>`).join("");
}

function textCell(value) {
  return escapeHtml(value ?? "");
}

function productLink(productCode) {
  return `<button class="product-link" type="button" data-product-code="${escapeHtml(productCode)}">${escapeHtml(productCode)}</button>`;
}

function numCell(value) {
  return `<span class="num">${fmtNum(value)}</span>`;
}

function statusBadge(status) {
  const cls = status === "부족" ? "bad" : status === "소진" || status === "일부납품" ? "warn" : "good";
  return `<span class="badge ${cls}">${escapeHtml(status)}</span>`;
}

function deliveryStatusBadge(status) {
  if (!status) return "";
  const cls = status.includes("납품완료") ? "good" : status.includes("완료") || status.includes("준비") ? "warn" : "bad";
  return `<span class="badge ${cls}">${escapeHtml(status)}</span>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addMovement(event) {
  event.preventDefault();
  const vendor = els.vendorInput.value;
  const productCode = els.productInput.value.trim();
  const qty = Number(els.qtyInput.value);
  const item = inventoryRows().find((row) => row.vendor === vendor && row.productCode === productCode);

  if (!item) {
    alert("선택한 업체에 등록된 품번이 없습니다.");
    return;
  }
  if (!Number.isFinite(qty) || qty <= 0) {
    alert("수량을 확인해주세요.");
    return;
  }

  movements.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    vendor,
    productCode,
    type: els.typeInput.value,
    qty,
    date: els.dateInput.value || today(),
    memo: els.memoInput.value.trim(),
    shareByProduct: shouldShareProductStock(productCode),
    createdAt: new Date().toISOString(),
  });
  saveMovements();
  els.qtyInput.value = "";
  els.memoInput.value = "";
  render();
  notifyMovement(movements[movements.length - 1]);
}

function makeId(prefix) {
  const value = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${value}`;
}

function openProductDialog() {
  els.productForm.reset();
  els.newInitialStock.value = "0";
  toggleNewVendorField();
  els.productDialog.showModal();
  (els.newVendor.value === "__new__" ? els.newVendorName : els.newProductCode).focus();
}

function toggleNewVendorField() {
  const isNewVendor = els.newVendor.value === "__new__";
  els.newVendorNameField.hidden = !isNewVendor;
  els.newVendorName.required = isNewVendor;
  if (!isNewVendor) els.newVendorName.value = "";
  if (isNewVendor && els.productDialog.open) els.newVendorName.focus();
}

function populateManageProducts() {
  const vendor = els.manageVendor.value;
  const products = inventoryRows()
    .filter((item) => item.vendor === vendor)
    .map((item) => item.productCode)
    .filter((value, index, values) => values.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b, "ko"));
  els.manageProductList.innerHTML = products
    .map((productCode) => `<option value="${escapeHtml(productCode)}"></option>`)
    .join("");
  els.manageProduct.value = "";
  populateManageRecords();
}

function selectedManageProduct() {
  const input = els.manageProduct.value.trim().toLowerCase();
  return inventoryRows().find((item) => item.vendor === els.manageVendor.value && item.productCode.toLowerCase() === input)?.productCode || "";
}

function populateManageRecords() {
  const vendor = els.manageVendor.value;
  const productCode = selectedManageProduct();
  const records = deliveryRows()
    .filter((record) => record.vendor === vendor && record.productCode === productCode)
    .sort((a, b) => (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99"));
  els.manageRecord.innerHTML = records.length
    ? records.map((record, index) => {
      const date = record.dueDate || "납기일자 없음";
      const state = record.productState || "미완료";
      return `<option value="${escapeHtml(record.id)}">${index + 1}. ${escapeHtml(date)} | 발주 ${fmtNum(record.orderQty)} | ${escapeHtml(state)}</option>`;
    }).join("")
    : `<option value="">납기 기록 없음</option>`;
  els.manageRecord.disabled = !productCode || records.length === 0;
  els.deleteProductButton.disabled = !productCode;
}

function openManageDialog() {
  const options = inventoryVendors()
    .map((vendor) => `<option value="${escapeHtml(vendor)}">${escapeHtml(vendor)}</option>`)
    .join("");
  els.manageVendor.innerHTML = options;
  const hasVendors = Boolean(options);
  els.manageVendor.disabled = !hasVendors;
  els.deleteVendorButton.disabled = !hasVendors;
  populateManageProducts();
  els.manageDialog.showModal();
}

function removeRelatedRecords(vendor, productCode = null) {
  const matches = (row) => row.vendor === vendor && (!productCode || row.productCode === productCode);
  const deliveryIds = [...deliverySeed, ...customDeliveries].filter(matches).map((row) => row.id);
  movements = movements.filter((row) => !matches(row));
  customProducts = customProducts.filter((row) => !matches(row));
  customDeliveries = customDeliveries.filter((row) => !matches(row));
  deliveryIds.forEach((id) => delete deliveryEdits[id]);
  deletedDeliveryIds = deletedDeliveryIds.filter((id) => !deliveryIds.includes(id));
  Object.keys(baseStockEdits).forEach((key) => {
    if (key === `${vendor}::${productCode}` || (!productCode && key.startsWith(`${vendor}::`))) delete baseStockEdits[key];
  });
  saveMovements();
  saveDeliveryEdits();
  saveBaseStockEdits();
  saveDeletedDeliveries();
  saveCustomData();
}

function finishDelete() {
  if (!allVendors().includes(els.vendorFilter.value)) els.vendorFilter.value = "all";
  els.productInput.value = "";
  populateSelects();
  render();
}

function deleteProduct() {
  const vendor = els.manageVendor.value;
  const productCode = selectedManageProduct();
  if (!vendor || !productCode) return;
  const records = deliveryRows().filter((record) => record.vendor === vendor && record.productCode === productCode);
  if (records.length > 1) {
    const record = records.find((item) => item.id === els.manageRecord.value);
    if (!record) return;
    const date = record.dueDate || "납기일자 없음";
    if (!confirm(`${vendor}의 ${productCode}\n${date} / 발주 ${fmtNum(record.orderQty)}개 기록을 삭제할까요?`)) return;
    if (!deletedDeliveryIds.includes(record.id)) deletedDeliveryIds.push(record.id);
    delete deliveryEdits[record.id];
    saveDeletedDeliveries();
    saveDeliveryEdits();
    els.manageDialog.close();
    finishDelete();
    openManageDialog();
    els.manageVendor.value = vendor;
    populateManageProducts();
    els.manageProduct.value = productCode;
    populateManageRecords();
    return;
  }
  if (!confirm(`${vendor}의 ${productCode} 품번을 삭제할까요?\n관련 입출고·납품 기록도 함께 삭제됩니다.`)) return;
  const key = `${vendor}::${productCode}`;
  if (!deletedProducts.includes(key)) deletedProducts.push(key);
  removeRelatedRecords(vendor, productCode);
  saveDeletedItems();
  els.manageDialog.close();
  finishDelete();
  if (inventoryVendors().length) openManageDialog();
}

function deleteVendor() {
  const vendor = els.manageVendor.value;
  if (!vendor) return;
  const productCount = inventoryRows().filter((row) => row.vendor === vendor).length;
  if (!confirm(`${vendor} 업체와 품번 ${productCount}개를 모두 삭제할까요?\n관련 입출고·납품 기록도 함께 삭제됩니다.`)) return;
  if (!deletedVendors.includes(vendor)) deletedVendors.push(vendor);
  deletedProducts = deletedProducts.filter((key) => !key.startsWith(`${vendor}::`));
  removeRelatedRecords(vendor);
  saveDeletedItems();
  els.manageDialog.close();
  finishDelete();
}

function registerProduct(event) {
  event.preventDefault();
  const isNewVendor = els.newVendor.value === "__new__";
  const vendor = isNewVendor ? els.newVendorName.value.trim() : els.newVendor.value;
  const productCode = els.newProductCode.value.trim();
  const location = els.newLocation.value.trim();
  const initialStock = Number(els.newInitialStock.value || 0);
  const orderQty = Number(els.newOrderQty.value || 0);
  const dueDate = els.newDueDate.value;
  const specialNote = els.newSpecialNote.value.trim();
  const remarks = els.newRemarks.value.trim();

  if (!vendor || !productCode) {
    alert("업체와 품번을 입력해주세요.");
    return;
  }
  if (isNewVendor && allVendors().some((name) => name.toLowerCase() === vendor.toLowerCase())) {
    alert("이미 등록된 업체입니다. 업체 목록에서 선택해주세요.");
    return;
  }
  if (!Number.isFinite(initialStock) || initialStock < 0 || !Number.isFinite(orderQty) || orderQty < 0) {
    alert("초기재고와 발주수량을 확인해주세요.");
    return;
  }
  const existingProduct = inventoryRows().find((row) => row.vendor === vendor && row.productCode.toLowerCase() === productCode.toLowerCase());

  const finalLocation = existingProduct?.location || location;
  const currentStock = existingProduct ? Number(existingProduct.currentStock || 0) : initialStock;
  if (!existingProduct) {
    customProducts.push({
      id: makeId("product"),
      seq: "",
      productCode,
      location,
      baseStock: initialStock,
      orderQty,
      currentStock,
      vendor,
      note: specialNote,
      finishedQty: 0,
      stockInput: initialStock,
      checkedDate: today(),
    });
  }
  customDeliveries.push({
    id: makeId("delivery"),
    vendor,
    productCode,
    location: finalLocation,
    orderQty,
    productState: "",
    currentStock,
    dueDate,
    deliveredDate: "",
    remarks,
    specialNote,
    shareByProduct: shouldShareProductStock(productCode),
    sourceSheet: "직접등록",
    sourceRow: customDeliveries.length + 1,
  });
  deletedVendors = deletedVendors.filter((name) => name !== vendor);
  saveCustomData();
  saveDeletedItems();
  els.productDialog.close();
  populateSelects();
  activeView = "product";
  selectedProductCode = productCode;
  els.searchInput.value = productCode;
  els.searchInput.placeholder = "조회할 품번을 입력하세요";
  render();
  const stock = stockSnapshot(vendor, productCode);
  sendInventoryAlert({
    kind: existingProduct ? "새 발주 등록" : (orderQty > 0 ? "새 제품/발주 등록" : "새 제품 등록"),
    vendor,
    productCode,
    qty: orderQty,
    currentStock: stock?.available,
    orderQty: stock?.orderQty,
    deliveredQty: stock?.deliveredQty,
    dueDate,
    memo: remarks || specialNote,
  });
}

function openDeliveryEditor(recordId) {
  const record = deliveryRows().find((row) => row.id === recordId);
  if (!record) return;
  const stockRows = rowsWithStock();
  const stockItem = stockRows.find((row) => row.vendor === record.vendor && row.productCode === record.productCode)
    || stockRows.find((row) => stockKey(row) === stockKey(record));
  els.editRecordId.value = record.id;
  els.editVendor.textContent = record.vendor;
  els.editProductCode.textContent = record.productCode;
  els.editBaseStock.value = stockItem?.baseStock ?? 0;
  els.editOrderQty.value = record.orderQty;
  els.editProductState.value = record.productState;
  els.editDueDate.value = record.dueDate;
  els.editDeliveredDate.value = record.deliveredDate;
  els.editSpecialNote.value = record.specialNote;
  els.editRemarks.value = record.remarks;
  els.deliveryDialog.showModal();
}

function saveDeliveryRecord(event) {
  event.preventDefault();
  const id = els.editRecordId.value;
  const record = deliveryRows().find((row) => row.id === id);
  const previousStock = record ? stockSnapshot(record.vendor, record.productCode) : null;
  const baseStock = Number(els.editBaseStock.value);
  const orderQty = Number(els.editOrderQty.value);
  if (!record || !Number.isFinite(baseStock) || baseStock < 0 || !Number.isFinite(orderQty) || orderQty < 0) {
    alert("기존재고와 발주수량을 확인해주세요.");
    return;
  }
  const sharedInbound = movementTotalsForItem(record).inbound;
  const nextProductState = els.editProductState.value.trim();
  const nextDueDate = els.editDueDate.value;
  const nextDeliveredDate = els.editDeliveredDate.value;
  const nextSpecialNote = els.editSpecialNote.value.trim();
  const nextRemarks = els.editRemarks.value.trim();
  baseStockEdits[itemKey(record)] = baseStock - sharedInbound;
  deliveryEdits[id] = {
    orderQty,
    productState: nextProductState,
    dueDate: nextDueDate,
    deliveredDate: nextDeliveredDate,
    specialNote: nextSpecialNote,
    remarks: nextRemarks,
    shareByProduct: shouldShareProductStock(record.productCode),
  };
  saveDeliveryEdits();
  saveBaseStockEdits();
  els.deliveryDialog.close();
  render();
  const stock = stockSnapshot(record.vendor, record.productCode);
  const baseChanged = previousStock && Number(previousStock.baseStock || 0) !== baseStock;
  const orderChanged = Number(record.orderQty || 0) !== orderQty || record.dueDate !== nextDueDate;
  const becamePacked = nextProductState.includes("포장") && !String(record.productState || "").includes("포장");
  const alertKind = becamePacked
    ? "포장완료"
    : orderChanged
      ? (Number(record.orderQty || 0) === 0 && orderQty > 0 ? "새 발주 등록" : "발주 수정")
      : baseChanged
        ? "재고변경"
        : "";
  if (alertKind) {
    sendInventoryAlert({
      kind: alertKind,
      vendor: record.vendor,
      productCode: record.productCode,
      qty: orderQty,
      currentStock: stock?.available,
      orderQty: stock?.orderQty,
      deliveredQty: stock?.deliveredQty,
      dueDate: nextDueDate,
      deliveredDate: nextDeliveredDate,
      memo: nextRemarks || nextSpecialNote || nextProductState,
    });
  }
}

function openStockEditor(vendor, productCode) {
  const item = rowsWithStock().find((row) => row.vendor === vendor && row.productCode === productCode);
  if (!item) return;
  els.stockEditForm.reset();
  els.stockVendor.textContent = vendor;
  els.stockProductCode.textContent = productCode;
  els.stockVendorValue.value = vendor;
  els.stockProductValue.value = productCode;
  els.stockCurrentValue.textContent = fmtNum(item.available);
  els.stockExactQty.placeholder = `현재 ${fmtNum(item.available)} / 비워두면 입고·출하`;
  els.stockDate.value = today();
  els.stockDialog.showModal();
  els.stockExactQty.focus();
}

function saveStockChange(event) {
  event.preventDefault();
  const vendor = els.stockVendorValue.value;
  const productCode = els.stockProductValue.value;
  const exactQtyText = els.stockExactQty.value.trim();
  const qty = Number(els.stockQty.value);
  if (!inventoryRows().some((row) => row.vendor === vendor && row.productCode === productCode)) return;

  if (exactQtyText) {
    const exactQty = Number(exactQtyText);
    if (!Number.isFinite(exactQty)) {
      alert("직접 수정할 현재재고를 확인해주세요.");
      return;
    }
    const item = rowsWithStock().find((row) => row.vendor === vendor && row.productCode === productCode);
    setAvailableStockEdit(vendor, productCode, exactQty);
    movements.push({
      id: makeId("movement"),
      vendor,
      productCode,
      type: "adjust",
      qty: exactQty,
      previousQty: item?.available ?? 0,
      date: els.stockDate.value || today(),
      memo: els.stockMemo.value.trim(),
      createdAt: new Date().toISOString(),
    });
    saveMovements();
    saveBaseStockEdits();
    els.stockDialog.close();
    render();
    notifyMovement(movements[movements.length - 1]);
    return;
  }

  if (!Number.isFinite(qty) || qty <= 0) {
    alert("수량을 확인해주세요.");
    return;
  }
  movements.push({
    id: makeId("movement"),
    vendor,
    productCode,
    type: els.stockType.value,
    qty,
    date: els.stockDate.value || today(),
    memo: els.stockMemo.value.trim(),
    shareByProduct: shouldShareProductStock(productCode),
    createdAt: new Date().toISOString(),
  });
  saveMovements();
  els.stockDialog.close();
  render();
  notifyMovement(movements[movements.length - 1]);
}

function deleteMovement(id) {
  const movement = movements.find((row) => row.id === id);
  if (!movement) return;
  const type = movementTypeLabel(movement.type) || "입출고";
  if (!confirm(`${movement.productCode} ${type} ${fmtNum(movement.qty)}개 내역을 삭제할까요?\n현재재고에 자동으로 반영됩니다.`)) return;
  if (movement.type === "adjust") {
    setAvailableStockEdit(movement.vendor, movement.productCode, Number(movement.previousQty || 0));
    saveBaseStockEdits();
  }
  movements = movements.filter((row) => row.id !== id);
  saveMovements();
  render();
}

function expandedStockExportRows(stockRows) {
  const recordsByItem = new Map();
  for (const record of deliveryRows()) {
    const key = itemKey(record);
    const records = recordsByItem.get(key) || [];
    records.push(record);
    recordsByItem.set(key, records);
  }

  return stockRows.flatMap((stock) => {
    const records = recordsByItem.get(itemKey(stock)) || [];
    if (!records.length) return [{ stock, record: null }];
    return records
      .sort((a, b) => (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31"))
      .map((record) => ({ stock, record }));
  });
}

function productSearchRecordStatus(stock, record) {
  if (!record) return stock?.status || "";
  if (!stock) return record.productState || "";
  if (stock.shortage > 0 && Number(record.orderQty || 0) > 0) return "부족";
  const canPack = Number(record.orderQty || 0) > 0 && Number(record.shippedQty || 0) === 0 && stock.available >= Number(record.orderQty || 0);
  if (record.productState.includes("일부납품")) return `일부납품${canPack ? ", 포장가능" : ""}`;
  if (isDelivered(record)) return "납품";
  if (record.productState) return `${record.productState}${canPack && !record.productState.includes("포장가능") ? ", 포장가능" : ""}`;
  return canPack ? "포장가능" : "";
}

function exportRecordStatus(stock, record) {
  if (!record) return stock.status;
  if (stock.shortage > 0) return "부족";
  const canPack = Number(record.orderQty || stock.orderQty || 0) > 0;
  if (record.productState.includes("일부납품")) return `일부납품${canPack ? ", 포장가능" : ""}`;
  if (isDelivered(record)) return `납품${canPack ? ", 포장가능" : ""}`;
  return canPack ? "포장가능" : stock.available === 0 ? "소진" : "보유";
}

function currentExport() {
  if (activeView === "stock" || activeView === "shortage") {
    const rows = activeView === "shortage" ? filteredStockRows().filter((row) => row.shortage > 0) : filteredStockRows();
    const exportRows = expandedStockExportRows(rows);
    return {
      name: activeView === "shortage" ? "부족현황" : "재고현황",
      header: ["업체", "품번", "소번지", "기존재고", "발주수량", "현재재고", "부족수량", "납기일자", "상태", "특이사항"],
      rows: exportRows.map(({ stock, record }) => [stock.vendor, stock.productCode, stock.location, stock.baseStock, record?.orderQty ?? stock.orderQty, stock.available, stock.shortage, record?.dueDate ?? stock.dueDate, exportRecordStatus(stock, record), record?.specialNote || stock.note]),
    };
  }
  if (activeView === "product") {
    const rows = filteredProductRows();
    const stockRows = rowsWithStock();
    const stockRowsByItem = new Map(stockRows.map((row) => [itemKey(row), row]));
    const stockRowsByProduct = new Map();
    for (const row of stockRows) {
      if (!stockRowsByProduct.has(stockKey(row))) stockRowsByProduct.set(stockKey(row), row);
    }
    const stockForRecord = (row) => stockRowsByItem.get(itemKey(row)) || stockRowsByProduct.get(stockKey(row));
    return {
      name: "품번조회",
      header: ["업체", "품번", "소번지", "제품상태", "발주수량", "납품수량", "기존재고", "현재재고", "부족수량", "납기일자", "납품일자", "비고", "특이사항"],
      rows: rows.map((row) => {
        const stock = stockForRecord(row);
        return [row.vendor, row.productCode, row.location, productSearchRecordStatus(stock, row), row.orderQty, row.shippedQty || 0, stock?.baseStock ?? 0, stock?.available ?? row.currentStock, stock?.shortage ?? 0, row.dueDate, row.deliveredDate, row.remarks, row.specialNote];
      }),
    };
  }
  if (activeView === "schedule" || activeView === "packed" || activeView === "delivered") {
    let rows = filteredDeliveryRows();
    if (activeView === "packed") rows = rows.filter(isPacked);
    if (activeView === "delivered") rows = rows.filter(isDeliveryMenuItem);
    return {
      name: activeView === "delivered" ? "납품완료" : activeView === "packed" ? "포장완료" : "납품납기조회",
      header: ["업체", "품번", "제품상태", "발주수량", "납품수량", "납기일자", "납품일자", "비고", "특이사항", "원본시트"],
      rows: rows.map((row) => [row.vendor, row.productCode, row.productState, row.orderQty, row.shippedQty || 0, row.dueDate, row.deliveredDate, row.remarks, row.specialNote, row.sourceSheet]),
    };
  }
  const rows = filteredMovements();
  return {
    name: "입출내역",
    header: ["일자", "업체", "품번", "구분", "수량", "비고"],
    rows: rows.map((row) => [row.date, row.vendor, row.productCode, movementTypeLabel(row.type), row.qty, row.memo]),
  };
}

function exportCsv() {
  const data = currentExport();
  const lines = [data.header, ...data.rows].map((line) => line.map(csvCell).join(","));
  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${data.name}_${today()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function resetData() {
  if (!confirm("입고/출하·재고변경 내역, 수정한 재고·납품정보, 직접 등록한 제품과 삭제 설정을 모두 초기화할까요?\n삭제했던 기본 업체와 품번은 다시 표시됩니다.")) return;
  movements = [];
  deliveryEdits = {};
  customProducts = [];
  customDeliveries = [];
  deletedVendors = [];
  deletedProducts = [];
  baseStockEdits = {};
  deletedDeliveryIds = [];
  saveMovements();
  saveDeliveryEdits();
  saveCustomData();
  saveDeletedItems();
  saveBaseStockEdits();
  saveDeletedDeliveries();
  populateSelects();
  render();
}

function showAuth(message = "회사 이메일로 로그인하세요.") {
  els.appView.hidden = true;
  els.authScreen.hidden = false;
  els.authMessage.textContent = message;
}

function authErrorMessage(error) {
  const message = String(error?.message || "");
  if (message.includes("Invalid login credentials")) return "이메일 또는 비밀번호가 맞지 않습니다.";
  if (message.includes("Email not confirmed")) return "이메일의 가입 확인 링크를 먼저 눌러주세요.";
  if (message.includes("already registered")) return "이미 가입된 이메일입니다.";
  return message || "처리 중 오류가 발생했습니다.";
}

async function handleSession(session) {
  cloudReady = false;
  if (!session?.user) {
    signedInProfile = null;
    showAuth();
    return;
  }
  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("id,email,role,approved")
    .eq("id", session.user.id)
    .maybeSingle();
  if (error || !profile) {
    showAuth("사용자 정보를 확인할 수 없습니다. 잠시 후 다시 로그인해주세요.");
    return;
  }
  if (!profile.approved) {
    await supabaseClient.auth.signOut();
    showAuth("가입 신청이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.");
    return;
  }
  signedInProfile = profile;
  const isAdmin = profile.role === "admin";
  els.authScreen.hidden = true;
  els.appView.hidden = false;
  els.signedInUser.textContent = `${profile.email}${isAdmin ? " · 관리자" : ""}`;
  els.manageUsersButton.hidden = !isAdmin;
  els.manageItemsButton.hidden = !isAdmin;
  els.resetData.hidden = !isAdmin;
  try {
    await loadCloudState(session.user);
    populateSelects();
    render();
    subscribeToCloudState();
  } catch (loadError) {
    console.error(loadError);
    setSyncStatus("연결 실패", true);
  }
}

async function login(event) {
  event.preventDefault();
  els.authMessage.textContent = "로그인 중입니다.";
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: els.authEmail.value.trim(),
    password: els.authPassword.value,
  });
  if (error) els.authMessage.textContent = authErrorMessage(error);
}

async function signUp() {
  if (!els.authForm.reportValidity()) return;
  els.authMessage.textContent = "가입 신청 중입니다.";
  const { data, error } = await supabaseClient.auth.signUp({
    email: els.authEmail.value.trim(),
    password: els.authPassword.value,
  });
  if (error) {
    els.authMessage.textContent = authErrorMessage(error);
    return;
  }
  els.authMessage.textContent = data.session
    ? "가입되었습니다. 관리자 승인을 기다려주세요."
    : "확인 이메일을 보냈습니다. 이메일 확인 후 관리자 승인을 기다려주세요.";
}

async function openUserManager() {
  const { data, error } = await supabaseClient.from("profiles").select("id,email,role,approved,created_at").order("created_at");
  if (error) {
    alert("사용자 목록을 불러오지 못했습니다.");
    return;
  }
  els.userList.innerHTML = data.map((profile) => {
    const isOwner = profile.email.toLowerCase() === "0duck1978@gmail.com";
    return `<div class="user-row">
      <div><strong>${escapeHtml(profile.email)}</strong><span>${profile.role === "admin" ? "관리자" : profile.approved ? "사용 중" : "승인 대기"}</span></div>
      <div class="user-row-actions">
        <button class="secondary-btn" type="button" data-user-approve="${escapeHtml(profile.id)}" data-approved="${profile.approved}" ${isOwner ? "disabled" : ""}>${profile.approved ? "승인 취소" : "승인"}</button>
        <button class="secondary-btn" type="button" data-user-role="${escapeHtml(profile.id)}" data-role="${profile.role}" ${isOwner ? "disabled" : ""}>${profile.role === "admin" ? "일반 전환" : "관리자 지정"}</button>
      </div>
    </div>`;
  }).join("");
  if (!els.userDialog.open) els.userDialog.showModal();
}

async function updateUser(event) {
  const approveButton = event.target.closest("[data-user-approve]");
  const roleButton = event.target.closest("[data-user-role]");
  if (!approveButton && !roleButton) return;
  const id = approveButton?.dataset.userApprove || roleButton.dataset.userRole;
  const values = approveButton
    ? { approved: approveButton.dataset.approved !== "true" }
    : { role: roleButton.dataset.role === "admin" ? "user" : "admin" };
  const { error } = await supabaseClient.from("profiles").update(values).eq("id", id);
  if (error) alert("사용자 권한을 변경하지 못했습니다.");
  else openUserManager();
}

async function initializeCloudApp() {
  const config = window.SUPABASE_CONFIG || {};
  if (!window.supabase || !config.url || !config.anonKey || config.anonKey.startsWith("__")) {
    showAuth("공용 데이터 연결 설정이 필요합니다.");
    return;
  }
  supabaseClient = window.supabase.createClient(config.url, config.anonKey);
  els.authForm.addEventListener("submit", login);
  els.signUpButton.addEventListener("click", signUp);
  els.signOutButton.addEventListener("click", () => supabaseClient.auth.signOut());
  els.manageUsersButton.addEventListener("click", openUserManager);
  els.closeUserDialog.addEventListener("click", () => els.userDialog.close());
  els.userList.addEventListener("click", updateUser);
  const { data } = await supabaseClient.auth.getSession();
  await handleSession(data.session);
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => handleSession(session), 0);
  });
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    activeView = tab.dataset.view;
    if (activeView !== "product") selectedProductCode = "";
    els.searchInput.placeholder = activeView === "product" ? "조회할 품번을 입력하세요" : "품번, 소번지, 날짜, 비고 검색";
    render();
  });
});

els.form.addEventListener("submit", addMovement);
els.vendorInput.addEventListener("change", () => {
  els.productInput.value = "";
  updateProductList();
});
els.vendorFilter.addEventListener("change", render);
els.searchInput.addEventListener("input", () => {
  selectedProductCode = "";
  render();
});
els.clearSearch.addEventListener("click", () => {
  selectedProductCode = "";
  els.searchInput.value = "";
  els.searchInput.focus();
  render();
});
els.historyDateFrom.addEventListener("change", render);
els.historyDateTo.addEventListener("change", render);
els.clearHistoryDates.addEventListener("click", () => {
  els.historyDateFrom.value = "";
  els.historyDateTo.value = "";
  render();
});
els.exportCsv.addEventListener("click", exportCsv);
els.resetData.addEventListener("click", resetData);
els.newProductButton.addEventListener("click", openProductDialog);
els.manageItemsButton.addEventListener("click", openManageDialog);
els.manageVendor.addEventListener("change", populateManageProducts);
els.manageProduct.addEventListener("input", populateManageRecords);
els.deleteProductButton.addEventListener("click", deleteProduct);
els.deleteVendorButton.addEventListener("click", deleteVendor);
els.closeManageDialog.addEventListener("click", () => els.manageDialog.close());
els.cancelManageDialog.addEventListener("click", () => els.manageDialog.close());
els.productForm.addEventListener("submit", registerProduct);
els.newVendor.addEventListener("change", toggleNewVendorField);
els.closeProductDialog.addEventListener("click", () => els.productDialog.close());
els.cancelProductDialog.addEventListener("click", () => els.productDialog.close());
els.tableBody.addEventListener("click", (event) => {
  const productButton = event.target.closest("[data-product-code]");
  if (productButton) {
    previousViewState = {
      activeView,
      vendor: els.vendorFilter.value,
      search: els.searchInput.value,
      selectedProductCode,
    };
    selectedProductCode = productButton.dataset.productCode;
    activeView = "product";
    els.vendorFilter.value = "all";
    els.searchInput.value = selectedProductCode;
    els.searchInput.placeholder = "조회할 품번을 입력하세요";
    render();
    return;
  }
  const stockButton = event.target.closest("[data-stock-code]");
  if (stockButton) {
    openStockEditor(stockButton.dataset.stockVendor, stockButton.dataset.stockCode);
    return;
  }
  const deleteMovementButton = event.target.closest("[data-delete-movement]");
  if (deleteMovementButton) {
    deleteMovement(deleteMovementButton.dataset.deleteMovement);
    return;
  }
  const button = event.target.closest("[data-edit-id]");
  if (button) openDeliveryEditor(button.dataset.editId);
});
els.backToPrevious.addEventListener("click", () => {
  if (!previousViewState) return;
  const state = previousViewState;
  previousViewState = null;
  activeView = state.activeView;
  selectedProductCode = state.selectedProductCode;
  els.vendorFilter.value = state.vendor;
  els.searchInput.value = state.search;
  els.searchInput.placeholder = activeView === "product" ? "조회할 품번을 입력하세요" : "품번, 소번지, 날짜, 비고 검색";
  render();
});
els.backToAll.addEventListener("click", () => {
  previousViewState = null;
  activeView = "stock";
  selectedProductCode = "";
  els.vendorFilter.value = "all";
  els.searchInput.value = "";
  els.searchInput.placeholder = "품번, 소번지, 날짜, 비고 검색";
  render();
});
els.deliveryEditForm.addEventListener("submit", saveDeliveryRecord);
els.closeDialog.addEventListener("click", () => els.deliveryDialog.close());
els.cancelDialog.addEventListener("click", () => els.deliveryDialog.close());
els.stockEditForm.addEventListener("submit", saveStockChange);
els.closeStockDialog.addEventListener("click", () => els.stockDialog.close());
els.cancelStockDialog.addEventListener("click", () => els.stockDialog.close());

els.dateInput.value = today();
initializeCloudApp();
