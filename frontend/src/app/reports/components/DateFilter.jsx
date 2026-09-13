"use client";

import { useEffect } from "react";

export default function DateFilter({
  filterType, // 'sales' | 'purchases' | 'inventory'
  filtersData = { customers: [], suppliers: [], warehouses: [] },
  selectedFilters = {},
  onChangeFilters,
  startDate,
  endDate,
  groupBy,
  selectedPreset,
  onChangeDate,
}) {
  
  const presets = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "last7" },
    { label: "Last 30 Days", value: "last30" },
    { label: "This Month", value: "thisMonth" },
    { label: "Custom Range", value: "custom" },
  ];

  const handlePresetChange = (preset) => {
    if (preset === "custom") {
      onChangeDate({ startDate, endDate, preset, groupBy });
      return;
    }

    const end = new Date();
    let start = new Date();
    
    // Set to local time start of day for start dates
    switch (preset) {
      case "today":
        start.setHours(0, 0, 0, 0);
        break;
      case "yesterday":
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case "last7":
        start.setDate(start.getDate() - 7);
        break;
      case "last30":
        start.setDate(start.getDate() - 30);
        break;
      case "thisMonth":
        start = new Date(start.getFullYear(), start.getMonth(), 1);
        break;
      default:
        break;
    }

    // Format as YYYY-MM-DD
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    onChangeDate({
      startDate: formatDate(start),
      endDate: formatDate(end),
      preset,
      groupBy,
    });
  };

  const handleDateChange = (type, value) => {
    onChangeDate({
      startDate: type === "start" ? value : startDate,
      endDate: type === "end" ? value : endDate,
      preset: "custom",
      groupBy,
    });
  };

  const handleGroupByChange = (value) => {
    onChangeDate({
      startDate,
      endDate,
      preset: selectedPreset,
      groupBy: value,
    });
  };

  return (
    <div className="reports-filter-card">
      <div className="filter-grid">
        
        {/* Date Presets (Hidden for inventory reports as inventory represents current state) */}
        {filterType !== "inventory" && (
          <div className="filter-group" style={{ gridColumn: "span 2" }}>
            <label>Date Range Shortcut</label>
            <div className="date-preset-grid" style={{ marginTop: 0, paddingTop: 0, border: "none" }}>
              {presets.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`preset-btn ${selectedPreset === p.value ? "active" : ""}`}
                  onClick={() => handlePresetChange(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date Pickers */}
        {filterType !== "inventory" && (
          <>
            <div className="filter-group">
              <label htmlFor="startDate">From Date</label>
              <input
                id="startDate"
                type="date"
                className="filter-input"
                value={startDate}
                onChange={(e) => handleDateChange("start", e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="endDate">To Date</label>
              <input
                id="endDate"
                type="date"
                className="filter-input"
                value={endDate}
                onChange={(e) => handleDateChange("end", e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="groupBy">Group By</label>
              <select
                id="groupBy"
                className="filter-input"
                value={groupBy}
                onChange={(e) => handleGroupByChange(e.target.value)}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>
          </>
        )}

        {/* Dynamic Filters depending on Report Type */}
        {filterType === "sales" && (
          <div className="filter-group">
            <label htmlFor="customerId">Filter by Customer</label>
            <select
              id="customerId"
              className="filter-input"
              value={selectedFilters.customerId || ""}
              onChange={(e) => onChangeFilters({ ...selectedFilters, customerId: e.target.value })}
            >
              <option value="">All Customers</option>
              {filtersData.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {filterType === "purchases" && (
          <div className="filter-group">
            <label htmlFor="supplierId">Filter by Supplier</label>
            <select
              id="supplierId"
              className="filter-input"
              value={selectedFilters.supplierId || ""}
              onChange={(e) => onChangeFilters({ ...selectedFilters, supplierId: e.target.value })}
            >
              <option value="">All Suppliers</option>
              {filtersData.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.companyName}
                </option>
              ))}
            </select>
          </div>
        )}

        {filterType === "inventory" && (
          <div className="filter-group">
            <label htmlFor="warehouseId">Filter by Warehouse</label>
            <select
              id="warehouseId"
              className="filter-input"
              value={selectedFilters.warehouseId || ""}
              onChange={(e) => onChangeFilters({ ...selectedFilters, warehouseId: e.target.value })}
            >
              <option value="">All Warehouses</option>
              {filtersData.warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>
        )}

      </div>
    </div>
  );
}
