"use client";

import { useEffect, useState } from "react";
import { medicalService } from "@/services/medicalService";
import {
  FiActivity,
  FiAlertTriangle,
  FiLayers,
  FiPackage,
  FiTrendingUp,
  FiRefreshCw,
  FiClock
} from "react-icons/fi";

export default function PharmacyDashboard() {
  const [stats, setStats] = useState({
    totalBatches: 0,
    expiredCount: 0,
    expiringSoon30Count: 0,
    expiringSoon90Count: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    expiredBatches: [],
    expiringSoonBatches: [],
    lowStockBatches: [],
    outOfStockBatches: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await medicalService.getDashboardStats();
      if (res.success && res.data) {
        if (res.data.totalBatches > 0) {
          setStats(res.data);
        } else {
          // Fallback Mock Data if database is fresh
          setStats({
            totalBatches: 85,
            expiredCount: 3,
            expiringSoon30Count: 5,
            expiringSoon90Count: 12,
            lowStockCount: 6,
            outOfStockCount: 2,
            expiredBatches: [
              { id: "b1", batchNumber: "B-PAR-092", medicine: { genericName: "Paracetamol", product: { name: "Panadol 500mg" } }, expiryDate: new Date(Date.now() - 5 * 86400000).toISOString(), quantity: 120, isMock: true },
              { id: "b2", batchNumber: "B-AMO-488", medicine: { genericName: "Amoxicillin", product: { name: "Amoxil 250mg" } }, expiryDate: new Date(Date.now() - 15 * 86400000).toISOString(), quantity: 45, isMock: true }
            ],
            expiringSoonBatches: [
              { id: "b3", batchNumber: "B-IBU-720", medicine: { genericName: "Ibuprofen", product: { name: "Advil 200mg" } }, expiryDate: new Date(Date.now() + 14 * 86400000).toISOString(), quantity: 300, isMock: true },
              { id: "b4", batchNumber: "B-CET-002", medicine: { genericName: "Cetirizine", product: { name: "Zyrtec 10mg" } }, expiryDate: new Date(Date.now() + 25 * 86400000).toISOString(), quantity: 180, isMock: true }
            ],
            lowStockBatches: [
              { id: "b5", batchNumber: "B-LIP-102", medicine: { genericName: "Atorvastatin", product: { name: "Lipitor 10mg" } }, quantity: 8, isMock: true },
              { id: "b6", batchNumber: "B-MET-039", medicine: { genericName: "Metformin", product: { name: "Glucophage 500mg" } }, quantity: 14, isMock: true }
            ],
            outOfStockBatches: []
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Pharmacy & Medical Dashboard</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Expiry tracking alert panels, batch stock levels, and drug dispensing summaries.</p>
        </div>
        <button onClick={fetchStats} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <FiRefreshCw /> Refresh Dashboard
        </button>
      </div>

      {/* WARNING NOTIFICATION BANNER IF EXPIRED ITEMS */}
      {stats.expiredCount > 0 && (
        <div style={{ display: "flex", gap: "12px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "12px", padding: "16px", marginBottom: "32px", color: "#b91c1c", alignItems: "center" }}>
          <FiAlertTriangle size={24} />
          <div>
            <strong style={{ fontSize: "15px", display: "block" }}>Urgent Warning: Expired Batches Detected!</strong>
            <span style={{ fontSize: "13px" }}>There are currently {stats.expiredCount} medicine batches past their expiration dates. Please isolate and log supplier returns.</span>
          </div>
        </div>
      )}

      {/* KPI GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px", marginBottom: "32px" }}>
        
        {/* Total Batches */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Active Batches</span>
            <div style={{ background: "#ecfdf5", color: "#059669", borderRadius: "8px", padding: "8px" }}><FiLayers /></div>
          </div>
          <span style={{ fontSize: "28px", fontWeight: "800" }}>{stats.totalBatches}</span>
        </div>

        {/* Expired Batches */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Expired Batches</span>
            <div style={{ background: "#fef2f2", color: "#ef4444", borderRadius: "8px", padding: "8px" }}><FiAlertTriangle /></div>
          </div>
          <span style={{ fontSize: "28px", fontWeight: "800", color: stats.expiredCount > 0 ? "#ef4444" : "#1e293b" }}>{stats.expiredCount}</span>
        </div>

        {/* Expiring Soon (30d) */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Expiring (30 days)</span>
            <div style={{ background: "#fffbeb", color: "#d97706", borderRadius: "8px", padding: "8px" }}><FiClock /></div>
          </div>
          <span style={{ fontSize: "28px", fontWeight: "800", color: stats.expiringSoon30Count > 0 ? "#d97706" : "#1e293b" }}>{stats.expiringSoon30Count}</span>
        </div>

        {/* Low Stock Medicines */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Low Stock Alerts</span>
            <div style={{ background: "#fff1f2", color: "#f43f5e", borderRadius: "8px", padding: "8px" }}><FiPackage /></div>
          </div>
          <span style={{ fontSize: "28px", fontWeight: "800", color: stats.lowStockCount > 0 ? "#f43f5e" : "#1e293b" }}>{stats.lowStockCount}</span>
        </div>

      </div>

      {/* DETAILED TABLES */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
        
        {/* Expired Batches Details */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 16px 0", color: "#ef4444", fontSize: "16px", fontWeight: "700" }}>Critical Expirations</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9", textAlign: "left", fontSize: "11px", color: "#64748b" }}>
                  <th style={{ padding: "8px" }}>BATCH NO</th>
                  <th style={{ padding: "8px" }}>MEDICINE NAME</th>
                  <th style={{ padding: "8px" }}>EXPIRY DATE</th>
                  <th style={{ padding: "8px" }}>QTY</th>
                </tr>
              </thead>
              <tbody>
                {stats.expiredBatches.map(b => (
                  <tr key={b.id} style={{ borderBottom: "1px solid #f8fafc", fontSize: "13px" }}>
                    <td style={{ padding: "8px", fontWeight: "700" }}>{b.batchNumber}</td>
                    <td style={{ padding: "8px" }}>
                      {b.medicine?.product?.name || b.medicine?.genericName}
                      {b.isMock && <span style={{ marginLeft: "6px", fontSize: "10px", color: "#94a3b8" }}>(Sample)</span>}
                    </td>
                    <td style={{ padding: "8px", color: "#ef4444", fontWeight: "600" }}>{new Date(b.expiryDate).toLocaleDateString()}</td>
                    <td style={{ padding: "8px" }}>{b.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 16px 0", color: "#d97706", fontSize: "16px", fontWeight: "700" }}>Low Stock/Shortage Warnings</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9", textAlign: "left", fontSize: "11px", color: "#64748b" }}>
                  <th style={{ padding: "8px" }}>BATCH NO</th>
                  <th style={{ padding: "8px" }}>MEDICINE NAME</th>
                  <th style={{ padding: "8px" }}>GENERIC NAME</th>
                  <th style={{ padding: "8px" }}>STOCK LEVEL</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockBatches.map(b => (
                  <tr key={b.id} style={{ borderBottom: "1px solid #f8fafc", fontSize: "13px" }}>
                    <td style={{ padding: "8px", fontWeight: "700" }}>{b.batchNumber}</td>
                    <td style={{ padding: "8px" }}>
                      {b.medicine?.product?.name || "Generic Drug"}
                      {b.isMock && <span style={{ marginLeft: "6px", fontSize: "10px", color: "#94a3b8" }}>(Sample)</span>}
                    </td>
                    <td style={{ padding: "8px", color: "#475569" }}>{b.medicine?.genericName}</td>
                    <td style={{ padding: "8px", color: "#ef4444", fontWeight: "700" }}>{b.quantity} units</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
