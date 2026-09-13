"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import axios from "axios";
import { showConfirm } from "@/utils/swal";
import {
  FiUsers,
  FiPlus,
  FiSearch,
  FiFilter,
  FiEdit,
  FiTrash2,
  FiEye,
  FiX,
  FiSave,
  FiPhone,
  FiMail,
  FiCalendar,
  FiUserCheck,
  FiAward,
  FiMapPin,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import { sanitizePhoneInput, getPhoneValidationError, isValidPhoneNumber } from "@/utils/validation";

export default function GymMembers() {

  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    gender: "Male",
    dob: "",
    phone: "",
    email: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    membershipPlanId: "",
    assignedTrainerId: "",
    branchId: "",
    startDate: "",
    expiryDate: "",
    status: "ACTIVE",
    notes: "",
  });

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [membersRes, plansRes, trainersRes, branchesRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/members`, { headers }).catch(() => ({ data: { success: true, data: [] } })),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/plans`, { headers }).catch(() => ({ data: { success: true, data: [] } })),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/trainers`, { headers }).catch(() => ({ data: { success: true, data: [] } })),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/branches`, { headers }).catch(() => ({ data: { data: [] } })),
      ]);

      if (membersRes.data.success) setMembers(membersRes.data.data || []);
      if (plansRes.data.success) setPlans(plansRes.data.data || []);
      if (trainersRes.data.success) setTrainers(trainersRes.data.data || []);
      const bList = branchesRes.data?.data || (Array.isArray(branchesRes.data) ? branchesRes.data : []);
      setBranches(bList);
    } catch (err) {
      console.error("Error loading gym data", err);
      toast.error("Failed to load Gym Members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const keyword = search.toLowerCase();
      const nameMatch =
        m.fullName?.toLowerCase().includes(keyword) ||
        m.memberId?.toLowerCase().includes(keyword) ||
        m.phone?.toLowerCase().includes(keyword) ||
        m.email?.toLowerCase().includes(keyword);

      const statusMatch = !statusFilter || m.status === statusFilter;
      const planMatch = !planFilter || m.membershipPlanId === planFilter;

      return nameMatch && statusMatch && planMatch;
    });
  }, [members, search, statusFilter, planFilter]);

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({
      fullName: "",
      gender: "Male",
      dob: "",
      phone: "",
      email: "",
      address: "",
      emergencyContact: "",
      emergencyPhone: "",
      membershipPlanId: plans[0]?.id || "",
      assignedTrainerId: "",
      branchId: branches[0]?.id || "",
      startDate: new Date().toISOString().split("T")[0],
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "ACTIVE",
      notes: "",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (member) => {
    setEditingMember(member);
    setFormData({
      fullName: member.fullName || "",
      gender: member.gender || "Male",
      dob: member.dob ? new Date(member.dob).toISOString().split("T")[0] : "",
      phone: member.phone || "",
      email: member.email || "",
      address: member.address || "",
      emergencyContact: member.emergencyContact || "",
      emergencyPhone: member.emergencyPhone || "",
      membershipPlanId: member.membershipPlanId || "",
      assignedTrainerId: member.assignedTrainerId || "",
      branchId: member.branchId || (branches[0]?.id || ""),
      startDate: member.startDate ? new Date(member.startDate).toISOString().split("T")[0] : "",
      expiryDate: member.expiryDate ? new Date(member.expiryDate).toISOString().split("T")[0] : "",
      status: member.status || "ACTIVE",
      notes: member.notes || "",
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!isValidPhoneNumber(formData.phone, true)) {
      toast.error("Phone number must contain exactly 10 digits");
      return;
    }
    if (formData.emergencyPhone && !isValidPhoneNumber(formData.emergencyPhone, false)) {
      toast.error("Emergency phone number must contain exactly 10 digits");
      return;
    }

    if (!formData.membershipPlanId) {
      toast.error("Membership plan is required");
      return;
    }
    if (!formData.assignedTrainerId) {
      toast.error("Assigned trainer is required");
      return;
    }
    if (!formData.startDate) {
      toast.error("Start date is required");
      return;
    }
    if (!formData.expiryDate) {
      toast.error("Expiry date is required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      if (editingMember) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/members/${editingMember.id}`,
          formData,
          { headers }
        );
        toast.success("Member updated successfully");
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/members`, formData, { headers });
        toast.success("Member created successfully! Login password is their phone number.");
      }

      setShowModal(false);
      fetchInitialData();
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorMsgs = err.response.data.errors.map((e) => e.msg).join(", ");
        toast.error(`Validation Failed: ${errorMsgs}`);
      } else {
        toast.error(err.response?.data?.message || "Failed to save member");
      }
    }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await showConfirm({
      title: "Delete Member?",
      text: `Are you sure you want to delete member "${name}"?`,
      confirmButtonText: "Yes, Delete",
      icon: "warning",
    });
    if (!isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/members/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Member deleted");
      fetchInitialData();
    } catch (err) {
      toast.error("Failed to delete member");
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
      <Toaster position="top-right" />

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <FiUsers style={{ color: "#4f46e5" }} /> Gym Members Directory
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
            Manage gym subscriptions, status badges, emergency contacts, and personal trainer assignments.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link
            href="/gym/branches"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 18px",
              background: "#ffffff",
              color: "#334155",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            <FiMapPin size={16} style={{ color: "#4f46e5" }} />
            <span>+ Add Gym Branch</span>
          </Link>

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
            <FiPlus size={18} /> New Member Registration
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #f1f5f9", display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
        <div style={{ flex: 1, minWidth: "260px", display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <FiSearch style={{ color: "#64748b" }} />
          <input
            type="text"
            placeholder="Search by ID, name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "14px" }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#ffffff", fontSize: "14px", color: "#334155", outline: "none" }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="EXPIRED">Expired</option>
          <option value="FROZEN">Frozen</option>
        </select>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#ffffff", fontSize: "14px", color: "#334155", outline: "none" }}
        >
          <option value="">All Membership Plans</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* MEMBERS TABLE */}
      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left", fontSize: "12px", color: "#64748b" }}>
              <th style={{ padding: "14px 16px" }}>MEMBER DETAILS</th>
              <th style={{ padding: "14px 16px" }}>CONTACT</th>
              <th style={{ padding: "14px 16px" }}>PLAN & DATES</th>
              <th style={{ padding: "14px 16px" }}>TRAINER</th>
              <th style={{ padding: "14px 16px" }}>STATUS</th>
              <th style={{ padding: "14px 16px", textAlign: "right" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                  Loading Gym Members...
                </td>
              </tr>
            ) : filteredMembers.length > 0 ? (
              filteredMembers.map((m) => {
                let statusBg = "#d1fae5";
                let statusColor = "#047857";
                if (m.status === "EXPIRED") { statusBg = "#fee2e2"; statusColor = "#b91c1c"; }
                else if (m.status === "FROZEN") { statusBg = "#cffaff"; statusColor = "#0e7490"; }
                else if (m.status === "INACTIVE") { statusBg = "#f1f5f9"; statusColor = "#64748b"; }

                return (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <strong style={{ fontSize: "15px", color: "#0f172a", display: "block" }}>{m.fullName}</strong>
                      <span style={{ fontSize: "12px", color: "#4f46e5", fontWeight: "600" }}>{m.memberId}</span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: "#334155" }}>
                      <div><FiPhone size={12} style={{ color: "#64748b" }} /> {m.phone}</div>
                      {m.email && <div style={{ color: "#64748b", marginTop: "2px" }}><FiMail size={12} /> {m.email}</div>}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px" }}>
                      <strong style={{ color: "#334155" }}>{m.plan?.name || "No Plan"}</strong>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                        Exp: {m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : "N/A"}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: "#334155" }}>
                      {m.trainer?.fullName || <span style={{ color: "#94a3b8" }}>Unassigned</span>}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "14px",
                          fontSize: "12px",
                          fontWeight: "700",
                          background: statusBg,
                          color: statusColor,
                        }}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button
                          onClick={() => setViewingMember(m)}
                          style={{ padding: "6px 10px", background: "#e0e7ff", color: "#4338ca", border: "none", borderRadius: "6px", cursor: "pointer" }}
                        >
                          <FiEye />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(m)}
                          style={{ padding: "6px 10px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: "6px", cursor: "pointer" }}
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id, m.fullName)}
                          style={{ padding: "6px 10px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", cursor: "pointer" }}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                  No members found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "650px", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                {editingMember ? "Edit Member Details" : "Register New Member"}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </div>

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

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Membership Plan *</label>
                <select
                  value={formData.membershipPlanId}
                  onChange={(e) => setFormData({ ...formData, membershipPlanId: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                >
                  <option value="">Select Plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Assigned Trainer *</label>
                <select
                  value={formData.assignedTrainerId}
                  onChange={(e) => setFormData({ ...formData, assignedTrainerId: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                >
                  <option value="">Select Trainer</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Gym Branch / Club Facility</label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                >
                  <option value="">Main Fitness Center</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code || "Branch"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="FROZEN">Frozen</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Emergency Contact Name</label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "10px 18px", background: "#f1f5f9", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "10px 24px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MEMBER DETAILS MODAL */}
      {viewingMember && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "550px", padding: "28px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                  {viewingMember.fullName}
                </h2>
                <span style={{ fontSize: "12px", color: "#4f46e5", fontWeight: "600" }}>
                  Member ID: {viewingMember.memberId}
                </span>
              </div>
              <button onClick={() => setViewingMember(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>
                <FiX />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", color: "#334155" }}>
              <div><strong style={{ color: "#64748b" }}>Gender:</strong> {viewingMember.gender || "N/A"}</div>
              <div><strong style={{ color: "#64748b" }}>DOB:</strong> {viewingMember.dob ? new Date(viewingMember.dob).toLocaleDateString() : "N/A"}</div>
              <div><strong style={{ color: "#64748b" }}>Phone:</strong> {viewingMember.phone || "N/A"}</div>
              <div><strong style={{ color: "#64748b" }}>Email:</strong> {viewingMember.email || "N/A"}</div>
              <div><strong style={{ color: "#64748b" }}>Plan:</strong> {viewingMember.plan?.name || "No Plan"}</div>
              <div><strong style={{ color: "#64748b" }}>Trainer:</strong> {viewingMember.trainer?.fullName || "Unassigned"}</div>
              <div><strong style={{ color: "#64748b" }}>Start Date:</strong> {viewingMember.startDate ? new Date(viewingMember.startDate).toLocaleDateString() : "N/A"}</div>
              <div><strong style={{ color: "#64748b" }}>Expiry Date:</strong> {viewingMember.expiryDate ? new Date(viewingMember.expiryDate).toLocaleDateString() : "N/A"}</div>
              <div><strong style={{ color: "#64748b" }}>Status:</strong> <span style={{ fontWeight: "700" }}>{viewingMember.status}</span></div>
              <div><strong style={{ color: "#64748b" }}>Emergency Contact:</strong> {viewingMember.emergencyContact || "N/A"}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong style={{ color: "#64748b" }}>Emergency Phone:</strong> {viewingMember.emergencyPhone || "N/A"}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong style={{ color: "#64748b" }}>Address:</strong> {viewingMember.address || "N/A"}</div>
              {viewingMember.notes && (
                <div style={{ gridColumn: "1 / -1", background: "#f8fafc", padding: "10px", borderRadius: "8px", marginTop: "6px" }}>
                  <strong style={{ color: "#64748b" }}>Notes:</strong> {viewingMember.notes}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button onClick={() => setViewingMember(null)} style={{ padding: "10px 20px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
