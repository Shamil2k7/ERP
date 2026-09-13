"use client";

import { useState, useEffect } from "react";
import { restaurantService } from "@/services/restaurantService";
import Swal, { showSuccess, showError } from "@/utils/swal";
import { FiShoppingCart, FiPrinter, FiXCircle, FiCheckCircle, FiEye } from "react-icons/fi";

export default function RestaurantOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [selectedRestaurantId, statusFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await restaurantService.getRestaurants();
      const list = res.data || [];
      setRestaurants(list);
      if (list.length > 0) {
        setSelectedRestaurantId(list[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await restaurantService.getOrders({
        restaurantId: selectedRestaurantId && selectedRestaurantId !== "ALL" ? selectedRestaurantId : undefined,
        status: statusFilter || undefined,
      });
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: "Cancel Order",
      input: "text",
      inputLabel: "Enter reason for order cancellation:",
      inputPlaceholder: "Reason...",
      showCancelButton: true,
      confirmButtonText: "Cancel Order",
      confirmButtonColor: "#ef4444",
    });
    if (!isConfirmed || !reason) return;
    try {
      await restaurantService.cancelOrder(orderId, reason);
      fetchOrders();
      showSuccess("Order Cancelled", "Order was successfully cancelled.");
    } catch (err) {
      showError("Cancel Failed", err.response?.data?.message || err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading Orders...</div>;
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Restaurant Orders Log</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Historical log of all dine-in, takeaway & delivery orders.</p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: "600" }}
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PREPARING">PREPARING</option>
            <option value="READY">READY</option>
            <option value="SERVED">SERVED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          {restaurants.length > 0 && (
            <select
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: "600" }}
            >
              {restaurants.length > 1 && <option value="ALL">All Outlets</option>}
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div style={{ backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        {orders.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
            <FiShoppingCart size={48} />
            <h3 style={{ marginTop: "16px", color: "#334155" }}>No Restaurant Orders Found</h3>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "13px", textTransform: "uppercase" }}>
                <th style={{ padding: "14px 20px" }}>Order #</th>
                <th style={{ padding: "14px 20px" }}>Type / Table</th>
                <th style={{ padding: "14px 20px" }}>Customer</th>
                <th style={{ padding: "14px 20px" }}>Items</th>
                <th style={{ padding: "14px 20px" }}>Amount</th>
                <th style={{ padding: "14px 20px" }}>Status</th>
                <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px 20px", fontWeight: "700", color: "#0f172a" }}>{o.orderNumber}</td>
                  <td style={{ padding: "16px 20px", fontWeight: "600", color: "#334155" }}>
                    {o.orderType} {o.table ? `(Table ${o.table.tableNumber})` : ""}
                  </td>
                  <td style={{ padding: "16px 20px", color: "#64748b" }}>
                    {o.customer?.name || "Walk-in"}
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: "13px" }}>
                    {o.items?.map((i) => `${i.quantity}x ${i.menuItem?.name || "Item"}`).join(", ")}
                  </td>
                  <td style={{ padding: "16px 20px", fontWeight: "800", color: "#059669" }}>
                    ₹{parseFloat(o.totalAmount || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "700",
                        backgroundColor:
                          o.status === "COMPLETED" ? "#d1fae5" : o.status === "CANCELLED" ? "#fee2e2" : "#dbeafe",
                        color:
                          o.status === "COMPLETED" ? "#065f46" : o.status === "CANCELLED" ? "#991b1b" : "#1e40af",
                      }}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button
                        onClick={() => setSelectedOrder(o)}
                        style={{ padding: "6px 12px", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <FiEye /> View
                      </button>
                      {o.status !== "COMPLETED" && o.status !== "CANCELLED" && (
                        <button
                          onClick={() => handleCancelOrder(o.id)}
                          style={{ padding: "6px 12px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "550px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>Order Details: {selectedOrder.orderNumber}</h3>
              <button onClick={() => setSelectedOrder(null)} style={{ border: "none", background: "none", fontSize: "18px", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
              Type: {selectedOrder.orderType} | Table: {selectedOrder.table?.tableNumber || "N/A"} | Status: {selectedOrder.status}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>Ordered Dishes:</h4>
              {selectedOrder.items?.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed #e2e8f0", fontSize: "14px" }}>
                  <span>{item.quantity}x {item.menuItem?.name}</span>
                  <span style={{ fontWeight: "700" }}>₹{parseFloat(item.total).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "2px solid #e2e8f0", paddingTop: "12px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "800", fontSize: "16px" }}>
                <span>Total Amount:</span>
                <span style={{ color: "#059669" }}>₹{parseFloat(selectedOrder.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedOrder(null)} style={{ padding: "8px 16px", borderRadius: "6px", backgroundColor: "#2563eb", color: "#fff", border: "none", fontWeight: "600" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
