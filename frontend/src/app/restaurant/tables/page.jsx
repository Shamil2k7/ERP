"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { restaurantService } from "@/services/restaurantService";
import { useCompany } from "@/context/CompanyContext";
import {
  joinCompanyRoom,
  joinOutletRoom,
  leaveOutletRoom,
  subscribeToAreaCreated,
  subscribeToAreaUpdated,
  subscribeToAreaDeleted,
  subscribeToTableCreated,
  subscribeToTableUpdated,
  subscribeToTableStatusUpdated,
  subscribeToTableDeleted,
  subscribeToOrderStatus,
  subscribeToKitchenOrderCreated,
  subscribeToReconnect,
} from "@/services/socketService";
import { FiPlus, FiCoffee, FiEdit, FiTrash2, FiRefreshCw, FiCheckCircle } from "react-icons/fi";
import { showSuccess, showError, showWarning, showConfirm } from "@/utils/swal";

function RestaurantTablesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryRestaurantId = searchParams.get("restaurantId") || "";

  const { user, company } = useCompany();
  const roleStr = String(user?.role || user?.roleRef?.name || user?.type || "").toUpperCase();
  const isCashier = roleStr.includes("CASHIER") || roleStr.includes("BILLING") || roleStr.includes("COUNTER");
  const isWaiter = roleStr.includes("WAITER") || roleStr.includes("STEWARD") || roleStr.includes("SERVER");
  const isAdmin = roleStr.includes("SUPER") || roleStr.includes("ADMIN") || roleStr.includes("OWNER");
  const isManager = roleStr.includes("MANAGER");
  const canManage = (isAdmin || isManager) && !isCashier && !isWaiter;

  const [loading, setLoading] = useState(true);

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(queryRestaurantId);

  const [areas, setAreas] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState("ALL");
  const [liveSyncActive, setLiveSyncActive] = useState(true);

  // Modals
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [areaName, setAreaName] = useState("");
  const [modalRestaurantId, setModalRestaurantId] = useState("");

  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [tableForm, setTableForm] = useState({ tableNumber: "", capacity: 4, areaId: "" });

  const [selectedTable, setSelectedTable] = useState(null);

  const selectedRestIdRef = useRef(selectedRestaurantId);
  const companyIdRef = useRef(company?.id || user?.companyId);

  useEffect(() => {
    selectedRestIdRef.current = selectedRestaurantId;
  }, [selectedRestaurantId]);

  const floorPlanTimeoutRef = useRef(null);
  const debouncedFetchFloorPlan = (restId) => {
    if (floorPlanTimeoutRef.current) clearTimeout(floorPlanTimeoutRef.current);
    floorPlanTimeoutRef.current = setTimeout(() => {
      fetchFloorPlan(restId);
    }, 400);
  };

  useEffect(() => {
    const currentCompId = company?.id || user?.companyId;
    if (currentCompId) {
      joinCompanyRoom(currentCompId);
    }
  }, [company?.id, user?.companyId]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Real-Time Socket.IO Synchronization for Areas & Tables
  useEffect(() => {
    if (!selectedRestaurantId) return;

    const currentCompId = company?.id || user?.companyId;
    if (currentCompId) joinCompanyRoom(currentCompId);
    joinOutletRoom(selectedRestaurantId, currentCompId);

    // 1. New Area Created
    const unsubscribeAreaCreated = subscribeToAreaCreated((data) => {
      console.log("⚡ [Table Management] Real-time Area Created:", data);
      if (data.companyId && currentCompId && data.companyId !== currentCompId) return;
      if (
        selectedRestIdRef.current &&
        selectedRestIdRef.current !== "ALL" &&
        data.restaurantId &&
        data.restaurantId !== selectedRestIdRef.current
      ) {
        return;
      }

      if (data.area) {
        setAreas((prev) => {
          const exists = prev.some((a) => a.id === data.area.id);
          if (exists) return prev;
          return [...prev, { ...data.area, tables: data.area.tables || [] }];
        });
      }
      fetchFloorPlan(selectedRestIdRef.current);
    });

    // 2. Area Updated
    const unsubscribeAreaUpdated = subscribeToAreaUpdated((data) => {
      console.log("⚡ [Table Management] Real-time Area Updated:", data);
      if (data.companyId && currentCompId && data.companyId !== currentCompId) return;
      if (
        selectedRestIdRef.current &&
        selectedRestIdRef.current !== "ALL" &&
        data.restaurantId &&
        data.restaurantId !== selectedRestIdRef.current
      ) {
        return;
      }

      if (data.area) {
        setAreas((prev) =>
          prev.map((a) => (a.id === data.area.id ? { ...a, ...data.area } : a))
        );
      }
      fetchFloorPlan(selectedRestIdRef.current);
    });

    // 3. Area Deleted
    const unsubscribeAreaDeleted = subscribeToAreaDeleted((data) => {
      console.log("⚡ [Table Management] Real-time Area Deleted:", data);
      if (data.companyId && currentCompId && data.companyId !== currentCompId) return;

      setAreas((prev) => prev.filter((a) => a.id !== data.areaId));
      fetchFloorPlan(selectedRestIdRef.current);
    });

    // 4. New Table Created
    const unsubscribeTableCreated = subscribeToTableCreated((data) => {
      console.log("⚡ [Table Management] Real-time Table Created:", data);
      if (data.companyId && currentCompId && data.companyId !== currentCompId) return;
      if (
        selectedRestIdRef.current &&
        selectedRestIdRef.current !== "ALL" &&
        data.restaurantId &&
        data.restaurantId !== selectedRestIdRef.current
      ) {
        return;
      }

      const newTable = data.table || {
        id: data.tableId,
        tableNumber: data.tableNumber,
        areaId: data.areaId,
        capacity: data.capacity || 4,
        status: data.status || "AVAILABLE",
        orders: [],
      };

      setAreas((prev) =>
        prev.map((a) => {
          if (a.id === newTable.areaId) {
            const curTables = Array.isArray(a.tables) ? a.tables : [];
            const exists = curTables.some((t) => t.id === newTable.id);
            if (exists) {
              return {
                ...a,
                tables: curTables.map((t) => (t.id === newTable.id ? { ...t, ...newTable } : t)),
              };
            }
            return {
              ...a,
              tables: [...curTables, newTable].sort((x, y) =>
                String(x.tableNumber).localeCompare(String(y.tableNumber), undefined, { numeric: true })
              ),
            };
          }
          return a;
        })
      );
      fetchFloorPlan(selectedRestIdRef.current);
    });

    // 5. Table Updated
    const unsubscribeTableUpdated = subscribeToTableUpdated((data) => {
      console.log("⚡ [Table Management] Real-time Table Updated:", data);
      if (data.companyId && currentCompId && data.companyId !== currentCompId) return;
      if (
        selectedRestIdRef.current &&
        selectedRestIdRef.current !== "ALL" &&
        data.restaurantId &&
        data.restaurantId !== selectedRestIdRef.current
      ) {
        return;
      }

      const tblId = data.tableId || data.table?.id;
      const targetStatus = data.status || data.table?.status;

      setAreas((prev) =>
        prev.map((a) => ({
          ...a,
          tables: (a.tables || []).map((t) => {
            if (t.id === tblId) {
              return {
                ...t,
                ...(data.table || {}),
                ...(targetStatus ? { status: targetStatus } : {}),
              };
            }
            return t;
          }),
        }))
      );

      setSelectedTable((prev) => {
        if (prev && prev.id === tblId) {
          return {
            ...prev,
            ...(data.table || {}),
            ...(targetStatus ? { status: targetStatus } : {}),
          };
        }
        return prev;
      });

      fetchFloorPlan(selectedRestIdRef.current);
    });

    // 6. Table Status Updated (AVAILABLE, OCCUPIED, RESERVED, CLEANING, BLOCKED)
    const handleStatusUpdate = (data) => {
      console.log("⚡ [Table Management] Real-time Table Status Updated:", data);
      if (data.companyId && currentCompId && data.companyId !== currentCompId) return;
      if (
        selectedRestIdRef.current &&
        selectedRestIdRef.current !== "ALL" &&
        data.restaurantId &&
        data.restaurantId !== selectedRestIdRef.current
      ) {
        return;
      }

      const tblId = data.tableId || data.table?.id || data.id;
      const targetStatus = data.status || data.table?.status;

      if (tblId && targetStatus) {
        setAreas((prev) =>
          prev.map((a) => ({
            ...a,
            tables: (a.tables || []).map((t) => {
              if (t.id === tblId || (data.tableNumber && t.tableNumber === data.tableNumber)) {
                return { ...t, status: targetStatus };
              }
              return t;
            }),
          }))
        );

        setSelectedTable((prev) => {
          if (prev && (prev.id === tblId || (data.tableNumber && prev.tableNumber === data.tableNumber))) {
            return { ...prev, status: targetStatus };
          }
          return prev;
        });
      }

      fetchFloorPlan(selectedRestIdRef.current);
    };

    const unsubscribeTableStatus = subscribeToTableStatusUpdated(handleStatusUpdate);

    // 7. Table Deleted
    const unsubscribeTableDeleted = subscribeToTableDeleted((data) => {
      console.log("⚡ [Table Management] Real-time Table Deleted:", data);
      if (data.companyId && currentCompId && data.companyId !== currentCompId) return;

      setAreas((prev) =>
        prev.map((a) => ({
          ...a,
          tables: (a.tables || []).filter((t) => t.id !== data.tableId),
        }))
      );

      setSelectedTable((prev) => (prev && prev.id === data.tableId ? null : prev));
      fetchFloorPlan(selectedRestIdRef.current);
    });

    // 8. Order Status updates altering table occupancy (Waiter POS sends order, payment completed, etc.)
    const handleOrderEvent = (data) => {
      if (data.companyId && currentCompId && data.companyId !== currentCompId) return;
      if (
        selectedRestIdRef.current &&
        selectedRestIdRef.current !== "ALL" &&
        data.restaurantId &&
        data.restaurantId !== selectedRestIdRef.current
      ) {
        return;
      }

      if (data.tableId) {
        let newStatus = null;
        if (
          data.status === "NEW" ||
          data.status === "DRAFT" ||
          data.status === "HELD" ||
          data.status === "CONFIRMED" ||
          data.status === "SENT_TO_KITCHEN" ||
          data.status === "PREPARING" ||
          data.status === "READY" ||
          data.status === "SERVED" ||
          data.status === "OCCUPIED"
        ) {
          newStatus = "OCCUPIED";
        } else if (data.status === "COMPLETED" || data.status === "CANCELLED" || data.status === "AVAILABLE") {
          newStatus = "AVAILABLE";
        }

        if (newStatus) {
          setAreas((prev) =>
            prev.map((a) => ({
              ...a,
              tables: (a.tables || []).map((t) =>
                t.id === data.tableId ? { ...t, status: newStatus } : t
              ),
            }))
          );
        }

      }
      fetchFloorPlan(selectedRestIdRef.current);
    };

    const unsubscribeOrderStatus = subscribeToOrderStatus(handleOrderEvent);
    const unsubscribeKotCreated = subscribeToKitchenOrderCreated(handleOrderEvent);

    // 9. Auto-Reconnection Handler
    const unsubscribeReconnect = subscribeToReconnect(() => {
      console.log("🔄 [Table Management] Socket reconnected - resynchronizing floor plan...");
      const compId = companyIdRef.current;
      joinCompanyRoom(compId);
      joinOutletRoom(selectedRestIdRef.current, compId);
      fetchFloorPlan(selectedRestIdRef.current);
    });

    return () => {
      if (floorPlanTimeoutRef.current) clearTimeout(floorPlanTimeoutRef.current);
      unsubscribeAreaCreated();
      unsubscribeAreaUpdated();
      unsubscribeAreaDeleted();
      unsubscribeTableCreated();
      unsubscribeTableUpdated();
      unsubscribeTableStatus();
      unsubscribeTableDeleted();
      unsubscribeOrderStatus();
      unsubscribeKotCreated();
      unsubscribeReconnect();
      leaveOutletRoom(selectedRestaurantId);
    };
  }, [selectedRestaurantId, company?.id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await restaurantService.getRestaurants();
      const list = res.data || [];
      setRestaurants(list);
      const assigned = queryRestaurantId || (list.length > 0 ? list[0].id : "");
      if (assigned) {
        setSelectedRestaurantId(assigned);
        setModalRestaurantId(assigned);
      }
      await fetchFloorPlan(assigned && assigned !== "ALL" ? assigned : undefined);
    } catch (err) {
      console.error("Error loading floor plan:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFloorPlan = async (restaurantId) => {
    try {
      const res = await restaurantService.getFloorPlan(restaurantId);
      const areasList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : res?.data?.areas || [];
      setAreas(areasList);
      setLiveSyncActive(true);
    } catch (err) {
      console.error("Error loading floor plan:", err);
    }
  };

  const handleCreateArea = async (e) => {
    e.preventDefault();
    const targetRestId = modalRestaurantId || selectedRestaurantId || (restaurants[0]?.id);

    if (!areaName.trim()) {
      showWarning("Name Required", "Please enter an Area Name (e.g., Ground Floor, VIP).");
      return;
    }

    if (!targetRestId) {
      showWarning("Outlet Required", "No Restaurant Outlet found. Please create a restaurant outlet first.");
      return;
    }

    try {
      await restaurantService.createArea({
        name: areaName.trim(),
        restaurantId: targetRestId,
      });
      setAreaName("");
      setShowAddAreaModal(false);
      setSelectedRestaurantId(targetRestId);
      fetchFloorPlan(targetRestId);
      showSuccess("Area Created", "Dining Area created successfully!");
    } catch (err) {
      showError("Failed", err.response?.data?.message || err.message || "Failed to create area");
    }
  };

  const handleCreateTable = async (e) => {
    e.preventDefault();
    const targetRestId = selectedRestaurantId || (restaurants[0]?.id);

    if (!tableForm.tableNumber || !tableForm.areaId) {
      showWarning("Fields Required", "Please fill in Table Number and select an Area.");
      return;
    }

    try {
      await restaurantService.createTable({
        ...tableForm,
        capacity: parseInt(tableForm.capacity),
        restaurantId: targetRestId,
      });
      setTableForm({ tableNumber: "", capacity: 4, areaId: "" });
      setShowAddTableModal(false);
      fetchFloorPlan(targetRestId);
      showSuccess("Table Created", "Table created successfully!");
    } catch (err) {
      showError("Failed", err.response?.data?.message || err.message || "Failed to create table");
    }
  };

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      // Optimistic in-memory update
      setAreas((prev) =>
        prev.map((a) => ({
          ...a,
          tables: (a.tables || []).map((t) =>
            t.id === tableId ? { ...t, status: newStatus } : t
          ),
        }))
      );
      if (selectedTable && selectedTable.id === tableId) {
        setSelectedTable((prev) => ({ ...prev, status: newStatus }));
      }

      await restaurantService.updateTableStatus(tableId, newStatus);
      setSelectedTable(null);
      fetchFloorPlan(selectedRestaurantId);
    } catch (err) {
      showError("Status Update Failed", err.response?.data?.message || err.message);
      fetchFloorPlan(selectedRestaurantId);
    }
  };

  const handleOpenPOSForTable = (table) => {
    if (!table || !table.id) return;
    const activeOrder = table.orders && table.orders.length > 0 ? table.orders[0] : null;
    const targetRestId = table.restaurantId || selectedRestaurantId || (restaurants[0]?.id || "");
    const orderQuery = activeOrder?.id ? `&orderId=${activeOrder.id}` : "";
    const outletQuery = targetRestId ? `&outletId=${targetRestId}&restaurantId=${targetRestId}` : "";
    const modeQuery = isCashier ? "&mode=billing" : "";
    router.push(`/restaurant/pos?tableId=${table.id}${orderQuery}${outletQuery}${modeQuery}`);
  };

  const handleDeleteArea = async (areaId) => {
    if (!canManage) return;
    const isConfirmed = await showConfirm({
      title: "Delete Dining Area?",
      text: "Are you sure you want to delete this dining area?",
      confirmButtonText: "Yes, Delete",
      icon: "warning",
    });
    if (!isConfirmed) return;
    try {
      // Optimistic in-memory removal
      setAreas((prev) => prev.filter((a) => a.id !== areaId));
      await restaurantService.deleteArea(areaId);
      fetchFloorPlan(selectedRestaurantId);
      showSuccess("Deleted", "Dining area deleted successfully!");
    } catch (err) {
      showError("Delete Failed", err.response?.data?.message || err.message);
      fetchFloorPlan(selectedRestaurantId);
    }
  };

  const handleDeleteTable = async (tableId, e) => {
    if (e) e.stopPropagation();
    if (!canManage) return;
    const isConfirmed = await showConfirm({
      title: "Delete Table?",
      text: "Are you sure you want to delete this table?",
      confirmButtonText: "Yes, Delete",
      icon: "warning",
    });
    if (!isConfirmed) return;
    try {
      // Optimistic in-memory removal
      setAreas((prev) =>
        prev.map((a) => ({
          ...a,
          tables: (a.tables || []).filter((t) => t.id !== tableId),
        }))
      );
      if (selectedTable && selectedTable.id === tableId) {
        setSelectedTable(null);
      }
      await restaurantService.deleteTable(tableId);
      fetchFloorPlan(selectedRestaurantId);
      showSuccess("Deleted", "Table deleted successfully!");
    } catch (err) {
      showError("Delete Failed", err.response?.data?.message || err.message);
      fetchFloorPlan(selectedRestaurantId);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: "#64748b", fontFamily: "Inter, sans-serif" }}>
        <FiRefreshCw className="animate-spin" size={32} style={{ marginBottom: "16px", color: "#2563eb" }} />
        <h2 style={{ fontSize: "20px", color: "#0f172a", margin: "0 0 8px 0" }}>Loading Floor Plan...</h2>
        <p style={{ margin: 0 }}>Fetching restaurant areas, seating layout, and live table statuses...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>
              Restaurant Table Management
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
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>
            Live floor plan, table statuses, and seating layout with zero-refresh synchronization.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {restaurants.length > 0 && (
            <select
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#fff",
                fontWeight: "700",
                color: "#1e293b",
                fontSize: "13px",
              }}
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  🏬 {r.name}
                </option>
              ))}
            </select>
          )}

          {canManage && (
            <>
              <button
                onClick={() => {
                  setModalRestaurantId(selectedRestaurantId || (restaurants[0]?.id || ""));
                  setShowAddAreaModal(true);
                }}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontWeight: "700",
                  color: "#334155",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                }}
              >
                <FiPlus /> Add Area
              </button>

              <button
                onClick={() => {
                  if (areas.length === 0) {
                    showWarning("Area Required", "Please add at least one dining area first.");
                    return;
                  }
                  setTableForm((prev) => ({ ...prev, areaId: areas[0]?.id || "" }));
                  setShowAddTableModal(true);
                }}
                style={{
                  padding: "10px 18px",
                  backgroundColor: "#2563eb",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "700",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
                }}
              >
                <FiPlus /> Add Table
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table Legend */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "24px",
          backgroundColor: "#fff",
          padding: "14px 20px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: "800", color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Status Legend:
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", color: "#166534" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#22c55e" }}></span>
          <span>AVAILABLE</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", color: "#991b1b" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ef4444" }}></span>
          <span>OCCUPIED</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", color: "#1e40af" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#3b82f6" }}></span>
          <span>RESERVED</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", color: "#854d0e" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#eab308" }}></span>
          <span>CLEANING</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", color: "#334155" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#64748b" }}></span>
          <span>BLOCKED</span>
        </div>
      </div>

      {/* Floor Plan Display grouped by Areas */}
      {areas.length === 0 ? (
        <div style={{ backgroundColor: "#fff", padding: "64px 20px", borderRadius: "16px", textAlign: "center", border: "1px solid #e2e8f0" }}>
          <FiCoffee size={48} color="#94a3b8" style={{ marginBottom: "16px" }} />
          <h3 style={{ color: "#0f172a", fontSize: "20px", fontWeight: "800", margin: "0 0 6px 0" }}>No floors or areas found</h3>
          <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 20px 0" }}>Create your first dining floor or section to configure tables.</p>
          {canManage && (
            <button
              onClick={() => {
                setModalRestaurantId(selectedRestaurantId || (restaurants[0]?.id || ""));
                setShowAddAreaModal(true);
              }}
              style={{ padding: "10px 24px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}
            >
              + Add Area
            </button>
          )}
        </div>
      ) : (
        (selectedAreaId === "ALL" ? areas : areas.filter((a) => a.id === selectedAreaId)).map((area) => {
          const areaTables = Array.isArray(area.tables) ? area.tables : [];

          return (
            <div key={area.id} style={{ marginBottom: "32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <span>{area.name}</span>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb", backgroundColor: "#eff6ff", padding: "3px 12px", borderRadius: "12px", border: "1px solid #dbeafe" }}>
                    {areaTables.length} tables
                  </span>
                </h2>

                {canManage && (
                  <button
                    onClick={() => handleDeleteArea(area.id)}
                    style={{ padding: "6px 12px", backgroundColor: "#fee2e2", color: "#991b1b", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                    title="Delete Area"
                  >
                    <FiTrash2 size={14} /> Delete Area
                  </button>
                )}
              </div>

              {areaTables.length === 0 ? (
                <div style={{ backgroundColor: "#fff", padding: "32px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 12px 0" }}>No tables found in this area</p>
                  {canManage && (
                    <button
                      onClick={() => {
                        setTableForm((prev) => ({ ...prev, areaId: area.id }));
                        setShowAddTableModal(true);
                      }}
                      style={{ padding: "8px 18px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                    >
                      + Add Table
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                  {areaTables.map((tbl) => {
                    const isOccupied = tbl.status === "OCCUPIED";
                    const isReserved = tbl.status === "RESERVED";
                    const isAvailable = tbl.status === "AVAILABLE";
                    const isCleaning = tbl.status === "CLEANING";

                    const bg = isOccupied ? "#fef2f2" : isReserved ? "#eff6ff" : isAvailable ? "#f0fdf4" : isCleaning ? "#fefce8" : "#f8fafc";
                    const border = isOccupied ? "#ef4444" : isReserved ? "#3b82f6" : isAvailable ? "#22c55e" : isCleaning ? "#eab308" : "#cbd5e1";
                    const textColor = isOccupied ? "#991b1b" : isReserved ? "#1e40af" : isAvailable ? "#166534" : isCleaning ? "#854d0e" : "#334155";

                    const activeOrder = tbl.orders && tbl.orders.length > 0 ? tbl.orders[0] : null;

                    return (
                      <div
                        key={tbl.id}
                        onClick={() => setSelectedTable(tbl)}
                        style={{
                          backgroundColor: bg,
                          border: `2px solid ${border}`,
                          borderRadius: "14px",
                          padding: "16px",
                          cursor: "pointer",
                          transition: "transform 0.15s ease, box-shadow 0.15s ease",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.04)",
                          position: "relative",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "18px", fontWeight: "800", color: textColor }}>{tbl.tableNumber}</span>
                          {canManage && (
                            <button
                              onClick={(e) => handleDeleteTable(tbl.id, e)}
                              style={{ background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "4px", padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center" }}
                              title="Delete Table"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: "12px", color: textColor, fontWeight: "600", marginTop: "4px" }}>
                          {tbl.capacity} Seats
                        </div>

                        <div style={{ marginTop: "12px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "800",
                              backgroundColor: border,
                              color: "#fff",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {tbl.status}
                          </span>
                        </div>

                        {activeOrder && (
                          <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: `1px solid ${border}40`, fontSize: "12px", fontWeight: "700", color: textColor }}>
                            Order: {activeOrder.orderNumber}
                            <div style={{ fontSize: "14px", fontWeight: "800", marginTop: "2px" }}>
                              ₹{parseFloat(activeOrder.totalAmount || 0).toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Add Area Modal */}
      {showAddAreaModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "14px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Create Dining Area</h3>
            <form onSubmit={handleCreateArea}>
              {restaurants.length > 1 && (
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Restaurant Outlet</label>
                  <select
                    value={modalRestaurantId}
                    onChange={(e) => setModalRestaurantId(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  >
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Area Name <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Ground Floor, VIP Section, Terrace"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowAddAreaModal(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", color: "#475569", fontWeight: "600", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 18px", borderRadius: "8px", backgroundColor: "#2563eb", color: "#fff", border: "none", fontWeight: "700", cursor: "pointer" }}>
                  Save Area
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddTableModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "14px", width: "100%", maxWidth: "450px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Add New Table</h3>
            <form onSubmit={handleCreateTable}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Area <span style={{ color: "#ef4444" }}>*</span></label>
                <select
                  value={tableForm.areaId}
                  onChange={(e) => setTableForm({ ...tableForm, areaId: e.target.value })}
                  required
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                >
                  <option value="">Select Area...</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Table Number / Identifier <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Table 01, T-12"
                  value={tableForm.tableNumber}
                  onChange={(e) => setTableForm({ ...tableForm, tableNumber: e.target.value })}
                  required
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Capacity (Seats)</label>
                <input
                  type="number"
                  min="1"
                  value={tableForm.capacity}
                  onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowAddTableModal(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", color: "#475569", fontWeight: "600", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 18px", borderRadius: "8px", backgroundColor: "#2563eb", color: "#fff", border: "none", fontWeight: "700", cursor: "pointer" }}>
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Table Action Drawer */}
      {selectedTable && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "14px", width: "100%", maxWidth: "450px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>{selectedTable.tableNumber}</h3>
              <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "800", backgroundColor: "#f1f5f9", textTransform: "uppercase" }}>
                {selectedTable.status}
              </span>
            </div>

            <p style={{ color: "#64748b", margin: "0 0 20px 0", fontSize: "14px" }}>
              Capacity: {selectedTable.capacity} Seats | Area: {selectedTable.area?.name || "Dining"}
            </p>

            {/* Quick Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              <button
                onClick={() => handleOpenPOSForTable(selectedTable)}
                style={{
                  padding: "12px",
                  backgroundColor: isCashier ? "#16a34a" : "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontSize: "14px",
                  boxShadow: isCashier ? "0 2px 6px rgba(22, 163, 74, 0.25)" : "0 2px 6px rgba(37, 99, 235, 0.25)",
                }}
              >
                {isCashier
                  ? (selectedTable.orders?.length > 0 || selectedTable.status === "OCCUPIED"
                      ? "🧾 Open Order in POS for Billing"
                      : "🧾 Open POS for Billing")
                  : (selectedTable.status === "OCCUPIED" ? "Open Active Order in POS" : "Take Order / Open POS")}
              </button>

              {!isCashier && (
                <>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#334155", marginTop: "10px", textTransform: "uppercase" }}>Change Table Status:</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <button onClick={() => handleStatusChange(selectedTable.id, "AVAILABLE")} style={{ padding: "8px", backgroundColor: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: "6px", fontWeight: "700", cursor: "pointer" }}>AVAILABLE</button>
                    <button onClick={() => handleStatusChange(selectedTable.id, "OCCUPIED")} style={{ padding: "8px", backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: "6px", fontWeight: "700", cursor: "pointer" }}>OCCUPIED</button>
                    <button onClick={() => handleStatusChange(selectedTable.id, "RESERVED")} style={{ padding: "8px", backgroundColor: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe", borderRadius: "6px", fontWeight: "700", cursor: "pointer" }}>RESERVED</button>
                    <button onClick={() => handleStatusChange(selectedTable.id, "CLEANING")} style={{ padding: "8px", backgroundColor: "#fefce8", color: "#854d0e", border: "1px solid #fef08a", borderRadius: "6px", fontWeight: "700", cursor: "pointer" }}>CLEANING</button>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedTable(null)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", color: "#475569", fontWeight: "600", cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RestaurantTablesPage() {
  return (
    <Suspense fallback={<div style={{ padding: "32px", textAlign: "center" }}>Loading Floor Plan...</div>}>
      <RestaurantTablesContent />
    </Suspense>
  );
}
