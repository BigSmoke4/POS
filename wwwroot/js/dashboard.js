/* Dashboard page logic: dynamic API-ready architecture for frontend & backend integration */
(async function () {
  const { donut, bars, bdt, css, MONTHS, generateBranchColor } = Charts;

  // DOM References
  const select = document.getElementById("branchSelect");
  const branchInput = document.getElementById("branchInput");
  const branchSelectDot = document.getElementById("branchSelectDot");
  const chevBtn = select.querySelector(".select__chev-btn");
  const menu = select.querySelector(".select__menu");
  const legend = document.getElementById("legend");
  const donutHost = document.getElementById("donut");
  const barsHost = document.getElementById("bars");
  const barTitle = document.getElementById("barTitle");
  const tip = document.getElementById("tooltip");
  const productsTitle = document.getElementById("productsTitle");
  const productsSub = document.getElementById("productsSub");
  const productTableBody = document.getElementById("productTableBody");

  // State
  let branches = [];
  let allMonthly = [];
  let currentBranchIndex = -1; // -1 = All Branches
  let expandedBranchIndex = -1; // Index of branch whose product list accordion is expanded
  let donutInstance = null;

  // Tooltip helper
  const showTip = (text, e) => {
    if (text == null) {
      tip.hidden = true;
      return;
    }
    tip.hidden = false;
    tip.textContent = text;
    tip.style.left = e.clientX + "px";
    tip.style.top = e.clientY + "px";
  };

  /* ========================================================
     API Communication Layer
     Designed for easy backend ASP.NET Core controller hooking
     ======================================================== */
  const API = {
    // Fetches sales data for all branches
    async getSalesData() {
      try {
        const res = await fetch("/Home/SalesData");
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return await res.json();
      } catch (err) {
        console.error("Failed to load /Home/SalesData:", err);
        return [];
      }
    },
    // Fetches top products (optional branchId; null = all branches)
    async getTopProducts(branchId = null) {
      try {
        const url = branchId ? `/Home/TopProducts?branchId=${branchId}` : `/Home/TopProducts`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return await res.json();
      } catch (err) {
        console.error("Failed to load /Home/TopProducts:", err);
        return [];
      }
    }
  };

  /* ========================================================
     Data Initialization
     ======================================================== */
  async function init() {
    const rawBranches = await API.getSalesData();

    // Map branches with calculated metrics and dynamic unique colors
    branches = rawBranches.map((b, i) => {
      const monthly = Array.isArray(b.monthly) ? b.monthly : new Array(12).fill(0);
      const total = monthly.reduce((acc, val) => acc + val, 0);
      return {
        id: b.id != null ? b.id : i + 1,
        name: b.name || `Branch ${i + 1}`,
        monthly: monthly,
        total: total,
        color: generateBranchColor(i, rawBranches.length)
      };
    });

    // Compute aggregate monthly sales across all branches
    const monthCount = branches.length > 0 && branches[0].monthly.length ? branches[0].monthly.length : 12;
    allMonthly = Array.from({ length: monthCount }, (_, m) =>
      branches.reduce((acc, b) => acc + (b.monthly[m] || 0), 0)
    );

    // Render components
    renderDonut();
    renderLegend();
    renderBranchMenu();
    setupDropdownEvents();

    // Initial state: select All Branches and load All Branch Top Products
    choose(-1);
  }

  /* ========================================================
     Donut Chart & Legend
     ======================================================== */
  function renderDonut() {
    donutInstance = donut(
      donutHost,
      branches.map(b => ({ value: b.total, color: b.color })),
      {
        onSelect: i => choose(currentBranchIndex === i ? -1 : i),
        onHover: (i, e) => showTip(i == null ? null : `${branches[i].name}: ${bdt(branches[i].total)}`, e)
      }
    );
  }

  function renderLegend() {
    legend.innerHTML = branches
      .map((b, i) => `
        <li class="legend__item" data-i="${i}">
          <div class="legend__header" tabindex="0" role="button" aria-expanded="false">
            <span class="dot" style="background:${b.color}"></span>
            <span class="legend__name">${b.name}</span>
            <span class="legend__val">${bdt(b.total)}</span>
            <button class="legend__chev-btn" type="button" aria-label="Toggle ${b.name} products" tabindex="-1">
              <svg class="legend__chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>
          <div class="legend__drawer" id="legendDrawer-${i}" hidden>
            <div class="legend__drawer-title">Top Products of ${b.name}</div>
            <div class="table-container branch-products-scroll">
              <table class="table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>QTY</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody id="legendTableBody-${i}">
                  <!-- Loaded dynamically on expand -->
                </tbody>
              </table>
            </div>
          </div>
        </li>
      `)
      .join("");

    legend.addEventListener("click", e => {
      const item = e.target.closest(".legend__item");
      if (!item) return;
      const idx = +item.dataset.i;

      // Check if user clicked on or inside the dropdown arrow button
      const chevBtnClicked = e.target.closest(".legend__chev-btn");

      if (chevBtnClicked) {
        e.stopPropagation();
        toggleBranchDrawer(idx);
        return;
      }

      // If clicked on header (name, val, or row), select branch on charts & dashboard
      const header = e.target.closest(".legend__header");
      if (header) {
        choose(currentBranchIndex === idx ? -1 : idx);
      }
    });

    legend.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        const header = e.target.closest(".legend__header");
        if (header) {
          e.preventDefault();
          const item = header.closest(".legend__item");
          if (item) {
            const idx = +item.dataset.i;
            choose(currentBranchIndex === idx ? -1 : idx);
          }
        }
      }
    });
  }

  async function toggleBranchDrawer(idx, forceOpen = null) {
    const item = legend.querySelector(`.legend__item[data-i="${idx}"]`);
    if (!item) return;

    const drawer = item.querySelector(`#legendDrawer-${idx}`);
    const tbody = item.querySelector(`#legendTableBody-${idx}`);
    const header = item.querySelector(".legend__header");
    const shouldOpen = forceOpen !== null ? forceOpen : drawer.hidden;

    // Close other expanded drawers for a clean accordion effect
    legend.querySelectorAll(".legend__item").forEach((it, k) => {
      if (k !== idx) {
        it.classList.remove("is-expanded");
        const dr = it.querySelector(".legend__drawer");
        if (dr) dr.hidden = true;
        const hd = it.querySelector(".legend__header");
        if (hd) hd.setAttribute("aria-expanded", "false");
      }
    });

    if (shouldOpen) {
      item.classList.add("is-expanded");
      drawer.hidden = false;
      header.setAttribute("aria-expanded", "true");
      expandedBranchIndex = idx;
      await loadLegendBranchProducts(idx, tbody);
    } else {
      item.classList.remove("is-expanded");
      drawer.hidden = true;
      header.setAttribute("aria-expanded", "false");
      if (expandedBranchIndex === idx) expandedBranchIndex = -1;
    }
  }

  async function loadLegendBranchProducts(idx, tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align:center; padding: 12px; color: var(--ink-faint);">Loading products...</td>
      </tr>
    `;

    const branch = branches[idx];
    if (!branch) return;

    const products = await API.getTopProducts(branch.id);

    if (!products || products.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align:center; padding: 12px; color: var(--ink-faint);">No products found</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = products
      .map(p => `
        <tr>
          <td>${p.name}</td>
          <td class="qty">${p.qty}</td>
          <td class="amount">${bdt(p.amount)}</td>
        </tr>
      `)
      .join("");
  }

  /* ========================================================
     Searchable / Writable Dropdown
     ======================================================== */
  function renderBranchMenu(filterText = "") {
    const query = filterText.trim().toLowerCase();

    // Filter branches based on written text in the dropdown input
    const filteredBranches = branches
      .map((b, originalIndex) => ({ ...b, originalIndex }))
      .filter(b => b.name.toLowerCase().includes(query));

    let html = "";

    // Show "All Branch Sales" option if query matches or is empty
    if ("all branch sales".includes(query) || !query) {
      const isSelected = currentBranchIndex === -1;
      html += `
        <li class="select__item" role="option" data-i="-1" tabindex="0" aria-selected="${isSelected}">
          <span class="dot" style="background:var(--accent)"></span>
          <span>All Branch Sales</span>
        </li>
      `;
    }

    if (filteredBranches.length > 0) {
      html += filteredBranches
        .map(b => {
          const isSelected = currentBranchIndex === b.originalIndex;
          return `
            <li class="select__item" role="option" data-i="${b.originalIndex}" tabindex="0" aria-selected="${isSelected}">
              <span class="dot" style="background:${b.color}"></span>
              <span>${b.name}</span>
            </li>
          `;
        })
        .join("");
    } else if (!("all branch sales".includes(query))) {
      html = `<li class="select__empty">No branch available</li>`;
    }

    menu.innerHTML = html;
  }

  function setupDropdownEvents() {
    // Clicking the input opens the dropdown and allows typing
    branchInput.addEventListener("click", () => {
      if (!isDropdownOpen()) {
        setDropdown(true);
        branchInput.select();
      }
    });

    branchInput.addEventListener("focus", () => {
      if (!isDropdownOpen()) {
        setDropdown(true);
        branchInput.select();
      }
    });

    // Real-time typing directly inside the dropdown input sorts down choices
    branchInput.addEventListener("input", e => {
      if (!isDropdownOpen()) setDropdown(true);
      renderBranchMenu(e.target.value);
    });

    // Toggle button on the right
    chevBtn.addEventListener("click", e => {
      e.stopPropagation();
      setDropdown(!isDropdownOpen());
      if (isDropdownOpen()) branchInput.focus();
    });

    // Selecting an item from the sorted list
    menu.addEventListener("click", e => {
      const li = e.target.closest(".select__item");
      if (li && li.dataset.i !== undefined) {
        choose(+li.dataset.i);
        setDropdown(false);
      }
    });

    // Keyboard support inside input
    branchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        const firstItem = menu.querySelector(".select__item");
        if (firstItem) {
          firstItem.click();
        } else {
          setDropdown(false);
        }
      } else if (e.key === "Escape") {
        // Revert text to selected branch
        branchInput.value = currentBranchIndex < 0 ? "All Branch Sales" : branches[currentBranchIndex].name;
        setDropdown(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const firstItem = menu.querySelector(".select__item");
        if (firstItem) firstItem.focus();
      }
    });

    // Keyboard navigation in menu items
    menu.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        const li = e.target.closest(".select__item");
        if (li) li.click();
      } else if (e.key === "Escape") {
        setDropdown(false);
        branchInput.focus();
      }
    });

    // Click outside closes dropdown & restores label
    document.addEventListener("click", e => {
      if (!select.contains(e.target)) {
        if (isDropdownOpen()) {
          branchInput.value = currentBranchIndex < 0 ? "All Branch Sales" : branches[currentBranchIndex].name;
          setDropdown(false);
        }
      }
    });
  }

  function isDropdownOpen() {
    return !menu.hidden;
  }

  function setDropdown(open) {
    menu.hidden = !open;
    select.classList.toggle("is-open", open);
    if (open) {
      renderBranchMenu(branchInput.value === "All Branch Sales" || (currentBranchIndex >= 0 && branchInput.value === branches[currentBranchIndex]?.name) ? "" : branchInput.value);
    }
  }

  /* ========================================================
     Action: Choose Branch
     ======================================================== */
  function choose(i) {
    currentBranchIndex = i;
    const isAll = i < 0;
    const name = isAll ? "All Branch Sales" : branches[i].name;
    const color = isAll ? (css("--accent") || "#10b981") : branches[i].color;

    // Update input text & indicator dot
    branchInput.value = name;
    if (branchSelectDot) branchSelectDot.style.background = color;
    barTitle.textContent = name;

    // Update active highlight states in menu and legend
    menu.querySelectorAll(".select__item").forEach(li => {
      li.setAttribute("aria-selected", +li.dataset.i === i);
    });

    if (donutInstance && donutInstance.segs) {
      donutInstance.segs.forEach((s, k) => s.classList.toggle("is-active", k === i));
      donutHost.classList.toggle("has-active", !isAll);
    }

    legend.querySelectorAll(".legend__item").forEach((li, k) => {
      li.classList.toggle("is-active", k === i);
    });

    // Redraw dynamic views
    drawBars();
    drawStats();
    loadMainTopProducts();

    // If a branch is selected (e.g. from dropdown or donut click), also auto-expand its products drawer
    if (!isAll) {
      toggleBranchDrawer(i, true);
    }
  }

  /* ========================================================
     Dynamic Monthly Column Bars
     Auto-optimizes Y-axis and column heights to backend data
     ======================================================== */
  function drawBars() {
    const isAll = currentBranchIndex < 0;
    const vals = isAll ? allMonthly : branches[currentBranchIndex].monthly;
    const color = isAll ? (css("--accent") || "#10b981") : branches[currentBranchIndex].color;

    bars(barsHost, vals, color, {
      onHover: (idx, e) => showTip(idx == null ? null : `${MONTHS[idx]}: ${bdt(vals[idx])}`, e)
    });
  }

  /* ========================================================
     Dynamic Stats
     ======================================================== */
  function drawStats() {
    const isAll = currentBranchIndex < 0;
    const vals = isAll ? allMonthly : branches[currentBranchIndex].monthly;
    const total = vals.reduce((a, c) => a + c, 0);
    const grand = allMonthly.reduce((a, c) => a + c, 0) || 1;
    const peak = Math.max(...vals, 1);
    const peakIdx = vals.indexOf(peak);
    const avg = total / 12;
    const last = vals[11] || 0;
    const prev = vals[10] || 1;
    const pctChange = prev !== 0 ? ((last - prev) / prev) * 100 : 0;

    stat(
      "statTotal",
      isAll ? "Sales" : `${branches[currentBranchIndex].name} sales`,
      bdt(total),
      pctChange,
      (last / peak) * 100
    );

    stat(
      "statBest",
      `${MONTHS[peakIdx] || "Month"} (best)`,
      bdt(peak),
      avg > 0 ? ((peak - avg) / avg) * 100 : 0,
      avg > 0 ? (avg / peak) * 100 : 0
    );

    const sharePct = (total / grand) * 100;
    const shareTitle = isAll ? "Branch share" : `${branches[currentBranchIndex].name} share`;
    stat("statShare", shareTitle, sharePct.toFixed(1) + "%", sharePct, sharePct);
  }

  function stat(id, title, value, pct, fill) {
    const c = document.getElementById(id);
    if (!c) return;
    const p = c.querySelector(".percent");
    c.querySelector(".title-text").textContent = title;
    c.querySelector("[data-value]").textContent = value;
    c.querySelector("[data-pct]").textContent = Math.abs(pct).toFixed(0) + "%";
    p.classList.toggle("is-down", pct < 0);
    c.querySelector(".fill").style.width = Math.max(0, Math.min(100, fill)) + "%";
  }

  /* ========================================================
     Dynamic Top Products Tables
     Loads Top Products dynamically based on selection:
     "Top Products" for All Branches or "Top Products of {Branch Name}"
     Sequence: Product Name, QTY, Amount
     ======================================================== */
  async function loadMainTopProducts() {
    const isAll = currentBranchIndex < 0;
    const branch = isAll ? null : branches[currentBranchIndex];
    const branchName = isAll ? "All Branches" : branch.name;

    if (productsTitle) {
      productsTitle.textContent = isAll ? "Top Products" : `Top Products of ${branchName}`;
    }
    if (productsSub) {
      productsSub.textContent = isAll ? "All branch sales data" : `${branchName} sales data`;
    }

    productTableBody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align:center; padding: 20px; color: var(--ink-faint);">Loading ${branchName} products...</td>
      </tr>
    `;

    const products = await API.getTopProducts(branch ? branch.id : null);

    if (!products || products.length === 0) {
      productTableBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align:center; padding: 20px; color: var(--ink-faint);">No products found</td>
        </tr>
      `;
      return;
    }

    // Sequence: Product Name, QTY, Amount
    productTableBody.innerHTML = products
      .map(p => `
        <tr>
          <td>${p.name}</td>
          <td class="qty">${p.qty}</td>
          <td class="amount">${bdt(p.amount)}</td>
        </tr>
      `)
      .join("");
  }

  // Run on page load
  await init();
})();
