"use client";

import { useState, useEffect, useRef } from "react";
import { restaurantService } from "@/services/restaurantService";
import {
  joinCompanyRoom,
  joinOutletRoom,
  leaveOutletRoom,
  subscribeToKitchenOrderCreated,
  subscribeToKitchenOrderUpdated,
  subscribeToOrderStatus,
  subscribeToReconnect,
} from "@/services/socketService";
import { FiTv, FiClock, FiCheck, FiPlay, FiRefreshCw } from "react-icons/fi";
import { showError } from "@/utils/swal";
import { useCompany } from "@/context/CompanyContext";

export default function KitchenDisplayPage() {
  const { user, company } = useCompany();
  const roleUpper = (user?.role || user?.roleRef?.name || user?.type || "").toUpperCase();
  const isAdmin = roleUpper.includes("SUPER") || roleUpper.includes("ADMIN") || roleUpper.includes("OWNER");

  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [kotOrders, setKotOrders] = useState([]);
  const [liveSyncActive, setLiveSyncActive] = useState(true);

  const selectedRestIdRef = useRef(selectedRestaurantId);
  const companyIdRef = useRef(company?.id || user?.companyId);

  useEffect(() => {
    selectedRestIdRef.current = selectedRestaurantId;
  }, [selectedRestaurantId]);

  useEffect(() => {
    companyIdRef.current = company?.id || user?.companyId;
  }, [company?.id, user?.companyId]);

  const fetchTimeoutRef = useRef(null);

  const debouncedFetchKOTs = () => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      fetchKOTs();
    }, 300);
  };

  useEffect(() => {
    const currentCompId = company?.id || user?.companyId;
    if (currentCompId) {
      joinCompanyRoom(currentCompId);
    }
    fetchInitialData();
  }, [company?.id, user?.companyId]);

  useEffect(() => {
    if (!selectedRestaurantId) return;

    const currentCompId = company?.id || user?.companyId;
    if (currentCompId) joinCompanyRoom(currentCompId);
    joinOutletRoom(selectedRestaurantId, currentCompId);

    fetchKOTs();

    // 1. Handle Real-Time Kitchen Order Creation (Waiter clicks "Send to Kitchen")
    const unsubscribeCreated = subscribeToKitchenOrderCreated((data) => {
      console.log("⚡ [KDS] Real-time KOT creation received:", data);

      // Multi-tenant check
      if (data.companyId && currentCompId && data.companyId !== currentCompId) {
        return;
      }
      // Outlet filter check
      if (
        selectedRestIdRef.current &&
        selectedRestIdRef.current !== "ALL" &&
        data.restaurantId &&
        data.restaurantId !== selectedRestIdRef.current
      ) {
        return;
      }

      // Immediate in-memory addition avoiding duplicates
      const newKotObj = data.kot || {
        id: data.kitchenOrderId || data.kotNumber,
        orderId: data.orderId,
        kotNumber: data.kotNumber,
        tableNumber: data.tableNumber,
        orderType: data.orderType,
        status: data.status || "NEW",
        items: data.items || [],
        notes: data.notes || data.order?.notes,
        createdAt: data.createdAt || new Date().toISOString(),
      };

      setKotOrders((prev) => {
        const exists = prev.some(
          (k) =>
            k.id === newKotObj.id ||
            (k.orderId && k.orderId === newKotObj.orderId) ||
            (k.kotNumber && k.kotNumber === newKotObj.kotNumber)
        );
        if (exists) {
          return prev.map((k) =>
            k.id === newKotObj.id || k.orderId === newKotObj.orderId || k.kotNumber === newKotObj.kotNumber
              ? { ...k, ...newKotObj, status: newKotObj.status || "NEW" }
              : k
          );
        }
        return [newKotObj, ...prev];
      });

      // Background synchronization from DB
      debouncedFetchKOTs();
    });

    // 2. Handle Real-Time Kitchen Order Updates (PREPARING, READY, SERVED, etc.)
    const handleOrderUpdate = (data) => {
      console.log("⚡ [KDS] Real-time KOT update received:", data);

      // Multi-tenant check
      if (data.companyId && currentCompId && data.companyId !== currentCompId) {
        return;
      }
      // Outlet filter check
      if (
        selectedRestIdRef.current &&
        selectedRestIdRef.current !== "ALL" &&
        data.restaurantId &&
        data.restaurantId !== selectedRestIdRef.current
      ) {
        return;
      }

      const targetStatus = data.status || data.orderStatus;

      if (
        targetStatus === "READY" ||
        targetStatus === "SERVED" ||
        targetStatus === "COMPLETED" ||
        targetStatus === "CANCELLED"
      ) {
        // Kitchen Staff responsibility ends when marked READY or completed; remove immediately from KDS queue
        setKotOrders((prev) =>
          prev.filter(
            (kot) =>
              kot.orderId !== data.orderId &&
              kot.id !== data.kitchenOrderId &&
              kot.id !== data.kot?.id &&
              kot.order?.id !== data.orderId
          )
        );
      } else if (targetStatus === "PREPARING") {
        // Update in-memory status to PREPARING
        setKotOrders((prev) =>
          prev.map((kot) => {
            if (
              kot.orderId === data.orderId ||
              kot.id === data.kitchenOrderId ||
              kot.id === data.kot?.id ||
              kot.order?.id === data.orderId
            ) {
              return { ...kot, status: "PREPARING" };
            }
            return kot;
          })
        );
      } else if (targetStatus === "NEW" || targetStatus === "CONFIRMED") {
        const kotData = data.kot || {
          id: data.kitchenOrderId,
          orderId: data.orderId,
          kotNumber: data.kotNumber,
          tableNumber: data.tableNumber,
          orderType: data.orderType,
          status: "NEW",
          items: data.items || [],
        };
        setKotOrders((prev) => {
          const exists = prev.some(
            (k) =>
              k.id === kotData.id ||
              k.id === data.kitchenOrderId ||
              (k.orderId && k.orderId === data.orderId)
          );
          if (exists) {
            return prev.map((k) =>
              k.id === kotData.id || k.id === data.kitchenOrderId || k.orderId === data.orderId
                ? { ...k, ...kotData, status: "NEW" }
                : k
            );
          }
          return [kotData, ...prev];
        });
      }

      // Background synchronization from DB
      debouncedFetchKOTs();
    };

    const unsubscribeUpdated = subscribeToKitchenOrderUpdated(handleOrderUpdate);
    const unsubscribeStatus = subscribeToOrderStatus(handleOrderUpdate);

    // 3. Handle Auto-Reconnection
    const unsubscribeReconnect = subscribeToReconnect(() => {
      console.log("🔄 [KDS] Socket reconnected - resynchronizing queue...");
      const compId = companyIdRef.current;
      if (compId) joinCompanyRoom(compId);
      if (selectedRestIdRef.current) joinOutletRoom(selectedRestIdRef.current, compId);
      debouncedFetchKOTs();
    });

    // Fallback sync interval (12s)
    const interval = setInterval(fetchKOTs, 12000);

    return () => {
      clearInterval(interval);
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeStatus();
      unsubscribeReconnect();
      leaveOutletRoom(selectedRestaurantId);
    };
  }, [selectedRestaurantId, company?.id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await restaurantService.getRestaurants();
      const list = res.data || res || [];
      setRestaurants(list);
      if (list.length > 0) {
        let assigned = list[0].id;
        if (user?.restaurantId) {
          const match = list.find((r) => r.id === user.restaurantId);
          if (match) assigned = match.id;
        } else if (user?.branchId) {
          const match = list.find((r) => r.branchId === user.branchId);
          if (match) assigned = match.id;
        }
        setSelectedRestaurantId(assigned);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchKOTs = async () => {
    try {
      const outletId =
        selectedRestaurantId && selectedRestaurantId !== "ALL"
          ? selectedRestaurantId
          : undefined;
      const res = await restaurantService.getKitchenOrders(outletId, "ACTIVE");
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      // Kitchen Display only manages active preparation tickets (NEW, PREPARING)
      const activeTickets = list.filter(
        (k) => k.status !== "READY" && k.status !== "SERVED" && k.status !== "COMPLETED" && k.status !== "CANCELLED"
      );
      setKotOrders(activeTickets);
      setLiveSyncActive(true);
    } catch (err) {
      console.warn("KOT fetch transient error (will retry):", err?.message || err);
    }
  };

  const handleStartPreparing = async (id) => {
    try {
      // Optimistic in-memory update
      setKotOrders((prev) =>
        prev.map((k) => (k.id === id ? { ...k, status: "PREPARING" } : k))
      );
      await restaurantService.startPreparation(id);
      debouncedFetchKOTs();
    } catch (err) {
      showError("KDS Action Failed", err.message);
      debouncedFetchKOTs();
    }
  };

  const handleMarkReady = async (id) => {
    try {
      // Optimistic removal: order has finished cooking, leaves KDS and moves to Waiter's Ready Orders
      setKotOrders((prev) => prev.filter((k) => k.id !== id));
      await restaurantService.markReady(id);
      debouncedFetchKOTs();
    } catch (err) {
      showError("KDS Action Failed", err.message);
      debouncedFetchKOTs();
    }
  };

  const newKOTs = kotOrders.filter(
    (k) => k.status === "NEW" || k.status === "CONFIRMED" || k.status === "PENDING"
  );
  const preparingKOTs = kotOrders.filter((k) => k.status === "PREPARING");

  if (loading) {
    return (
      <div
        style={{
          padding: "60px",
          textAlign: "center",
          color: "#64748b",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <FiRefreshCw
          className="animate-spin"
          size={32}
          style={{ marginBottom: "16px", color: "#2563eb" }}
        />
        <h2 style={{ fontSize: "20px", color: "#0f172a", margin: "0 0 8px 0" }}>
          Loading Kitchen Display System...
        </h2>
        <p style={{ margin: 0 }}>Fetching KOT Preparation Queue & Kitchen Tickets...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1600px",
        margin: "0 auto",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "20px 24px",
          border: "1px solid #e2e8f0",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              background: "#d1fae5",
              padding: "12px",
              borderRadius: "12px",
              color: "#059669",
            }}
          >
            <FiTv size={26} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: "800", margin: 0, color: "#0f172a" }}>
                Kitchen Display System (KDS)
              </h1>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: liveSyncActive ? "#16a34a" : "#ca8a04",
                  backgroundColor: liveSyncActive ? "#dcfce7" : "#fef9c3",
                  padding: "3px 10px",
                  borderRadius: "20px",
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    backgroundColor: liveSyncActive ? "#16a34a" : "#ca8a04",
                  }}
                />
                Live Real-Time
              </span>
            </div>
            <p style={{ color: "#64748b", margin: "3px 0 0 0", fontSize: "14px" }}>
              Kitchen preparation queue. Mark ready when cooking is complete to notify Waiter for serving.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {isAdmin && restaurants.length > 0 && (
            <select
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              style={{
                padding: "9px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                fontWeight: "700",
                color: "#1e293b",
                fontSize: "13px",
              }}
            >
              {restaurants.length > 1 && <option value="ALL">🏬 All Kitchen Outlets</option>}
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  🏬 {r.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={fetchKOTs}
            style={{
              padding: "9px 16px",
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#334155",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FiRefreshCw size={15} /> Refresh KOT Queue
          </button>
        </div>
      </div>

      {/* Empty State when zero active orders */}
      {kotOrders.length === 0 ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "64px 20px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <FiTv size={48} color="#94a3b8" style={{ marginBottom: "16px" }} />
          <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0" }}>
            No active kitchen orders
          </h3>
          <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
            New orders confirmed from Restaurant POS will automatically appear here on the KDS display without page refresh.
          </p>
        </div>
      ) : (
        /* KOT Queue 2-Column Grid: 1. NEW KOT, 2. PREPARING */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {/* COLUMN 1: NEW KOTs */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid #e2e8f0",
              borderTop: "4px solid #2563eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#2563eb" }}>
                  NEW KOT ({newKOTs.length})
                </h3>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>
                  Pending preparation start
                </span>
              </div>
              <span
                style={{
                  background: "#dbeafe",
                  color: "#1e40af",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              >
                NEW
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {newKOTs.length === 0 ? (
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: "13px",
                    margin: 0,
                    textAlign: "center",
                    padding: "32px 0",
                  }}
                >
                  No new incoming orders.
                </p>
              ) : (
                newKOTs.map((kot) => (
                  <KOTCard
                    key={kot.id}
                    kot={kot}
                    onAction={() => handleStartPreparing(kot.id)}
                    actionText="Start Preparing"
                    actionColor="#2563eb"
                    icon={FiPlay}
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 2: PREPARING KOTs */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid #e2e8f0",
              borderTop: "4px solid #f59e0b",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#d97706" }}>
                  PREPARING ({preparingKOTs.length})
                </h3>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>
                  Cooking in kitchen
                </span>
              </div>
              <span
                style={{
                  background: "#fef3c7",
                  color: "#92400e",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              >
                COOKING
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {preparingKOTs.length === 0 ? (
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: "13px",
                    margin: 0,
                    textAlign: "center",
                    padding: "32px 0",
                  }}
                >
                  No orders currently preparing.
                </p>
              ) : (
                preparingKOTs.map((kot) => (
                  <KOTCard
                    key={kot.id}
                    kot={kot}
                    onAction={() => handleMarkReady(kot.id)}
                    actionText="Mark Ready (Send to Waiter)"
                    actionColor="#16a34a"
                    icon={FiCheck}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KOTCard({ kot, onAction, actionText, actionColor, icon: Icon }) {
  const createdTime = kot.createdAt
    ? new Date(kot.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        borderRadius: "14px",
        padding: "18px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* KOT Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          paddingBottom: "10px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div>
          <span style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
            {kot.kotNumber}
          </span>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "#2563eb", marginTop: "2px" }}>
            {kot.tableNumber ? `Table ${kot.tableNumber}` : `(${kot.orderType})`}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            color: "#64748b",
            fontWeight: "600",
          }}
        >
          <FiClock size={14} />
          <span>{createdTime}</span>
        </div>
      </div>

      {/* Items List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
        {kot.items?.map((i, idx) => (
          <div
            key={i.id || idx}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#ffffff",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #f1f5f9",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
              {i.quantity}x {i.menuItem?.name || i.product?.name || i.productName || i.name || "Dish"}
            </span>
          </div>
        ))}
      </div>

      {/* Special Kitchen Notes */}
      {kot.notes && (
        <div
          style={{
            backgroundColor: "#fef3c7",
            border: "1px solid #fde68a",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#92400e",
            fontWeight: "600",
            marginBottom: "16px",
          }}
        >
          Note: {kot.notes}
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={onAction}
        style={{
          width: "100%",
          padding: "11px",
          backgroundColor: actionColor,
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          fontWeight: "800",
          fontSize: "13px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          boxShadow: `0 4px 6px -1px ${actionColor}33`,
          transition: "transform 0.1s ease, box-shadow 0.1s ease",
        }}
      >
        <Icon size={16} />
        <span>{actionText}</span>
      </button>
    </div>
  );
}
