"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { showConfirm } from "@/utils/swal";
import {
  FiUserCheck,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiPhone,
  FiMail,
  FiAward,
  FiX,
  FiDollarSign,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import { sanitizePhoneInput, getPhoneValidationError, isValidPhoneNumber } from "@/utils/validation";

export default function GymTrainers() {

  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    specialization: "Bodybuilding & Weight Training",
    experience: 3,
    salary: 1500,
    status: "ACTIVE",
  });

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/trainers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setTrainers(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch trainers", err);
      toast.error("Failed to load Gym Trainers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const handleOpenAdd = () => {
    setEditingTrainer(null);
    setFormData({
      fullName: "",
      phone: "",
      email: "",
      specialization: "Bodybuilding & Weight Training",
      experience: 3,
      salary: 1500,
      status: "ACTIVE",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTrainer(t);
    setFormData({
      fullName: t.fullName || "",
      phone: t.phone || "",
      email: t.email || "",
      specialization: t.specialization || "",
      experience: t.experience || 0,
      salary: t.salary || 0,
      status: t.status || "ACTIVE",
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error("Trainer name is required");
      return;
    }
    if (!isValidPhoneNumber(formData.phone, true)) {
      toast.error("Phone number must contain exactly 10 digits");
      return;
    }


    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      if (editingTrainer) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/trainers/${editingTrainer.id}`,
          formData,
          { headers }
        );
        toast.success("Trainer details updated");
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/trainers`, formData, { headers });
        toast.success("Trainer profile created");
      }

      setShowModal(false);
      fetchTrainers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save trainer");
    }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await showConfirm({
      title: "Delete Trainer Profile?",
      text: `Are you sure you want to delete trainer profile for "${name}"?`,
      confirmButtonText: "Yes, Delete",
      icon: "warning",
    });
    if (!isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/trainers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Trainer deleted");
      fetchTrainers();
    } catch (err) {
      toast.error("Failed to delete trainer");
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
      <Toaster position="top-right" />

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <FiUserCheck style={{ color: "#ec4899" }} /> Gym Trainers Directory
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
            Manage trainer profiles, specializations, experience levels, and member assignments.
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
          <FiPlus size={18} /> Add New Trainer
        </button>
      </div>

      {/* TRAINERS GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
        {loading ? (
          <div style={{ padding: "32px", color: "#64748b" }}>Loading Gym Trainers...</div>
        ) : trainers.length > 0 ? (
          trainers.map((t) => (
            <div
              key={t.id}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid #f1f5f9",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>{t.fullName}</h3>
                    <span style={{ fontSize: "12px", color: "#ec4899", fontWeight: "700" }}>{t.trainerId}</span>
                  </div>
                  <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", background: t.status === "ACTIVE" ? "#d1fae5" : "#fee2e2", color: t.status === "ACTIVE" ? "#047857" : "#b91c1c" }}>
                    {t.status}
                  </span>
                </div>

                <div style={{ margin: "16px 0", padding: "12px", background: "#f8fafc", borderRadius: "10px" }}>
                  <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>SPECIALIZATION</div>
                  <div style={{ fontSize: "14px", color: "#0f172a", fontWeight: "700", marginTop: "2px" }}>
                    {t.specialization || "Fitness & Bodybuilding"}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#334155" }}>
                  <div><FiPhone size={12} style={{ color: "#64748b" }} /> {t.phone}</div>
                  {t.email && <div><FiMail size={12} style={{ color: "#64748b" }} /> {t.email}</div>}
                  <div><FiAward size={12} style={{ color: "#64748b" }} /> {t.experience || 0} Years Experience</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", paddingTop: "14px", borderTop: "1px solid #f8fafc" }}>
                <span style={{ padding: "4px 10px", background: "#fce7f3", color: "#be185d", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>
                  {t.assignedMembers?.length || 0} Assigned Members
                </span>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => handleOpenEdit(t)} style={{ padding: "6px 10px", background: "#f1f5f9", border: "none", borderRadius: "6px", cursor: "pointer", color: "#334155" }}>
                    <FiEdit />
                  </button>
                  <button onClick={() => handleDelete(t.id, t.fullName)} style={{ padding: "6px 10px", background: "#fee2e2", border: "none", borderRadius: "6px", cursor: "pointer", color: "#ef4444" }}>
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: "32px", color: "#94a3b8" }}>No trainers added yet.</div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "550px", padding: "28px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                {editingTrainer ? "Edit Trainer Profile" : "Add New Trainer"}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Trainer Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Phone Number *</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    placeholder="10-digit Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: sanitizePhoneInput(e.target.value) })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                  />
                  {formData.phone && getPhoneValidationError(formData.phone, false) && (
                    <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      ⚠ {getPhoneValidationError(formData.phone, false)}
                    </span>
                  )}
                </div>


                <div>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. Weight Training, Yoga, CrossFit"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Salary ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "10px 18px", background: "#f1f5f9", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "10px 24px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>
                  Save Trainer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
