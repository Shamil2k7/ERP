"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/services/apiClient";
import socketService from "@/services/socketService";
import { useCompany } from "@/context/CompanyContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  Layers,
  Users,
  RefreshCw,
  PlusCircle,
  Plus,
  Truck,
  Building2,
  Calendar,
  CheckCircle2,
  Inbox,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  CreditCard,
  Eye,
  Loader2,
} from "lucide-react";
import styles from "./DashboardHome.module.css";

export default function DashboardHome() {
  const router = useRouter();
  const { user, company } = useCompany();

  // State Management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [datePeriod, setDatePeriod] = useState("30days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Data States
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalSalesFormatted: "₹0",
    salesDelta: "0.0%",
    salesDeltaPositive: true,
    totalOrders: 0,
    ordersDelta: "0.0%",
    ordersDeltaPositive: true,
    totalProducts: 0,
    productDelta: "0.0%",
    productDeltaPositive: true,
    lowStock: 0,
    totalInventoryValue: 0,
    totalInventoryValueFormatted: "₹0",
    activeStaff: 0,
    currency: "₹",
  });

  const [branches, setBranches] = useState([{ id: "ALL", name: "All Branches" }]);
  const [salesOverviewChart, setSalesOverviewChart] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);

  // Determine user role and permissions
  const roleUpper = (user?.role || user?.roleRef?.name || user?.designation || user?.type || "").toUpperCase();
  const isSuperAdmin = roleUpper.includes("SUPER");
  const isAdmin = isSuperAdmin || roleUpper.includes("ADMIN") || roleUpper.includes("OWNER");
  const isManager = roleUpper.includes("MANAGER");
  const isCashier = roleUpper.includes("CASHIER") || roleUpper.includes("BILLING") || roleUpper.includes("COUNTER");
  const isInventoryManager = roleUpper.includes("INVENTORY") || roleUpper.includes("STOCK");
  const isPurchaseManager = roleUpper.includes("PURCHASE");
  const isAccountant = roleUpper.includes("ACCOUNT") || roleUpper.includes("FINANCE");

  // Fetch unified Retail Dashboard data
  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const params = {
        branchId: selectedBranch,
        period: datePeriod,
      };

      if (datePeriod === "custom" && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }

      const res = await apiClient.get("/dashboard/overview", { params });

      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        if (d.summary) setSummary(d.summary);
        if (d.branches) setBranches(d.branches);
        if (d.salesOverviewChart) setSalesOverviewChart(d.salesOverviewChart);
        if (d.lowStockAlerts) setLowStockAlerts(d.lowStockAlerts);
        if (d.recentSales) setRecentSales(d.recentSales);
      }
    } catch (err) {
      console.error("Retail Dashboard fetch error:", err);
      setError("Unable to load live dashboard metrics. Please check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBranch, datePeriod, customStart, customEnd]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time socket event listeners for instant updates
  useEffect(() => {
    const handleUpdate = () => {
      fetchDashboardData(true);
    };

    const unsubSale = socketService.on("sale.completed", handleUpdate);
    const unsubStock = socketService.on("stock.updated", handleUpdate);
    const unsubProduct = socketService.on("product.created", handleUpdate);
    const unsubPurchase = socketService.on("purchase.created", handleUpdate);
    const unsubDashboard = socketService.on("dashboard.updated", handleUpdate);

    return () => {
      if (typeof unsubSale === "function") unsubSale();
      if (typeof unsubStock === "function") unsubStock();
      if (typeof unsubProduct === "function") unsubProduct();
      if (typeof unsubPurchase === "function") unsubPurchase();
      if (typeof unsubDashboard === "function") unsubDashboard();
    };
  }, [fetchDashboardData]);

  if (loading && !refreshing && summary.totalProducts === 0 && salesOverviewChart.length === 0) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loadingContainer}>
          <Loader2 className="animate-spin" size={32} color="#2563eb" />
          <span>Loading Retail Dashboard...</span>
        </div>
      </div>
    );
  }

  // Format currency helper
  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString("en-IN")}`;
  };

  // Format date helper
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.container}>
        
        {/* =========================================================
           1. HEADER & TOOLBAR
        ========================================================= */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.pageTitle}>Retail Dashboard</h1>
            <p className={styles.pageSubtitle}>Business Overview & Live Operations</p>
          </div>

          <div className={styles.filtersBar}>
            {/* Branch Filter */}
            {(isAdmin || isSuperAdmin || branches.length > 1) && (
              <div className={styles.filterGroup}>
                <Building2 size={16} />
                <select
                  className={styles.selectInput}
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  aria-label="Filter by Branch"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range Filter */}
            <div className={styles.filterGroup}>
              <Calendar size={16} />
              <select
                className={styles.selectInput}
                value={datePeriod}
                onChange={(e) => setDatePeriod(e.target.value)}
                aria-label="Filter by Date Period"
              >
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Date Range Pickers */}
            {datePeriod === "custom" && (
              <>
                <input
                  type="date"
                  className={styles.customDateInput}
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  className={styles.customDateInput}
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  placeholder="End Date"
                />
              </>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              className={`${styles.refreshBtn} ${refreshing ? styles.spinning : ""}`}
              onClick={() => fetchDashboardData(true)}
              title="Refresh Dashboard"
              aria-label="Refresh Dashboard"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* =========================================================
           2. TOP SUMMARY CARDS
        ========================================================= */}
        <div className={styles.kpiGrid}>
          {/* Card 1: Total Sales */}
          {(!isInventoryManager && !isPurchaseManager) && (
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiLabel}>Total Sales</span>
                <div className={styles.kpiIconWrapper} style={{ background: "#eff6ff", color: "#2563eb" }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className={styles.kpiValue}>{summary.totalSalesFormatted || formatCurrency(summary.totalSales)}</div>
              <div className={styles.kpiFooter}>
                <span className={summary.salesDeltaPositive ? styles.kpiDeltaPositive : styles.kpiDeltaNegative}>
                  {summary.salesDeltaPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {summary.salesDelta || "0.0%"}
                </span>
                <span className={styles.kpiSubtext}>vs previous period</span>
              </div>
            </div>
          )}

          {/* Card 2: Total Orders */}
          {(!isInventoryManager && !isPurchaseManager) && (
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiLabel}>Total Orders</span>
                <div className={styles.kpiIconWrapper} style={{ background: "#f0fdf4", color: "#16a34a" }}>
                  <ShoppingCart size={18} />
                </div>
              </div>
              <div className={styles.kpiValue}>{Number(summary.totalOrders || 0).toLocaleString("en-IN")}</div>
              <div className={styles.kpiFooter}>
                <span className={summary.ordersDeltaPositive ? styles.kpiDeltaPositive : styles.kpiDeltaNegative}>
                  {summary.ordersDeltaPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {summary.ordersDelta || "0.0%"}
                </span>
                <span className={styles.kpiSubtext}>completed sales</span>
              </div>
            </div>
          )}

          {/* Card 3: Total Products */}
          {(!isCashier) && (
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiLabel}>Total Products</span>
                <div className={styles.kpiIconWrapper} style={{ background: "#faf5ff", color: "#9333ea" }}>
                  <Package size={18} />
                </div>
              </div>
              <div className={styles.kpiValue}>{Number(summary.totalProducts || summary.activeProducts || 0).toLocaleString("en-IN")}</div>
              <div className={styles.kpiFooter}>
                <span className={styles.kpiSubtext}>active in catalog</span>
              </div>
            </div>
          )}

          {/* Card 4: Low Stock Items */}
          {(!isCashier && !isAccountant) && (
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiLabel}>Low Stock Items</span>
                <div
                  className={styles.kpiIconWrapper}
                  style={{
                    background: summary.lowStock > 0 ? "#fef2f2" : "#f0fdf4",
                    color: summary.lowStock > 0 ? "#dc2626" : "#16a34a",
                  }}
                >
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className={styles.kpiValue} style={{ color: summary.lowStock > 0 ? "#dc2626" : "#0f172a" }}>
                {Number(summary.lowStock || 0).toLocaleString("en-IN")}
              </div>
              <div className={styles.kpiFooter}>
                <span className={styles.kpiSubtext}>
                  {summary.lowStock > 0 ? "requires restock" : "all items sufficient"}
                </span>
              </div>
            </div>
          )}

          {/* Card 5: Total Inventory Value */}
          {(!isCashier) && (
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiLabel}>Inventory Value</span>
                <div className={styles.kpiIconWrapper} style={{ background: "#f8fafc", color: "#0891b2" }}>
                  <Layers size={18} />
                </div>
              </div>
              <div className={styles.kpiValue}>
                {summary.totalInventoryValueFormatted || formatCurrency(summary.totalInventoryValue)}
              </div>
              <div className={styles.kpiFooter}>
                <span className={styles.kpiSubtext}>current stock valuation</span>
              </div>
            </div>
          )}

          {/* Optional Card 6: Active Staff (Admin & Store Manager) */}
          {(isAdmin || isManager) && (
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiLabel}>Active Staff</span>
                <div className={styles.kpiIconWrapper} style={{ background: "#fff7ed", color: "#ea580c" }}>
                  <Users size={18} />
                </div>
              </div>
              <div className={styles.kpiValue}>{Number(summary.activeStaff || 0).toLocaleString("en-IN")}</div>
              <div className={styles.kpiFooter}>
                <span className={styles.kpiSubtext}>assigned team members</span>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================
           3. SALES OVERVIEW CHART
        ========================================================= */}
        {(!isInventoryManager && !isPurchaseManager) && (
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Sales Overview</h3>
                <p>Daily completed sales revenue for the selected period</p>
              </div>
            </div>

            {salesOverviewChart.length > 0 ? (
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesOverviewChart} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="retailSalesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), "Sales Amount"]}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{
                        background: "#0f172a",
                        color: "#ffffff",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "13px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#retailSalesGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Inbox size={32} />
                <p className={styles.emptyText}>No sales data available for the selected period.</p>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
           4. DATA TABLES: LOW STOCK ALERTS & RECENT SALES
        ========================================================= */}
        <div className={styles.tablesGrid}>
          {/* Low Stock Alerts Table */}
          {(!isCashier && !isAccountant) && (
            <div className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <h3>Low Stock Alerts</h3>
                <Link href="/warehouse/stock" className={styles.viewAllLink}>
                  Manage Stock <ChevronRight size={14} />
                </Link>
              </div>

              {lowStockAlerts.length > 0 ? (
                <div className={styles.tableWrapper}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>SKU</th>
                        <th>Current Stock</th>
                        <th>Min Stock</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockAlerts.slice(0, 6).map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.name}</strong>
                          </td>
                          <td style={{ color: "#64748b", fontFamily: "monospace" }}>{item.sku}</td>
                          <td>
                            <span style={{ color: item.currentStock <= 0 ? "#dc2626" : "#d97706", fontWeight: "700" }}>
                              {item.currentStock} {item.unit || "Pcs"}
                            </span>
                          </td>
                          <td>{item.minStock}</td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${
                                item.currentStock <= 0 ? styles.badgeDanger : styles.badgeWarning
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <CheckCircle2 size={32} style={{ color: "#16a34a" }} />
                  <p className={styles.emptyText}>All products are sufficiently stocked.</p>
                </div>
              )}
            </div>
          )}

          {/* Recent Sales Table */}
          {(!isInventoryManager && !isPurchaseManager) && (
            <div className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <h3>Recent Sales</h3>
                <Link href="/pos/history" className={styles.viewAllLink}>
                  View All <ChevronRight size={14} />
                </Link>
              </div>

              {recentSales.length > 0 ? (
                <div className={styles.tableWrapper}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Customer</th>
                        <th>Date & Time</th>
                        <th>Payment</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSales.slice(0, 6).map((sale) => (
                        <tr key={sale.id}>
                          <td>
                            <strong style={{ color: "#2563eb" }}>{sale.invoiceNumber}</strong>
                          </td>
                          <td>{sale.customerName}</td>
                          <td style={{ color: "#64748b", fontSize: "12.5px" }}>{formatDateTime(sale.dateTime)}</td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles.badgeNeutral}`}>
                              {sale.paymentMethod}
                            </span>
                          </td>
                          <td>
                            <strong>{sale.totalAmountFormatted || formatCurrency(sale.totalAmount)}</strong>
                          </td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles.badgeSuccess}`}>
                              {sale.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <Inbox size={32} />
                  <p className={styles.emptyText}>No recent sales found.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =========================================================
           5. QUICK ACTIONS SECTION
        ========================================================= */}
        <div className={styles.quickActionsCard}>
          <h3>Quick Actions</h3>
          <div className={styles.actionsGrid}>
            {/* New Sale: Cashier, Store Manager, Admin */}
            {(isAdmin || isManager || isCashier) && (
              <Link href="/pos" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}>
                <PlusCircle size={16} /> New Sale (POS)
              </Link>
            )}

            {/* Add Product: Inventory Manager, Store Manager, Admin */}
            {(isAdmin || isManager || isInventoryManager) && (
              <Link href="/admin/products/add" className={styles.actionBtn}>
                <Plus size={16} /> Add Product
              </Link>
            )}

            {/* Add Purchase: Purchase Manager, Store Manager, Admin */}
            {(isAdmin || isManager || isPurchaseManager) && (
              <Link href="/purchases/add" className={styles.actionBtn}>
                <Plus size={16} /> Add Purchase
              </Link>
            )}

            {/* Add Supplier: Purchase Manager, Admin */}
            {(isAdmin || isPurchaseManager) && (
              <Link href="/admin/suppliers" className={styles.actionBtn}>
                <Truck size={16} /> Add Supplier
              </Link>
            )}

            {/* Manage Stock: Inventory Manager, Store Manager, Admin */}
            {(isAdmin || isManager || isInventoryManager) && (
              <Link href="/warehouse/stock" className={styles.actionBtn}>
                <Layers size={16} /> Manage Inventory
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}