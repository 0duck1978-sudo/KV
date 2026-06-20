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

const els = {
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
}

function saveDeliveryEdits() {
  localStorage.setItem(deliveryEditStorageKey, JSON.stringify(deliveryEdits));
}

function saveCustomData() {
  localStorage.setItem(customProductStorageKey, JSON.stringify(customProducts));
  localStorage.setItem(customDeliveryStorageKey, JSON.stringify(customDeliveries));
}

function saveDeletedItems() {
  localStorage.setItem(deletedVendorStorageKey, JSON.stringify(deletedVendors));
  localStorage.setItem(deletedProductStorageKey, JSON.stringify(deletedProducts));
}

function saveBaseStockEdits() {
  localStorage.setItem(baseStockEditStorageKey, JSON.stringify(baseStockEdits));
}

function saveDeletedDeliveries() {
  localStorage.setItem(deletedDeliveryStorageKey, JSON.stringify(deletedDeliveryIds));
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

function isDeleted(vendor, productCode) {
  return deletedVendors.includes(vendor) || deletedProducts.includes(`${vendor}::${productCode}`);
}

function movementDelta(movement) {
  return movement.type === "in" ? movement.qty : -movement.qty;
}

function movementMap() {
  const map = new Map();
  for (const movement of movements) {
    const key = `${movement.vendor}::${movement.productCode}`;
    map.set(key, (map.get(key) || 0) + movementDelta(movement));
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

function rowsWithStock() {
  const deltas = movementMap();
  const orderAdjustments = orderQtyAdjustmentMap();
  const dueDates = new Map();
  const deliveryStates = new Map();
  for (const record of deliveryRows()) {
    const key = itemKey(record);
    const meaningful = Number(record.orderQty || 0) > 0 || record.dueDate || record.deliveredDate || record.productState;
    if (meaningful) {
      const states = deliveryStates.get(key) || [];
      states.push(record);
      deliveryStates.set(key, states);
    }
    if (!isDelivered(record) && record.dueDate) {
      const dates = dueDates.get(key) || [];
      if (!dates.includes(record.dueDate)) dates.push(record.dueDate);
      dueDates.set(key, dates);
    }
  }
  return inventoryRows().map((item) => {
    const adjustment = deltas.get(itemKey(item)) || 0;
    const orderAdjustment = orderAdjustments.get(itemKey(item)) || 0;
    const baseStock = Number(baseStockEdits[itemKey(item)] ?? item.baseStock ?? 0);
    const orderQty = Number(item.orderQty || 0) + orderAdjustment;
    const available = baseStock - orderQty + adjustment;
    const dates = (dueDates.get(itemKey(item)) || []).sort();
    const records = deliveryStates.get(itemKey(item)) || [];
    const deliveredCount = records.filter(isDelivered).length;
    const hasPartial = records.some((record) => record.productState.includes("일부납품"));
    const stockStatus = available < 0 ? "부족" : available === 0 ? "소진" : "보유";
    const deliveryStatus = hasPartial || (deliveredCount > 0 && deliveredCount < records.length)
      ? "일부납품"
      : records.length > 0 && deliveredCount === records.length
        ? "납품"
        : stockStatus;
    return {
      ...item,
      baseStock,
      orderQty,
      adjustment,
      available,
      dueDate: dates.length ? `${dates[0]}${dates.length > 1 ? " 외" : ""}` : "",
      shortage: available < 0 ? Math.abs(available) : 0,
      status: deliveryStatus,
    };
  });
}

function deliveryRows() {
  return [...deliverySeed, ...customDeliveries]
    .filter((record) => !deletedDeliveryIds.includes(record.id))
    .filter((record) => !isDeleted(record.vendor, record.productCode))
    .map((record) => ({ ...record, ...(deliveryEdits[record.id] || {}) }));
}

function isDelivered(record) {
  return record.productState.includes("납품완료") || Boolean(record.deliveredDate);
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
  const rows = rowsWithStock();
  els.metricProducts.textContent = fmtNum(rows.length);
  els.metricVendors.textContent = fmtNum(allVendors().length);
  els.metricShortages.textContent = fmtNum(rows.filter((row) => row.available < 0).length);
  els.metricStock.textContent = fmtNum(rows.reduce((sum, row) => sum + row.available, 0));
}

function matchesFilter(row, fields) {
  const query = els.searchInput.value.trim().toLowerCase();
  const vendor = els.vendorFilter.value;
  const vendorOk = vendor === "all" || row.vendor === vendor;
  const text = fields.map((field) => row[field] || "").join(" ").toLowerCase();
  return vendorOk && (!query || text.includes(query));
}

function filteredStockRows() {
  return rowsWithStock().filter((row) => matchesFilter(row, ["productCode", "location", "note"]));
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
  return movements
    .filter((row) => matchesFilter(row, ["productCode", "memo", "date"]))
    .sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`));
}

function render() {
  renderMetrics();
  els.emptyState.textContent = "조회 결과가 없습니다.";
  els.productNavigation.hidden = activeView !== "product" || !selectedProductCode;
  els.backToPrevious.disabled = !previousViewState;
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === activeView);
  });

  const stockRows = filteredStockRows();
  const records = filteredDeliveryRows();
  if (activeView === "stock") renderStock(stockRows);
  if (activeView === "shortage") renderShortage(stockRows.filter((row) => row.available < 0));
  if (activeView === "product") renderProductSearch(filteredProductRows());
  if (activeView === "schedule") renderDelivery(records, false);
  if (activeView === "delivered") renderDelivery(records.filter(isDelivered), true);
  if (activeView === "history") renderMovements(filteredMovements());
}

function renderProductSearch(rows) {
  const stockValues = new Map(rowsWithStock().map((row) => [itemKey(row), row.available]));
  const displayDate = (row) => row.deliveredDate || row.dueDate || "";
  const sorted = [...rows].sort((a, b) => {
    const left = displayDate(a);
    const right = displayDate(b);
    if (!left && right) return 1;
    if (left && !right) return -1;
    return left.localeCompare(right) || a.vendor.localeCompare(b.vendor, "ko") || a.sourceRow - b.sourceRow;
  });
  setHead(["업체", "품번", "소번지", "제품상태", "발주수량", "현재재고", "납기일자", "납품일자", "비고", "특이사항", "재고변경", "수정"]);
  setBody(sorted, (row) => [
    textCell(row.vendor),
    productLink(row.productCode),
    textCell(row.location),
    deliveryStatusBadge(row.productState),
    numCell(row.orderQty),
    numCell(stockValues.get(itemKey(row)) ?? row.currentStock),
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
  setHead(["업체", "품번", "소번지", "기존재고", "발주수량", "현재재고", "납기일자", "상태", "특이사항"]);
  setBody(rows, (row) => [
    textCell(row.vendor),
    productLink(row.productCode),
    textCell(row.location),
    numCell(row.baseStock),
    numCell(row.orderQty),
    numCell(row.available),
    textCell(row.dueDate),
    statusBadge(row.status),
    textCell(row.note),
  ]);
}

function renderShortage(rows) {
  setHead(["업체", "품번", "소번지", "부족수량", "발주수량", "현재재고", "재고확인날짜", "특이사항"]);
  setBody(rows.sort((a, b) => b.shortage - a.shortage), (row) => [
    textCell(row.vendor),
    productLink(row.productCode),
    textCell(row.location),
    numCell(row.shortage),
    numCell(row.orderQty),
    numCell(row.available),
    textCell(row.checkedDate),
    textCell(row.note),
  ]);
}

function renderDelivery(rows, completedOnly) {
  const sorted = [...rows].sort((a, b) => {
    const left = completedOnly ? a.deliveredDate : a.dueDate;
    const right = completedOnly ? b.deliveredDate : b.dueDate;
    return (right || "0000-00-00").localeCompare(left || "0000-00-00") || a.vendor.localeCompare(b.vendor, "ko");
  });
  setHead(["업체", "품번", "제품상태", "발주수량", "납기일자", "납품일자", "비고", "특이사항", "수정"]);
  setBody(sorted, (row) => [
    textCell(row.vendor),
    productLink(row.productCode),
    deliveryStatusBadge(row.productState),
    numCell(row.orderQty),
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
    textCell(row.type === "in" ? "완성품 추가" : "출하"),
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
    createdAt: new Date().toISOString(),
  });
  saveMovements();
  els.qtyInput.value = "";
  els.memoInput.value = "";
  render();
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
  if (inventoryRows().some((row) => row.vendor === vendor && row.productCode.toLowerCase() === productCode.toLowerCase())) {
    alert("해당 업체에 이미 등록된 품번입니다.");
    return;
  }

  const currentStock = initialStock - orderQty;
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
  customDeliveries.push({
    id: makeId("delivery"),
    vendor,
    productCode,
    location,
    orderQty,
    productState: "",
    currentStock,
    dueDate,
    deliveredDate: "",
    remarks,
    specialNote,
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
}

function openDeliveryEditor(recordId) {
  const record = deliveryRows().find((row) => row.id === recordId);
  if (!record) return;
  const stockItem = rowsWithStock().find((row) => row.vendor === record.vendor && row.productCode === record.productCode);
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
  const baseStock = Number(els.editBaseStock.value);
  const orderQty = Number(els.editOrderQty.value);
  if (!record || !Number.isFinite(baseStock) || baseStock < 0 || !Number.isFinite(orderQty) || orderQty < 0) {
    alert("기존재고와 발주수량을 확인해주세요.");
    return;
  }
  baseStockEdits[itemKey(record)] = baseStock;
  deliveryEdits[id] = {
    orderQty,
    productState: els.editProductState.value.trim(),
    dueDate: els.editDueDate.value,
    deliveredDate: els.editDeliveredDate.value,
    specialNote: els.editSpecialNote.value.trim(),
    remarks: els.editRemarks.value.trim(),
  };
  saveDeliveryEdits();
  saveBaseStockEdits();
  els.deliveryDialog.close();
  render();
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
  els.stockDate.value = today();
  els.stockDialog.showModal();
  els.stockQty.focus();
}

function saveStockChange(event) {
  event.preventDefault();
  const vendor = els.stockVendorValue.value;
  const productCode = els.stockProductValue.value;
  const qty = Number(els.stockQty.value);
  if (!inventoryRows().some((row) => row.vendor === vendor && row.productCode === productCode)) return;
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
    createdAt: new Date().toISOString(),
  });
  saveMovements();
  els.stockDialog.close();
  render();
}

function deleteMovement(id) {
  const movement = movements.find((row) => row.id === id);
  if (!movement) return;
  const type = movement.type === "in" ? "입고" : "출하";
  if (!confirm(`${movement.productCode} ${type} ${fmtNum(movement.qty)}개 내역을 삭제할까요?\n현재재고에 자동으로 반영됩니다.`)) return;
  movements = movements.filter((row) => row.id !== id);
  saveMovements();
  render();
}

function currentExport() {
  if (activeView === "stock" || activeView === "shortage") {
    const rows = activeView === "shortage" ? filteredStockRows().filter((row) => row.available < 0) : filteredStockRows();
    return {
      name: activeView === "shortage" ? "부족현황" : "재고현황",
      header: activeView === "shortage"
        ? ["업체", "품번", "소번지", "부족수량", "발주수량", "현재재고", "재고확인날짜", "특이사항"]
        : ["업체", "품번", "소번지", "기존재고", "발주수량", "현재재고", "납기일자", "상태", "특이사항"],
      rows: activeView === "shortage"
        ? rows.map((row) => [row.vendor, row.productCode, row.location, row.shortage, row.orderQty, row.available, row.checkedDate, row.note])
        : rows.map((row) => [row.vendor, row.productCode, row.location, row.baseStock, row.orderQty, row.available, row.dueDate, row.status, row.note]),
    };
  }
  if (activeView === "product") {
    const rows = filteredProductRows();
    const stockValues = new Map(rowsWithStock().map((row) => [itemKey(row), row.available]));
    return {
      name: "품번조회",
      header: ["업체", "품번", "소번지", "제품상태", "발주수량", "현재재고", "납기일자", "납품일자", "비고", "특이사항"],
      rows: rows.map((row) => [row.vendor, row.productCode, row.location, row.productState, row.orderQty, stockValues.get(itemKey(row)) ?? row.currentStock, row.dueDate, row.deliveredDate, row.remarks, row.specialNote]),
    };
  }
  if (activeView === "schedule" || activeView === "delivered") {
    let rows = filteredDeliveryRows();
    if (activeView === "delivered") rows = rows.filter(isDelivered);
    return {
      name: activeView === "delivered" ? "납품완료" : "납품납기조회",
      header: ["업체", "품번", "제품상태", "발주수량", "납기일자", "납품일자", "비고", "특이사항", "원본시트"],
      rows: rows.map((row) => [row.vendor, row.productCode, row.productState, row.orderQty, row.dueDate, row.deliveredDate, row.remarks, row.specialNote, row.sourceSheet]),
    };
  }
  const rows = filteredMovements();
  return {
    name: "입출내역",
    header: ["일자", "업체", "품번", "구분", "수량", "비고"],
    rows: rows.map((row) => [row.date, row.vendor, row.productCode, row.type === "in" ? "완성품 추가" : "출하", row.qty, row.memo]),
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
  if (!confirm("입고/출하 내역, 수정한 재고·납품정보, 직접 등록한 제품과 삭제 설정을 모두 초기화할까요?\n삭제했던 기본 업체와 품번은 다시 표시됩니다.")) return;
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
populateSelects();
render();
