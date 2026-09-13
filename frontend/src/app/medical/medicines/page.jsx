"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { medicalService } from "@/services/medicalService";
import { showConfirm } from "@/utils/swal";
import toast, { Toaster } from "react-hot-toast";
import {
  FiPlus,
  FiTrash2,
  FiRefreshCw
} from "react-icons/fi";

export default function MedicinesCatalog() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitData();
  }, []);

  const fetchInitData = async () => {
    try {
      setLoading(true);
      const medRes = await medicalService.getMedicines();
      setMedicines(medRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load medicines registry");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await showConfirm({
      title: "Deregister Medicine?",
      text: "Are you sure you want to deregister this medicine?",
      confirmButtonText: "Yes, Deregister",
      icon: "warning",
    });
    if (!isConfirmed) return;
    try {
      await medicalService.deleteMedicine(id);
      toast.success("Medicine deregistered successfully!");
      fetchInitData();
    } catch (err) {
      toast.error("Failed to delete medicine");
    }
  };

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <Toaster position="top-right" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Medicines Registry</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Register medicines, set clinical categories, and enforce prescription locks.</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button 
            onClick={fetchInitData} 
            style={{ 
              padding: "8px 16px", 
              borderRadius: "8px", 
              border: "1px solid #cbd5e1", 
              background: "#ffffff", 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "8px", 
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              color: "#334155"
            }}
          >
            <FiRefreshCw /> Reload List
          </button>
          <Link 
            href="/medical/medicines/add" 
            style={{ 
              padding: "8px 16px", 
              borderRadius: "8px", 
              border: "none", 
              background: "#10b981", 
              color: "#ffffff", 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "8px", 
              cursor: "pointer", 
              textDecoration: "none",
              fontSize: "14px", 
              fontWeight: "700"
            }}
          >
            <FiPlus /> Add Medicine
          </Link>
        </div>
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
        <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Registered Medicines ({medicines.length})</h3>
        
        {loading ? (
          <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>Loading medicines...</p>
        ) : medicines.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ color: "#64748b", margin: "0 0 16px 0", fontSize: "15px" }}>No medicines registered yet.</p>
            <Link 
              href="/medical/medicines/add" 
              style={{ 
                padding: "10px 20px", 
                borderRadius: "8px", 
                background: "#4f46e5", 
                color: "#ffffff", 
                textDecoration: "none", 
                fontWeight: "600",
                display: "inline-flex",
                fontSize: "14px"
              }}
            >
              + Register First Medicine
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left", fontSize: "12px", color: "#475569", fontWeight: "700" }}>
                  <th style={{ padding: "16px 12px" }}>TRADE/BRAND NAME</th>
                  <th style={{ padding: "16px 12px" }}>GENERIC FORMULA</th>
                  <th style={{ padding: "16px 12px" }}>STRENGTH</th>
                  <th style={{ padding: "16px 12px" }}>DOSAGE FORM</th>
                  <th style={{ padding: "16px 12px" }}>MANUFACTURER</th>
                  <th style={{ padding: "16px 12px" }}>RX LOCK</th>
                  <th style={{ padding: "16px 12px", width: "80px", textAlign: "center" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map(m => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "14px", transition: "background 0.2s" }}>
                    <td style={{ padding: "16px 12px", fontWeight: "700", color: "#0f172a" }}>{m.product?.name || "Generic Drug"}</td>
                    <td style={{ padding: "16px 12px", color: "#334155" }}>{m.genericName}</td>
                    <td style={{ padding: "16px 12px", color: "#475569" }}>{m.strength}</td>
                    <td style={{ padding: "16px 12px", color: "#475569" }}><span style={{ padding: "4px 8px", background: "#f1f5f9", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>{m.dosageForm}</span></td>
                    <td style={{ padding: "16px 12px", color: "#64748b" }}>{m.manufacturer || "N/A"}</td>
                    <td style={{ padding: "16px 12px" }}>
                      {m.prescriptionRequired ? (
                        <span style={{ padding: "4px 8px", background: "#fef2f2", color: "#ef4444", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>PRESCRIPTION REQUIRED</span>
                      ) : (
                        <span style={{ padding: "4px 8px", background: "#f0fdf4", color: "#16a34a", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>OTC (OVER THE COUNTER)</span>
                      )}
                    </td>
                    <td style={{ padding: "16px 12px", textAlign: "center" }}>
                      <button 
                        onClick={() => handleDelete(m.id)} 
                        style={{ 
                          background: "none", 
                          border: "none", 
                          color: "#ef4444", 
                          cursor: "pointer",
                          padding: "6px",
                          borderRadius: "4px",
                          transition: "color 0.2s"
                        }}
                        title="Deregister Medicine"
                      >
                        <FiTrash2 size={16} />
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
