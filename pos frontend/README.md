# POS Frontend Package (Ready for ASP.NET Backend Integration)

This standalone frontend package contains the complete neumorphic POS Dashboard UI, designed specifically for clean handoff and direct integration with your ASP.NET Core backend API.

---

## 📁 Directory Structure
```
pos frontend/
├── index.html            <- Complete Dashboard UI layout (no ASP.NET Razor dependencies)
├── css/
│   ├── tokens.css        <- Color palette, typography, spacing & design tokens
│   ├── neumorphic.css    <- Neumorphic soft-shadow effects & pills
│   └── site.css          <- Responsive dashboard grid, tables, donut chart & drawers
├── js/
│   ├── charts.js         <- Lightweight vanilla SVG chart engine (Donut & Column Bars)
│   ├── site.js           <- Sidebar navigation & mobile hamburger toggle
│   └── dashboard.js      <- Dashboard state manager & ASP.NET API client layer
└── README.md             <- This integration documentation
```

---

## 🔌 Connecting to Your ASP.NET Core Backend

Open `js/dashboard.js`. The **API Communication Layer** is situated right at lines 40–165.

### 1. Base URL / API Host Configuration
If your backend is running on a specific host/port (e.g., `https://localhost:7142` or `http://localhost:5000`), you can set the `API_BASE_URL` in `js/dashboard.js`:

```javascript
const API_BASE_URL = ""; // Empty string for same-origin, or e.g. "https://localhost:7142"
```

### 2. Endpoints Needed in Your Controller

Your backend should provide two simple endpoints:

#### A. Branch Sales Data (`GET /Home/SalesData` or `GET /api/sales`)
Returns monthly sales (12 numbers for Jan..Dec) and names for all branches:
```json
[
  {
    "id": 1,
    "name": "Dhaka",
    "monthly": [2450000, 2780000, 3100000, 2950000, 3400000, 3600000, 3850000, 3900000, 4100000, 4300000, 4500000, 4800000]
  },
  {
    "id": 2,
    "name": "Chattogram",
    "monthly": [1800000, 1950000, 2100000, 2050000, 2300000, 2500000, 2600000, 2750000, 2900000, 3100000, 3200000, 3450000]
  }
]
```

#### B. Top Products (`GET /Home/TopProducts?branchId={id}` or `GET /api/top-products`)
- When `branchId` is omitted or null: returns aggregate top products across all branches.
- When `branchId` is passed: returns top products for that specific branch.
```json
[
  { "id": 1, "name": "Sony Bravia 55\" 4K Google TV", "qty": 15, "amount": 1250000 },
  { "id": 2, "name": "Samsung French Door Refrigerator", "qty": 8, "amount": 980000 },
  { "id": 3, "name": "Gree 1.5 Ton Dual Inverter AC", "qty": 12, "amount": 720000 }
]
```

---

## 🚀 How to Run the Frontend
You can open `index.html` directly in any web browser, or serve it using any local HTTP server (Live Server in VS Code, Python `python -m http.server`, Node `npx serve`, IIS, etc.).
- When the backend is offline or disconnected, it automatically uses the built-in fallback data so the UI remains 100% interactive and functional for testing.
- When your backend controller is connected, it automatically switches to live database data!

