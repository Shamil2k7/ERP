"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { showConfirm } from "@/utils/swal";
import {
  FiAward,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCheck,
  FiX,
  FiDollarSign,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";

export default function MembershipPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    duration: 1,
    durationType: "MONTHS",
    price: 50,
    joiningFee: 10,
    description: "",
    benefits: "Full gym access, Free locker, 1 Personal trainer session",
    status: "ACTIVE",
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setPlans(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load plans", err);
      toast.error("Failed to load Membership Plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      duration: 1,
      durationType: "MONTHS",
      price: 50,
      joiningFee: 10,
      description: "",
      benefits: "Full gym access, Free locker, 1 Personal trainer session",
      status: "ACTIVE",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPlan(p);
    setFormData({
      name: p.name || "",
      duration: p.duration || 1,
      durationType: p.durationType || "MONTHS",
      price: p.price || 0,
      joiningFee: p.joiningFee || 0,
      description: p.description || "",
      benefits: typeof p.benefits === "string" ? p.benefits : JSON.stringify(p.benefits || ""),
      status: p.status || "ACTIVE",
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price < 0) {
      toast.error("Plan Name and valid Price are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      if (editingPlan) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/plans/${editingPlan.id}`,
          formData,
          { headers }
        );
        toast.success("Plan updated");
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/plans`, formData, { headers });
        toast.success("Plan created successfully");
      }

      setShowModal(false);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save plan");
    }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await showConfirm({
      title: "Delete Membership Plan?",
      text: `Are you sure you want to delete membership plan "${name}"?`,
      confirmButtonText: "Yes, Delete",
      icon: "warning",
    });
    if (!isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/plans/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Plan deleted");
      fetchPlans();
    } catch (err) {
      toast.error("Failed to delete plan");
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
      <Toaster position="top-right" />

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <FiAward style={{ color: "#ec4899" }} /> Membership Plans
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
            Build custom monthly, quarterly, or annual plans for your gym members.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 20px",
            background: "#4f46e5",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
          }}
        >
          <FiPlus size={18} /> Create Custom Plan
        </button>
      </div>

      {/* PLANS CARDS GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
        {loading ? (
          <div style={{ padding: "32px", color: "#64748b" }}>Loading Membership Plans...</div>
        ) : plans.length > 0 ? (
          plans.map((p) => (
            <div
              key={p.id}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid #f1f5f9",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>{p.name}</h3>
                  <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", background: p.status === "ACTIVE" ? "#d1fae5" : "#fee2e2", color: p.status === "ACTIVE" ? "#047857" : "#b91c1c" }}>
                    {p.status}
                  </span>
                </div>

                <div style={{ fontSize: "32px", fontWeight: "800", color: "#4f46e5", margin: "16px 0 8px 0" }}>
                  ${p.price} <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>/ {p.duration} {p.durationType?.toLowerCase()}</span>
                </div>

                {Number(p.joiningFee || 0) > 0 && (
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
                    + ${p.joiningFee} One-time Joining Fee
                  </div>
                )}

                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px", marginTop: "14px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Key Plan Benefits</span>
                  <div style={{ marginTop: "8px", fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>
                    {typeof p.benefits === "string" ? p.benefits : "Full gym access & locker access"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #f8fafc" }}>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>
                  {p._count?.members || 0} Subscribed Members
                </span>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => handleOpenEdit(p)} style={{ padding: "6px 10px", background: "#f1f5f9", border: "none", borderRadius: "6px", cursor: "pointer", color: "#334155" }}>
                    <FiEdit />
                  </button>
                  <button onClick={() => handleDelete(p.id, p.name)} style={{ padding: "6px 10px", background: "#fee2e2", border: "none", borderRadius: "6px", cursor: "pointer", color: "#ef4444" }}>
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: "32px", color: "#94a3b8" }}>No membership plans created yet.</div>
        )}
      </div>

      {/* CREATE / EDIT PLAN MODAL */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "550px", padding: "28px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                {editingPlan ? "Edit Membership Plan" : "Create New Plan"}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Plan Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Fitness Plan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Duration *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Duration Type</label>
                  <select
                    value={formData.durationType}
                    onChange={(e) => setFormData({ ...formData, durationType: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                  >
                    <option value="DAYS">Days</option>
                    <option value="MONTHS">Months</option>
                    <option value="YEARS">Years</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Price ($) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Joining Fee ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.joiningFee}
                    onChange={(e) => setFormData({ ...formData, joiningFee: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Benefits & Features</label>
                <textarea
                  rows="3"
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="Comma separated benefits..."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "10px 18px", background: "#f1f5f9", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "10px 24px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
