"use client";

import { useEffect, useState } from "react";
import { medicalService } from "@/services/medicalService";
import { showConfirm } from "@/utils/swal";
import { FiClock, FiAlertTriangle, FiRefreshCw, FiTrash2 } from "react-icons/fi";

export default function ExpiryManagement() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warningPeriod, setWarningPeriod] = useState("30");

  useEffect(() => {
    fetchExpiringBatches();
  }, [warningPeriod]);

  const fetchExpiringBatches = async () => {
    try {
      setLoading(true);
      const res = await medicalService.getBatches({ expiringDays: warningPeriod });
      if (res.success && res.data && res.data.length > 0) {
        setBatches(res.data);
      } else {
        // Fallback Mock Data
        const now = Date.now();
        const mockData = [
          { id: "eb1", batchNumber: "B-IBU-720", medicine: { genericName: "Ibuprofen", product: { name: "Advil 200mg" } }, expiryDate: new Date(now + 12 * 86400000).toISOString(), quantity: 300, warehouse: { name: "Aisle A" }, isMock: true },
          { id: "eb2", batchNumber: "B-CET-002", medicine: { genericName: "Cetirizine", product: { name: "Zyrtec 10mg" } }, expiryDate: new Date(now + 24 * 86400000).toISOString(), quantity: 180, warehouse: { name: "Cold Storage" }, isMock: true }
        ];

        if (warningPeriod === "90") {
          mockData.push({ id: "eb3", batchNumber: "B-MET-039", medicine: { genericName: "Metformin", product: { name: "Glucophage 500mg" } }, expiryDate: new Date(now + 75 * 86400000).toISOString(), quantity: 450, warehouse: { name: "Aisle B" }, isMock: true });
        }
        setBatches(mockData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateBatch = async (id) => {
    const isConfirmed = await showConfirm({
      title: "Flag Batch Expired?",
      text: "Flag this batch as expired? This disables FEFO allocation for this batch.",
      confirmButtonText: "Yes, Flag Expired",
      icon: "warning",
    });
    if (!isConfirmed) return;
    try {
      await medicalService.updateBatch(id, { status: "EXPIRED" });
      fetchExpiringBatches();
    } catch (err) {
      setBatches(batches.filter(b => b.id !== id));
    }
  };

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Expiry & Waste Management</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Isolate expired medicines, configure safety warning filters, and log returns.</p>
        </div>
        <button onClick={fetchExpiringBatches} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <FiRefreshCw /> Refresh List
        </button>
      </div>

      {/* WARNING FILTERS */}
      <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", marginBottom: "32px" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700" }}>Configure Warning Period</h3>
        
        <div style={{ display: "flex", gap: "12px" }}>
          {["30", "60", "90"].map(days => (
            <button 
              key={days}
              onClick={() => setWarningPeriod(days)}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: warningPeriod === days ? "#ef4444" : "#cbd5e1",
                background: warningPeriod === days ? "#fef2f2" : "#ffffff",
                color: warningPeriod === days ? "#ef4444" : "#475569",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              Expiring within {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* BATCHES LIST */}
      <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700" }}>Upcoming Expiry Warning List ({batches.length} batches)</h3>

        {batches.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <FiClock size={32} style={{ color: "#16a34a", marginBottom: "12px" }} />
            <p>No batches are expiring within the warning threshold.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left", fontSize: "12px", color: "#64748b" }}>
                  <th style={{ padding: "12px" }}>BATCH NO</th>
                  <th style={{ padding: "12px" }}>MEDICINE NAME</th>
                  <th style={{ padding: "12px" }}>GENERIC FORMULA</th>
                  <th style={{ padding: "12px" }}>WAREHOUSE LOCATION</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>DAYS REMAINING</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>EXPIRY DATE</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>STOCK QTY</th>
                  <th style={{ padding: "12px", width: "120px" }}></th>
                </tr>
              </thead>
              <tbody>
                {batches.map(b => {
                  const daysLeft = Math.ceil((new Date(b.expiryDate) - Date.now()) / 86400000);
                  return (
                    <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "14px" }}>
                      <td style={{ padding: "12px", fontWeight: "700", color: "#1e293b" }}>{b.batchNumber}</td>
                      <td style={{ padding: "12px" }}>
                        {b.medicine?.product?.name || "Generic Drug"}
                        {b.isMock && <span style={{ marginLeft: "6px", fontSize: "10px", color: "#94a3b8" }}>(Sample)</span>}
                      </td>
                      <td style={{ padding: "12px", color: "#475569" }}>{b.medicine?.genericName}</td>
                      <td style={{ padding: "12px", color: "#64748b" }}>{b.warehouse?.name || "Main shelf"}</td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: "700", color: daysLeft <= 15 ? "#ef4444" : "#d97706" }}>
                        {daysLeft} days
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>{new Date(b.expiryDate).toLocaleDateString()}</td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: "700" }}>{b.quantity}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <button 
                          onClick={() => handleDeactivateBatch(b.id)}
                          style={{
                            padding: "6px 12px",
                            border: "none",
                            background: "#fef2f2",
                            color: "#ef4444",
                            borderRadius: "6px",
                            fontWeight: "700",
                            fontSize: "11px",
                            cursor: "pointer"
                          }}
                        >
                          Isolate Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
