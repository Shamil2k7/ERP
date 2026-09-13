"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { laundryService } from "@/services/laundryService";
import Swal from "sweetalert2";
import {
  FiTruck,
  FiMapPin,
  FiPhone,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiSearch,
  FiRefreshCw,
  FiAlertCircle,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiSend,
  FiCheck
} from "react-icons/fi";

export default function LaundryDeliveryLog() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Action in-flight tracking
  const [updatingId, setUpdatingId] = useState(null);

  const fetchDeliveries = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setRefreshing(true);
      setError(null);

      const params = {
        page,
        limit: 20,
      };

      if (statusFilter && statusFilter !== "ALL") {
        params.status = statusFilter;
      }
      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await laundryService.getDeliveries(params);
      if (res.success) {
        setDeliveries(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.totalCount || 0);
      } else {
        setDeliveries([]);
      }
    } catch (err) {
      console.error("Failed to fetch delivery logs:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch delivery logs");
      setDeliveries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // Periodic background refresh every 15s to keep real-time parity
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchDeliveries(true);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchDeliveries]);

  const handleUpdateStatus = async (delivery, newStatus) => {
    const isDispatch = newStatus === "OUT_FOR_DELIVERY";
    const isDelivered = newStatus === "DELIVERED";

    const title = isDispatch
      ? `Dispatch Order ${delivery.orderNumber}?`
      : isDelivered
      ? `Mark Order ${delivery.orderNumber} as Delivered?`
      : `Update Delivery Status to ${newStatus}?`;

    const text = isDispatch
      ? "This order will be marked Out for Delivery and dispatched to customer."
      : isDelivered
      ? "This order will be marked as Delivered and completed."
      : "Confirm updating the delivery status.";

    const confirmButtonText = isDispatch ? "Yes, Dispatch Now" : isDelivered ? "Yes, Mark Delivered" : "Confirm";
    const confirmButtonColor = isDispatch ? "#f59e0b" : isDelivered ? "#10b981" : "#3b82f6";

    const result = await Swal.fire({
      title,
      text,
      icon: isDelivered ? "question" : "info",
      showCancelButton: true,
      confirmButtonColor,
      cancelButtonColor: "#64748b",
      confirmButtonText,
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setUpdatingId(delivery.id);
      await laundryService.updateDeliveryStatus(delivery.orderId, {
        deliveryStatus: newStatus,
        deliveryNotes: `Delivery status updated to ${newStatus} on ${new Date().toLocaleString()}`,
      });

      Swal.fire({
        icon: "success",
        title: "Status Updated",
        text: `Order ${delivery.orderNumber} has been updated to ${newStatus.replace(/_/g, " ")}.`,
        timer: 2000,
        showConfirmButton: false,
      });

      // Refetch deliveries immediately
      await fetchDeliveries(true);
    } catch (err) {
      console.error("Failed to update delivery status:", err);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.response?.data?.message || err.message || "Failed to update delivery status",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "DELIVERED":
        return {
          bg: "#dcfce7",
          color: "#15803d",
          border: "#86efac",
          label: "DELIVERED",
          icon: FiCheckCircle,
        };
      case "OUT_FOR_DELIVERY":
        return {
          bg: "#fef3c7",
          color: "#b45309",
          border: "#fde68a",
          label: "OUT FOR DELIVERY",
          icon: FiTruck,
        };
      case "FAILED":
        return {
          bg: "#fee2e2",
          color: "#b91c1c",
          border: "#fca5a5",
          label: "FAILED",
          icon: FiAlertCircle,
        };
      case "CANCELLED":
        return {
          bg: "#f1f5f9",
          color: "#64748b",
          border: "#cbd5e1",
          label: "CANCELLED",
          icon: FiClock,
        };
      case "PENDING":
      default:
        return {
          bg: "#e0f2fe",
          color: "#0369a1",
          border: "#bae6fd",
          label: "PENDING",
          icon: FiClock,
        };
    }
  };

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiTruck size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                Home Delivery Log
              </h1>
              <p style={{ color: "#64748b", fontSize: "14px", margin: "2px 0 0 0" }}>
                Manage outgoing laundry drop-offs, track dispatch coordinates, and mark successful delivery logs.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchDeliveries(false)}
          disabled={refreshing}
          style={{
            padding: "9px 16px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#334155",
            fontSize: "13px",
            fontWeight: "600",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            cursor: refreshing ? "not-allowed" : "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            transition: "all 0.2s ease",
          }}
        >
          <FiRefreshCw className={refreshing ? "animate-spin" : ""} size={14} />
          {refreshing ? "Refreshing..." : "Refresh Deliveries"}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "16px",
          border: "1px solid #e2e8f0",
          marginBottom: "20px",
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 280px", minWidth: "240px" }}>
          <FiSearch
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
            size={16}
          />
          <input
            type="text"
            placeholder="Search by order #, customer, phone, or address..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              outline: "none",
              color: "#1e293b",
            }}
          />
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {["ALL", "PENDING", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED"].map((status) => {
            const active = statusFilter === status;
            const labelMap = {
              ALL: "All Deliveries",
              PENDING: "Pending",
              OUT_FOR_DELIVERY: "Out for Delivery",
              DELIVERED: "Delivered",
              FAILED: "Failed",
            };
            return (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                style={{
                  padding: "7px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: active ? "700" : "500",
                  border: active ? "1px solid #2563eb" : "1px solid #e2e8f0",
                  background: active ? "#eff6ff" : "#ffffff",
                  color: active ? "#2563eb" : "#64748b",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {labelMap[status] || status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        {loading && !refreshing ? (
          <div style={{ padding: "80px 24px", textAlign: "center", color: "#64748b" }}>
            <div style={{ display: "inline-block", marginBottom: "16px" }}>
              <FiRefreshCw size={32} className="animate-spin" style={{ color: "#2563eb" }} />
            </div>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: "500" }}>Loading delivery records from database...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "60px 24px", textAlign: "center", color: "#64748b" }}>
            <FiAlertCircle size={40} style={{ color: "#ef4444", marginBottom: "12px" }} />
            <p style={{ color: "#0f172a", fontWeight: "600", fontSize: "16px", margin: "0 0 8px 0" }}>
              Unable to load delivery log
            </p>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 16px 0" }}>{error}</p>
            <button
              onClick={() => fetchDeliveries(false)}
              style={{
                padding: "8px 18px",
                borderRadius: "6px",
                border: "none",
                background: "#2563eb",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        ) : deliveries.length === 0 ? (
          <div style={{ padding: "80px 24px", textAlign: "center", color: "#64748b" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#f1f5f9",
                color: "#94a3b8",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <FiTruck size={30} />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>
              No delivery records found
            </h3>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0, maxWidth: "380px", marginInline: "auto" }}>
              {search || statusFilter !== "ALL"
                ? "No delivery logs match your current search and filter criteria."
                : "Home deliveries scheduled at the Laundry POS or Order checkout will appear here dynamically."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View (Visible on >= 768px) */}
            <div className="hidden md:block" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      fontSize: "12px",
                      color: "#64748b",
                      fontWeight: "700",
                      letterSpacing: "0.03em",
                    }}
                  >
                    <th style={{ padding: "14px 18px" }}>ORDER NO</th>
                    <th style={{ padding: "14px 18px" }}>CUSTOMER</th>
                    <th style={{ padding: "14px 18px" }}>DELIVERY ADDRESS</th>
                    <th style={{ padding: "14px 18px" }}>CONTACT</th>
                    <th style={{ padding: "14px 18px" }}>SCHEDULE DATE</th>
                    <th style={{ padding: "14px 18px" }}>STATUS</th>
                    <th style={{ padding: "14px 18px", textAlign: "right" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((dev) => {
                    const badge = getStatusBadge(dev.deliveryStatus);
                    const BadgeIcon = badge.icon;
                    const isPending = dev.deliveryStatus === "PENDING";
                    const isOutForDelivery = dev.deliveryStatus === "OUT_FOR_DELIVERY";
                    const isFailed = dev.deliveryStatus === "FAILED";
                    const isDelivered = dev.deliveryStatus === "DELIVERED";
                    const isUpdating = updatingId === dev.id;

                    return (
                      <tr
                        key={dev.id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          fontSize: "13px",
                          transition: "background 0.15s ease",
                        }}
                      >
                        {/* Order Number */}
                        <td style={{ padding: "14px 18px", fontWeight: "700", color: "#2563eb" }}>
                          {dev.orderNumber}
                          {dev.totalAmount ? (
                            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "500", marginTop: "2px" }}>
                              ${Number(dev.totalAmount).toFixed(2)}
                            </div>
                          ) : null}
                        </td>

                        {/* Customer */}
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ fontWeight: "600", color: "#1e293b" }}>{dev.customerName}</div>
                          {dev.customerId ? (
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>ID: {dev.customerId.slice(0, 8)}...</div>
                          ) : null}
                        </td>

                        {/* Address */}
                        <td style={{ padding: "14px 18px", maxWidth: "260px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "6px",
                              color: "#334155",
                              lineHeight: "1.4",
                              wordBreak: "break-word",
                            }}
                          >
                            <FiMapPin size={14} style={{ color: "#94a3b8", flexShrink: 0, marginTop: "2px" }} />
                            <span>{dev.deliveryAddress || "Address not provided"}</span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569" }}>
                            <FiPhone size={13} style={{ color: "#94a3b8" }} />
                            <span>{dev.contactNumber || "N/A"}</span>
                          </div>
                        </td>

                        {/* Schedule Date */}
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569" }}>
                            <FiCalendar size={13} style={{ color: "#94a3b8" }} />
                            <span>
                              {dev.scheduledDate
                                ? new Date(dev.scheduledDate).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "ASAP"}
                            </span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "4px 10px",
                              backgroundColor: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: "700",
                            }}
                          >
                            <BadgeIcon size={12} />
                            {badge.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                          {isPending && (
                            <button
                              onClick={() => handleUpdateStatus(dev, "OUT_FOR_DELIVERY")}
                              disabled={isUpdating}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "none",
                                background: "#f59e0b",
                                color: "#ffffff",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: isUpdating ? "not-allowed" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: "0 1px 2px rgba(245, 158, 11, 0.2)",
                              }}
                            >
                              <FiSend size={12} />
                              Dispatch
                            </button>
                          )}

                          {isOutForDelivery && (
                            <button
                              onClick={() => handleUpdateStatus(dev, "DELIVERED")}
                              disabled={isUpdating}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "none",
                                background: "#10b981",
                                color: "#ffffff",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: isUpdating ? "not-allowed" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: "0 1px 2px rgba(16, 185, 129, 0.2)",
                              }}
                            >
                              <FiCheck size={12} />
                              Mark Delivered
                            </button>
                          )}

                          {isFailed && (
                            <button
                              onClick={() => handleUpdateStatus(dev, "OUT_FOR_DELIVERY")}
                              disabled={isUpdating}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "none",
                                background: "#6366f1",
                                color: "#ffffff",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: isUpdating ? "not-allowed" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <FiRefreshCw size={12} />
                              Retry Dispatch
                            </button>
                          )}

                          {isDelivered && (
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#16a34a",
                                fontWeight: "600",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <FiCheckCircle size={14} />
                              Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Card View (Visible on < 768px) */}
            <div className="block md:hidden" style={{ padding: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {deliveries.map((dev) => {
                  const badge = getStatusBadge(dev.deliveryStatus);
                  const BadgeIcon = badge.icon;
                  const isPending = dev.deliveryStatus === "PENDING";
                  const isOutForDelivery = dev.deliveryStatus === "OUT_FOR_DELIVERY";
                  const isFailed = dev.deliveryStatus === "FAILED";
                  const isDelivered = dev.deliveryStatus === "DELIVERED";
                  const isUpdating = updatingId === dev.id;

                  return (
                    <div
                      key={dev.id}
                      style={{
                        padding: "16px",
                        borderRadius: "12px",
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                      }}
                    >
                      {/* Top Header: Order Number & Status Badge */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <div>
                          <span style={{ fontSize: "15px", fontWeight: "800", color: "#2563eb" }}>
                            {dev.orderNumber}
                          </span>
                          {dev.totalAmount ? (
                            <span style={{ fontSize: "13px", color: "#64748b", marginLeft: "8px" }}>
                              (${Number(dev.totalAmount).toFixed(2)})
                            </span>
                          ) : null}
                        </div>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            borderRadius: "16px",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          <BadgeIcon size={11} />
                          {badge.label}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px",
                          color: "#1e293b",
                          fontWeight: "600",
                          marginBottom: "8px",
                        }}
                      >
                        <FiUser size={14} style={{ color: "#94a3b8" }} />
                        <span>{dev.customerName}</span>
                      </div>

                      {/* Delivery Address */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "8px",
                          fontSize: "13px",
                          color: "#475569",
                          marginBottom: "8px",
                          lineHeight: "1.4",
                          wordBreak: "break-word",
                        }}
                      >
                        <FiMapPin size={14} style={{ color: "#94a3b8", flexShrink: 0, marginTop: "2px" }} />
                        <span>{dev.deliveryAddress || "Address not provided"}</span>
                      </div>

                      {/* Contact & Schedule */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          justifyContent: "space-between",
                          gap: "8px",
                          fontSize: "12px",
                          color: "#64748b",
                          paddingTop: "8px",
                          borderTop: "1px dashed #f1f5f9",
                          marginBottom: "12px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <FiPhone size={13} />
                          <span>{dev.contactNumber || "N/A"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <FiCalendar size={13} />
                          <span>
                            {dev.scheduledDate
                              ? new Date(dev.scheduledDate).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })
                              : "ASAP"}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: "8px" }}>
                        {isPending && (
                          <button
                            onClick={() => handleUpdateStatus(dev, "OUT_FOR_DELIVERY")}
                            disabled={isUpdating}
                            style={{
                              flex: 1,
                              padding: "9px 12px",
                              borderRadius: "8px",
                              border: "none",
                              background: "#f59e0b",
                              color: "#ffffff",
                              fontSize: "13px",
                              fontWeight: "700",
                              cursor: isUpdating ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                            }}
                          >
                            <FiSend size={14} />
                            Dispatch Order
                          </button>
                        )}

                        {isOutForDelivery && (
                          <button
                            onClick={() => handleUpdateStatus(dev, "DELIVERED")}
                            disabled={isUpdating}
                            style={{
                              flex: 1,
                              padding: "9px 12px",
                              borderRadius: "8px",
                              border: "none",
                              background: "#10b981",
                              color: "#ffffff",
                              fontSize: "13px",
                              fontWeight: "700",
                              cursor: isUpdating ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                            }}
                          >
                            <FiCheck size={14} />
                            Mark Delivered
                          </button>
                        )}

                        {isFailed && (
                          <button
                            onClick={() => handleUpdateStatus(dev, "OUT_FOR_DELIVERY")}
                            disabled={isUpdating}
                            style={{
                              flex: 1,
                              padding: "9px 12px",
                              borderRadius: "8px",
                              border: "none",
                              background: "#6366f1",
                              color: "#ffffff",
                              fontSize: "13px",
                              fontWeight: "700",
                              cursor: isUpdating ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                            }}
                          >
                            <FiRefreshCw size={14} />
                            Retry Dispatch
                          </button>
                        )}

                        {isDelivered && (
                          <div
                            style={{
                              width: "100%",
                              padding: "8px",
                              borderRadius: "8px",
                              background: "#f0fdf4",
                              color: "#16a34a",
                              fontSize: "12px",
                              fontWeight: "700",
                              textAlign: "center",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                            }}
                          >
                            <FiCheckCircle size={14} />
                            Delivery Completed
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  borderTop: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  Showing page <span style={{ fontWeight: "700", color: "#0f172a" }}>{page}</span> of{" "}
                  <span style={{ fontWeight: "700", color: "#0f172a" }}>{totalPages}</span> ({totalCount} total
                  deliveries)
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      background: page === 1 ? "#f1f5f9" : "#ffffff",
                      color: page === 1 ? "#94a3b8" : "#334155",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: page === 1 ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <FiChevronLeft size={14} />
                    Previous
                  </button>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      background: page === totalPages ? "#f1f5f9" : "#ffffff",
                      color: page === totalPages ? "#94a3b8" : "#334155",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: page === totalPages ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    Next
                    <FiChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
