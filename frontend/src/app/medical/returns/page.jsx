"use client";

import { useEffect, useState, useMemo } from "react";
import { medicalService } from "@/services/medicalService";
import { getPurchases } from "@/services/purchaseService";
import apiClient from "@/services/apiClient";
import { showSuccess, showError, showWarning, showConfirm } from "@/utils/swal";
import { useCompany } from "@/context/CompanyContext";
import { 
  FiTrash2, 
  FiRefreshCw, 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiCalendar, 
  FiDollarSign, 
  FiTrendingUp, 
  FiX, 
  FiMapPin, 
  FiTruck,
  FiShoppingBag
} from "react-icons/fi";

export default function MedicineReturns() {
  const { user, branchOverride } = useCompany();
  const [returns, setReturns] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal and Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [returnNumber, setReturnNumber] = useState("");
  const [purchaseOrderId, setPurchaseOrderId] = useState("");
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [totalAmount, setTotalAmount] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [status, setStatus] = useState("DISPATCHED");
  const [notes, setNotes] = useState("");

  const fetchReturnsData = async () => {
    try {
      const [retRes, purRes, shopRes] = await Promise.all([
        medicalService.getPurchaseReturns(),
        getPurchases(),
        medicalService.getMedicalShops()
      ]);
      setReturns(retRes?.data || retRes || []);
      setPurchases(purRes?.data || purRes || []);
      setShops(shopRes?.data || shopRes || []);
    } catch (err) {
      console.error(err);
      showError("Fetch Error", "Failed to retrieve returns list from system database.");
    } finally {
      setLoading(false);
    }
  };

  const handleReload = async () => {
    setLoading(true);
    await fetchReturnsData();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReturnsData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenAddModal = () => {
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    setReturnNumber(`RET-MED-${randomSeq}`);
    
    // Set default branch
    const activeBranchId = branchOverride?.id || user?.branchId || "";
    setBranchId(activeBranchId);
    
    setPurchaseOrderId("");
    setReturnDate(new Date().toISOString().split("T")[0]);
    setTotalAmount("");
    setTaxAmount(0);
    setStatus("DISPATCHED");
    setNotes("");
    setShowAddModal(true);
  };

  const handlePurchaseOrderChange = (poId) => {
    setPurchaseOrderId(poId);
    // Autofill total amount if purchase order is chosen
    const selectedPO = purchases.find(p => p.id === poId);
    if (selectedPO) {
      setTotalAmount(parseFloat(selectedPO.totalAmount || 0));
    } else {
      setTotalAmount("");
    }
  };

  const handleCreateReturnSubmit = async (e) => {
    e.preventDefault();
    if (!branchId) {
      showWarning("Input Required", "Please select a branch outlet.");
      return;
    }
    if (!purchaseOrderId) {
      showWarning("Input Required", "Please select a reference purchase order invoice.");
      return;
    }
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      showWarning("Input Required", "Please enter a valid return value.");
      return;
    }

    try {
      setModalLoading(true);
      const payload = {
        branchId,
        type: "PURCHASE_RETURN",
        referencePurchaseOrderId: purchaseOrderId,
        returnNumber: returnNumber.trim(),
        returnDate: new Date(returnDate).toISOString(),
        totalAmount: parseFloat(totalAmount),
        taxAmount: parseFloat(taxAmount || 0),
        netAmount: parseFloat(totalAmount) + parseFloat(taxAmount || 0),
        status,
        notes: notes.trim() || undefined
      };

      const res = await apiClient.post("/returns", payload);
      if (res.data?.success || res) {
        showSuccess("Return Processed", `Supplier Return ${returnNumber} recorded successfully.`);
        setShowAddModal(false);
        fetchReturnsData();
      }
    } catch (err) {
      console.error(err);
      showError("Submission Failed", err.response?.data?.message || err.message || "Failed to record return.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteReturn = async (id, rNo) => {
    const isConfirmed = await showConfirm({
      title: "Remove Return Log?",
      text: `Are you sure you want to delete return log ${rNo}? This cannot be undone.`,
      confirmButtonText: "Yes, Delete",
      icon: "warning"
    });
    if (!isConfirmed) return;

    try {
      setLoading(true);
      const res = await apiClient.delete(`/returns/${id}`);
      if (res.data?.success || res) {
        showSuccess("Deleted", "Return log entry removed.");
        fetchReturnsData();
      }
    } catch (err) {
      console.error(err);
      showError("Delete Failed", err.response?.data?.message || err.message || "Failed to delete return log.");
    } finally {
      setLoading(false);
    }
  };

  // Memoized Return PO Map to avoid nested O(n^2) lookups in render loop
  const returnPOMap = useMemo(() => {
    const map = {};
    purchases.forEach(p => {
      map[p.id] = {
        supplier: p.supplier?.companyName || p.supplier?.name || "Generic Distributor",
        itemsCount: p.items?.length || 1
      };
    });
    return map;
  }, [purchases]);

  // Filtered Returns
  const filteredReturns = useMemo(() => {
    return returns.filter(r => {
      const rNo = (r.returnNumber || "").toLowerCase();
      const poDetails = returnPOMap[r.referencePurchaseOrderId] || {};
      const supplierName = (poDetails.supplier || "").toLowerCase();
      const matchesSearch = rNo.includes(searchTerm.toLowerCase()) || supplierName.includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [returns, searchTerm, statusFilter, returnPOMap]);

  // Stats Calculations
  const stats = useMemo(() => {
    const totalCount = filteredReturns.length;
    const totalSpend = filteredReturns.reduce((sum, r) => sum + parseFloat(r.totalAmount || 0), 0);
    const pendingCount = filteredReturns.filter(r => r.status === "PENDING" || !r.status).length;
    const completedCount = filteredReturns.filter(r => r.status === "DELIVERED").length;

    return {
      totalCount,
      totalSpend,
      pendingCount,
      completedCount
    };
  }, [filteredReturns]);

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      
      {/* PAGE HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Supplier Returns (Damaged / Expired)</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Process returns for expired drug batches and verify distributor credit refunds.</p>
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
              background: "#ef4444",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "700",
              fontSize: "14px",
              color: "#ffffff",
              cursor: "pointer",
              boxShadow: "0 4px 6px -1px rgba(239,68,68,0.2)",
              transition: "all 0.2s"
            }}
          >
            <FiPlus /> Record Supplier Return
          </button>
        </div>
      </div>

      {/* OVERVIEW STATS CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Refund Claims</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#ef4444", margin: 0 }}>${stats.totalSpend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <div style={{ padding: "8px", borderRadius: "50%", background: "#fef2f2", color: "#ef4444" }}><FiDollarSign size={20} /></div>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Returns Logged</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0 }}>{stats.totalCount} Shipments</h2>
            <div style={{ padding: "8px", borderRadius: "50%", background: "#eff6ff", color: "#3b82f6" }}><FiTruck size={20} /></div>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pending Returns</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0 }}>{stats.pendingCount} Pending</h2>
            <div style={{ padding: "8px", borderRadius: "50%", background: "#fffbeb", color: "#f59e0b" }}><FiCalendar size={20} /></div>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Delivered Refunded</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0 }}>{stats.completedCount} Complete</h2>
            <div style={{ padding: "8px", borderRadius: "50%", background: "#ecfdf5", color: "#10b981" }}><FiTrendingUp size={20} /></div>
          </div>
        </div>
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div style={{ background: "#ffffff", borderRadius: "16px", padding: "16px 20px", border: "1px solid #e2e8f0", display: "flex", gap: "16px", alignItems: "center", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ position: "relative", flexGrow: 1 }}>
          <FiSearch style={{ position: "absolute", left: "12px", top: "13px", color: "#94a3b8" }} />
          <input 
            type="text"
            placeholder="Search by supplier return number or distributor name..."
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
            <option value="DISPATCHED">Dispatched</option>
            <option value="PENDING">Pending</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>
      </div>

      {/* RETURNS TABLE */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "260px" }}>
          <FiRefreshCw className="animate-spin" size={24} style={{ color: "#ef4444", marginBottom: "12px" }} />
          <p style={{ color: "#64748b", fontWeight: "600" }}>Loading returns history...</p>
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left", fontSize: "12px", color: "#64748b" }}>
                  <th style={{ padding: "12px" }}>RETURN NO</th>
                  <th style={{ padding: "12px" }}>SUPPLIER DISTRIBUTOR</th>
                  <th style={{ padding: "12px" }}>RETURN DATE</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>ITEMS COUNT</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>TOTAL VALUE</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>STATUS</th>
                  <th style={{ padding: "12px", width: "80px", textAlign: "center" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
                      No supplier returns logged. Click &quot;Record Supplier Return&quot; to log a new purchase return.
                    </td>
                  </tr>
                ) : (
                  filteredReturns.map(r => {
                    const poData = returnPOMap[r.referencePurchaseOrderId] || {};
                    return (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "14px" }}>
                        <td style={{ padding: "12px", fontWeight: "700", color: "#ef4444", fontFamily: "monospace" }}>{r.returnNumber}</td>
                        <td style={{ padding: "12px", fontWeight: "600", color: "#334155" }}>
                          {poData.supplier || "Generic Distributor"}
                        </td>
                        <td style={{ padding: "12px", color: "#64748b" }}>{new Date(r.returnDate).toLocaleDateString()}</td>
                        <td style={{ padding: "12px", textAlign: "right" }}>{poData.itemsCount || 1} items</td>
                        <td style={{ padding: "12px", textAlign: "right", fontWeight: "800", color: "#1e293b" }}>
                          ${parseFloat(r.totalAmount || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <span style={{ 
                            padding: "4px 10px", 
                            background: r.status === "DELIVERED" ? "#e6fffa" : r.status === "PENDING" ? "#fffbeb" : "#fff7ed", 
                            color: r.status === "DELIVERED" ? "#047857" : r.status === "PENDING" ? "#b45309" : "#c2410c", 
                            borderRadius: "12px", 
                            fontSize: "10px", 
                            fontWeight: "700",
                            border: r.status === "DELIVERED" ? "1px solid #b2f5ea" : r.status === "PENDING" ? "1px solid #fde68a" : "1px solid #ffedd5"
                          }}>
                            {r.status || "DISPATCHED"}
                          </span>
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <button 
                            onClick={() => handleDeleteReturn(r.id, r.returnNumber)}
                            style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                          >
                            <FiTrash2 size={16} />
                          </button>
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

      {/* RECORD SUPPLIER RETURN MODAL */}
      {showAddModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <form onSubmit={handleCreateReturnSubmit} style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>Record Supplier Return</h2>
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
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>RETURN FROM OUTLET / BRANCH *</label>
                <select
                  required
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
                >
                  <option value="">-- Choose Outlet --</option>
                  {shops.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>RETURN NUMBER *</label>
                <input 
                  type="text"
                  required
                  value={returnNumber}
                  onChange={(e) => setReturnNumber(e.target.value)}
                  placeholder="e.g. RET-MED-0012"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
                />
              </div>
            </div>

            <div style={{ border: "1px solid #e2e8f0", padding: "16px", borderRadius: "8px", background: "#f8fafc", marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "#475569", marginBottom: "6px" }}>SELECT REFERENCE PURCHASE ORDER *</label>
              <select
                required
                value={purchaseOrderId}
                onChange={(e) => handlePurchaseOrderChange(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", background: "#ffffff", marginBottom: "10px" }}
              >
                <option value="">-- Select Invoice PO --</option>
                {purchases.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.purchaseNo} - {p.supplier?.companyName || p.supplier?.name} (${parseFloat(p.totalAmount).toFixed(2)})
                  </option>
                ))}
              </select>

              {purchaseOrderId && (
                <div style={{ fontSize: "13px", color: "#475569", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span><strong>Distributor:</strong> {purchases.find(p => p.id === purchaseOrderId)?.supplier?.companyName}</span>
                  <span><strong>Order Date:</strong> {new Date(purchases.find(p => p.id === purchaseOrderId)?.purchaseDate).toLocaleDateString()}</span>
                  <span><strong>Total Purchase Bill:</strong> ${parseFloat(purchases.find(p => p.id === purchaseOrderId)?.totalAmount).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>RETURN VALUE ($) *</label>
                <input 
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>RETURN DATE *</label>
                <input 
                  type="date"
                  required
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>TAX ADJUSTMENT ($)</label>
                <input 
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>RETURN STATUS</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "700", color: "#1e293b", outline: "none" }}
                >
                  <option value="PENDING">PENDING (VERIFYING)</option>
                  <option value="DISPATCHED">DISPATCHED (SHIPPED)</option>
                  <option value="DELIVERED">DELIVERED (REFUNDED)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>REASON / DAMAGE NOTES</label>
              <textarea 
                placeholder="List damaged, expired medicines or return reason codes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", height: "76px", resize: "none", outline: "none" }}
              />
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
                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#ef4444", color: "#ffffff", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}
              >
                {modalLoading ? "Saving Return..." : "Save Return Log"}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}

