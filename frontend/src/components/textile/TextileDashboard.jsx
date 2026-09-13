"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FiLayers,
  FiCpu,
  FiCheckCircle,
  FiShoppingBag,
  FiTrendingUp,
  FiAlertCircle,
  FiPlus,
  FiActivity,
  FiTruck,
  FiRefreshCw,
  FiAlertTriangle,
  FiClock,
  FiSliders,
} from "react-icons/fi";
import apiClient from "@/services/apiClient";
import socketService from "@/services/socketService";
import { useCompany } from "@/context/CompanyContext";

export default function TextileDashboard() {
  const { company, industryCode } = useCompany();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const res = await apiClient.get("/textile/dashboard");
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      } else {
        throw new Error(res.data?.message || "Invalid dashboard response structure");
      }
    } catch (err) {
      console.error("Error fetching textile dashboard:", err);
      // Fallback: load from tenant storage / DB fallback
      try {
        const storedRaw = JSON.parse(localStorage.getItem("textile_raw_materials") || "[]");
        const storedBatches = JSON.parse(localStorage.getItem("textile_production_batches") || "[]");
        const storedQC = JSON.parse(localStorage.getItem("textile_qc_inspections") || "[]");

        const totalRaw = storedRaw.reduce((sum, item) => sum + (Number(item.stock) || Number(item.quantity) || 0), 0);
        const lowStock = storedRaw.filter((item) => (Number(item.stock) || 0) <= (Number(item.reorderLevel) || 500)).length;
        const yarnStock = storedRaw.filter((i) => (i.category || "").toLowerCase().includes("yarn") || (i.name || "").toLowerCase().includes("yarn")).reduce((s, i) => s + (Number(i.stock) || 0), 0);
        const dyeStock = storedRaw.filter((i) => (i.category || "").toLowerCase().includes("dye") || (i.category || "").toLowerCase().includes("chem")).reduce((s, i) => s + (Number(i.stock) || 0), 0);

        const activeBatches = storedBatches.filter((b) => b.status !== "COMPLETED" && (b.progress || 0) < 100);
        const spinning = activeBatches.filter((b) => (b.stage || b.currentStage || "").toLowerCase().includes("spin") || b.currentStageIndex === 0).length;
        const weaving = activeBatches.filter((b) => (b.stage || b.currentStage || "").toLowerCase().includes("weav") || b.currentStageIndex === 1).length;
        const dyeing = activeBatches.filter((b) => (b.stage || b.currentStage || "").toLowerCase().includes("dye") || b.currentStageIndex === 2).length;
        const printing = activeBatches.filter((b) => (b.stage || b.currentStage || "").toLowerCase().includes("print") || b.currentStageIndex === 3).length;
        const qc = activeBatches.filter((b) => (b.stage || b.currentStage || "").toLowerCase().includes("qc") || b.currentStageIndex === 4).length;

        const passedQC = storedQC.filter((q) => q.status === "PASSED" || q.result === "PASS" || q.grade === "Grade A").length;
        const failedQC = storedQC.filter((q) => q.status === "REJECTED" || q.result === "FAIL" || q.grade === "Reject").length;
        const totalQC = passedQC + failedQC;
        const passRate = totalQC > 0 ? Number(((passedQC / totalQC) * 100).toFixed(1)) : 0;

        const completedBatches = storedBatches.filter((b) => b.status === "COMPLETED" || (b.progress || 0) >= 100);
        const finishedMeters = completedBatches.reduce((s, b) => s + (Number(b.completedQty) || Number(b.targetQty) || Number(b.targetMeters) || 0), 0);

        setData({
          rawMaterials: {
            totalQuantity: totalRaw,
            unit: "KG",
            yarnStock,
            dyeStock,
            lowStockCount: lowStock,
            unitBreakdown: [{ unit: "KG", quantity: totalRaw }],
          },
          activeBatches: {
            total: activeBatches.length,
            spinning,
            weaving,
            dyeing,
            printing,
            qc,
            stageSummary: `${spinning} Spinning, ${weaving} Weaving, ${dyeing} Dyeing, ${qc} QC`,
          },
          qualityControl: {
            passRate,
            hasQcData: totalQC > 0,
            passed: passedQC,
            failed: failedQC,
            pending: storedQC.filter((q) => q.status === "PENDING").length,
            totalCompleted: totalQC,
          },
          finishedFabrics: {
            totalQuantity: finishedMeters,
            unit: "Meters",
            productCount: completedBatches.length,
          },
          pipeline: [
            { stage: "1. Yarn Spinning", activeBatches: spinning, countLabel: `${spinning} Batches`, status: spinning > 0 ? "Active" : "Idle", bg: "#f0fdf4", color: "#166534" },
            { stage: "2. Loom Weaving", activeBatches: weaving, countLabel: `${weaving} Batches`, status: weaving > 0 ? "Active" : "Idle", bg: "#eff6ff", color: "#1e40af" },
            { stage: "3. Dyeing & Washing", activeBatches: dyeing, countLabel: `${dyeing} Batches`, status: dyeing > 0 ? "Active" : "Idle", bg: "#fdf4ff", color: "#86198f" },
            { stage: "4. Printing & Finish", activeBatches: printing, countLabel: `${printing} Batches`, status: printing > 0 ? "Active" : "Idle", bg: "#fff7ed", color: "#c2410c" },
            { stage: "5. QC Inspection", activeBatches: qc, countLabel: `${qc} Batches`, status: qc > 0 ? "Inspecting" : "Idle", bg: "#ecfdf5", color: "#047857" },
            { stage: "6. Finished Stock", activeBatches: completedBatches.length, countLabel: `${(finishedMeters || 0).toLocaleString()} Meters`, status: finishedMeters > 0 ? "Ready" : "Empty", bg: "#f8fafc", color: "#334155" },
          ],
          ongoingOrders: activeBatches.map((b) => ({
            id: b.id,
            batchId: b.id,
            fabricType: b.fabricType || b.material || b.batchName || "Fabric Roll",
            currentStage: b.stage || b.currentStage || "1. Yarn Spinning",
            targetOutput: Number(b.targetOutput || b.targetMeters || b.targetQty || 0),
            completedQty: Number(b.completedQty || 0),
            unit: b.unit || "Meters",
            progress: Number(b.progress || 0),
            status: b.status || "IN_PROGRESS",
          })),
        });
      } catch (fallbackErr) {
        setError(err.response?.data?.message || err.message || "Failed to load dashboard data.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Setup real-time websocket listener
    const unsubscribeUpdated = socketService.on("textile.dashboard.updated", () => {
      fetchDashboardData(true);
    });
    const unsubscribeGlobal = socketService.on("dashboard.updated", () => {
      fetchDashboardData(true);
    });

    // Background polling fallback every 8 seconds
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 8000);

    return () => {
      if (unsubscribeUpdated) unsubscribeUpdated();
      if (unsubscribeGlobal) unsubscribeGlobal();
      clearInterval(interval);
    };
  }, [fetchDashboardData, company?.id]);

  const raw = data?.rawMaterials || { totalQuantity: 0, unit: "KG", yarnStock: 0, dyeStock: 0, lowStockCount: 0 };
  const activeBatches = data?.activeBatches || { total: 0, stageSummary: "0 Spinning, 0 Weaving, 0 Dyeing, 0 QC" };
  const qc = data?.qualityControl || { passRate: 0, hasQcData: false, passed: 0, failed: 0, pending: 0, totalCompleted: 0 };
  const finished = data?.finishedFabrics || { totalQuantity: 0, unit: "Meters", productCount: 0 };
  const pipeline = data?.pipeline || [];
  const ongoingOrders = data?.ongoingOrders || [];

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", maxWidth: "1400px", margin: "0 auto" }}>
      {/* HEADER SECTION */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "#0f172a",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            🧵 Textile & Production Overview
            {refreshing && <FiRefreshCw className="animate-spin" size={16} style={{ color: "#0d9488" }} />}
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>
            Real-time tracking for raw materials, yarn spinning, weaving batches, dyeing, and quality control.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link
            href="/textile/production"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
              color: "#ffffff",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "700",
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(13, 148, 136, 0.25)",
            }}
          >
            <FiPlus size={16} /> New Production Order
          </Link>
          <Link
            href="/textile/quality-control"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              background: "#f1f5f9",
              color: "#334155",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              textDecoration: "none",
              border: "1px solid #cbd5e1",
            }}
          >
            <FiCheckCircle size={16} style={{ color: "#10b981" }} /> Log QC Inspection
          </Link>
        </div>
      </div>

      {/* ERROR BANNER IF ANY */}
      {error && (
        <div
          style={{
            padding: "14px 18px",
            background: "#fee2e2",
            color: "#b91c1c",
            borderRadius: "10px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "14px",
            border: "1px solid #fecaca",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FiAlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchDashboardData()}
            style={{
              background: "#b91c1c",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "18px",
          marginBottom: "28px",
        }}
      >
        {/* CARD 1: RAW MATERIALS STOCK */}
        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
              Raw Materials Stock
            </span>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "#ccfbf1",
                color: "#0f766e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiLayers size={22} />
            </div>
          </div>

          {loading && !data ? (
            <div style={{ height: "34px", background: "#f1f5f9", borderRadius: "6px", margin: "12px 0 4px 0" }} />
          ) : (
            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "12px 0 4px 0" }}>
              {raw.totalQuantity > 0 ? (
                <>
                  {(raw.totalQuantity || 0).toLocaleString()}{" "}
                  <span style={{ fontSize: "15px", color: "#64748b", fontWeight: "500" }}>{raw.unit}</span>
                </>
              ) : (
                <span style={{ color: "#94a3b8", fontSize: "22px" }}>0 {raw.unit}</span>
              )}
            </h2>
          )}

          <div style={{ fontSize: "12px", color: "#0f766e", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
            <FiTrendingUp /> Real-time Yarn & Dye Inventory
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
            {raw.yarnStock > 0 || raw.dyeStock > 0 ? (
              <span>
                {(raw.yarnStock || 0).toLocaleString()} KG Yarn • {(raw.dyeStock || 0).toLocaleString()} KG Dyes & Chem
              </span>
            ) : raw.lowStockCount > 0 ? (
              <span style={{ color: "#b91c1c", fontWeight: "600" }}>⚠️ {raw.lowStockCount} item(s) below reorder level</span>
            ) : (
              <span>No raw material inventory available</span>
            )}
          </div>
        </div>

        {/* CARD 2: ACTIVE BATCHES */}
        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
              Active Batches
            </span>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "#e0e7ff",
                color: "#4338ca",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiCpu size={22} />
            </div>
          </div>

          {loading && !data ? (
            <div style={{ height: "34px", background: "#f1f5f9", borderRadius: "6px", margin: "12px 0 4px 0" }} />
          ) : (
            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "12px 0 4px 0" }}>
              {activeBatches.total}{" "}
              <span style={{ fontSize: "15px", color: "#64748b", fontWeight: "500" }}>Orders</span>
            </h2>
          )}

          <div style={{ fontSize: "12px", color: "#6366f1", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
            <FiActivity /> Stage Breakdown
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
            {activeBatches.total > 0 ? (
              <span>{activeBatches.stageSummary}</span>
            ) : (
              <span>No active production batches</span>
            )}
          </div>
        </div>

        {/* CARD 3: QUALITY PASS RATE */}
        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
              Quality Pass Rate
            </span>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "#d1fae5",
                color: "#047857",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiCheckCircle size={22} />
            </div>
          </div>

          {loading && !data ? (
            <div style={{ height: "34px", background: "#f1f5f9", borderRadius: "6px", margin: "12px 0 4px 0" }} />
          ) : (
            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "12px 0 4px 0" }}>
              {qc.hasQcData ? `${qc.passRate}%` : <span style={{ color: "#94a3b8", fontSize: "20px" }}>No QC Data</span>}
            </h2>
          )}

          <div style={{ fontSize: "12px", color: "#10b981", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
            <FiCheckCircle /> Inspection Results
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
            {qc.hasQcData ? (
              <span>
                {qc.passed} Passed • {qc.failed} Failed ({qc.totalCompleted} Total)
              </span>
            ) : (
              <span>No completed QC inspections logged</span>
            )}
          </div>
        </div>

        {/* CARD 4: FINISHED FABRICS */}
        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
              Finished Fabrics
            </span>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "#fef3c7",
                color: "#b45309",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiShoppingBag size={22} />
            </div>
          </div>

          {loading && !data ? (
            <div style={{ height: "34px", background: "#f1f5f9", borderRadius: "6px", margin: "12px 0 4px 0" }} />
          ) : (
            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "12px 0 4px 0" }}>
              {finished.totalQuantity > 0 ? (
                <>
                  {finished.totalQuantity.toLocaleString()}{" "}
                  <span style={{ fontSize: "15px", color: "#64748b", fontWeight: "500" }}>{finished.unit}</span>
                </>
              ) : (
                <span style={{ color: "#94a3b8", fontSize: "22px" }}>0 {finished.unit}</span>
              )}
            </h2>
          )}

          <div style={{ fontSize: "12px", color: "#d97706", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
            <FiTruck /> Ready Stock Output
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
            {finished.productCount > 0 ? (
              <span>({finished.productCount} Finished Products Available)</span>
            ) : (
              <span>No finished fabric inventory available</span>
            )}
          </div>
        </div>
      </div>

      {/* STAGE WORKFLOW PIPELINE VISUALIZATION */}
      <div
        style={{
          background: "#ffffff",
          padding: "24px",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          marginBottom: "28px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
            ⚙️ Textile Production Pipeline Stages
          </h3>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Live Manufacturing Flow</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
          {pipeline.map((s, idx) => (
            <div
              key={idx}
              style={{
                background: s.bg || "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "14px",
                transition: "transform 0.2s ease",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: "700", color: s.color || "#1e293b", marginBottom: "4px" }}>
                {s.stage}
              </div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{s.countLabel}</div>
              <div
                style={{
                  fontSize: "11px",
                  color: s.status === "Active" ? "#047857" : s.status === "Inspecting" ? "#0f766e" : s.status === "Attention Required" ? "#b91c1c" : "#64748b",
                  marginTop: "4px",
                  fontWeight: "700",
                }}
              >
                Status: {s.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT BATCHES TABLE */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
            🏭 Ongoing Production Orders & Batch Progress
          </h3>
          <Link
            href="/textile/production"
            style={{ fontSize: "13px", fontWeight: "700", color: "#0d9488", textDecoration: "none" }}
          >
            View All Production Orders →
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Batch ID</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Fabric / Yarn Type</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Current Stage</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Target Output</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Completion Progress</th>
              </tr>
            </thead>
            <tbody>
              {ongoingOrders.length > 0 ? (
                ongoingOrders.map((b) => (
                  <tr key={b.id || b.batchId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 20px", fontWeight: "700", color: "#0d9488" }}>{b.batchId || b.id}</td>
                    <td style={{ padding: "16px 20px", fontWeight: "600", color: "#0f172a" }}>{b.fabricType || b.material}</td>
                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "700",
                          background:
                            b.status === "COMPLETED"
                              ? "#d1fae5"
                              : b.status === "QUALITY_CHECK"
                              ? "#fef3c7"
                              : "#e0e7ff",
                          color:
                            b.status === "COMPLETED"
                              ? "#047857"
                              : b.status === "QUALITY_CHECK"
                              ? "#b45309"
                              : "#4338ca",
                        }}
                      >
                        {b.currentStage || b.stage || b.status}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px", fontWeight: "600", color: "#334155" }}>
                      {Number(b.completedQty || 0).toLocaleString()} / {Number(b.targetOutput || b.targetQty || 0).toLocaleString()} {b.unit || "Meters"}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            flex: 1,
                            height: "8px",
                            background: "#e2e8f0",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(b.progress || 0, 100)}%`,
                              height: "100%",
                              background: b.progress === 100 ? "#10b981" : "#0d9488",
                              borderRadius: "4px",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569", width: "35px" }}>
                          {b.progress || 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: "36px 20px", textAlign: "center", color: "#94a3b8" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <FiClock size={28} style={{ color: "#cbd5e1" }} />
                      <div style={{ fontSize: "15px", fontWeight: "600", color: "#475569" }}>
                        No ongoing production orders found.
                      </div>
                      <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                        Click &quot;New Production Order&quot; to start a new batch.
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
