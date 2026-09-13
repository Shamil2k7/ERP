"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import {
  FiUsers,
  FiUserCheck,
  FiUserPlus,
  FiClock,
  FiCheckSquare,
  FiXCircle,
  FiDollarSign,
  FiCreditCard,
  FiAward,
  FiActivity,
  FiArrowUpRight,
  FiPlus,
  FiChevronRight,
  FiCalendar,
} from "react-icons/fi";

export default function GymDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGymStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load Gym Dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGymStats();
  }, []);

  const cardsData = [
    { label: "Total Members", value: stats?.cards?.totalMembers ?? 0, icon: FiUsers, color: "#4f46e5", bg: "#e0e7ff" },
    { label: "Active Members", value: stats?.cards?.activeMembers ?? 0, icon: FiUserCheck, color: "#10b981", bg: "#d1fae5" },
    { label: "New Today", value: stats?.cards?.newMembersToday ?? 0, icon: FiUserPlus, color: "#06b6d4", bg: "#cffaff" },
    { label: "Expiring Soon", value: stats?.cards?.expiringSoon ?? 0, icon: FiClock, color: "#f59e0b", bg: "#fef3c7" },
    { label: "Today's Attendance", value: stats?.cards?.todayAttendance ?? 0, icon: FiCheckSquare, color: "#8b5cf6", bg: "#ede9fe" },
    { label: "Present Members", value: stats?.cards?.presentMembers ?? 0, icon: FiUserCheck, color: "#10b981", bg: "#d1fae5" },
    { label: "Absent Members", value: stats?.cards?.absentMembers ?? 0, icon: FiXCircle, color: "#ef4444", bg: "#fee2e2" },
    { label: "Monthly Revenue", value: `$${(stats?.cards?.monthlyRevenue ?? 0).toLocaleString()}`, icon: FiDollarSign, color: "#059669", bg: "#d1fae5" },
    { label: "Pending Payments", value: `$${(stats?.cards?.pendingPayments ?? 0).toLocaleString()}`, icon: FiCreditCard, color: "#ea580c", bg: "#ffedd5" },
    { label: "Total Trainers", value: stats?.cards?.totalTrainers ?? 0, icon: FiAward, color: "#ec4899", bg: "#fce7f3" },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
      {/* DASHBOARD HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>🏋️</span>
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
              Gym Management Dashboard
            </h1>
          </div>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
            Real-time overview of members, attendance check-ins, fee collections, and trainer roster.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            href="/gym/members"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              background: "#4f46e5",
              color: "#ffffff",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
            }}
          >
            <FiPlus /> Add New Member
          </Link>

          <Link
            href="/gym/attendance"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              background: "#10b981",
              color: "#ffffff",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
            }}
          >
            <FiCheckSquare /> Check-In Member
          </Link>
        </div>
      </div>

      {/* 10 DASHBOARD CARDS GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {cardsData.map((card, idx) => {
          const IconComp = card.icon;
          return (
            <div
              key={idx}
              style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "14px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
                border: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "transform 0.2s ease, boxShadow 0.2s ease",
              }}
            >
              <div>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {card.label}
                </span>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "6px" }}>
                  {loading ? "..." : card.value}
                </div>
              </div>

              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: card.bg,
                  color: card.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                }}
              >
                <IconComp />
              </div>
            </div>
          );
        })}
      </div>

      {/* 5 SUGGESTED OVERVIEW SECTIONS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
        {/* SECTION 1: MEMBERSHIP OVERVIEW */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <FiActivity style={{ color: "#4f46e5" }} /> Membership Overview
            </h3>
            <Link href="/gym/plans" style={{ fontSize: "13px", color: "#4f46e5", textDecoration: "none", fontWeight: "600" }}>
              View Plans →
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "#f8fafc", borderRadius: "10px" }}>
              <span style={{ fontSize: "14px", color: "#334155", fontWeight: "500" }}>Active Memberships</span>
              <strong style={{ color: "#10b981", fontSize: "15px" }}>{stats?.cards?.activeMembers ?? 0}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "#f8fafc", borderRadius: "10px" }}>
              <span style={{ fontSize: "14px", color: "#334155", fontWeight: "500" }}>Expiring Within 7 Days</span>
              <strong style={{ color: "#f59e0b", fontSize: "15px" }}>{stats?.cards?.expiringSoon ?? 0}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "#f8fafc", borderRadius: "10px" }}>
              <span style={{ fontSize: "14px", color: "#334155", fontWeight: "500" }}>Expired Memberships</span>
              <strong style={{ color: "#ef4444", fontSize: "15px" }}>
                {Math.max(0, (stats?.cards?.totalMembers ?? 0) - (stats?.cards?.activeMembers ?? 0))}
              </strong>
            </div>
          </div>
        </div>

        {/* SECTION 2: ATTENDANCE OVERVIEW */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <FiCheckSquare style={{ color: "#10b981" }} /> Attendance Summary
            </h3>
            <Link href="/gym/attendance" style={{ fontSize: "13px", color: "#10b981", textDecoration: "none", fontWeight: "600" }}>
              View Log →
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ padding: "16px", background: "#ecfdf5", borderRadius: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#047857" }}>
                {stats?.cards?.presentMembers ?? 0}
              </div>
              <span style={{ fontSize: "13px", color: "#065f46", fontWeight: "600" }}>Present Today</span>
            </div>

            <div style={{ padding: "16px", background: "#fef2f2", borderRadius: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#b91c1c" }}>
                {stats?.cards?.absentMembers ?? 0}
              </div>
              <span style={{ fontSize: "13px", color: "#991b1b", fontWeight: "600" }}>Absent / Unchecked</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: REVENUE OVERVIEW */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <FiDollarSign style={{ color: "#059669" }} /> Revenue & Payments
            </h3>
            <Link href="/gym/payments" style={{ fontSize: "13px", color: "#059669", textDecoration: "none", fontWeight: "600" }}>
              Collect Fees →
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "#f8fafc", borderRadius: "10px" }}>
              <span style={{ fontSize: "14px", color: "#334155" }}>Membership Fee Collection</span>
              <strong style={{ color: "#059669", fontSize: "15px" }}>${(stats?.cards?.monthlyRevenue ?? 0).toLocaleString()}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "#fff7ed", borderRadius: "10px" }}>
              <span style={{ fontSize: "14px", color: "#c2410c" }}>Pending Fee Amount</span>
              <strong style={{ color: "#c2410c", fontSize: "15px" }}>${(stats?.cards?.pendingPayments ?? 0).toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT MEMBERS & TRAINERS TABLES */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginTop: "24px" }}>
        {/* RECENT MEMBERS */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              Recent Member Registrations
            </h3>
            <Link href="/gym/members" style={{ fontSize: "13px", color: "#4f46e5", textDecoration: "none", fontWeight: "600" }}>
              View All Members →
            </Link>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left", fontSize: "12px", color: "#64748b" }}>
                <th style={{ padding: "10px" }}>MEMBER</th>
                <th style={{ padding: "10px" }}>PLAN</th>
                <th style={{ padding: "10px" }}>STATUS</th>
                <th style={{ padding: "10px" }}>JOIN DATE</th>
              </tr>
            </thead>
            <tbody>
              {stats?.sections?.recentMembers?.length > 0 ? (
                stats.sections.recentMembers.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f8fafc", fontSize: "14px" }}>
                    <td style={{ padding: "12px 10px" }}>
                      <strong style={{ color: "#0f172a" }}>{m.fullName}</strong>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{m.memberId}</div>
                    </td>
                    <td style={{ padding: "12px 10px", color: "#334155" }}>
                      {m.plan?.name || "No Plan"}
                    </td>
                    <td style={{ padding: "12px 10px" }}>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "700",
                          background: m.status === "ACTIVE" ? "#d1fae5" : "#fee2e2",
                          color: m.status === "ACTIVE" ? "#047857" : "#b91c1c",
                        }}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 10px", color: "#64748b", fontSize: "13px" }}>
                      {new Date(m.joinDate || m.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                    No members registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ACTIVE TRAINERS */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
              Active Trainers
            </h3>
            <Link href="/gym/trainers" style={{ fontSize: "13px", color: "#ec4899", textDecoration: "none", fontWeight: "600" }}>
              Manage →
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {stats?.sections?.trainers?.length > 0 ? (
              stats.sections.trainers.map((t) => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#f8fafc", borderRadius: "10px" }}>
                  <div>
                    <strong style={{ fontSize: "14px", color: "#0f172a" }}>{t.fullName}</strong>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{t.specialization || "Fitness Coach"}</div>
                  </div>
                  <span style={{ fontSize: "12px", background: "#fce7f3", color: "#be185d", padding: "4px 10px", borderRadius: "12px", fontWeight: "700" }}>
                    {t._count?.assignedMembers || 0} Members
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                No active trainers added.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
