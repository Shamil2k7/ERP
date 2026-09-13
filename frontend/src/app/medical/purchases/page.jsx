"use client";

import { useEffect, useState, useMemo } from "react";
import { getPurchases, createPurchase, deletePurchase } from "@/services/purchaseService";
import { getSuppliers } from "@/services/supplierService";
import { getWarehouses } from "@/services/warehouseService";
import { medicalService } from "@/services/medicalService";
import { showSuccess, showError, showWarning, showConfirm } from "@/utils/swal";
import { 
  FiShoppingCart, 
  FiRefreshCw, 
  FiPlus, 
  FiTrash2, 
  FiSearch, 
  FiCalendar, 
  FiDollarSign, 
  FiPackage, 
  FiX, 
  FiGrid,
  FiFilter
} from "react-icons/fi";

export default function MedicinePurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal & Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [medicines, setMedicines] = useState([]);

  // Form Fields
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [purchaseNo, setPurchaseNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("RECEIVED");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [items, setItems] = useState([{ productId: "", quantity: 1, unitPrice: 0, totalPrice: 0 }]);

  const fetchPurchases = async () => {
    try {
      const res = await getPurchases();
      const purchasesData = res?.data || res || [];
      if (Array.isArray(purchasesData)) {
        setPurchases(purchasesData);
      }
    } catch (err) {
      console.error(err);
      showError("Fetch Error", "Failed to retrieve purchase logs from database.");
    } finally {
      setLoading(false);
    }
  };

  const handleReload = async () => {
    setLoading(true);
    await fetchPurchases();
  };

  const loadModalData = async () => {
    try {
      const [supRes, whRes, medRes] = await Promise.all([
        getSuppliers(),
        getWarehouses(),
        medicalService.getMedicines()
      ]);
      setSuppliers(supRes?.data || supRes || []);
      setWarehouses(whRes?.data || whRes || []);
      setMedicines(medRes?.data || medRes || []);
    } catch (err) {
      console.error("Failed to load form master data:", err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPurchases();
      loadModalData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenAddModal = () => {
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    setPurchaseNo(`INV-MED-${randomSeq}`);
    setSupplierId("");
    if (warehouses.length > 0) {
      setWarehouseId(warehouses[0].id);
    } else {
      setWarehouseId("");
    }
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setStatus("RECEIVED");
    setNotes("");
    setTaxRate(0);
    setItems([{ productId: "", quantity: 1, unitPrice: 0, totalPrice: 0 }]);
    setShowAddModal(true);
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...items];
    const currentItem = { ...updated[index] };

    if (field === "productId") {
      currentItem.productId = value;
      // Pre-fill cost price if product is selected
      const selectedMed = medicines.find(m => m.productId === value);
      if (selectedMed?.product) {
        currentItem.unitPrice = parseFloat(selectedMed.product.costPrice || selectedMed.product.sellingPrice || 0);
      } else {
        currentItem.unitPrice = 0;
      }
    } else if (field === "quantity") {
      currentItem.quantity = Math.max(1, parseInt(value) || 1);
    } else if (field === "unitPrice") {
      currentItem.unitPrice = Math.max(0, parseFloat(value) || 0);
    }

    currentItem.totalPrice = currentItem.quantity * currentItem.unitPrice;
    updated[index] = currentItem;
    setItems(updated);
  };

  const handleAddItemRow = () => {
    setItems([...items, { productId: "", quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return (subtotal * (parseFloat(taxRate) || 0)) / 100;
  }, [subtotal, taxRate]);

  const grandTotal = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  const handleCreatePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      showWarning("Input Required", "Please select a Supplier Distributor.");
      return;
    }
    if (!warehouseId) {
      showWarning("Input Required", "Please select a Destination Warehouse Depot.");
      return;
    }
    const invalidItems = items.filter(item => !item.productId || item.quantity <= 0);
    if (invalidItems.length > 0) {
      showWarning("Input Required", "Please select a valid medicine and enter quantity for all item rows.");
      return;
    }

    try {
      setModalLoading(true);
      const payload = {
        purchaseNo: purchaseNo.trim(),
        supplierId,
        warehouseId,
        purchaseDate: new Date(purchaseDate).toISOString(),
        status,
        notes: notes.trim() || undefined,
        totalAmount: grandTotal,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }))
      };

      const res = await createPurchase(payload);
      if (res.success || res) {
        showSuccess("Procurement Recorded", `Purchase order ${purchaseNo} has been saved successfully.`);
        setShowAddModal(false);
        fetchPurchases();
      }
    } catch (err) {
      console.error(err);
      showError("Submission Error", err.response?.data?.message || err.message || "Failed to record purchase.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeletePurchase = async (id, pNo) => {
    const isConfirmed = await showConfirm({
      title: "Delete Purchase Log?",
      text: `Are you sure you want to remove purchase log ${pNo}? This will not reverse inventory changes automatically.`,
      confirmButtonText: "Yes, Delete",
      icon: "warning"
    });
    if (!isConfirmed) return;

    try {
      setLoading(true);
      const res = await deletePurchase(id);
      if (res.success || res) {
        showSuccess("Deleted", "Purchase log deleted successfully.");
        fetchPurchases();
      }
    } catch (err) {
      console.error(err);
      showError("Delete Failed", err.response?.data?.message || err.message || "Failed to remove purchase record.");
    } finally {
      setLoading(false);
    }
  };

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const pNo = (p.purchaseNo || p.invoiceNumber || "").toLowerCase();
      const supplierName = (p.supplier?.companyName || p.supplier || "N/A").toLowerCase();
      const matchesSearch = pNo.includes(searchTerm.toLowerCase()) || supplierName.includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [purchases, searchTerm, statusFilter]);

  // Statistics calculations
  const stats = useMemo(() => {
    const totalCount = filteredPurchases.length;
    const totalSpend = filteredPurchases.reduce((sum, p) => sum + parseFloat(p.totalAmount || 0), 0);
    const uniqueSuppliers = new Set(filteredPurchases.map(p => p.supplierId || p.supplier?.id).filter(Boolean)).size;
    const pendingCount = filteredPurchases.filter(p => p.status === "PENDING").length;

    return {
      totalCount,
      totalSpend,
      uniqueSuppliers,
      pendingCount
    };
  }, [filteredPurchases]);

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      
      {/* PAGE HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Medicine Purchase Logs</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>View batch procurement lists, match supplier invoices, and track purchase payments.</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
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
            <FiRefreshCw /> Reload
          </button>
          <button 
            onClick={handleOpenAddModal}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "none",
              background: "#10b981",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "700",
              fontSize: "14px",
              color: "#ffffff",
              cursor: "pointer",
              boxShadow: "0 4px 6px -1px rgba(16,185,129,0.2)",
              transition: "all 0.2s"
            }}
          >
            <FiPlus /> Record Procurement
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Spend</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0 }}>${stats.totalSpend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <div style={{ padding: "8px", borderRadius: "50%", background: "#ecfdf5", color: "#10b981" }}><FiDollarSign size={20} /></div>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Procurements</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0 }}>{stats.totalCount} Orders</h2>
            <div style={{ padding: "8px", borderRadius: "50%", background: "#eff6ff", color: "#3b82f6" }}><FiShoppingCart size={20} /></div>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Suppliers</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0 }}>{stats.uniqueSuppliers} Vendors</h2>
            <div style={{ padding: "8px", borderRadius: "50%", background: "#faf5ff", color: "#a855f7" }}><FiGrid size={20} /></div>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pending Orders</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0 }}>{stats.pendingCount} Pending</h2>
            <div style={{ padding: "8px", borderRadius: "50%", background: "#fffbeb", color: "#f59e0b" }}><FiCalendar size={20} /></div>
          </div>
        </div>
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div style={{ background: "#ffffff", borderRadius: "16px", padding: "16px 20px", border: "1px solid #e2e8f0", display: "flex", gap: "16px", alignItems: "center", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ position: "relative", flexGrow: 1 }}>
          <FiSearch style={{ position: "absolute", left: "12px", top: "13px", color: "#94a3b8" }} />
          <input 
            type="text"
            placeholder="Search by supplier invoice no. or distributor company..."
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
            <option value="ALL">All Statuses</option>
            <option value="RECEIVED">Received</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* PURCHASE LOGS TABLE CARD */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "260px" }}>
          <FiRefreshCw className="animate-spin" size={24} style={{ color: "#10b981", marginBottom: "12px" }} />
          <p style={{ color: "#64748b", fontWeight: "600" }}>Loading purchase logs...</p>
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left", fontSize: "12px", color: "#64748b" }}>
                  <th style={{ padding: "12px" }}>SUPPLIER INVOICE NO</th>
                  <th style={{ padding: "12px" }}>SUPPLIER DISTRIBUTOR</th>
                  <th style={{ padding: "12px" }}>PURCHASE DATE</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>ITEMS COUNT</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>TOTAL BILL</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>STATUS</th>
                  <th style={{ padding: "12px", width: "80px", textAlign: "center" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
                      No purchase logs registered. Click &quot;Record Procurement&quot; to log a new purchase.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map(p => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "14px" }}>
                      <td style={{ padding: "12px", fontWeight: "700", color: "#10b981" }}>{p.purchaseNo || p.invoiceNumber}</td>
                      <td style={{ padding: "12px", fontWeight: "600", color: "#334155" }}>
                        {p.supplier?.companyName || p.supplier || "N/A"}
                      </td>
                      <td style={{ padding: "12px", color: "#64748b" }}>{new Date(p.purchaseDate || p.date).toLocaleDateString()}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>{p.items?.length || p.itemsCount || p.items || 0} drugs</td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>
                        ${parseFloat(p.totalAmount || p.amount || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "700",
                          background: p.status === "RECEIVED" ? "#e6fffa" : p.status === "PENDING" ? "#fffbeb" : "#fef2f2",
                          color: p.status === "RECEIVED" ? "#047857" : p.status === "PENDING" ? "#b45309" : "#b91c1c",
                          border: p.status === "RECEIVED" ? "1px solid #b2f5ea" : p.status === "PENDING" ? "1px solid #fde68a" : "1px solid #fecaca"
                        }}>
                          {p.status || "RECEIVED"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <button 
                          onClick={() => handleDeletePurchase(p.id, p.purchaseNo)}
                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD PROCUREMENT MODAL */}
      {showAddModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <form onSubmit={handleCreatePurchaseSubmit} style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", maxWidth: "700px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>Record Medicine Procurement</h2>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <FiX size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>SUPPLIER DISTRIBUTOR *</label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.companyName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>DESTINATION WAREHOUSE *</label>
                <select
                  required
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
                >
                  <option value="">-- Choose Warehouse --</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>INVOICE NUMBER *</label>
                <input 
                  type="text"
                  required
                  value={purchaseNo}
                  onChange={(e) => setPurchaseNo(e.target.value)}
                  placeholder="e.g. INV-MED-0281"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>PROCUREMENT DATE *</label>
                <input 
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>ORDER STATUS</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "700", color: "#1e293b", outline: "none" }}
                >
                  <option value="PENDING">PENDING (ORDERED)</option>
                  <option value="RECEIVED">RECEIVED (ADDED TO STOCK)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>TAX RATE (%)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
                />
              </div>
            </div>

            {/* Procurement Items */}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FiPackage /> MEDICINES LIST ({items.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  style={{
                    background: "#eff6ff",
                    border: "none",
                    color: "#2563eb",
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <FiPlus /> Add Drug Row
                </button>
              </div>

              {/* Items List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "200px", overflowY: "auto", paddingRight: "4px" }}>
                {items.map((item, index) => (
                  <div key={index} style={{ display: "grid", gridTemplateColumns: "3fr 1.2fr 1.5fr 1fr 40px", gap: "10px", alignItems: "center" }}>
                    
                    {/* Medicine dropdown */}
                    <select
                      required
                      value={item.productId}
                      onChange={(e) => handleUpdateItem(index, "productId", e.target.value)}
                      style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
                    >
                      <option value="">Select Drug...</option>
                      {medicines.map(m => (
                        <option key={m.productId} value={m.productId}>
                          {m.product?.name || m.genericName} {m.strength ? `(${m.strength})` : ""}
                        </option>
                      ))}
                    </select>

                    {/* Quantity */}
                    <input 
                      type="number"
                      required
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(index, "quantity", e.target.value)}
                      style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", textAlign: "center", outline: "none" }}
                    />

                    {/* Cost Unit Price */}
                    <input 
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="Cost Price ($)"
                      value={item.unitPrice || ""}
                      onChange={(e) => handleUpdateItem(index, "unitPrice", e.target.value)}
                      style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", textAlign: "right", outline: "none" }}
                    />

                    {/* Total Price */}
                    <div style={{ textAlign: "right", fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                      ${(item.totalPrice || 0).toFixed(2)}
                    </div>

                    {/* Remove row */}
                    <div style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        disabled={items.length === 1}
                        style={{ background: "none", border: "none", color: items.length === 1 ? "#cbd5e1" : "#ef4444", cursor: items.length === 1 ? "not-allowed" : "pointer" }}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Summary details */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px", borderTop: "1px solid #e2e8f0", paddingTop: "16px", marginBottom: "24px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>ADDITIONAL PURCHASE NOTES</label>
                <textarea 
                  placeholder="Supplier terms, invoice matching comments..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", height: "76px", resize: "none", outline: "none" }}
                />
              </div>

              <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                  <span>Subtotal:</span>
                  <span style={{ fontWeight: "700", color: "#334155" }}>${subtotal.toFixed(2)}</span>
                </div>
                {taxRate > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                    <span>Estimated Tax ({taxRate}%):</span>
                    <span style={{ fontWeight: "700", color: "#334155" }}>+${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: "800", color: "#0f172a", borderTop: "1px solid #cbd5e1", paddingTop: "6px", marginTop: "4px" }}>
                  <span>Grand Total:</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "none", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={modalLoading}
                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#10b981", color: "#ffffff", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}
              >
                {modalLoading ? "Saving Procurement..." : "Save Purchase Log"}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}

