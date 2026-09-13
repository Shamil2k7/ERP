"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  FiBarChart2,
  FiDollarSign,
  FiShoppingBag,
  FiCoffee,
  FiTruck,
  FiTrendingUp,
  FiCalendar,
  FiRefreshCw,
  FiUsers,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiPieChart,
  FiLayers,
  FiArrowUpRight,
  FiArrowDownRight,
  FiPercent,
  FiActivity,
  FiGrid,
} from "react-icons/fi";
import { restaurantService } from "@/services/restaurantService";
import { socketService, joinOutletRoom, subscribeToOrderStatus } from "@/services/socketService";
import { useCompany } from "@/context/CompanyContext";
import { showError, showWarning } from "@/utils/swal";

export default function RestaurantReportsPage() {
  const { user } = useCompany();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("ALL");

  // Filter States
  const [period, setPeriod] = useState("today");
  const [customStartDate, setCustomStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Active sub-tabs for menu & inventory
  const [menuSortBy, setMenuSortBy] = useState("quantity"); // "quantity" | "revenue"
  const [inventoryTab, setInventoryTab] = useState("lowStock"); // "lowStock" | "outOfStock"

  // Report Data State
  const [reportData, setReportData] = useState(null);

  // Fetch initial restaurants list
  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await restaurantService.getRestaurants();
      const list = res.data || [];
      setRestaurants(list);
      if (list.length > 0) {
        // If single restaurant or default
        setSelectedRestaurantId(list[0].id);
      }
    } catch (err) {
      console.error("Error fetching restaurants for reports:", err);
    }
  };

  // Fetch report data
  const loadReports = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else if (!reportData) setLoading(true);

      try {
        if (period === "custom" && customStartDate > customEndDate) {
          showWarning(
            "Invalid Date Range",
            "Start date cannot be after end date."
          );
          setRefreshing(false);
          setLoading(false);
          return;
        }

        const params = {
          restaurantId:
            selectedRestaurantId === "ALL" ? undefined : selectedRestaurantId,
          period,
          startDate: period === "custom" ? customStartDate : undefined,
          endDate: period === "custom" ? customEndDate : undefined,
        };

        const res = await restaurantService.getRestaurantAnalytics(params);
        if (res.success && res.data) {
          setReportData(res.data);
        }
      } catch (err) {
        console.error("Error loading restaurant reports:", err);
        showError("Failed to Load Reports", err.message || "Unable to fetch analytics.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedRestaurantId, period, customStartDate, customEndDate, reportData]
  );

  // Reload when filters change
  useEffect(() => {
    loadReports();
  }, [selectedRestaurantId, period, customStartDate, customEndDate]);

  // Join socket outlet room when outlet changes
  useEffect(() => {
    if (selectedRestaurantId && selectedRestaurantId !== "ALL") {
      joinOutletRoom(selectedRestaurantId);
    }
  }, [selectedRestaurantId]);

  // Real-time socket auto-refresh listener
  useEffect(() => {
    const handleLiveUpdate = () => {
      loadReports(false);
    };

    const unsubscribe = subscribeToOrderStatus(handleLiveUpdate);
    socketService.on("order_created", handleLiveUpdate);
    socketService.on("order_status_updated", handleLiveUpdate);
    socketService.on("payment_completed", handleLiveUpdate);
    socketService.on("order_cancelled", handleLiveUpdate);

    return () => {
      if (unsubscribe) unsubscribe();
      socketService.off("order_created", handleLiveUpdate);
      socketService.off("order_status_updated", handleLiveUpdate);
      socketService.off("payment_completed", handleLiveUpdate);
      socketService.off("order_cancelled", handleLiveUpdate);
    };
  }, [loadReports]);

  // Menu items sorted by selected criterion
  const displayedMenuItems = useMemo(() => {
    if (!reportData?.menuPerformance) return [];
    if (menuSortBy === "revenue") {
      return reportData.menuPerformance.topRevenue || [];
    }
    return reportData.menuPerformance.topSelling || [];
  }, [reportData, menuSortBy]);

  const overview = reportData?.overview || {
    totalSales: 0,
    previousPeriodSales: 0,
    salesGrowthPercent: 0,
    totalOrders: 0,
    completedOrdersCount: 0,
    averageOrderValue: 0,
    liveActiveOrders: 0,
    totalCustomers: 0,
  };

  const salesTimeline = reportData?.salesTimeline || [];
  const maxTimelineSales = useMemo(() => {
    return Math.max(...salesTimeline.map((t) => t.sales || 0), 1);
  }, [salesTimeline]);

  return (
    <div style={{ padding: "24px", maxWidth: "1500px", margin: "0 auto", color: "#0f172a", fontFamily: "'Inter', sans-serif" }}>
      {/* ============================================================
          TOP HEADER & GLOBAL CONTROLS
      ============================================================ */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
          background: "#ffffff",
          padding: "20px 24px",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
            }}
          >
            <FiBarChart2 />
          </div>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>
              Restaurant Reports & Analytics
            </h1>
            <p style={{ color: "#64748b", fontSize: "13px", margin: "2px 0 0 0" }}>
              Real-time financial, sales, menu, and operational intelligence
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Restaurant Outlet Selector */}
          {restaurants.length > 0 && (
            <select
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              style={{
                height: "42px",
                padding: "0 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {restaurants.length > 1 && <option value="ALL">All Outlets</option>}
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}

          {/* Date Filter Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                height: "42px",
                padding: "0 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#0f172a",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range Inputs */}
          {period === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{
                  height: "42px",
                  padding: "0 10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  color: "#0f172a",
                  outline: "none",
                }}
              />
              <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "700" }}>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{
                  height: "42px",
                  padding: "0 10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  color: "#0f172a",
                  outline: "none",
                }}
              />
            </div>
          )}

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => loadReports(true)}
            disabled={refreshing}
            style={{
              height: "42px",
              padding: "0 16px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#334155",
              fontWeight: "600",
              fontSize: "13px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: refreshing ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <FiRefreshCw className={refreshing ? "spin" : ""} size={14} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {loading && !reportData ? (
        /* Loading Skeleton */
        <div style={{ padding: "80px 20px", textAlign: "center", background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
          <FiRefreshCw className="spin" size={32} style={{ color: "#2563eb", marginBottom: "16px" }} />
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#334155" }}>Loading Live Analytics...</h3>
          <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: "13px" }}>Compiling database aggregations for selected date range.</p>
        </div>
      ) : (
        <>
          {/* ============================================================
              1. OVERVIEW SUMMARY CARDS
          ============================================================ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            {/* CARD 1: TOTAL SALES */}
            <div
              style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Total Sales (Paid)
                  </span>
                  <div style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", marginTop: "6px" }}>
                    ₹{overview.totalSales.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                  <FiDollarSign />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "14px", fontSize: "12px" }}>
                {overview.salesGrowthPercent >= 0 ? (
                  <span style={{ color: "#2563eb", fontWeight: "700", display: "inline-flex", alignItems: "center" }}>
                    <FiArrowUpRight size={14} /> +{overview.salesGrowthPercent.toFixed(1)}%
                  </span>
                ) : (
                  <span style={{ color: "#dc2626", fontWeight: "700", display: "inline-flex", alignItems: "center" }}>
                    <FiArrowDownRight size={14} /> {overview.salesGrowthPercent.toFixed(1)}%
                  </span>
                )}
                <span style={{ color: "#94a3b8" }}>vs previous period</span>
              </div>
            </div>

            {/* CARD 2: TOTAL ORDERS */}
            <div
              style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Total Orders
                  </span>
                  <div style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", marginTop: "6px" }}>
                    {overview.totalOrders} <span style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Orders</span>
                  </div>
                </div>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                  <FiShoppingBag />
                </div>
              </div>
              <div style={{ marginTop: "14px", fontSize: "12px", color: "#64748b" }}>
                <strong style={{ color: "#2563eb" }}>{overview.completedOrdersCount} completed</strong> • {overview.totalOrders - overview.completedOrdersCount} in progress/other
              </div>
            </div>

            {/* CARD 3: AVERAGE ORDER VALUE */}
            <div
              style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Average Order Value (AOV)
                  </span>
                  <div style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", marginTop: "6px" }}>
                    ₹{overview.averageOrderValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                  <FiTrendingUp />
                </div>
              </div>
              <div style={{ marginTop: "14px", fontSize: "12px", color: "#64748b" }}>
                Per completed dine-in & takeaway bill
              </div>
            </div>

            {/* CARD 4: LIVE ACTIVE ORDERS */}
            <div
              style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Live Active Orders
                    </span>
                    <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb" }}></span>
                  </div>
                  <div style={{ fontSize: "26px", fontWeight: "800", color: "#2563eb", marginTop: "6px" }}>
                    {overview.liveActiveOrders} <span style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Active</span>
                  </div>
                </div>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                  <FiActivity />
                </div>
              </div>
              <div style={{ marginTop: "14px", fontSize: "12px", color: "#64748b" }}>
                KOT in Kitchen / Waiter Ready to Serve
              </div>
            </div>

            {/* CARD 5: TOTAL PATRONS / CUSTOMERS */}
            <div
              style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Unique Patrons
                  </span>
                  <div style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", marginTop: "6px" }}>
                    {overview.totalCustomers} <span style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>Patrons</span>
                  </div>
                </div>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                  <FiUsers />
                </div>
              </div>
              <div style={{ marginTop: "14px", fontSize: "12px", color: "#64748b" }}>
                Distinct customers recorded in period
              </div>
            </div>
          </div>

          {/* ============================================================
              2. SALES TIMELINE & SALES BY ORDER TYPE (2 COLUMNS)
          ============================================================ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "24px",
              marginBottom: "24px",
            }}
          >
            {/* SALES TIMELINE VISUAL CHART */}
            <div
              style={{
                background: "#ffffff",
                padding: "24px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                    Sales Revenue Timeline
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {period === "today" || period === "yesterday" ? "Hourly sales distribution (₹)" : "Daily sales distribution (₹)"}
                  </span>
                </div>
                <span style={{ padding: "4px 10px", background: "#f1f5f9", borderRadius: "6px", fontSize: "12px", fontWeight: "700", color: "#475569" }}>
                  {salesTimeline.length} data intervals
                </span>
              </div>

              {salesTimeline.length === 0 || overview.totalSales === 0 ? (
                <div style={{ padding: "48px 0", textAlign: "center", color: "#94a3b8" }}>
                  <FiCalendar size={32} style={{ marginBottom: "8px", opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: "14px" }}>No sales transactions recorded for this period.</p>
                </div>
              ) : (
                <div style={{ height: "240px", display: "flex", alignItems: "flex-end", gap: "8px", paddingBottom: "24px", overflowX: "auto" }}>
                  {salesTimeline.map((item, idx) => {
                    const heightPercent = maxTimelineSales > 0 ? (item.sales / maxTimelineSales) * 100 : 0;
                    return (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          minWidth: salesTimeline.length > 20 ? "24px" : "32px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          height: "100%",
                          justifyContent: "flex-end",
                        }}
                        title={`${item.label}: ₹${item.sales.toFixed(2)} (${item.orders} orders)`}
                      >
                        <div
                          style={{
                            width: "100%",
                            maxWidth: "36px",
                            height: `${Math.max(heightPercent, 4)}%`,
                            backgroundColor: item.sales > 0 ? "#2563eb" : "#e2e8f0",
                            borderRadius: "6px 6px 2px 2px",
                            transition: "height 0.3s ease, background 0.2s ease",
                            cursor: "pointer",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#64748b",
                            marginTop: "6px",
                            whiteSpace: "nowrap",
                            fontWeight: "600",
                          }}
                        >
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SALES BY ORDER TYPE */}
            <div
              style={{
                background: "#ffffff",
                padding: "24px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                  Sales by Order Type
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Revenue split across channels</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", margin: "20px 0" }}>
                {(reportData?.salesByOrderType || []).map((ch) => {
                  const icon =
                    ch.type === "DINE_IN" ? <FiCoffee /> : ch.type === "TAKEAWAY" ? <FiShoppingBag /> : <FiTruck />;
                  const color =
                    ch.type === "DINE_IN" ? "#2563eb" : ch.type === "TAKEAWAY" ? "#1d4ed8" : "#1e40af";
                  return (
                    <div key={ch.type}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "13px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", color: "#334155" }}>
                          <span style={{ color }}>{icon}</span> {ch.label}
                        </span>
                        <span style={{ fontWeight: "800", color: "#0f172a" }}>
                          ₹{ch.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                          <span style={{ color: "#64748b", fontWeight: "500", fontSize: "12px" }}>({ch.percentage.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${ch.percentage}%`,
                            backgroundColor: color,
                            borderRadius: "999px",
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#64748b" }}>
                Total channel sales: <strong style={{ color: "#0f172a" }}>₹{overview.totalSales.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* ============================================================
              3. ORDER ANALYTICS & STATUS DISTRIBUTION
          ============================================================ */}
          <div
            style={{
              background: "#ffffff",
              padding: "24px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                  Order Analytics & Status Distribution
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Live order breakdown across database statuses</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
              {Object.entries(reportData?.orderAnalytics?.statusBreakdown || {}).map(([st, count]) => {
                return (
                  <div
                    key={st}
                    style={{
                      background: "#ffffff",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "11px", fontWeight: "800", color: "#2563eb", letterSpacing: "0.5px" }}>
                      {st}
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================
              4. TOP SELLING MENU ITEMS & PERFORMANCE
          ============================================================ */}
          <div
            style={{
              background: "#ffffff",
              padding: "24px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                  Menu Items Performance
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Top performing dishes based on actual completed order items
                </span>
              </div>

              <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "8px", gap: "4px" }}>
                <button
                  type="button"
                  onClick={() => setMenuSortBy("quantity")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "none",
                    background: menuSortBy === "quantity" ? "#ffffff" : "transparent",
                    color: menuSortBy === "quantity" ? "#2563eb" : "#64748b",
                    fontWeight: "700",
                    fontSize: "12px",
                    cursor: "pointer",
                    boxShadow: menuSortBy === "quantity" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  By Quantity Sold
                </button>
                <button
                  type="button"
                  onClick={() => setMenuSortBy("revenue")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "none",
                    background: menuSortBy === "revenue" ? "#ffffff" : "transparent",
                    color: menuSortBy === "revenue" ? "#2563eb" : "#64748b",
                    fontWeight: "700",
                    fontSize: "12px",
                    cursor: "pointer",
                    boxShadow: menuSortBy === "revenue" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  By Total Revenue
                </button>
              </div>
            </div>

            {displayedMenuItems.length === 0 ? (
              <div style={{ padding: "36px", textAlign: "center", color: "#94a3b8" }}>
                No menu items sold in this period.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "12px 14px", color: "#475569", fontWeight: "700" }}>Rank</th>
                      <th style={{ padding: "12px 14px", color: "#475569", fontWeight: "700" }}>Menu Item</th>
                      <th style={{ padding: "12px 14px", color: "#475569", fontWeight: "700" }}>Category</th>
                      <th style={{ padding: "12px 14px", color: "#475569", fontWeight: "700", textAlign: "right" }}>Qty Sold</th>
                      <th style={{ padding: "12px 14px", color: "#475569", fontWeight: "700", textAlign: "right" }}>Unit Price</th>
                      <th style={{ padding: "12px 14px", color: "#475569", fontWeight: "700", textAlign: "right" }}>Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedMenuItems.map((item, idx) => (
                      <tr key={item.menuItemId || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 14px", fontWeight: "700", color: idx < 3 ? "#2563eb" : "#64748b" }}>
                          #{idx + 1}
                        </td>
                        <td style={{ padding: "12px 14px", fontWeight: "700", color: "#0f172a" }}>
                          {item.name}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#64748b" }}>
                          <span style={{ padding: "2px 8px", background: "#f1f5f9", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>
                            {item.categoryName || "General"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>
                          {item.quantitySold}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", color: "#64748b" }}>
                          ₹{item.unitPrice.toFixed(2)}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: "800", color: "#2563eb" }}>
                          ₹{item.totalRevenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ============================================================
              5. TABLE PERFORMANCE (DINE-IN) & PAYMENT ANALYTICS (2 COLUMNS)
          ============================================================ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr",
              gap: "24px",
              marginBottom: "24px",
            }}
          >
            {/* TABLE PERFORMANCE */}
            <div
              style={{
                background: "#ffffff",
                padding: "24px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                  Table & Floor Performance
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Dine-In table occupancy and sales summary</span>
              </div>

              {(reportData?.tablePerformance || []).length === 0 ? (
                <div style={{ padding: "36px", textAlign: "center", color: "#94a3b8" }}>
                  No table order records found.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                        <th style={{ padding: "10px 12px", color: "#475569", fontWeight: "700" }}>Table</th>
                        <th style={{ padding: "10px 12px", color: "#475569", fontWeight: "700" }}>Area</th>
                        <th style={{ padding: "10px 12px", color: "#475569", fontWeight: "700", textAlign: "right" }}>Orders</th>
                        <th style={{ padding: "10px 12px", color: "#475569", fontWeight: "700", textAlign: "right" }}>Total Sales</th>
                        <th style={{ padding: "10px 12px", color: "#475569", fontWeight: "700", textAlign: "right" }}>Avg Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData?.tablePerformance || []).slice(0, 8).map((tbl) => (
                        <tr key={tbl.tableId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 12px", fontWeight: "700", color: "#2563eb" }}>
                            {tbl.tableNumber}
                          </td>
                          <td style={{ padding: "10px 12px", color: "#64748b" }}>{tbl.areaName}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: "600" }}>{tbl.totalOrders}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>
                            ₹{tbl.totalSales.toFixed(2)}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: "#64748b" }}>
                            ₹{tbl.averageOrderValue.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* PAYMENT ANALYTICS */}
            <div
              style={{
                background: "#ffffff",
                padding: "24px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                  Payment Methods
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Settled transaction channels</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px", margin: "16px 0" }}>
                {(reportData?.paymentAnalytics || []).map((pay) => (
                  <div key={pay.method}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", fontSize: "13px" }}>
                      <span style={{ fontWeight: "700", color: "#334155" }}>
                        {pay.label} <span style={{ color: "#94a3b8", fontWeight: "500" }}>({pay.count} txns)</span>
                      </span>
                      <span style={{ fontWeight: "800", color: "#0f172a" }}>
                        ₹{pay.amount.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pay.percentage}%`,
                          backgroundColor:
                            pay.method === "CASH"
                              ? "#2563eb"
                              : pay.method === "UPI"
                              ? "#1d4ed8"
                              : pay.method === "CARD"
                              ? "#1e40af"
                              : "#3b82f6",
                          borderRadius: "999px",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#64748b" }}>
                Real settlement logs from completed order payments.
              </div>
            </div>
          </div>

          {/* ============================================================
              6. STAFF PERFORMANCE & INGREDIENT STOCK INSIGHTS (2 COLUMNS)
          ============================================================ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              marginBottom: "32px",
            }}
          >
            {/* STAFF PERFORMANCE */}
            <div
              style={{
                background: "#ffffff",
                padding: "24px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                  Staff Performance
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Order volume and sales processed by personnel</span>
              </div>

              {(reportData?.staffPerformance || []).length === 0 ? (
                <div style={{ padding: "36px", textAlign: "center", color: "#94a3b8" }}>
                  No staff activity logged for this period.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                        <th style={{ padding: "10px 12px", color: "#475569", fontWeight: "700" }}>Staff Member</th>
                        <th style={{ padding: "10px 12px", color: "#475569", fontWeight: "700", textAlign: "right" }}>Orders Taken</th>
                        <th style={{ padding: "10px 12px", color: "#475569", fontWeight: "700", textAlign: "right" }}>Completed</th>
                        <th style={{ padding: "10px 12px", color: "#475569", fontWeight: "700", textAlign: "right" }}>Sales Handled</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData?.staffPerformance || []).map((staff, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 12px", fontWeight: "700", color: "#0f172a" }}>
                            {staff.staffName}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: "#475569" }}>
                            {staff.ordersTaken}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: "#16a34a", fontWeight: "600" }}>
                            {staff.completedOrders}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: "800", color: "#0f172a" }}>
                            ₹{staff.totalSales.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* INVENTORY & INGREDIENT INSIGHTS */}
            <div
              style={{
                background: "#ffffff",
                padding: "24px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                    Ingredient Stock Insights
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Live raw material threshold tracking</span>
                </div>

                <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "8px", gap: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setInventoryTab("lowStock")}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background: inventoryTab === "lowStock" ? "#ffffff" : "transparent",
                      color: inventoryTab === "lowStock" ? "#d97706" : "#64748b",
                      fontWeight: "700",
                      fontSize: "12px",
                      cursor: "pointer",
                      boxShadow: inventoryTab === "lowStock" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    }}
                  >
                    Low Stock ({(reportData?.inventoryInsights?.lowStock || []).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInventoryTab("outOfStock")}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background: inventoryTab === "outOfStock" ? "#ffffff" : "transparent",
                      color: inventoryTab === "outOfStock" ? "#dc2626" : "#64748b",
                      fontWeight: "700",
                      fontSize: "12px",
                      cursor: "pointer",
                      boxShadow: inventoryTab === "outOfStock" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    }}
                  >
                    Out of Stock ({(reportData?.inventoryInsights?.outOfStock || []).length})
                  </button>
                </div>
              </div>

              {inventoryTab === "lowStock" ? (
                (reportData?.inventoryInsights?.lowStock || []).length === 0 ? (
                  <div style={{ padding: "36px", textAlign: "center", color: "#16a34a" }}>
                    <FiCheckCircle size={24} style={{ marginBottom: "6px" }} />
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: "600" }}>All ingredients have healthy stock levels.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#fffbeb", borderBottom: "2px solid #fef3c7", textAlign: "left" }}>
                          <th style={{ padding: "10px 12px", color: "#b45309", fontWeight: "700" }}>Ingredient</th>
                          <th style={{ padding: "10px 12px", color: "#b45309", fontWeight: "700", textAlign: "right" }}>Current</th>
                          <th style={{ padding: "10px 12px", color: "#b45309", fontWeight: "700", textAlign: "right" }}>Min Level</th>
                          <th style={{ padding: "10px 12px", color: "#b45309", fontWeight: "700" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(reportData?.inventoryInsights?.lowStock || []).map((ing) => (
                          <tr key={ing.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px 12px", fontWeight: "700", color: "#0f172a" }}>
                              {ing.name} <span style={{ color: "#94a3b8", fontSize: "11px" }}>({ing.sku})</span>
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: "700", color: "#d97706" }}>
                              {ing.currentStock} {ing.unit}
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "right", color: "#64748b" }}>
                              {ing.minimumStock} {ing.unit}
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <span style={{ padding: "2px 8px", background: "#fef3c7", color: "#92400e", borderRadius: "4px", fontSize: "11px", fontWeight: "800" }}>
                                LOW STOCK
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                (reportData?.inventoryInsights?.outOfStock || []).length === 0 ? (
                  <div style={{ padding: "36px", textAlign: "center", color: "#16a34a" }}>
                    <FiCheckCircle size={24} style={{ marginBottom: "6px" }} />
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: "600" }}>No ingredients are currently out of stock.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#fef2f2", borderBottom: "2px solid #fee2e2", textAlign: "left" }}>
                          <th style={{ padding: "10px 12px", color: "#b91c1c", fontWeight: "700" }}>Ingredient</th>
                          <th style={{ padding: "10px 12px", color: "#b91c1c", fontWeight: "700", textAlign: "right" }}>Current</th>
                          <th style={{ padding: "10px 12px", color: "#b91c1c", fontWeight: "700", textAlign: "right" }}>Min Level</th>
                          <th style={{ padding: "10px 12px", color: "#b91c1c", fontWeight: "700" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(reportData?.inventoryInsights?.outOfStock || []).map((ing) => (
                          <tr key={ing.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px 12px", fontWeight: "700", color: "#0f172a" }}>
                              {ing.name} <span style={{ color: "#94a3b8", fontSize: "11px" }}>({ing.sku})</span>
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: "800", color: "#dc2626" }}>
                              0 {ing.unit}
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "right", color: "#64748b" }}>
                              {ing.minimumStock} {ing.unit}
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <span style={{ padding: "2px 8px", background: "#fee2e2", color: "#991b1b", borderRadius: "4px", fontSize: "11px", fontWeight: "800" }}>
                                OUT OF STOCK
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}

      {/* Global CSS for rotating animation */}
      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
