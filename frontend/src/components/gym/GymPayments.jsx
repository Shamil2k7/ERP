"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  FiCreditCard,
  FiPlus,
  FiSearch,
  FiPrinter,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiFileText,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";

export default function GymPayments() {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const [formData, setFormData] = useState({
    memberId: "",
    membershipPlanId: "",
    totalAmount: 50,
    paidAmount: 50,
    paymentMethod: "CASH",
    notes: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [payRes, memRes, planRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/payments`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/members`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/plans`, { headers }),
      ]);

      if (payRes.data.success) setPayments(payRes.data.data || []);
      if (memRes.data.success) setMembers(memRes.data.data || []);
      if (planRes.data.success) setPlans(planRes.data.data || []);
    } catch (err) {
      console.error("Failed to load payments", err);
      toast.error("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMemberChange = (mId) => {
    const mem = members.find((m) => m.id === mId);
    let planId = mem?.membershipPlanId || "";
    let price = 50;

    if (planId) {
      const p = plans.find((pl) => pl.id === planId);
      if (p) price = Number(p.price || 50);
    }

    setFormData((prev) => ({
      ...prev,
      memberId: mId,
      membershipPlanId: planId,
      totalAmount: price,
      paidAmount: price,
    }));
  };

  const handlePlanChange = (pId) => {
    const p = plans.find((pl) => pl.id === pId);
    const price = p ? Number(p.price || 50) : 50;

    setFormData((prev) => ({
      ...prev,
      membershipPlanId: pId,
      totalAmount: price,
      paidAmount: price,
    }));
  };

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    if (!formData.memberId) {
      toast.error("Please select a member");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/payments`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Payment recorded successfully!");
      setShowModal(false);
      fetchData();

      if (res.data.data) {
        setSelectedReceipt(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record payment");
    }
  };

  const filteredPayments = payments.filter((p) => {
    const keyword = search.toLowerCase();
    const nameMatch =
      p.member?.fullName?.toLowerCase().includes(keyword) ||
      p.receiptNumber?.toLowerCase().includes(keyword) ||
      p.paymentNumber?.toLowerCase().includes(keyword);

    const statusMatch = !statusFilter || p.status === statusFilter;
    return nameMatch && statusMatch;
  });

  return (
    <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
      <Toaster position="top-right" />

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <FiCreditCard style={{ color: "#059669" }} /> Payments & Membership Fees
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
            Collect membership fees, issue payment receipts, and monitor overdue fee balances.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              memberId: members[0]?.id || "",
              membershipPlanId: plans[0]?.id || "",
              totalAmount: Number(plans[0]?.price || 50),
              paidAmount: Number(plans[0]?.price || 50),
              paymentMethod: "CASH",
              notes: "",
            });
            setShowModal(true);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 20px",
            background: "#059669",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
          }}
        >
          <FiPlus size={18} /> Collect Payment
        </button>
      </div>

      {/* TOOLBAR */}
      <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #f1f5f9", display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
        <div style={{ flex: 1, minWidth: "260px", display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <FiSearch style={{ color: "#64748b" }} />
          <input
            type="text"
            placeholder="Search by receipt # or member name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "14px" }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#ffffff", fontSize: "14px", outline: "none" }}
        >
          <option value="">All Payment Statuses</option>
          <option value="PAID">Paid</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PENDING">Pending</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      {/* PAYMENTS TABLE */}
      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left", fontSize: "12px", color: "#64748b" }}>
              <th style={{ padding: "14px 16px" }}>RECEIPT #</th>
              <th style={{ padding: "14px 16px" }}>MEMBER</th>
              <th style={{ padding: "14px 16px" }}>PLAN</th>
              <th style={{ padding: "14px 16px" }}>PAID / TOTAL</th>
              <th style={{ padding: "14px 16px" }}>METHOD & DATE</th>
              <th style={{ padding: "14px 16px" }}>STATUS</th>
              <th style={{ padding: "14px 16px", textAlign: "right" }}>RECEIPT</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                  Loading Gym Payments...
                </td>
              </tr>
            ) : filteredPayments.length > 0 ? (
              filteredPayments.map((p) => {
                let statusBg = "#d1fae5";
                let statusColor = "#047857";
                if (p.status === "PARTIALLY_PAID") { statusBg = "#fef3c7"; statusColor = "#d97706"; }
                else if (p.status === "PENDING" || p.status === "OVERDUE") { statusBg = "#fee2e2"; statusColor = "#b91c1c"; }

                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <strong style={{ fontSize: "14px", color: "#4f46e5" }}>{p.receiptNumber || p.paymentNumber}</strong>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <strong style={{ fontSize: "14px", color: "#0f172a" }}>{p.member?.fullName || "Member"}</strong>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{p.member?.phone}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: "#334155" }}>
                      {p.plan?.name || "Membership Plan"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <strong style={{ fontSize: "14px", color: "#059669" }}>${Number(p.paidAmount).toLocaleString()}</strong>
                      <span style={{ fontSize: "12px", color: "#64748b" }}> / ${Number(p.totalAmount).toLocaleString()}</span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: "#334155" }}>
                      <strong>{p.paymentMethod}</strong>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {new Date(p.paymentDate || p.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", background: statusBg, color: statusColor }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        style={{ padding: "6px 12px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <FiPrinter size={14} /> Receipt
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                  No payment records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* COLLECT PAYMENT MODAL */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "550px", padding: "28px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                Collect Membership Fee
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCollectPayment} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Select Member *</label>
                <select
                  required
                  value={formData.memberId}
                  onChange={(e) => handleMemberChange(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                >
                  <option value="">Select Member</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.fullName} ({m.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Membership Plan</label>
                <select
                  value={formData.membershipPlanId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                >
                  <option value="">Select Plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Total Fee Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Paid Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="WALLET">Mobile Wallet / UPI</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "10px 18px", background: "#f1f5f9", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "10px 24px", background: "#059669", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>
                  Record Payment & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      {selectedReceipt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "450px", padding: "32px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            <div style={{ textAlign: "center", borderBottom: "2px dashed #e2e8f0", paddingBottom: "20px", marginBottom: "20px" }}>
              <span style={{ fontSize: "28px" }}>🏋️</span>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: "4px 0" }}>GYM PAYMENT RECEIPT</h2>
              <span style={{ fontSize: "13px", color: "#64748b" }}>Receipt No: {selectedReceipt.receiptNumber || selectedReceipt.paymentNumber}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Member:</span>
                <strong style={{ color: "#0f172a" }}>{selectedReceipt.member?.fullName}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Plan:</span>
                <span style={{ color: "#334155" }}>{selectedReceipt.plan?.name || "Membership Plan"}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Payment Method:</span>
                <strong style={{ color: "#334155" }}>{selectedReceipt.paymentMethod}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Date:</span>
                <span style={{ color: "#334155" }}>{new Date(selectedReceipt.paymentDate || selectedReceipt.createdAt).toLocaleDateString()}</span>
              </div>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "10px", marginTop: "10px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "700", color: "#0f172a" }}>Paid Amount:</span>
                <strong style={{ fontSize: "18px", color: "#059669" }}>${Number(selectedReceipt.paidAmount).toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
              <button
                onClick={() => window.print()}
                style={{ flex: 1, padding: "12px", background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <FiPrinter /> Print Receipt
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                style={{ padding: "12px 18px", background: "#f1f5f9", border: "none", borderRadius: "8px", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
