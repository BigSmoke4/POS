/* Dependency-free SVG chart helpers (no CDN needed) */
window.Charts = (function () {
  const NS = "http://www.w3.org/2000/svg";
  const el = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const bdt = n => "৳ " + Math.round(n).toLocaleString("en-BD");
  const bdtShort = n => n >= 1e7 ? "৳ " + (n / 1e7).toFixed(1).replace(/\.0$/, "") + " Cr"
                       : n >= 1e5 ? "৳ " + (n / 1e5).toFixed(1).replace(/\.0$/, "") + " L"
                       : n >= 1e3 ? "৳ " + (n / 1e3).toFixed(0) + "K" : "৳ " + n;

  // Golden ratio hue generation for dynamic unique colors per branch
  function generateBranchColor(index, total) {
    const predefined = [
      css("--c1") || "#10b981",
      css("--c2") || "#3b82f6",
      css("--c3") || "#f59e0b",
      css("--c4") || "#8b5cf6",
      css("--c5") || "#ef4444",
      css("--c6") || "#06b6d4"
    ];
    if (index < predefined.length && predefined[index]) {
      return predefined[index];
    }
    // High-contrast aesthetically pleasing HSL distribution
    const hue = Math.round((index * 137.508) % 360);
    return `hsl(${hue}, 70%, 50%)`;
  }

  // Calculate clean, human-friendly maximum for Y-axis dynamic scaling
  function calculateNiceMax(val) {
    if (!val || val <= 0) return 100000;
    const exponent = Math.floor(Math.log10(val));
    const power = Math.pow(10, exponent);
    const fraction = val / power;
    let niceFraction;
    if (fraction <= 1.0) niceFraction = 1.0;
    else if (fraction <= 1.25) niceFraction = 1.25;
    else if (fraction <= 1.5) niceFraction = 1.5;
    else if (fraction <= 2.0) niceFraction = 2.0;
    else if (fraction <= 2.5) niceFraction = 2.5;
    else if (fraction <= 5.0) niceFraction = 5.0;
    else if (fraction <= 7.5) niceFraction = 7.5;
    else niceFraction = 10.0;
    return niceFraction * power;
  }

  function donut(host, items, { onSelect, onHover } = {}) {
    const r = 75, C = 2 * Math.PI * r, total = items.reduce((s, i) => s + i.value, 0), gap = items.length > 1 ? 8 : 0;
    host.innerHTML = "";
    const svg = el("svg", { viewBox: "0 0 200 200", role: "img", "aria-label": "Sales share by branch" });
    
    // Solid colors with 3D skeuomorphic shadows
    const defs = el("defs");
    
    // Strong drop shadow for raised 3D effect
    const shadowFilter = el("filter", { id: "strongShadow", x: "-50%", y: "-50%", width: "200%", height: "200%" });
    shadowFilter.appendChild(el("feDropShadow", { dx: "6", dy: "6", stdDeviation: "8", "flood-color": "rgba(100,110,120,0.7)" }));
    shadowFilter.appendChild(el("feDropShadow", { dx: "-4", dy: "-4", stdDeviation: "6", "flood-color": "rgba(255,255,255,0.9)" }));
    defs.appendChild(shadowFilter);
    svg.appendChild(defs);
    
    // Outer decorative ring with 3D bevel
    svg.appendChild(el("circle", { cx: 100, cy: 100, r: r + 15, fill: "none", stroke: "rgba(255,255,255,0.8)", "stroke-width": 3 }));
    svg.appendChild(el("circle", { cx: 100, cy: 100, r: r + 12, fill: "none", stroke: "rgba(150,160,170,0.3)", "stroke-width": 1 }));
    
    // Background shadow layer (creates depth behind segments)
    svg.appendChild(el("circle", { cx: 100, cy: 100, r, fill: "none", stroke: "#d1d5dc", "stroke-width": 24, filter: "url(#strongShadow)" }));
    
    // Background track
    svg.appendChild(el("circle", { cx: 100, cy: 100, r, fill: "none", stroke: "#e5e7eb", "stroke-width": 22 }));
    
    let offset = 0; const segs = [];
    items.forEach((it, i) => {
      if (total <= 0) return;
      const rawLen = (it.value / total) * C;
      const len = Math.max(rawLen - (items.length > 1 ? gap : 0), 1);
      const s = el("circle", { 
        class: "donut__seg", 
        cx: 100, cy: 100, r, 
        stroke: it.color,
        "stroke-dasharray": `${len} ${C - len}`, 
        "stroke-dashoffset": C,
        tabindex: 0, 
        filter: "url(#strongShadow)",
        "data-final-offset": -offset
      });
      s.addEventListener("mouseenter", e => onHover && onHover(i, e));
      s.addEventListener("mousemove", e => onHover && onHover(i, e));
      s.addEventListener("mouseleave", () => onHover && onHover(null));
      s.addEventListener("click", () => onSelect && onSelect(i));
      s.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") onSelect && onSelect(i); });
      svg.appendChild(s); segs.push(s);
      offset += rawLen;
    });
    
    // Smooth normal fill animation
    requestAnimationFrame(() => {
      segs.forEach(s => {
        const finalOffset = parseFloat(s.getAttribute("data-final-offset"));
        s.style.transition = "stroke-dashoffset 1s ease-out";
        s.style.strokeDashoffset = finalOffset;
      });
    });
    
    host.appendChild(svg);
    const c = document.createElement("div"); c.className = "donut__center";
    c.innerHTML = `<small>Total</small><b>${bdtShort(total)}</b>`;
    host.appendChild(c);
    return { segs, total };
  }

  function bars(host, values, color, { onHover, months = MONTHS } = {}) {
    const W = 720, H = 360, m = { l: 75, r: 16, t: 16, b: 36 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const maxVal = Math.max(...values, 0);
    const max = calculateNiceMax(maxVal * 1.08); // dynamic optimized upper bound
    const ticks = 5;

    host.innerHTML = "";
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Monthly sales in BDT" });
    const gradId = "barGrad_" + Math.random().toString(36).substr(2, 9);
    const defs = el("defs"), g = el("linearGradient", { id: gradId, x1: 0, y1: 0, x2: 0, y2: 1 });
    g.appendChild(el("stop", { offset: "0%", "stop-color": color, "stop-opacity": 1 }));
    g.appendChild(el("stop", { offset: "100%", "stop-color": color, "stop-opacity": .45 }));
    defs.appendChild(g); svg.appendChild(defs);

    // Dynamic Y-axis lines & labels (clean BDT scale based on backend values)
    for (let t = 0; t <= ticks; t++) {
      const v = (max / ticks) * t;
      const y = m.t + ih - (v / max) * ih;
      svg.appendChild(el("line", { class: "grid-line", x1: m.l, x2: W - m.r, y1: y, y2: y }));
      const tx = el("text", { class: "axis-text", x: m.l - 12, y: y + 4, "text-anchor": "end" });
      tx.textContent = bdtShort(v);
      svg.appendChild(tx);
    }

    const n = values.length || 12;
    const step = iw / n;
    const bw = Math.min(step * 0.56, 36);

    values.forEach((v, i) => {
      const h = max > 0 ? (v / max) * ih : 0;
      const x = m.l + step * i + (step - bw) / 2;
      const y = m.t + ih - h;
      const b = el("rect", { class: "bar", x, y: m.t + ih, width: bw, height: 0, rx: 8, fill: `url(#${gradId})`, tabindex: 0 });
      b.addEventListener("mousemove", e => onHover && onHover(i, e));
      b.addEventListener("mouseleave", () => onHover && onHover(null));
      svg.appendChild(b);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        b.setAttribute("y", y);
        b.setAttribute("height", Math.max(h, 0));
      }));
      const lb = el("text", { class: "axis-text", x: x + bw / 2, y: H - 10, "text-anchor": "middle" });
      lb.textContent = months[i] || `M${i+1}`;
      svg.appendChild(lb);
    });

    host.appendChild(svg);
  }

  return { donut, bars, bdt, bdtShort, css, MONTHS, generateBranchColor, calculateNiceMax };
})();
