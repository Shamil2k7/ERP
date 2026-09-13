"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiCheckCircle,
  FiPlus,
  FiSearch,
  FiAlertOctagon,
  FiAward,
  FiX,
  FiCheck,
  FiTrash2,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import apiClient from "@/services/apiClient";
import { useCompany } from "@/context/CompanyContext";

export default function QualityControlPage() {
  const router = useRouter();
  const { user, isModuleEnabled, loading: companyLoading } = useCompany();

  const [inspections, setInspections] = useState([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!companyLoading && user && !isModuleEnabled("QUALITY_CONTROL")) {
      router.replace("/unauthorized");
    }
  }, [user, companyLoading, isModuleEnabled, router]);
  const [formData, setFormData] = useState({
    batchId: "",
    fabricName: "",
    inspectedMeters: "",
    passedMeters: "",
    defectMeters: "",
    defectType: "Minor Stain",
    grade: "Grade A",
    inspector: "",
  });

  useEffect(() => {
    async function loadInspections() {
      try {
        const res = await apiClient.get("/textile/quality-control");
        if (res.data?.success && Array.isArray(res.data.data)) {
          setInspections(res.data.data);
          localStorage.setItem("textile_qc_inspections", JSON.stringify(res.data.data));
          return;
        }
      } catch (err) {
        console.warn("Backend QC fetch fallback to localStorage:", err);
      }
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("textile_qc_inspections");
        if (stored) {
          setInspections(JSON.parse(stored));
        }
      }
    }
    loadInspections();
  }, []);

  const saveInspections = async (newInspections) => {
    setInspections(newInspections);
    if (typeof window !== "undefined") {
      localStorage.setItem("textile_qc_inspections", JSON.stringify(newInspections));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddInspection = async (e) => {
    e.preventDefault();
    if (!formData.batchId || !formData.inspectedMeters) {
      toast.error("Please enter batch ID and inspected quantity");
      return;
    }

    const payload = {
      batchId: formData.batchId,
      fabricName: formData.fabricName || "Textile Fabric Roll",
      inspectedMeters: Number(formData.inspectedMeters),
      passedMeters: Number(formData.passedMeters) || Number(formData.inspectedMeters),
      defectMeters: Number(formData.defectMeters) || 0,
      defectType: formData.defectType,
      grade: formData.grade,
      inspector: formData.inspector || "Quality Inspector",
      date: new Date().toISOString().split("T")[0],
      status: formData.grade === "Reject" ? "REJECTED" : formData.grade === "Grade B" ? "PASSED_WITH_DEFECTS" : "PASSED",
      result: formData.grade === "Reject" ? "FAIL" : "PASS",
    };

    try {
      const res = await apiClient.post("/textile/quality-control", payload);
      if (res.data?.success && res.data?.data) {
        saveInspections([res.data.data, ...inspections]);
      } else {
        const newQc = {
          id: `QC-${Math.floor(904 + Math.random() * 100)}`,
          ...payload,
        };
        saveInspections([newQc, ...inspections]);
      }
    } catch (err) {
      const newQc = {
        id: `QC-${Math.floor(904 + Math.random() * 100)}`,
        ...payload,
      };
      saveInspections([newQc, ...inspections]);
    }

    toast.success(`QC Inspection logged for batch ${formData.batchId}!`);
    setShowAddModal(false);
    setFormData({
      batchId: "",
      fabricName: "",
      inspectedMeters: "",
      passedMeters: "",
      defectMeters: "",
      defectType: "Minor Stain",
      grade: "Grade A",
      inspector: "",
    });
  };

  const handleDeleteInspection = async (id) => {
    try {
      await apiClient.delete(`/textile/quality-control/${id}`);
    } catch (err) {
      console.warn("Delete QC record API fallback:", err);
    }
    const updated = inspections.filter((i) => i.id !== id);
    saveInspections(updated);
    toast.success("QC Inspection record deleted.");
  };

  const filtered = inspections.filter(
    (q) =>
      q.batchId.toLowerCase().includes(search.toLowerCase()) ||
      q.fabricName.toLowerCase().includes(search.toLowerCase()) ||
      q.inspector.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif" }}>
      <Toaster position="top-right" />

      {/* HEADER */}
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
            <FiCheckCircle style={{ color: "#10b981" }} /> Textile Quality Control & Defect Logs
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>
            Inspect fabric rolls, categorize defects (color bleed, yarn slub, shrinkage), and assign Grade A/B/Reject ratings.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
          }}
        >
          <FiPlus size={16} /> Log QC Inspection
        </button>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", uppercase: true }}>PASS RATE</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#10b981", margin: "6px 0" }}>95.2%</div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>Grade A Output</div>
        </div>
        <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", uppercase: true }}>TOTAL INSPECTED</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "6px 0" }}>1,900 Meters</div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>Across 3 Batches</div>
        </div>
        <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", uppercase: true }}>REJECTED QUANTITY</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#ef4444", margin: "6px 0" }}>270 Meters</div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>Yarn Slubs & Stains</div>
        </div>
      </div>

      {/* SEARCH */}
      <div
        style={{
          background: "#ffffff",
          padding: "16px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <FiSearch style={{ color: "#64748b" }} />
        <input
          type="text"
          placeholder="Search inspection code, batch ID, or inspector..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: "14px" }}
        />
      </div>

      {/* TABLE */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>QC ID</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Batch ID</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Fabric Product</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Passed / Inspected</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Primary Defect</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Quality Grade</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Inspector</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px 20px", fontWeight: "700", color: "#10b981" }}>{q.id}</td>
                  <td style={{ padding: "16px 20px", fontWeight: "700", color: "#0d9488" }}>{q.batchId}</td>
                  <td style={{ padding: "16px 20px", fontWeight: "600", color: "#0f172a" }}>{q.fabricName}</td>
                  <td style={{ padding: "16px 20px", fontWeight: "700", color: "#334155" }}>
                    {q.passedMeters} / {q.inspectedMeters} Meters
                  </td>
                  <td style={{ padding: "16px 20px", color: q.defectMeters > 0 ? "#b45309" : "#64748b" }}>
                    {q.defectMeters > 0 ? `${q.defectType} (${q.defectMeters}m)` : "None"}
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "700",
                        background:
                          q.grade === "Grade A"
                            ? "#d1fae5"
                            : q.grade === "Grade B"
                            ? "#fef3c7"
                            : "#fee2e2",
                        color:
                          q.grade === "Grade A"
                            ? "#047857"
                            : q.grade === "Grade B"
                            ? "#b45309"
                            : "#dc2626",
                      }}
                    >
                      {q.grade}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px", color: "#475569" }}>{q.inspector}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                🔍 Log Quality Control Inspection
              </h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleAddInspection}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Batch ID *
                  </label>
                  <input
                    type="text"
                    name="batchId"
                    value={formData.batchId}
                    onChange={handleInputChange}
                    placeholder="BATCH-2026-081"
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Quality Grade
                  </label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Grade B">Grade B (Seconds)</option>
                    <option value="Reject">Reject (Scrap)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Inspected (Meters) *
                  </label>
                  <input
                    type="number"
                    name="inspectedMeters"
                    value={formData.inspectedMeters}
                    onChange={handleInputChange}
                    placeholder="1000"
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Defect (Meters)
                  </label>
                  <input
                    type="number"
                    name="defectMeters"
                    value={formData.defectMeters}
                    onChange={handleInputChange}
                    placeholder="20"
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Primary Defect Type
                </label>
                <select
                  name="defectType"
                  value={formData.defectType}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                >
                  <option value="Color Bleed & Stain">Color Bleed & Stain</option>
                  <option value="Weave Distortion">Weave Distortion</option>
                  <option value="Yarn Slub & Holes">Yarn Slub & Holes</option>
                  <option value="Shrinkage Fault">Shrinkage Fault</option>
                  <option value="None">None (Perfect)</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Inspector Name
                </label>
                <input
                  type="text"
                  name="inspector"
                  value={formData.inspector}
                  onChange={handleInputChange}
                  placeholder="e.g. Sunil Kumar"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", fontWeight: "600" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    fontWeight: "700",
                  }}
                >
                  Save QC Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
