"use client";

import { useState, useEffect } from "react";
import { restaurantService } from "@/services/restaurantService";
import { FiCalendar, FiPlus, FiTrash2 } from "react-icons/fi";
import { showSuccess, showError, showConfirm } from "@/utils/swal";
import { sanitizePhoneInput, getPhoneValidationError, isValidPhoneNumber } from "@/utils/validation";


export default function RestaurantReservationsPage() {
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10));

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    tableId: "",
    reservationDate: new Date().toISOString().slice(0, 10),
    reservationTime: "19:00",
    numberOfGuests: 2,
    notes: "",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedRestaurantId) {
      fetchReservations();
      fetchTables(selectedRestaurantId);
    }
  }, [selectedRestaurantId, filterDate]);

  const fetchTables = async (restaurantId) => {
    try {
      const tblRes = await restaurantService.getTables(restaurantId);
      setTables(tblRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await restaurantService.getRestaurants();
      const list = res.data || [];
      setRestaurants(list);
      if (list.length > 0) {
        setSelectedRestaurantId(list[0].id);
        const tblRes = await restaurantService.getTables(list[0].id);
        setTables(tblRes.data || []);
      }
    } catch (err) {
      console.error("Error loading restaurants:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const res = await restaurantService.getReservations(selectedRestaurantId, null, filterDate);
      setReservations(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    if (!selectedRestaurantId) return;

    if (!isValidPhoneNumber(form.customerPhone, true)) {
      showError("Invalid Phone Number", "Phone number must contain exactly 10 digits.");
      return;
    }

    try {
      await restaurantService.createReservation({
        ...form,
        restaurantId: selectedRestaurantId,
        numberOfGuests: parseInt(form.numberOfGuests),
        reservationDate: new Date(form.reservationDate).toISOString(),
      });
      setShowAddModal(false);
      setForm({
        customerName: "",
        customerPhone: "",
        tableId: "",
        reservationDate: new Date().toISOString().slice(0, 10),
        reservationTime: "19:00",
        numberOfGuests: 2,
        notes: "",
      });
      fetchReservations();
      showSuccess("Reservation Created", "Reservation booking created successfully!");
    } catch (err) {
      showError("Failed", err.response?.data?.message || err.message);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await restaurantService.updateReservationStatus(id, status);
      fetchReservations();
      showSuccess("Status Updated", `Reservation status changed to ${status}`);
    } catch (err) {
      showError("Failed", err.response?.data?.message || err.message);
    }
  };

  const handleDeleteReservation = async (id) => {
    const isConfirmed = await showConfirm({
      title: "Delete Reservation?",
      text: "Are you sure you want to delete this reservation booking?",
      confirmButtonText: "Yes, Delete",
      icon: "warning",
    });
    if (!isConfirmed) return;
    try {
      await restaurantService.deleteReservation(id);
      fetchReservations();
      showSuccess("Deleted", "Reservation deleted successfully!");
    } catch (err) {
      showError("Delete Failed", err.response?.data?.message || err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading Reservations...</div>;
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Table Reservations</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Manage customer table bookings, seatings & schedules.</p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: "600" }}
          />

          {restaurants.length > 0 && (
            <select
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: "600" }}
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            style={{ padding: "10px 18px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <FiPlus /> New Reservation
          </button>
        </div>
      </div>

      {/* Reservation Cards / Table */}
      <div style={{ backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        {reservations.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
            <FiCalendar size={48} />
            <h3 style={{ marginTop: "16px", color: "#334155" }}>No Reservations for this Date</h3>
            <p>Click "New Reservation" to book a table.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "13px", textTransform: "uppercase" }}>
                <th style={{ padding: "14px 20px" }}>Customer</th>
                <th style={{ padding: "14px 20px" }}>Table</th>
                <th style={{ padding: "14px 20px" }}>Guests</th>
                <th style={{ padding: "14px 20px" }}>Time</th>
                <th style={{ padding: "14px 20px" }}>Status</th>
                <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontWeight: "700", color: "#0f172a" }}>{r.customerName || r.customer?.name || "Guest"}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{r.customerPhone || r.customer?.phone}</div>
                  </td>
                  <td style={{ padding: "16px 20px", fontWeight: "600", color: "#334155" }}>
                    {r.table ? `${r.table.tableNumber} (${r.table.area?.name || "Area"})` : "Unassigned"}
                  </td>
                  <td style={{ padding: "16px 20px", fontWeight: "600" }}>{r.numberOfGuests} Guests</td>
                  <td style={{ padding: "16px 20px", fontWeight: "600", color: "#2563eb" }}>{r.reservationTime}</td>
                  <td style={{ padding: "16px 20px" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "700",
                        backgroundColor:
                          r.status === "CONFIRMED"
                            ? "#dbeafe"
                            : r.status === "SEATED"
                            ? "#d1fae5"
                            : r.status === "PENDING"
                            ? "#fef3c7"
                            : "#f1f5f9",
                        color:
                          r.status === "CONFIRMED"
                            ? "#1e40af"
                            : r.status === "SEATED"
                            ? "#065f46"
                            : r.status === "PENDING"
                            ? "#92400e"
                            : "#64748b",
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      {r.status === "PENDING" && (
                        <button
                          onClick={() => handleStatusChange(r.id, "CONFIRMED")}
                          style={{ padding: "6px 12px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                        >
                          Confirm
                        </button>
                      )}
                      {(r.status === "CONFIRMED" || r.status === "PENDING") && (
                        <button
                          onClick={() => handleStatusChange(r.id, "SEATED")}
                          style={{ padding: "6px 12px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                        >
                          Seat Guests
                        </button>
                      )}
                      {r.status === "SEATED" && (
                        <button
                          onClick={() => handleStatusChange(r.id, "COMPLETED")}
                          style={{ padding: "6px 12px", backgroundColor: "#64748b", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                        >
                          Complete
                        </button>
                      )}
                      {r.status !== "CANCELLED" && r.status !== "COMPLETED" && (
                        <button
                          onClick={() => handleStatusChange(r.id, "CANCELLED")}
                          style={{ padding: "6px 12px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReservation(r.id)}
                        style={{ padding: "6px 10px", backgroundColor: "#fee2e2", color: "#991b1b", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                        title="Delete Reservation Record"
                      >
                        <FiTrash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New Reservation Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "500px" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "700" }}>New Reservation</h3>
            <form onSubmit={handleCreateReservation}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Customer Name</label>
                  <input
                    type="text"
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Phone Number</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    placeholder="10-digit Phone Number"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: sanitizePhoneInput(e.target.value) })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                  {form.customerPhone && getPhoneValidationError(form.customerPhone, false) && (
                    <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      ⚠ {getPhoneValidationError(form.customerPhone, false)}
                    </span>
                  )}
                </div>

              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Date</label>
                  <input
                    type="date"
                    required
                    value={form.reservationDate}
                    onChange={(e) => setForm({ ...form, reservationDate: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Time</label>
                  <input
                    type="time"
                    required
                    value={form.reservationTime}
                    onChange={(e) => setForm({ ...form, reservationTime: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Guests</label>
                  <input
                    type="number"
                    min="1"
                    value={form.numberOfGuests}
                    onChange={(e) => setForm({ ...form, numberOfGuests: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Assign Table</label>
                  <select
                    value={form.tableId}
                    onChange={(e) => setForm({ ...form, tableId: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="">Select Table...</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.tableNumber} {t.area?.name ? `(${t.area.name})` : ""} - {t.capacity} Seats
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 16px", borderRadius: "6px", backgroundColor: "#2563eb", color: "#fff", border: "none", fontWeight: "600" }}>
                  Save Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
