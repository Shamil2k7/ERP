"use client";

import { useEffect, useState } from "react";
import { laundryService } from "@/services/laundryService";
import { showSuccess, showError } from "@/utils/swal";
import { FiCheckCircle, FiInbox, FiRefreshCw } from "react-icons/fi";

export default function LaundryReadyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReadyOrders();
  }, []);

  const fetchReadyOrders = async () => {
    try {
      setLoading(true);
      const res = await laundryService.getOrders();
      const list = res.data || [];
      // filter orders in READY or OUT_FOR_DELIVERY status
      setOrders(list.filter(o => ["READY", "OUT_FOR_DELIVERY"].includes(o.status)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async (orderId) => {
    try {
      await laundryService.updateOrderStatus(orderId, "DELIVERED", "Handed over to customer");
      fetchReadyOrders();
      showSuccess("Order Delivered", "Order status updated to DELIVERED.");
    } catch (err) {
      showError("Delivery Failed", "Failed to deliver order: " + err.message);
    }
  };

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Ready for Collection</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Process order handover, receive balances, and log completion events.</p>
        </div>
        <button onClick={fetchReadyOrders} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <FiRefreshCw /> Refresh List
        </button>
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
        {orders.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
            <FiInbox size={40} style={{ color: "#94a3b8", marginBottom: "12px" }} />
            <p>No orders are currently waiting for collection.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left", fontSize: "12px", color: "#64748b" }}>
                  <th style={{ padding: "12px" }}>ORDER NO</th>
                  <th style={{ padding: "12px" }}>CUSTOMER</th>
                  <th style={{ padding: "12px" }}>TOTAL ITEMS</th>
                  <th style={{ padding: "12px" }}>BILL TOTAL</th>
                  <th style={{ padding: "12px" }}>BALANCE DUE</th>
                  <th style={{ padding: "12px" }}>STATUS</th>
                  <th style={{ padding: "12px", width: "140px" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "14px" }}>
                    <td style={{ padding: "12px", fontWeight: "700", color: "#2563eb" }}>{order.orderNumber}</td>
                    <td style={{ padding: "12px", color: "#1e293b", fontWeight: "600" }}>
                      {order.customer?.name}
                      <span style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "400" }}>{order.customer?.phone}</span>
                    </td>
                    <td style={{ padding: "12px" }}>{order.items?.reduce((sum, i) => sum + i.quantity, 0)} garments</td>
                    <td style={{ padding: "12px", fontWeight: "700" }}>${parseFloat(order.totalAmount || 0).toFixed(2)}</td>
                    <td style={{ padding: "12px", fontWeight: "700", color: parseFloat(order.balanceAmount || 0) > 0 ? "#ef4444" : "#16a34a" }}>
                      ${parseFloat(order.balanceAmount || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        padding: "4px 8px",
                        background: "#f0fdf4",
                        color: "#16a34a",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "700"
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <button 
                        onClick={() => handleDeliver(order.id)}
                        style={{
                          padding: "6px 12px",
                          border: "none",
                          background: "#16a34a",
                          color: "#ffffff",
                          borderRadius: "6px",
                          fontWeight: "700",
                          fontSize: "12px",
                          cursor: "pointer",
                          width: "100%"
                        }}
                      >
                        Handover / Deliver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
