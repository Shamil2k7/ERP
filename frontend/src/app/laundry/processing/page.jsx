"use client";

import { useEffect, useState } from "react";
import { laundryService } from "@/services/laundryService";
import { showSuccess, showError } from "@/utils/swal";
import { FiClock, FiCheckSquare, FiRefreshCw } from "react-icons/fi";

export default function LaundryProcessingQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await laundryService.getOrders();
      const orderList = res.data || [];
      // filter items in RECEIVED or PROCESSING status
      const activeItems = [];
      orderList.forEach(order => {
        if (["RECEIVED", "INSPECTING", "PROCESSING"].includes(order.status)) {
          order.items?.forEach(item => {
            activeItems.push({
              id: item.id,
              orderId: order.id,
              orderNumber: order.orderNumber,
              garmentType: item.garmentType,
              quantity: item.quantity,
              serviceName: item.service?.name,
              status: order.status,
              notes: item.notes,
              receivedAt: order.receivedAt
            });
          });
        }
      });
      setItems(activeItems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStatus = async (orderId, currentStatus) => {
    const nextStatus = currentStatus === "RECEIVED" ? "INSPECTING" : currentStatus === "INSPECTING" ? "PROCESSING" : "READY";
    try {
      await laundryService.updateOrderStatus(orderId, nextStatus, `Advanced stage to ${nextStatus}`);
      fetchQueue();
      showSuccess("Stage Updated", `Order advanced to ${nextStatus}.`);
    } catch (err) {
      showError("Stage Update Failed", "Failed to advance stage: " + err.message);
    }
  };

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Processing & Washing Queue</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Operator console to track garment cleaning stages from intake to press.</p>
        </div>
        <button onClick={fetchQueue} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <FiRefreshCw /> Refresh Queue
        </button>
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
        {items.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
            <FiCheckSquare size={40} style={{ color: "#16a34a", marginBottom: "12px" }} />
            <p>Washing queue is clear! All items have been processed.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left", fontSize: "12px", color: "#64748b" }}>
                  <th style={{ padding: "12px" }}>ORDER NO</th>
                  <th style={{ padding: "12px" }}>GARMENT ITEM</th>
                  <th style={{ padding: "12px" }}>SERVICE REQUESTED</th>
                  <th style={{ padding: "12px" }}>QTY</th>
                  <th style={{ padding: "12px" }}>INFLOW TIME</th>
                  <th style={{ padding: "12px" }}>CURRENT STAGE</th>
                  <th style={{ padding: "12px", width: "140px" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "14px" }}>
                    <td style={{ padding: "12px", fontWeight: "700", color: "#2563eb" }}>{item.orderNumber}</td>
                    <td style={{ padding: "12px", color: "#1e293b", fontWeight: "600" }}>
                      {item.garmentType}
                      {item.notes && <span style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "400" }}>({item.notes})</span>}
                    </td>
                    <td style={{ padding: "12px", color: "#475569" }}>{item.serviceName}</td>
                    <td style={{ padding: "12px", fontWeight: "700" }}>{item.quantity}</td>
                    <td style={{ padding: "12px", color: "#64748b" }}>{new Date(item.receivedAt).toLocaleTimeString()}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        padding: "4px 8px",
                        background: item.status === "RECEIVED" ? "#eff6ff" : item.status === "INSPECTING" ? "#faf5ff" : "#fffbeb",
                        color: item.status === "RECEIVED" ? "#2563eb" : item.status === "INSPECTING" ? "#8b5cf6" : "#d97706",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "700"
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <button 
                        onClick={() => handleAdvanceStatus(item.orderId, item.status)}
                        style={{
                          padding: "6px 12px",
                          border: "none",
                          background: item.status === "PROCESSING" ? "#16a34a" : "#2563eb",
                          color: "#ffffff",
                          borderRadius: "6px",
                          fontWeight: "700",
                          fontSize: "12px",
                          cursor: "pointer",
                          width: "100%"
                        }}
                      >
                        {item.status === "RECEIVED" ? "Start Inspect" : item.status === "INSPECTING" ? "Start Wash" : "Mark Ready"}
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
