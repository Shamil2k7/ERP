"use client";

import { useEffect, useState } from "react";
import { laundryService } from "@/services/laundryService";
import { showSuccess, showError } from "@/utils/swal";
import {
  FiGrid,
  FiClock,
  FiCheckCircle,
  FiTruck,
  FiShoppingBag,
  FiXCircle,
  FiEye,
  FiRefreshCw
} from "react-icons/fi";

const STATUS_OPTIONS = ["ALL", "RECEIVED", "INSPECTING", "PROCESSING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED", "CANCELLED"];

export default function LaundryOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatusFilter, setActiveStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await laundryService.getOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      } else {
        // Fallback Mock data
        setOrders([
          {
            id: "ord-1",
            orderNumber: "LND-0104",
            status: "PROCESSING",
            subtotal: 45.00,
            discountAmount: 0.00,
            taxAmount: 2.25,
            totalAmount: 47.25,
            paidAmount: 47.25,
            balanceAmount: 0.00,
            specialInstructions: "Collars dry cleaning",
            receivedAt: new Date(Date.now() - 3600000).toISOString(),
            customer: { name: "David Miller", phone: "9876543210" },
            branch: { name: "Central Outlet" },
            items: [
              { id: "item-1", garmentType: "Shirt", quantity: 2, unitPrice: 15.00, totalAmount: 30.00, service: { name: "Dry Cleaning" } },
              { id: "item-2", garmentType: "Pant", quantity: 1, unitPrice: 15.00, totalAmount: 15.00, service: { name: "Dry Cleaning" } },
            ]
          },
          {
            id: "ord-2",
            orderNumber: "LND-0105",
            status: "RECEIVED",
            subtotal: 22.50,
            discountAmount: 0.00,
            taxAmount: 1.13,
            totalAmount: 23.63,
            paidAmount: 0.00,
            balanceAmount: 23.63,
            receivedAt: new Date().toISOString(),
            customer: { name: "Emma Watson", phone: "9876543211" },
            branch: { name: "Central Outlet" },
            items: [
              { id: "item-3", garmentType: "Saree", quantity: 1, unitPrice: 22.50, totalAmount: 22.50, service: { name: "Special Wash" } }
            ]
          },
          {
            id: "ord-3",
            orderNumber: "LND-0106",
            status: "READY",
            subtotal: 68.00,
            discountAmount: 5.00,
            taxAmount: 3.15,
            totalAmount: 66.15,
            paidAmount: 66.15,
            balanceAmount: 0.00,
            receivedAt: new Date(Date.now() - 7200000).toISOString(),
            customer: { name: "John Doe", phone: "9876543212" },
            branch: { name: "Central Outlet" },
            items: [
              { id: "item-4", garmentType: "Suit", quantity: 1, unitPrice: 68.00, totalAmount: 68.00, service: { name: "Dry Cleaning" } }
            ]
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await laundryService.updateOrderStatus(orderId, newStatus);
      if (res.success || res.data) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        showSuccess("Status Updated", `Order status updated to ${newStatus}.`);
      }
    } catch (err) {
      showError("Update Failed", "Failed to update status: " + err.message);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = activeStatusFilter === "ALL" || o.status === activeStatusFilter;
    const matchesSearch = o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.customer?.phone?.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "RECEIVED": return { bg: "#eff6ff", text: "#2563eb" };
      case "INSPECTING": return { bg: "#faf5ff", text: "#8b5cf6" };
      case "PROCESSING": return { bg: "#fffbeb", text: "#d97706" };
      case "READY": return { bg: "#f0fdf4", text: "#16a34a" };
      case "OUT_FOR_DELIVERY": return { bg: "#ecfdf5", text: "#059669" };
      case "DELIVERED": return { bg: "#f8fafc", text: "#475569" };
      case "COMPLETED": return { bg: "#f0fdf4", text: "#15803d" };
      default: return { bg: "#fef2f2", text: "#ef4444" };
    }
  };

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Laundry Orders Management</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Update garment progress, initiate dry cleaning processing, and handle pickup payments.</p>
        </div>
        <button 
          onClick={fetchOrders}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            padding: "8px 16px",
            borderRadius: "8px",
            color: "#475569",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          <FiRefreshCw /> Reload Orders
        </button>
      </div>

      {/* FILTER HEADER */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        
        {/* Status Pills */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {STATUS_OPTIONS.map(status => (
            <button 
              key={status}
              onClick={() => setActiveStatusFilter(status)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "1px solid",
                borderColor: activeStatusFilter === status ? "#2563eb" : "#cbd5e1",
                background: activeStatusFilter === status ? "#2563eb" : "#ffffff",
                color: activeStatusFilter === status ? "#ffffff" : "#475569",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <input 
          type="text"
          placeholder="Search by order # or customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", width: "260px" }}
        />

      </div>

      {/* LIST GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
        
        {filteredOrders.length === 0 ? (
          <div style={{ padding: "80px", textAlign: "center", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <FiShoppingBag size={48} style={{ color: "#94a3b8", marginBottom: "16px" }} />
            <p style={{ color: "#64748b", margin: 0 }}>No orders found matching the filter criteria.</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const colors = getStatusColor(order.status);
            return (
              <div key={order.id} style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b" }}>{order.orderNumber}</span>
                    <span style={{ padding: "4px 10px", background: colors.bg, color: colors.text, borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>{order.status}</span>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>Received: {new Date(order.receivedAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div style={{ display: "flex", gap: "24px", fontSize: "14px", color: "#475569" }}>
                    <div>Customer: <strong style={{ color: "#1e293b" }}>{order.customer?.name}</strong> ({order.customer?.phone})</div>
                    <div>Items: <strong style={{ color: "#1e293b" }}>{order.items?.reduce((sum, i) => sum + i.quantity, 0)} garments</strong></div>
                    <div>Outlet: <strong style={{ color: "#1e293b" }}>{order.branch?.name || "Main branch"}</strong></div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>${parseFloat(order.totalAmount || 0).toFixed(2)}</div>
                    <div style={{ fontSize: "12px", color: parseFloat(order.balanceAmount || 0) > 0 ? "#ef4444" : "#16a34a", fontWeight: "600" }}>
                      {parseFloat(order.balanceAmount || 0) > 0 ? `Unpaid: $${parseFloat(order.balanceAmount).toFixed(2)}` : "Fully Paid"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}
                    >
                      <FiEye /> View Details
                    </button>
                    
                    {/* Next action states */}
                    {order.status === "RECEIVED" && (
                      <button 
                        onClick={() => handleUpdateStatus(order.id, "PROCESSING")}
                        style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#d97706", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}
                      >
                        Start Processing
                      </button>
                    )}
                    {order.status === "PROCESSING" && (
                      <button 
                        onClick={() => handleUpdateStatus(order.id, "READY")}
                        style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#16a34a", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}
                      >
                        Mark as Ready
                      </button>
                    )}
                    {order.status === "READY" && (
                      <button 
                        onClick={() => handleUpdateStatus(order.id, "COMPLETED")}
                        style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

      </div>

      {/* DETAIL DRAWER MODAL */}
      {selectedOrder && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "32px", maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>Order {selectedOrder.orderNumber} Details</h2>
              <button 
                onClick={() => setSelectedOrder(null)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontWeight: "800" }}
              >
                X
              </button>
            </div>

            {/* Customer & Branch */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px", fontSize: "14px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block" }}>CUSTOMER PROFILE</span>
                <strong>{selectedOrder.customer?.name}</strong>
                <span style={{ display: "block", color: "#475569" }}>{selectedOrder.customer?.phone}</span>
              </div>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block" }}>OUTLET / BRANCH</span>
                <strong>{selectedOrder.branch?.name || "Central Outlet"}</strong>
                <span style={{ display: "block", color: "#475569" }}>Status: {selectedOrder.status}</span>
              </div>
            </div>

            {/* Items table */}
            <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9", padding: "16px", marginBottom: "24px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "12px" }}>GARMENT LIST</span>
              {selectedOrder.items?.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <strong>{item.quantity} × {item.garmentType}</strong>
                    <span style={{ marginLeft: "8px", color: "#2563eb", fontSize: "11px", fontWeight: "600" }}>{item.service?.name}</span>
                    {item.notes && <span style={{ display: "block", fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>Instruction: {item.notes}</span>}
                  </div>
                  <strong>${parseFloat(item.totalAmount || 0).toFixed(2)}</strong>
                </div>
              ))}
            </div>

            {/* Financial breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "20px", fontSize: "13px", color: "#475569" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal:</span><strong>${parseFloat(selectedOrder.subtotal || 0).toFixed(2)}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Tax:</span><strong>${parseFloat(selectedOrder.taxAmount || 0).toFixed(2)}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", color: "#0f172a" }}><span>Total:</span><strong>${parseFloat(selectedOrder.totalAmount || 0).toFixed(2)}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a" }}><span>Paid Amount:</span><strong>${parseFloat(selectedOrder.paidAmount || 0).toFixed(2)}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#ef4444" }}><span>Balance Due:</span><strong>${parseFloat(selectedOrder.balanceAmount || 0).toFixed(2)}</strong></div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              {selectedOrder.status !== "CANCELLED" && selectedOrder.status !== "COMPLETED" && (
                <button 
                  onClick={() => {
                    handleUpdateStatus(selectedOrder.id, "CANCELLED");
                  }}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ef4444", color: "#ef4444", background: "none", cursor: "pointer", fontWeight: "600" }}
                >
                  Cancel Order
                </button>
              )}
              <button onClick={() => setSelectedOrder(null)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#0f172a", color: "#ffffff", cursor: "pointer", fontWeight: "700" }}>Close</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
