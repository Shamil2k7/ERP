"use client";

import { useEffect, useState, useMemo } from "react";
import { medicalService } from "@/services/medicalService";
import { showError } from "@/utils/swal";
import { 
  FiPackage, 
  FiRefreshCw, 
  FiSearch, 
  FiFilter, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiLayers, 
  FiMapPin 
} from "react-icons/fi";

export default function PharmacyInventory() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchInventory = async () => {
    try {
      const res = await medicalService.getMedicines();
      if (res.success && res.data) {
        const mapped = res.data.map(m => {
          const qty = m.batches?.reduce((sum, b) => sum + (b.quantity || 0), 0) || 0;
          return {
            id: m.id,
            sku: m.product?.sku || "N/A",
            name: m.product?.name || "N/A",
            genericName: m.genericName || "",
            strength: m.strength || "",
            category: m.product?.category?.name || "Uncategorized",
            quantity: qty,
            minStock: m.product?.reorderLevel || 10,
            unit: m.product?.unit?.name || "units",
            rackLocation: m.product?.rackLocation || "N/A",
            warehouseLocation: m.product?.warehouseLocation || ""
          };
        });
        setStocks(mapped);
      }
    } catch (err) {
      console.error(err);
      showError("Fetch Error", "Failed to retrieve stock list from pharmacy database.");
    } finally {
      setLoading(false);
    }
  };

  const handleReload = async () => {
    setLoading(true);
    await fetchInventory();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Filtered Stock Levels
  const filteredStocks = useMemo(() => {
    return stocks.filter(s => {
      const query = searchTerm.toLowerCase();
      const matchesSearch = 
        s.sku.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query) ||
        s.genericName.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query);

      let matchesStatus = true;
      if (statusFilter === "STABLE") {
        matchesStatus = s.quantity > s.minStock;
      } else if (statusFilter === "LOW_STOCK") {
        matchesStatus = s.quantity > 0 && s.quantity <= s.minStock;
      } else if (statusFilter === "OUT_OF_STOCK") {
        matchesStatus = s.quantity === 0;
      }

      return matchesSearch && matchesStatus;
    });
  }, [stocks, searchTerm, statusFilter]);

  // Statistics Calculations
  const stats = useMemo(() => {
    const totalItems = stocks.length;
    const lowStockCount = stocks.filter(s => s.quantity > 0 && s.quantity <= s.minStock).length;
    const outOfStockCount = stocks.filter(s => s.quantity === 0).length;
    const totalQty = stocks.reduce((sum, s) => sum + s.quantity, 0);

    return {
      totalItems,
      lowStockCount,
      outOfStockCount,
      totalQty
    };
  }, [stocks]);

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      
      {/* PAGE HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Pharmacy Inventory Stock</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Check physical stock levels, monitor reorder status, and map warehouse rack locations.</p>
        </div>
        <button 
          onClick={handleReload}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "600",
            fontSize: "14px",
            color: "#475569",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          <FiRefreshCw /> Reload Inventory
        </button>
      </div>

      {/* OVERVIEW STATS CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Drugs</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0 }}>{stats.totalItems} Items</h2>
            <div style={{ padding: "8px", borderRadius: "50%", background: "#eff6ff", color: "#3b82f6" }}><FiPackage size={20} /></div>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Low Stock Alerts</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: stats.lowStockCount > 0 ? "#ef4444" : "#0f172a", margin: 0 }}>{stats.lowStockCount} Warnings</h2>
            <div style={{ padding: "8px", borderRadius: "50%", background: "#fffbeb", color: "#f59e0b" }}><FiAlertCircle size={20} /></div>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Out of Stock</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: stats.outOfStockCount > 0 ? "#ef4444" : "#0f172a", margin: 0 }}>{stats.outOfStockCount} Depleted</h2>
            <div style={{ padding: "8px", borderRadius: "50%", background: "#fef2f2", color: "#ef4444" }}><FiAlertCircle size={20} /></div>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Quantity</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0 }}>{stats.totalQty.toLocaleString()} units</h2>
            <div style={{ padding: "8px", borderRadius: "50%", background: "#ecfdf5", color: "#10b981" }}><FiCheckCircle size={20} /></div>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER TOOLBAR */}
      <div style={{ background: "#ffffff", borderRadius: "16px", padding: "16px 20px", border: "1px solid #e2e8f0", display: "flex", gap: "16px", alignItems: "center", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ position: "relative", flexGrow: 1 }}>
          <FiSearch style={{ position: "absolute", left: "12px", top: "13px", color: "#94a3b8" }} />
          <input 
            type="text"
            placeholder="Search by drug name, generic, SKU, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "10px 10px 10px 38px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FiFilter style={{ color: "#64748b" }} />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", color: "#475569", background: "#ffffff", fontWeight: "600", outline: "none", cursor: "pointer" }}
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="STABLE">Stable Stock</option>
            <option value="LOW_STOCK">Low Stock Alert</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* INVENTORY TABLE CARD */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "260px" }}>
          <FiRefreshCw className="animate-spin" size={24} style={{ color: "#10b981", marginBottom: "12px" }} />
          <p style={{ color: "#64748b", fontWeight: "600" }}>Loading stock levels...</p>
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left", fontSize: "12px", color: "#64748b" }}>
                  <th style={{ padding: "12px" }}>DRUG SKU</th>
                  <th style={{ padding: "12px" }}>FORMULATION / NAME</th>
                  <th style={{ padding: "12px" }}>CATEGORY</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>MINIMUM LEVEL</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>CURRENT STOCK</th>
                  <th style={{ padding: "12px" }}><FiMapPin style={{ marginRight: "4px", verticalAlign: "middle" }} /> RACK LOCATION</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
                      No matching medicines or stocks found in your inventory.
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map(s => {
                    const isOutOfStock = s.quantity === 0;
                    const isLowStock = s.quantity > 0 && s.quantity <= s.minStock;

                    return (
                      <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "14px" }}>
                        <td style={{ padding: "12px", fontWeight: "700", color: "#475569", fontFamily: "monospace" }}>{s.sku}</td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontWeight: "700", color: "#1e293b" }}>{s.name}</div>
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                            {s.genericName} {s.strength ? `(${s.strength})` : ""}
                          </div>
                        </td>
                        <td style={{ padding: "12px", fontWeight: "600", color: "#64748b" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <FiLayers size={13} /> {s.category}
                          </span>
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", color: "#64748b" }}>
                          {s.minStock} {s.unit}
                        </td>
                        <td style={{ 
                          padding: "12px", 
                          textAlign: "right", 
                          fontWeight: "800", 
                          color: isOutOfStock ? "#ef4444" : isLowStock ? "#f59e0b" : "#10b981" 
                        }}>
                          {s.quantity} {s.unit}
                        </td>
                        <td style={{ padding: "12px", color: "#475569", fontWeight: "500" }}>
                          {s.rackLocation} {s.warehouseLocation ? `(${s.warehouseLocation})` : ""}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <span style={{ 
                            padding: "4px 8px", 
                            background: isOutOfStock ? "#fef2f2" : isLowStock ? "#fffbeb" : "#e6fffa", 
                            color: isOutOfStock ? "#b91c1c" : isLowStock ? "#b45309" : "#047857", 
                            border: isOutOfStock ? "1px solid #fecaca" : isLowStock ? "1px solid #fde68a" : "1px solid #b2f5ea",
                            borderRadius: "12px", 
                            fontSize: "10px", 
                            fontWeight: "700" 
                          }}>
                            {isOutOfStock ? "OUT OF STOCK" : isLowStock ? "LOW STOCK" : "STABLE"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

