"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  FiCheckSquare,
  FiClock,
  FiSearch,
  FiUserCheck,
  FiCalendar,
  FiPlus,
  FiCheck,
  FiXCircle,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";

export default function AttendanceLog() {
  const [attendance, setAttendance] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [checkInTime, setCheckInTime] = useState("");

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [attRes, memRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/attendance?date=${dateFilter}`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/members`, { headers }),
      ]);

      if (attRes.data.success) setAttendance(attRes.data.data || []);
      if (memRes.data.success) setMembers(memRes.data.data || []);
    } catch (err) {
      console.error("Failed to load attendance", err);
      toast.error("Failed to load attendance log");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [dateFilter]);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) {
      toast.error("Please select a member to check in");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const now = new Date();

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/attendance`,
        {
          memberId: selectedMemberId,
          date: dateFilter,
          checkInTime: now.toISOString(),
          status: "PRESENT",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Member checked in successfully!");
      setSelectedMemberId("");
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to check in");
    }
  };

  const handleCheckOut = async (attendanceId) => {
    try {
      const token = localStorage.getItem("token");
      const now = new Date();

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/gym/attendance/${attendanceId}`,
        { checkOutTime: now.toISOString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Member checked out");
      fetchAttendance();
    } catch (err) {
      toast.error("Failed to update check-out time");
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
      <Toaster position="top-right" />

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <FiCheckSquare style={{ color: "#10b981" }} /> Member Attendance Log
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
            Real-time gym check-in, check-out tracking, and daily attendance history.
          </p>
        </div>
      </div>

      {/* MANUAL CHECK-IN CARD & DATE FILTER */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FiUserCheck style={{ color: "#10b981" }} /> Quick Member Check-In
          </h3>

          <form onSubmit={handleCheckIn} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
            >
              <option value="">Select Member to Check In...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.memberId}) - {m.status}
                </option>
              ))}
            </select>

            <button
              type="submit"
              style={{
                padding: "12px 24px",
                background: "#10b981",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FiCheck /> Record Check-In
            </button>
          </form>
        </div>

        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <label style={{ fontSize: "13px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>
            Filter Log by Date
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
          />
        </div>
      </div>

      {/* ATTENDANCE TABLE */}
      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left", fontSize: "12px", color: "#64748b" }}>
              <th style={{ padding: "14px 16px" }}>MEMBER</th>
              <th style={{ padding: "14px 16px" }}>CHECK-IN TIME</th>
              <th style={{ padding: "14px 16px" }}>CHECK-OUT TIME</th>
              <th style={{ padding: "14px 16px" }}>STATUS</th>
              <th style={{ padding: "14px 16px", textAlign: "right" }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                  Loading attendance records...
                </td>
              </tr>
            ) : attendance.length > 0 ? (
              attendance.map((att) => (
                <tr key={att.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <strong style={{ fontSize: "15px", color: "#0f172a" }}>{att.member?.fullName || "Member"}</strong>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{att.member?.memberId}</div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "#059669", fontWeight: "600" }}>
                    {att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: att.checkOutTime ? "#64748b" : "#f59e0b" }}>
                    {att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active Session"}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "700", background: att.status === "PRESENT" ? "#d1fae5" : "#fee2e2", color: att.status === "PRESENT" ? "#047857" : "#b91c1c" }}>
                      {att.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    {!att.checkOutTime ? (
                      <button
                        onClick={() => handleCheckOut(att.id)}
                        style={{ padding: "6px 14px", background: "#fef3c7", color: "#d97706", border: "1px solid #fcd34d", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
                      >
                        Check-Out Now
                      </button>
                    ) : (
                      <span style={{ fontSize: "13px", color: "#10b981", fontWeight: "600" }}>Completed</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                  No attendance check-ins recorded for {dateFilter}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
