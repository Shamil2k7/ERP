"use client";

import { useEffect, useState } from "react";
import { laundryService } from "@/services/laundryService";
import { showSuccess, showError, showWarning } from "@/utils/swal";
import {
  FiTag,
  FiUser,
  FiShoppingCart,
  FiLayers,
  FiCheckCircle,
  FiSearch,
  FiRefreshCw,
  FiPlus,
  FiFilter,
  FiClock,
  FiX
} from "react-icons/fi";

export default function LaundryGarmentsTracking() {
  const [garments, setGarments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeGarment, setActiveGarment] = useState(null);
  
  // Barcode search simulator state
  const [scanBarcode, setScanBarcode] = useState("");

  // Modal states for creating a new garment
  const [showAddModal, setShowAddModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [garmentNotes, setGarmentNotes] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchGarments();
  }, []);

  const fetchGarments = async () => {
    try {
      setLoading(true);
      const res = await laundryService.getGarments();
      if (res && res.success) {
        setGarments(res.data || []);
      } else if (Array.isArray(res)) {
        setGarments(res);
      } else {
        setGarments([]);
      }
    } catch (err) {
      console.error("Fetch garments error:", err);
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message;
      if (status === 401) {
        showError("Authentication Required", "Your session has expired. Please log in again.");
      } else if (status === 403) {
        showError("Access Denied", message || "You do not have permission to view garments.");
      } else {
        showError("Load Error", message || "Failed to retrieve garments list from server.");
      }
      setGarments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = async () => {
    try {
      setModalLoading(true);
      setShowAddModal(true);
      const res = await laundryService.getOrders();
      if (res.success && res.data) {
        // Only show orders that are not fully delivered/completed
        const activeOrders = res.data.filter(o => o.status !== "DELIVERED" && o.status !== "COMPLETED");
        setOrders(activeOrders);
      }
    } catch (err) {
      console.error(err);
      showError("Error", "Failed to load active orders.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateGarmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemId) {
      showWarning("Required Field", "Please select a specific order item first.");
      return;
    }

    try {
      setModalLoading(true);
      const payload = {
        orderItemId: selectedItemId,
        tagNumber: customTag.trim() || null,
        barcode: customTag.trim() || null,
        status: "RECEIVED",
        notes: garmentNotes.trim() || null
      };

      const res = await laundryService.createGarment(payload);
      if (res.success) {
        showSuccess("Garment Registered", "The garment tag was registered successfully!");
        setShowAddModal(false);
        // Reset form
        setSelectedOrderId("");
        setSelectedItemId("");
        setCustomTag("");
        setGarmentNotes("");
        // Reload list
        fetchGarments();
      }
    } catch (err) {
      console.error(err);
      showError("Registration Failed", err.message || "Failed to create garment record.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleScanSearch = async (e) => {
    e.preventDefault();
    if (!scanBarcode) return;

    try {
      setLoading(true);
      const res = await laundryService.scanGarment(scanBarcode.trim());
      if (res.success && res.data) {
        setActiveGarment(res.data);
        showSuccess("Garment Found", `Loaded garment tag: ${res.data.tagNumber}`);
      } else {
        showError("Not Found", "No active garment found matching that barcode or tag.");
      }
    } catch (err) {
      console.error(err);
      showError("Search Error", err.message || "Failed to query the garment tag.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (garmentId, newStatus) => {
    try {
      setLoading(true);
      const res = await laundryService.updateGarmentStatus(garmentId, newStatus);
      if (res.success && res.data) {
        showSuccess("Status Updated", `Garment status updated to ${newStatus}`);
        
        // Update local list
        setGarments(garments.map(g => g.id === garmentId ? { ...g, status: newStatus } : g));
        
        // Update scanned card if matches
        if (activeGarment && activeGarment.id === garmentId) {
          setActiveGarment({ ...activeGarment, status: newStatus });
        }
      }
    } catch (err) {
      console.error(err);
      showError("Status Update Failed", err.message || "Could not change status.");
    } finally {
      setLoading(false);
    }
  };

  const filteredGarments = garments.filter(g => {
    const matchesStatus = statusFilter === "ALL" || g.status === statusFilter;
    const matchesSearch = 
      g.tagNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.orderItem?.order?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.orderItem?.order?.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getSelectedOrderItems = () => {
    const order = orders.find(o => o.id === selectedOrderId);
    return order ? order.items || [] : [];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "RECEIVED": return { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" };
      case "PROCESSING": return { bg: "#fffbeb", text: "#d97706", border: "#fde68a" };
      case "READY": return { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" };
      case "DELIVERED": return { bg: "#f8fafc", text: "#475569", border: "#cbd5e1" };
      case "COMPLETED": return { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" };
      default: return { bg: "#fef2f2", text: "#ef4444", border: "#fecaca" };
    }
  };

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Garment Tag & Barcode Tracking</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Register custom garment tags, search active barcodes, and track laundry items dynamically.</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button 
            onClick={fetchGarments}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              padding: "10px 18px",
              borderRadius: "8px",
              color: "#475569",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            <FiRefreshCw /> Refresh List
          </button>
          <button 
            onClick={handleOpenAddModal}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#2563eb",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              color: "#ffffff",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 4px 6px -1px rgba(37,99,235,0.2)"
            }}
          >
            <FiPlus /> Register Custom Tag
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "32px", alignItems: "start" }}>
        
        {/* LEFT COLUMN: LIST AND FILTERS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* SEARCH & FILTERS HEADER */}
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0", display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ position: "relative", flexGrow: 1 }}>
              <FiSearch style={{ position: "absolute", left: "12px", top: "14px", color: "#94a3b8" }} />
              <input 
                type="text"
                placeholder="Find garments by tag, order #, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: "10px 10px 10px 38px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
              />
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FiFilter style={{ color: "#64748b" }} />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", color: "#475569", background: "#ffffff", fontWeight: "600" }}
              >
                <option value="ALL">All Statuses</option>
                <option value="RECEIVED">Received</option>
                <option value="PROCESSING">Processing</option>
                <option value="READY">Ready</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>
          </div>

          {/* GARMENTS TABLE CONTAINER */}
          <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "16px", fontSize: "12px", fontWeight: "700", color: "#475569" }}>TAG NUMBER</th>
                  <th style={{ padding: "16px", fontSize: "12px", fontWeight: "700", color: "#475569" }}>ORDER / CUSTOMER</th>
                  <th style={{ padding: "16px", fontSize: "12px", fontWeight: "700", color: "#475569" }}>GARMENT DETAILS</th>
                  <th style={{ padding: "16px", fontSize: "12px", fontWeight: "700", color: "#475569" }}>STATUS</th>
                  <th style={{ padding: "16px", fontSize: "12px", fontWeight: "700", color: "#475569", textAlign: "center" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "64px", color: "#64748b" }}>
                      <FiRefreshCw className="animate-spin" size={24} style={{ marginBottom: "12px" }} />
                      <p style={{ margin: 0, fontWeight: "600" }}>Loading active garments...</p>
                    </td>
                  </tr>
                ) : filteredGarments.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "64px", color: "#64748b" }}>
                      <FiTag size={36} style={{ marginBottom: "12px", color: "#cbd5e1" }} />
                      <p style={{ margin: 0, fontWeight: "600" }}>No matching garment tags found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredGarments.map(garment => {
                    const colors = getStatusColor(garment.status);
                    return (
                      <tr key={garment.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "16px" }}>
                          <span 
                            onClick={() => setActiveGarment(garment)}
                            style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: "800", color: "#2563eb", cursor: "pointer", textDecoration: "underline" }}
                          >
                            {garment.tagNumber}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>{garment.orderItem?.order?.orderNumber}</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>{garment.orderItem?.order?.customer?.name || "Walk-in"}</div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>{garment.orderItem?.garmentType}</div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{garment.orderItem?.service?.name}</div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ padding: "4px 10px", background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
                            {garment.status}
                          </span>
                        </td>
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          <select
                            value={garment.status}
                            onChange={(e) => handleUpdateStatus(garment.id, e.target.value)}
                            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: "600", color: "#475569" }}
                          >
                            <option value="RECEIVED">Received</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="READY">Ready</option>
                            <option value="DELIVERED">Delivered</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* RIGHT COLUMN: SCANNER BARCODE SIMULATOR & DETAILED CARD */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* BARCODE SCANNER INTERFACE */}
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
              <FiTag size={20} style={{ color: "#2563eb" }} /> Scan Tag Barcode
            </h3>
            
            <form onSubmit={handleScanSearch} style={{ display: "flex", gap: "10px" }}>
              <input 
                type="text"
                placeholder="Type tag barcode (e.g. LND-0002-001)"
                value={scanBarcode}
                onChange={(e) => setScanBarcode(e.target.value)}
                style={{ flexGrow: 1, padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
              />
              <button 
                type="submit" 
                style={{ padding: "10px 20px", border: "none", background: "#2563eb", color: "#ffffff", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}
              >
                Scan
              </button>
            </form>
          </div>

          {/* ACTIVE GARMENT PREVIEW CARD */}
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>Scanned Garment Details</h3>

            {activeGarment ? (
              <div>
                {/* Tag Banner */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", borderBottom: "1px dashed #cbd5e1", paddingBottom: "16px", marginBottom: "20px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb", display: "block" }}>ACTIVE TAG NUMBER</span>
                    <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "800", fontFamily: "monospace", color: "#1e293b" }}>{activeGarment.tagNumber}</h2>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", textAlign: "right" }}>STATUS</span>
                    <span style={{ padding: "6px 12px", background: getStatusColor(activeGarment.status).bg, color: getStatusColor(activeGarment.status).text, borderRadius: "12px", fontSize: "12px", fontWeight: "700", display: "inline-block", marginTop: "4px" }}>
                      {activeGarment.status}
                    </span>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <FiShoppingCart style={{ color: "#64748b" }} size={16} />
                    <span style={{ fontSize: "14px" }}>Order Reference: <strong style={{ color: "#0f172a" }}>{activeGarment.orderItem?.order?.orderNumber}</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <FiUser style={{ color: "#64748b" }} size={16} />
                    <span style={{ fontSize: "14px" }}>Customer Name: <strong style={{ color: "#0f172a" }}>{activeGarment.orderItem?.order?.customer?.name || "Walk-in Customer"}</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <FiLayers style={{ color: "#64748b" }} size={16} />
                    <span style={{ fontSize: "14px" }}>Garment/Service: <strong style={{ color: "#0f172a" }}>{activeGarment.orderItem?.garmentType}</strong> ({activeGarment.orderItem?.service?.name})</span>
                  </div>
                </div>

                {/* Notes */}
                {activeGarment.notes && (
                  <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #f1f5f9", fontSize: "13px", color: "#475569", marginBottom: "24px" }}>
                    <strong>Special Notes:</strong> {activeGarment.notes}
                  </div>
                )}

                {/* Quick Status Changers */}
                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "12px" }}>QUICK ADVANCE STATUS</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      onClick={() => handleUpdateStatus(activeGarment.id, "PROCESSING")}
                      style={{ flex: 1, padding: "8px 12px", border: "1px solid #d97706", background: activeGarment.status === "PROCESSING" ? "#fffbeb" : "#fff", color: "#d97706", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}
                    >
                      Process
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(activeGarment.id, "READY")}
                      style={{ flex: 1, padding: "8px 12px", border: "1px solid #16a34a", background: activeGarment.status === "READY" ? "#f0fdf4" : "#fff", color: "#16a34a", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}
                    >
                      Ready
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(activeGarment.id, "DELIVERED")}
                      style={{ flex: 1, padding: "8px 12px", border: "none", background: "#2563eb", color: "#ffffff", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}
                    >
                      Deliver
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "64px 20px", color: "#64748b" }}>
                <FiTag size={40} style={{ marginBottom: "12px", color: "#cbd5e1" }} />
                <p style={{ margin: 0, fontSize: "14px" }}>Scan a barcode tag or click a tag number on the list to view live tracking logs.</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* REGISTER NEW CUSTOM TAG MODAL */}
      {showAddModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <form onSubmit={handleCreateGarmentSubmit} style={{ background: "#ffffff", borderRadius: "16px", padding: "32px", maxWidth: "450px", width: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>Register Custom Garment Tag</h2>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <FiX size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
              
              {/* Select Active Order */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>1. SELECT ACTIVE ORDER *</label>
                <select
                  required
                  value={selectedOrderId}
                  onChange={(e) => {
                    setSelectedOrderId(e.target.value);
                    setSelectedItemId("");
                  }}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                >
                  <option value="">-- Choose Active Order --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>{o.orderNumber} - {o.customer?.name || "Walk-in"} ({new Date(o.receivedAt).toLocaleDateString()})</option>
                  ))}
                </select>
              </div>

              {/* Select Order Item */}
              {selectedOrderId && (
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>2. SELECT GARMENT TYPE FROM ORDER *</label>
                  <select
                    required
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  >
                    <option value="">-- Choose Garment --</option>
                    {getSelectedOrderItems().map(item => (
                      <option key={item.id} value={item.id}>{item.quantity} × {item.garmentType} ({item.service?.name})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Tag input */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>3. CUSTOM TAG / BARCODE NUMBER (OPTIONAL)</label>
                <input 
                  type="text"
                  placeholder="e.g. CUSTOM-001 (auto-generates if empty)"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>4. SPECIAL NOTES / INSTRUCTIONS</label>
                <textarea 
                  placeholder="e.g. Red silk fabric, handle with care"
                  value={garmentNotes}
                  onChange={(e) => setGarmentNotes(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", height: "80px", resize: "none" }}
                />
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
                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#ffffff", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}
              >
                {modalLoading ? "Registering..." : "Add Tag"}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
