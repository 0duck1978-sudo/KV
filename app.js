// Supabase 연동 설정
const SUPABASE_URL = "https://uoctovqlmmwbanqfrwfk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvY3RvdnFsbW13YmFucWZyd2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NjY2ODQsImV4cCI6MjA5NzQ0MjY4NH0.1jr3QYXQ9DwiNceI7Fdu0fk5V76_xnbDNOt-ex4V45Y";

// 공통 헤더 설정
const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};

// 메인 요소들 정의
const els = {
  metricProducts: document.querySelector("#metricProducts"),
  metricVendors: document.querySelector("#metricVendors"),
  metricShortages: document.querySelector("#metricShortages"),
  metricStock: document.querySelector("#metricStock"),
  vendorFilter: document.querySelector("#vendorFilter"),
  searchInput: document.querySelector("#searchInput"),
  tableHead: document.querySelector("#tableHead"),
  tableBody: document.querySelector("#tableBody"),
  emptyState: document.querySelector("#emptyState")
};

let activeView = "stock"; // "stock", "shortage", "product", "delivery", "completed", "history"
let allData = [];

// 1. Supabase에서 'research' 테이블 데이터 실시간 가져오기
async function fetchSupabaseData() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/research?select=*`, {
      method: "GET",
      headers: headers
    });
    if (!response.ok) throw new Error("데이터 로드 실패");
    allData = await response.json();
    populateFilters();
    render();
    setupButtonEvents(); // 모든 버튼 이벤트 연결
  } catch (err) {
    console.error(err);
    if(els.emptyState) els.emptyState.textContent = "데이터를 불러오는 중 오류가 발생했습니다.";
  }
}

function fmtNum(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) ? n.toLocaleString("ko-KR") : n.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function populateFilters() {
  if (!els.vendorFilter) return;
  const vendors = [...new Set(allData.map(item => item.업체))].filter(Boolean).sort((a, b) => a.localeCompare(b, "ko"));
  const currentFilter = els.vendorFilter.value;
  
  els.vendorFilter.innerHTML = `<option value="all">전체 업체</option>` + 
    vendors.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
    
  if (currentFilter) els.vendorFilter.value = currentFilter;
}

function renderMetrics() {
  if (els.metricProducts) els.metricProducts.textContent = fmtNum(allData.length);
  if (els.metricVendors) els.metricVendors.textContent = fmtNum([...new Set(allData.map(item => item.업체))].filter(Boolean).length);
  if (els.metricShortages) els.metricShortages.textContent = fmtNum(allData.filter(row => Number(row.현재재고 || 0) < 0).length);
  if (els.metricStock) els.metricStock.textContent = fmtNum(allData.reduce((sum, row) => sum + Number(row.현재재고 || 0), 0));
}

function render() {
  renderMetrics();
  
  const query = els.searchInput ? els.searchInput.value.trim().toLowerCase() : "";
  const selectedVendor = els.vendorFilter ? els.vendorFilter.value : "all";
  
  // 뷰 모드에 따른 1차 데이터 필터링
  const filtered = allData.filter(row => {
    // 1) 부족현황: 현재재고가 0 미만인 것만
    if (activeView === "shortage" && Number(row.현재재고 || 0) >= 0) return false;
    
    // 2) 납품/납기조회: 납기일자가 존재하는 항목들만 골라보기
    if (activeView === "delivery" && !row.납기일자) return false;
    
    // 3) 납품완료: 현재재고가 발주수량만큼 다 채워졌거나 보유 상태인 것 (예시 조건)
    if (activeView === "completed" && Number(row.현재재고 || 0) <= 0) return false;

    const matchVendor = selectedVendor === "all" || row.업체 === selectedVendor;
    const text = `${row.품번} ${row.소번지} ${row.특이사항}`.toLowerCase();
    const matchQuery = !query || text.includes(query);
    return matchVendor && matchQuery;
  });

  if (els.emptyState) els.emptyState.style.display = filtered.length ? "none" : "block";
  
  // 테이블 제목 레이아웃 설정
  if (els.tableHead) {
    if (activeView === "history") {
      els.tableHead.innerHTML = `<tr><th>업체</th><th>품번</th><th>소번지</th><th>구분</th><th>수량</th><th>일자</th><th>비고</th></tr>`;
    } else {
      els.tableHead.innerHTML = `<tr><th>업체</th><th>품번</th><th>소번지</th><th>기존재고</th><th>발주수량</th><th>현재재고</th><th>납기일자</th><th>상태</th><th>특이사항</th></tr>`;
    }
  }
  
  // 테이블 내용 렌더링
  if (els.tableBody) {
    if (activeView === "history") {
      // 입출내역 예시 레이아웃 (데이터 구조에 따라 매칭)
      els.tableBody.innerHTML = filtered.map(row => `
        <tr>
          <td>${escapeHtml(row.업체)}</td>
          <td><span class="num">${escapeHtml(row.품번)}</span></td>
          <td>${escapeHtml(row.소번지)}</td>
          <td><span class="badge good">조회됨</span></td>
          <td><span class="num">${fmtNum(row.발주수량)}</span></td>
          <td>${escapeHtml(row.납기일자 || "-")}</td>
          <td>${escapeHtml(row.특이사항 || "")}</td>
        </tr>
      `).join("");
    } else {
      els.tableBody.innerHTML = filtered.map(row => {
        const available = Number(row.현재재고 || 0);
        const status = available < 0 ? "부족" : available === 0 ? "소진" : "보유";
        const badgeClass = status === "부족" ? "bad" : status === "소진" ? "warn" : "good";
        
        return `<tr>
          <td>${escapeHtml(row.업체)}</td>
          <td><span class="num">${escapeHtml(row.품번)}</span></td>
          <td>${escapeHtml(row.소번지)}</td>
          <td><span class="num">${fmtNum(row.기존재고)}</span></td>
          <td><span class="num">${fmtNum(row.발주수량)}</span></td>
          <td><span class="num">${fmtNum(row.현재재고)}</span></td>
          <td>${escapeHtml(row.납기일자 || "")}</td>
          <td><span class="badge ${badgeClass}">${status}</span></td>
          <td>${escapeHtml(row.특이사항 || "")}</td>
        </tr>`;
      }).join("");
    }
  }
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

// 모든 메뉴 버튼 이벤트 연결 함수
function setupButtonEvents() {
  const buttons = document.querySelectorAll("button, .nav-btn");
  buttons.forEach(btn => {
    const txt = btn.textContent.trim();
    
    // 각 버튼의 텍스트명과 매칭하여 기능 활성화
    if (txt === "재고") {
      btn.addEventListener("click", (e) => { e.preventDefault(); changeActiveTab(btn); activeView = "stock"; render(); });
    } else if (txt === "부족현황") {
      btn.addEventListener("click", (e) => { e.preventDefault(); changeActiveTab(btn); activeView = "shortage"; render(); });
    } else if (txt === "품번조회") {
      btn.addEventListener("click", (e) => { e.preventDefault(); changeActiveTab(btn); activeView = "product"; render(); if(els.searchInput) els.searchInput.focus(); });
    } else if (txt === "납품/납기조회") {
      btn.addEventListener("click", (e) => { e.preventDefault(); changeActiveTab(btn); activeView = "delivery"; render(); });
    } else if (txt === "납품완료") {
      btn.addEventListener("click", (e) => { e.preventDefault(); changeActiveTab(btn); activeView = "completed"; render(); });
    } else if (txt === "입출내역") {
      btn.addEventListener("click", (e) => { e.preventDefault(); changeActiveTab(btn); activeView = "history"; render(); });
    }
  });
}

// 탭 선택 시 시각 효과 디자인 변경 유지
function changeActiveTab(activeBtn) {
  const buttons = document.querySelectorAll("button, .nav-btn");
  buttons.forEach(btn => {
    const t = btn.textContent.trim();
    if(["재고","부족현황","품번조회","납품/납기조회","납품완료","입출내역"].includes(t)) {
      btn.style.backgroundColor = "";
      btn.style.color = "";
    }
  });
  activeBtn.style.backgroundColor = "#1e40af"; // 활성화 시 남색 불 들어오게 설정
  activeBtn.style.color = "#ffffff";
}

if (els.vendorFilter) els.vendorFilter.addEventListener("change", render);
if (els.searchInput) els.searchInput.addEventListener("input", render);

// 최초 실행
fetchSupabaseData();
