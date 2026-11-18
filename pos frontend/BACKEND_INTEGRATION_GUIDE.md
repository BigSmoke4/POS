# Backend Developer Integration Guide

This guide is for the backend developer connecting their database, EF Core, or services into the ASP.NET Core controllers powering the frontend POS Dashboard.

---

## 1. Endpoints Overview

All endpoints live in [HomeController.cs](file:///d:/pos/GlassDashboard/Controllers/HomeController.cs).

### Endpoint 1: Branch Sales & Monthly Distribution
- **Route:** `GET /Home/SalesData`
- **Output:** JSON Array of Branch objects
- **JSON Schema:**
```json
[
  {
    "id": 1,
    "name": "Dhaka",
    "monthly": [2450000, 3100000, 2800000, 3500000, 4100000, 3900000, 4200000, 4500000, 4300000, 4700000, 4900000, 5200000]
  },
  {
    "id": 2,
    "name": "Chattogram",
    "monthly": [1800000, 2100000, 2050000, 2500000, 2900000, 2800000, 3000000, 3200000, 3100000, 3400000, 3600000, 3800000]
  }
]
```
> **Notes:**
> - `monthly`: array of 12 numbers representing BDT amounts from Jan to Dec.
> - The frontend automatically assigns each branch a unique color, computes donut shares, calculates total sales, and sets up the dropdown.

---

### Endpoint 2: Top Products (Dynamic Branch-wise & All Branches)
- **Route:** `GET /Home/TopProducts?branchId={optionalId}`
- **Query Parameter:**
  - `branchId` (null or omitted): returns top products across **all branches** (rendered in the main Top Products card).
  - `branchId=1` (or any valid branch id): returns top products for **that specific branch** (rendered in the collapsible branch card below the round share graph).
- **Column Order in UI:**
  - `Product Name` -> `QTY` -> `Amount` (formatted in BDT `৳`)
- **JSON Schema:**
```json
[
  {
    "id": 1,
    "name": "Sony Bravia 55\" 4K Google TV",
    "amount": 1250000,
    "qty": 15
  },
  {
    "id": 2,
    "name": "Samsung French Door Refrigerator 580L",
    "amount": 980000,
    "qty": 8
  }
]
```

---

## 2. Frontend Features Already Handled

1. **Searchable & Writable Dropdown:**
   - Real-time search/filter for branches with automatic sorting and instant keyboard support.
   - Selecting a branch automatically updates stats, bar chart, and requests branch-specific top products.
2. **Auto-Generated Unique Colors:**
   - Pre-mapped to tokens (`--c1` to `--c6`) and dynamically expands with a golden-ratio color formula if you add 10, 20, or 50 branches.
3. **Optimized Dynamic Y-Axis & X-Axis:**
   - The bar chart automatically scales its Y-axis upper bound (৳ K, ৳ L, ৳ Cr) based on the highest data points returned by the backend.
   - X-axis cleanly labels months.
4. **Clean API Architecture:**
   - Located in [dashboard.js](file:///d:/pos/GlassDashboard/wwwroot/js/dashboard.js) under the `API` object (`getSalesData`, `getTopProducts`). If your backend controller route changes (e.g. `/api/sales`), simply update those two URLs.

