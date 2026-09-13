"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FiActivity,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiPlus,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiSliders,
  FiX,
  FiLayers,
  FiPackage,
  FiTruck,
  FiRepeat,
  FiCheckCircle,
  FiCalendar,
  FiTrash2,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import apiClient from "@/services/apiClient";
import { useCompany } from "@/context/CompanyContext";

const MOVEMENT_TYPES = [
  { id: "ALL", label: "All Movements" },
  { id: "STOCK_IN", label: "Stock In", icon: FiArrowDownLeft, color: "#059669", bg: "#d1fae5" },
  { id: "STOCK_OUT", label: "Stock Out", icon: FiArrowUpRight, color: "#dc2626", bg: "#fee2e2" },
  { id: "PRODUCTION_CONSUMPTION", label: "Production Consumption", icon: FiLayers, color: "#ea580c", bg: "#ffedd5" },
  { id: "SALES_DEDUCTION", label: "Sales Deduction", icon: FiTruck, color: "#2563eb", bg: "#dbeafe" },
  { id: "ADJUSTMENT", label: "Adjustments", icon: FiSliders, color: "#7c3aed", bg: "#ede9fe" },
  { id: "TRANSFER", label: "Transfers", icon: FiRepeat, color: "#0891b2", bg: "#cffafe" },
];

export default function TextileStockMovementsPage() {
  const { user } = useCompany();
  const [movements, setMovements] = useState([]);
  const [summary, setSummary] = useState({
    totalReceived: { formatted: "0 KG", subtitle: "No Inflow Activity Recorded" },
    productionIssued: { formatted: "0 KG", subtitle: "No Material Issued to Production" },
    salesDispatches: { formatted: "0 Meters", subtitle: "No Fabric Dispatches Recorded" },
    unitTransfers: { count: 0, subtitle: "No Warehouse Transfers Recorded" },
  });

  const [rawMaterialsList, setRawMaterialsList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);

  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    type: "STOCK_IN",
    item: "",
    sku: "",
    quantity: "",
    unit: "KG",
    source: "",
    destination: "",
    batchId: "",
    user: user?.fullName || "Inventory Officer",
    reason: "",
    date: new Date().toISOString().slice(0, 16),
  });

  // Fetch stock movements & summary from backend
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeFilter !== "ALL") params.movementType = activeFilter;
      if (search.trim()) params.search = search.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [movRes, sumRes] = await Promise.allSettled([
        apiClient.get("/textile/stock-movements", { params }),
        apiClient.get("/textile/stock-movements/summary", { params }),
      ]);

      if (movRes.status === "fulfilled" && movRes.value?.data?.data) {
        setMovements(Array.isArray(movRes.value.data.data) ? movRes.value.data.data : []);
      } else if (movRes.status === "fulfilled" && Array.isArray(movRes.value.data)) {
        setMovements(movRes.value.data);
      } else {
        setMovements([]);
      }

      if (sumRes.status === "fulfilled" && sumRes.value?.data?.data) {
        setSummary(sumRes.value.data.data);
      }
    } catch (err) {
      console.error("Failed to load textile stock movements:", err);
      toast.error(err.response?.data?.message || "Failed to load stock movements audit trail");
    } finally {
      setLoading(false);
    }
  }, [activeFilter, search, startDate, endDate]);

  // Load auxiliary lists for modal
  useEffect(() => {
    async function loadAuxiliaryData() {
      try {
        const [rmRes, pRes, bRes] = await Promise.allSettled([
          apiClient.get("/textile/raw-materials"),
          apiClient.get("/textile/products"),
          apiClient.get("/textile/production/orders"),
        ]);
        if (rmRes.status === "fulfilled" && rmRes.value?.data?.data) {
          setRawMaterialsList(rmRes.value.data.data);
        }
        if (pRes.status === "fulfilled" && pRes.value?.data?.data) {
          setProductsList(pRes.value.data.data);
        }
        if (bRes.status === "fulfilled" && bRes.value?.data?.data) {
          setBatchesList(bRes.value.data.data);
        }
      } catch (e) {
        console.warn("Could not fetch auxiliary data for stock movements form", e);
      }
    }
    loadAuxiliaryData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Automatic Realtime Polling fallback (15s)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchData();
    }, 15000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const handleSelectItem = (itemName) => {
    if (!itemName) return;
    const foundRM = rawMaterialsList.find((r) => r.name === itemName);
    if (foundRM) {
      setFormData((prev) => ({
        ...prev,
        item: foundRM.name,
        sku: foundRM.id,
        unit: foundRM.unit || "KG",
      }));
      return;
    }
    const foundP = productsList.find((p) => p.name === itemName);
    if (foundP) {
      setFormData((prev) => ({
        ...prev,
        item: foundP.name,
        sku: foundP.sku || `PROD-${foundP.id}`,
        unit: "Meters",
      }));
    }
  };

  const handleCreateMovement = async (e) => {
    e.preventDefault();
    if (!formData.item || !formData.quantity || Number(formData.quantity) <= 0) {
      toast.error("Please provide valid item and positive quantity");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        type: formData.type,
        item: formData.item.trim(),
        sku: formData.sku?.trim() || "TEX-GEN-01",
        quantity: Number(formData.quantity),
        unit: formData.unit,
        source: formData.source?.trim() || "Main Mill Depot",
        destination: formData.destination?.trim() || "Mill Processing Section",
        batchId: formData.batchId?.trim() || null,
        user: formData.user?.trim() || user?.fullName || "Inventory Officer",
        reason: formData.reason?.trim() || "Operational Stock Movement",
        date: formData.date ? formData.date.replace("T", " ") : new Date().toISOString().replace("T", " ").substring(0, 16),
      };

      const res = await apiClient.post("/textile/stock-movements", payload);
      toast.success(res.data?.message || "Stock movement recorded successfully!");
      setShowModal(false);
      setFormData({
        type: "STOCK_IN",
        item: "",
        sku: "",
        quantity: "",
        unit: "KG",
        source: "",
        destination: "",
        batchId: "",
        user: user?.fullName || "Inventory Officer",
        reason: "",
        date: new Date().toISOString().slice(0, 16),
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to record stock movement:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to record stock movement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setActiveFilter("ALL");
    setSearch("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", maxWidth: "1400px", margin: "0 auto" }}>
      <Toaster position="top-right" />

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "#0f172a",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <FiActivity style={{ color: "#0891b2" }} /> Stock Movements & Audit Trail
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>
            Real-time multi-tenant ledger for every mill inventory event: Inward Stock, Outward Dispatches, Production Consumption, Adjustments & Transfers.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={fetchData}
            title="Refresh Ledger"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 14px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              color: "#334155",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>

          <button
            onClick={() => setShowModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              background: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(8, 145, 178, 0.25)",
            }}
          >
            <FiPlus size={16} /> Record Stock Movement
          </button>
        </div>
      </div>

      {/* DYNAMIC KPI SUMMARY CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {/* TOTAL RECEIVED */}
        <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Total Received (Inflow)</span>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#059669", marginTop: "6px" }}>
            +{summary.totalReceived?.formatted || "0 KG"}
          </div>
          <span style={{ fontSize: "12px", color: "#059669", fontWeight: "600" }}>
            {summary.totalReceived?.subtitle || "Inward Raw Material & Output"}
          </span>
        </div>

        {/* PRODUCTION ISSUED */}
        <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Production Issued</span>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#ea580c", marginTop: "6px" }}>
            {summary.productionIssued?.formatted || "0 KG"}
          </div>
          <span style={{ fontSize: "12px", color: "#ea580c", fontWeight: "600" }}>
            {summary.productionIssued?.subtitle || "Issued to Production Batches"}
          </span>
        </div>

        {/* SALES DISPATCHES */}
        <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Sales Dispatches</span>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#2563eb", marginTop: "6px" }}>
            -{summary.salesDispatches?.formatted || "0 Meters"}
          </div>
          <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: "600" }}>
            {summary.salesDispatches?.subtitle || "Fabric Dispatched to Buyers"}
          </span>
        </div>

        {/* UNIT TRANSFERS */}
        <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Unit Transfers</span>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#0891b2", marginTop: "6px" }}>
            {summary.unitTransfers?.count || 0} Events
          </div>
          <span style={{ fontSize: "12px", color: "#0891b2", fontWeight: "600" }}>
            {summary.unitTransfers?.subtitle || "Inter-Mill Warehouse Transfers"}
          </span>
        </div>
      </div>

      {/* FILTER TABS */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", marginBottom: "20px", overflowX: "auto" }}>
        {MOVEMENT_TYPES.map((t) => {
          const isActive = activeFilter === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveFilter(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                border: "none",
                background: "transparent",
                borderBottom: isActive ? "3px solid #0891b2" : "3px solid transparent",
                color: isActive ? "#0891b2" : "#64748b",
                fontWeight: isActive ? "700" : "500",
                fontSize: "13px",
                cursor: "pointer",
                marginBottom: "-2px",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* SEARCH AND DATE FILTER CONTROLS */}
      <div
        style={{
          background: "#ffffff",
          padding: "14px 18px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "250px" }}>
          <FiSearch style={{ color: "#64748b" }} />
          <input
            type="text"
            placeholder="Search by Ref #, Material, SKU, Batch ID, Officer or Reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              width: "100%",
              fontSize: "14px",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
          />
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
          />
          {(search || startDate || endDate || activeFilter !== "ALL") && (
            <button
              onClick={handleResetFilters}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                fontSize: "12px",
                fontWeight: "600",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* MOVEMENTS AUDIT TABLE */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: "600", fontSize: "12px", textTransform: "uppercase" }}>
              <tr>
                <th style={{ padding: "14px 18px" }}>Event Ref #</th>
                <th style={{ padding: "14px 18px" }}>Movement Type</th>
                <th style={{ padding: "14px 18px" }}>Item & SKU</th>
                <th style={{ padding: "14px 18px" }}>Quantity</th>
                <th style={{ padding: "14px 18px" }}>Source Location</th>
                <th style={{ padding: "14px 18px" }}>Destination</th>
                <th style={{ padding: "14px 18px" }}>Officer / Shift</th>
                <th style={{ padding: "14px 18px" }}>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "36px", textAlign: "center", color: "#64748b" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <FiRefreshCw className="animate-spin" size={18} />
                      Loading live stock movements ledger...
                    </div>
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px 24px", textAlign: "center" }}>
                    <div style={{ maxWidth: "420px", margin: "0 auto" }}>
                      <FiPackage size={36} style={{ color: "#94a3b8", marginBottom: "12px" }} />
                      <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: "0 0 6px 0" }}>
                        No stock movements found.
                      </h3>
                      <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                        Inventory activity will appear here automatically when stock is received, consumed, transferred, sold, or adjusted.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const typeDef = MOVEMENT_TYPES.find((t) => t.id === m.type) || {
                    id: m.type,
                    label: m.type.replace(/_/g, " "),
                    icon: FiActivity,
                    color: "#475569",
                    bg: "#f1f5f9",
                  };
                  const Icon = typeDef.icon || FiActivity;
                  const isPositive = m.quantity > 0;

                  return (
                    <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 18px", fontWeight: "700", color: "#0891b2" }}>
                        {m.id}
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "400" }}>
                          {m.reference ? `${m.reference} — ` : ""}{m.reason}
                        </div>
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "700",
                            background: typeDef.bg || "#f1f5f9",
                            color: typeDef.color || "#475569",
                          }}
                        >
                          <Icon size={12} />
                          {typeDef.label}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <strong style={{ color: "#1e293b", display: "block" }}>{m.item}</strong>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{m.sku || "No SKU"}</span>
                      </td>
                      <td
                        style={{
                          padding: "14px 18px",
                          fontWeight: "700",
                          color: isPositive ? "#059669" : "#dc2626",
                        }}
                      >
                        {isPositive ? "+" : ""}{Number(m.quantity || 0).toLocaleString()}{" "}
                        <span style={{ fontSize: "11px", fontWeight: "500", color: "#64748b" }}>{m.unit || "KG"}</span>
                      </td>
                      <td style={{ padding: "14px 18px", color: "#475569", fontSize: "13px" }}>{m.source || "—"}</td>
                      <td style={{ padding: "14px 18px", color: "#475569", fontSize: "13px" }}>{m.destination || "—"}</td>
                      <td style={{ padding: "14px 18px", color: "#64748b", fontSize: "12px" }}>{m.user || "Inventory Admin"}</td>
                      <td style={{ padding: "14px 18px", color: "#64748b", fontSize: "12px", whiteSpace: "nowrap" }}>
                        {m.date || m.createdAt ? String(m.date || m.createdAt).slice(0, 16).replace("T", " ") : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: RECORD STOCK MOVEMENT */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Record Stock Movement Event</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}>
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMovement}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Movement Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px" }}
                >
                  <option value="STOCK_IN">Stock In (Purchase / Direct Intake)</option>
                  <option value="STOCK_OUT">Stock Out (Dispatched / Sample)</option>
                  <option value="PRODUCTION_CONSUMPTION">Production Consumption (Loom / Dyeing Issue)</option>
                  <option value="PRODUCTION_OUTPUT">Production Output (Finished Fabric Output)</option>
                  <option value="SALES_DEDUCTION">Sales Deduction (Customer Order Dispatch)</option>
                  <option value="ADJUSTMENT">Adjustment (Physical Audit Count / Shrinkage)</option>
                  <option value="TRANSFER">Transfer (Inter-Mill / Warehouse Transfer)</option>
                  <option value="WASTAGE">Wastage / Defect Disposal</option>
                </select>
              </div>

              {/* ITEM SELECTION */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Inventory Item / Material *</label>
                <input
                  type="text"
                  required
                  list="textile-inventory-items"
                  placeholder="Type or select material / fabric..."
                  value={formData.item}
                  onChange={(e) => {
                    setFormData({ ...formData, item: e.target.value });
                    handleSelectItem(e.target.value);
                  }}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px" }}
                />
                <datalist id="textile-inventory-items">
                  {rawMaterialsList.map((rm) => (
                    <option key={rm.id} value={rm.name}>{rm.category} (Stock: {rm.stock} {rm.unit})</option>
                  ))}
                  {productsList.map((p) => (
                    <option key={p.id} value={p.name}>Finished Fabric ({p.sku})</option>
                  ))}
                </datalist>
              </div>

              {/* SKU & BATCH */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Item SKU / Code</label>
                  <input
                    type="text"
                    placeholder="e.g. RM-COT-01"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Production Batch (Optional)</label>
                  <select
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px" }}
                  >
                    <option value="">-- No Production Batch --</option>
                    {batchesList.map((b) => (
                      <option key={b.id} value={b.id}>{b.id} — {b.fabricType || b.batchName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* QUANTITY & UNIT */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    placeholder="e.g. 5000"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Unit of Measure</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px" }}
                  >
                    <option value="KG">KG</option>
                    <option value="Meters">Meters</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Bales">Bales</option>
                    <option value="Liters">Liters</option>
                    <option value="Cones">Cones</option>
                  </select>
                </div>
              </div>

              {/* SOURCE & DESTINATION */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Source Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Raw Material Depot"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Destination Location</label>
                  <input
                    type="text"
                    placeholder="e.g. AirJet Loom Unit 2"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px" }}
                  />
                </div>
              </div>

              {/* OFFICER & DATE */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Officer / Processed By</label>
                  <input
                    type="text"
                    placeholder="e.g. Karthik (Inventory)"
                    value={formData.user}
                    onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px" }}
                  />
                </div>
              </div>

              {/* REASON */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Reason / Notes / PO Ref</label>
                <input
                  type="text"
                  placeholder="e.g. PO-8801 Delivery Inward or Warp Yarn Consumption"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  style={{ padding: "10px 16px", border: "1px solid #cbd5e1", background: "#f8fafc", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  {submitting ? "Recording..." : "Save Stock Movement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
