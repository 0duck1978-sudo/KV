import { INVENTORY_SEED, DELIVERY_SEED } from './data.js';

const els = {
  metricProducts: document.querySelector('#metricProducts'),
  metricVendors: document.querySelector('#metricVendors'),
  metricShortages: document.querySelector('#metricShortages'),
  metricStock: document.querySelector('#metricStock'),
  vendorFilter: document.querySelector('#vendorFilter'),
  searchInput: document.querySelector('#searchInput'),
  tableHead: document.querySelector('#tableHead'),
  tableBody: document.querySelector('#tableBody'),
  emptyState: document.querySelector('#emptyState'),
  form: document.querySelector('form'),
  vendorInput: document.querySelector('input[placeholder*="업체"]'),
  productInput: document.querySelector('input[placeholder*="품번"]'),
  typeSelect: document.querySelector('select:not(#vendorFilter)'),
  qtyInput: document.querySelector('input[type="number"]'),
  dateInput: document.querySelector('input[type="date"]'),
  remarkInput: document.querySelector('input[placeholder*="비고"]')
};

let activeView = 'stock';
let inventory = [];
let deliveryLog = [];

function init() {
  const savedInv = localStorage.getItem('kv_inventory');
  const savedLog = localStorage.getItem('kv_delivery_log');
  
  if (savedInv) {
    inventory = JSON.parse(savedInv);
  } else {
    inventory = [...INVENTORY_SEED];
    save();
  }
  
  if (savedLog) {
    deliveryLog = JSON.parse(savedLog);
  } else {
    deliveryLog = [...DELIVERY_SEED];
    save();
  }

  const savedView = localStorage.getItem('kv_active_view');
  if (savedView) activeView = savedView;

  if (els.vendorFilter) {
    els.vendorFilter.addEventListener('change', render);
  }
  if (els.searchInput) {
    els.searchInput.addEventListener('input', render);
  }
  if (els.form) {
    els.form.addEventListener('submit', handleTransaction);
  }

  setupNav();
  populateFilters();
  render();
}

function save() {
  localStorage.setItem('kv_inventory', JSON.stringify(inventory));
  localStorage.setItem('kv_delivery_log', JSON.stringify(deliveryLog));
  localStorage.setItem('kv_active_view', activeView);
}

function setupNav() {
  const buttons = document.querySelectorAll('button, .nav-btn');
  buttons.forEach(btn => {
    const text = btn.textContent.trim();
    if (text === '재고') btn.id = 'btnStock';
    if (text === '부족현황') btn.id = 'btnShortage';
    if (text === '품번조회') btn.id = 'btnProduct';
    if (text === '납품/납기조회') btn.id = 'btnDelivery';
    if (text === '납품완료') btn.id = 'btnCompleted';
    if (text === '입출내역') btn.id = 'btnHistory';

    btn.addEventListener('click', (e) => {
      if (btn.type === 'submit' || btn.closest('form')) return;
      e.preventDefault();
      
      if (btn.id === 'btnStock') activeView = 'stock';
      else if (btn.id === 'btnShortage') activeView = 'shortage';
      else if (btn.id === 'btnProduct') {
        activeView = 'product';
        setTimeout(() => els.searchInput && els.searchInput.focus(), 50);
      }
      else if (btn.id === 'btnDelivery') activeView = 'delivery';
      else if (btn.id === 'btnCompleted') activeView = 'completed';
      else if (btn.id === 'btnHistory') activeView = 'history';

      save();
      render();
    });
  });
}

function populateFilters() {
  if (!els.vendorFilter) return;
  const vendors = [...new Set(inventory.map(item => item.vendor))].filter(Boolean).sort((a,b)=>a.localeCompare(b,'ko'));
  const current = els.vendorFilter.value;
  els.vendorFilter.innerHTML = '<option value="all">전체 업체</option>' + 
    vendors.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
  if (current) els.vendorFilter.value = current;
}

function handleTransaction(e) {
  e.preventDefault();
  const vendor = els.vendorInput.value.trim();
  const product = els.productInput.value.trim();
  const type = els.typeSelect.value;
  const qty = parseInt(els.qtyInput.value || '0', 10);
  const date = els.dateInput.value;
  const remark = els.remarkInput.value.trim();

  if (!vendor || !product || qty <= 0) return;

  let item = inventory.find(i => i.vendor === vendor && i.product === product);
  if (!item) {
    item = { vendor, product, location: '-', initial: 0, order: 0, available: 0, dueDate: '', remark: '' };
    inventory.push(item);
  }

  if (type === '완성품 추가') {
    item.initial += qty;
    item.available += qty;
  } else if (type === '원자재 출하') {
    item.available -= qty;
  }

  if (date) item.dueDate = date;
  if (remark) item.remark = remark;

  deliveryLog.unshift({
    id: Date.now().toString(),
    date: new Date().toISOString().split('T')[0],
    vendor,
    product,
    type,
    qty,
    dueDate: date || '-',
    remark: remark || '-'
  });

  save();
  populateFilters();
  els.form.reset();
  render();
}

function fmtNum(n) {
  return (n || 0).toLocaleString('ko-KR');
}

function renderMetrics() {
  if (els.metricProducts) els.metricProducts.textContent = fmtNum(inventory.length);
  if (els.metricVendors) els.metricVendors.textContent = fmtNum([...new Set(inventory.map(i=>i.vendor))].filter(Boolean).length);
  if (els.metricShortages) els.metricShortages.textContent = fmtNum(inventory.filter(i => i.available < 0).length);
  if (els.metricStock) els.metricStock.textContent = fmtNum(inventory.reduce((sum, i) => sum + (i.available || 0), 0));
}

function render() {
  renderMetrics();
  
  const buttons = document.querySelectorAll('button, .nav-btn');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    if (activeView === 'stock' && btn.id === 'btnStock') btn.classList.add('active');
    if (activeView === 'shortage' && btn.id === 'btnShortage') btn.classList.add('active');
    if (activeView === 'product' && btn.id === 'btnProduct') btn.classList.add('active');
    if (activeView === 'delivery' && btn.id === 'btnDelivery') btn.classList.add('active');
    if (activeView === 'completed' && btn.id === 'btnCompleted') btn.classList.add('active');
    if (activeView === 'history' && btn.id === 'btnHistory') btn.classList.add('active');
  });

  const vendorSel = els.vendorFilter ? els.vendorFilter.value : 'all';
  const query = els.searchInput ? els.searchInput.value.trim().toLowerCase() : '';

  if (activeView === 'history') {
    if (els.tableHead) els.tableHead.innerHTML = `<tr><th>일자</th><th>업체</th><th>품번</th><th>구분</th><th>수량</th><th>납기일자</th><th>비고</th></tr>`;
    
    const filteredLog = deliveryLog.filter(log => {
      const matchVendor = vendorSel === 'all' || log.vendor === vendorSel;
      const matchQuery = !query || `${log.product} ${log.remark}`.toLowerCase().includes(query);
      return matchVendor && matchQuery;
    });

    if (els.emptyState) els.emptyState.style.display = filteredLog.length ? 'none' : 'block';
    if (els.tableBody) {
      els.tableBody.innerHTML = filteredLog.map(log => `
        <tr>
          <td>${escapeHtml(log.date)}</td>
          <td>${escapeHtml(log.vendor)}</td>
          <td><span class="num">${escapeHtml(log.product)}</span></td>
          <td><span class="badge ${log.type.includes('추가')?'good':'bad'}">${escapeHtml(log.type)}</span></td>
          <td><span class="num">${fmtNum(log.qty)}</span></td>
          <td>${escapeHtml(log.dueDate)}</td>
          <td>${escapeHtml(log.remark)}</td>
        </tr>
      `).join('');
    }
    return;
  }

  if (els.tableHead) {
    els.tableHead.innerHTML = `<tr><th>업체</th><th>품번</th><th>소번지</th><th>기존재고</th><th>발주수량</th><th>현재재고</th><th>납기일자</th><th>상태</th><th>특이사항</th></tr>`;
  }

  const filteredInv = inventory.filter(item => {
    const matchVendor = vendorSel === 'all' || item.vendor === vendorSel;
    const matchQuery = !query || `${item.product} ${item.location} ${item.remark}`.toLowerCase().includes(query);
    if (!matchVendor || !matchQuery) return false;

    if (activeView === 'shortage') return item.available < 0;
    if (activeView === 'delivery') return !!item.dueDate && item.available < 0;
    if (activeView === 'completed') return !!item.dueDate && item.available >= 0;
    return true;
  });

  if (els.emptyState) els.emptyState.style.display = filteredInv.length ? 'none' : 'block';
  if (els.tableBody) {
    els.tableBody.innerHTML = filteredInv.map(item => {
      const status = item.available < 0 ? '부족' : item.available === 0 ? '소진' : '보유';
      const badgeClass = status === '부족' ? 'bad' : status === '소진' ? 'warn' : 'good';
      return `
        <tr>
          <td>${escapeHtml(item.vendor)}</td>
          <td><span class="num">${escapeHtml(item.product)}</span></td>
          <td>${escapeHtml(item.location)}</td>
          <td><span class="num">${fmtNum(item.initial)}</span></td>
          <td><span class="num">${fmtNum(item.order)}</span></td>
          <td><span class="num">${fmtNum(item.available)}</span></td>
          <td>${escapeHtml(item.dueDate || '-')}</td>
          <td><span class="badge ${badgeClass}">${status}</span></td>
          <td>${escapeHtml(item.remark || '-')}</td>
        </tr>
      `;
    }).join('');
  }
}

function escapeHtml(str) {
  return String(str ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();
