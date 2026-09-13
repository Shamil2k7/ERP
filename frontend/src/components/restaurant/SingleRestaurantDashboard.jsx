"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/services/apiClient";
import { restaurantService } from "@/services/restaurantService";
import styles from "./SingleRestaurantDashboard.module.css";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  FiCoffee,
  FiShoppingCart,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiDollarSign,
  FiCalendar,
  FiTrash2,
  FiTrendingUp,
  FiTv,
  FiMonitor,
  FiUsers,
  FiPackage,
  FiPieChart,
  FiBarChart2,
  FiBox,
  FiCheckSquare,
  FiXCircle,
  FiArrowRight,
  FiLayers,
  FiActivity,
  FiFileText,
  FiRefreshCw,
  FiPlus,
  FiMapPin,
  FiCreditCard,
  FiPercent,
  FiTrendingDown,
  FiTruck,
  FiGrid,
  FiFilter,
} from "react-icons/fi";

const PIE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

import { useCompany } from "@/context/CompanyContext";

export default function SingleRestaurantDashboard() {
  const router = useRouter();
  const { company } = useCompany();

  // Loading & Filter States
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedOutletId, setSelectedOutletId] = useState("ALL"); // ALL or restaurantId
  const [dateFilter, setDateFilter] = useState("TODAY"); // TODAY, YESTERDAY, WEEK, MONTH, CUSTOM
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [salesChartView, setSalesChartView] = useState("DAILY"); // DAILY, WEEKLY, MONTHLY

  // Raw Database Data States
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [wastages, setWastages] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [customersCount, setCustomersCount] = useState(0);
  const [foodCostReport, setFoodCostReport] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, [company?.id]);

  useEffect(() => {
    fetchDashboardMetrics();
  }, [selectedOutletId, company?.id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await restaurantService.getRestaurants();
      const list = res.data || [];
      setRestaurants(list);
    } catch (err) {
      console.error("Failed to load restaurants list:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      const targetOutletId = selectedOutletId === "ALL" ? "" : selectedOutletId;

      const results = await Promise.allSettled([
        restaurantService.getTables(targetOutletId),
        restaurantService.getOrders({ restaurantId: targetOutletId }),
        restaurantService.getKitchenOrders(targetOutletId),
        restaurantService.getWastages(targetOutletId),
        restaurantService.getReservations(targetOutletId),
        restaurantService.getFoodCostReport(targetOutletId),
        restaurantService.getMenuItems(targetOutletId),
        apiClient.get("/products"),
        apiClient.get("/admin/expenses").catch(() => apiClient.get("/expenses")),
        apiClient.get("/customers"),
      ]);

      const [
        tableRes,
        orderRes,
        kotRes,
        wasteRes,
        resvRes,
        foodCostRes,
        menuItemsRes,
        productRes,
        expenseRes,
        customerRes,
      ] = results;

      if (tableRes.status === "fulfilled") setTables(tableRes.value.data || []);
      if (orderRes.status === "fulfilled") setOrders(orderRes.value.data || []);
      if (kotRes.status === "fulfilled") setKitchenOrders(kotRes.value.data || []);
      if (wasteRes.status === "fulfilled") setWastages(wasteRes.value.data || []);
      if (resvRes.status === "fulfilled") setReservations(resvRes.value.data || []);
      if (foodCostRes.status === "fulfilled") setFoodCostReport(foodCostRes.value.data || []);
      if (menuItemsRes.status === "fulfilled") setMenuItems(menuItemsRes.value.data || []);

      if (productRes.status === "fulfilled") {
        setProducts(productRes.value.data?.data || productRes.value.data || []);
      }
      if (expenseRes.status === "fulfilled") {
        setExpenses(expenseRes.value.data?.data || expenseRes.value.data || []);
      }
      if (customerRes.status === "fulfilled") {
        const custs = customerRes.value.data?.data || customerRes.value.data || [];
        setCustomersCount(Array.isArray(custs) ? custs.length : 0);
      }
    } catch (err) {
      console.error("Error fetching restaurant dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // DYNAMIC FILTERING LOGIC
  // ==========================================
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const yesterdayStr = new Date(new Date().setDate(now.getDate() - 1)).toISOString().slice(0, 10);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!o.createdAt) return false;
      const orderDateStr = new Date(o.createdAt).toISOString().slice(0, 10);
      const orderDate = new Date(o.createdAt);
      const hour = orderDate.getHours();

      // Outlet filter check
      if (selectedOutletId !== "ALL" && o.restaurantId !== selectedOutletId) {
        return false;
      }

      // Date range filter check
      if (dateFilter === "TODAY") return orderDateStr === todayStr;
      if (dateFilter === "YESTERDAY") return orderDateStr === yesterdayStr;
      if (dateFilter === "WEEK") {
        const weekAgo = new Date(new Date().setDate(now.getDate() - 7));
        return orderDate >= weekAgo;
      }
      if (dateFilter === "MONTH") {
        const monthAgo = new Date(new Date().setMonth(now.getMonth() - 1));
        return orderDate >= monthAgo;
      }
      if (dateFilter === "CUSTOM") {
        if (customStartDate && orderDateStr < customStartDate) return false;
        if (customEndDate && orderDateStr > customEndDate) return false;
      }
      return true;
    });
  }, [orders, selectedOutletId, dateFilter, todayStr, yesterdayStr, customStartDate, customEndDate]);

  // Previous Period Orders for Comparison
  const prevPeriodOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!o.createdAt) return false;
      const orderDateStr = new Date(o.createdAt).toISOString().slice(0, 10);
      if (dateFilter === "TODAY") return orderDateStr === yesterdayStr;
      return false;
    });
  }, [orders, dateFilter, yesterdayStr]);

  // ==========================================
  // SECTION 3: TOP SUMMARY CARDS CALCULATIONS
  // ==========================================

  // 1. Total Sales & Comparison
  const totalSales = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status === "COMPLETED" || o.status === "SERVED" || o.status === "DELIVERED" || o.paymentStatus === "PAID")
      .reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
  }, [filteredOrders]);

  const prevTotalSales = useMemo(() => {
    return prevPeriodOrders
      .filter((o) => o.status === "COMPLETED" || o.status === "SERVED" || o.status === "DELIVERED" || o.paymentStatus === "PAID")
      .reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
  }, [prevPeriodOrders]);

  const salesGrowthPct = useMemo(() => {
    if (prevTotalSales === 0) return totalSales > 0 ? "+100.0" : "0.0";
    const diff = totalSales - prevTotalSales;
    return ((diff / prevTotalSales) * 100).toFixed(1);
  }, [totalSales, prevTotalSales]);

  // 2. Total Orders (Completed & Pending)
  const totalOrdersCount = filteredOrders.length;
  const completedOrdersCount = useMemo(
    () => filteredOrders.filter((o) => o.status === "COMPLETED" || o.status === "SERVED" || o.status === "DELIVERED").length,
    [filteredOrders]
  );
  const pendingOrdersCount = useMemo(
    () => filteredOrders.filter((o) => o.status === "PENDING" || o.status === "NEW" || o.status === "CONFIRMED" || o.status === "PREPARING").length,
    [filteredOrders]
  );

  // 3. Net Sales (Gross - Discounts - Returns)
  const grossSales = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + (parseFloat(o.subtotal) || parseFloat(o.totalAmount) || 0), 0),
    [filteredOrders]
  );
  const totalDiscounts = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + (parseFloat(o.discountAmount) || 0), 0),
    [filteredOrders]
  );
  const totalReturns = useMemo(
    () => filteredOrders.filter((o) => o.status === "CANCELLED" || o.status === "VOID").reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0),
    [filteredOrders]
  );
  const netSales = useMemo(() => Math.max(0, grossSales - totalDiscounts - totalReturns), [grossSales, totalDiscounts, totalReturns]);

  // 4. Net Profit (Revenue - Food Cost - Expenses)
  const foodCostMap = useMemo(() => {
    const map = {};
    if (Array.isArray(foodCostReport)) {
      foodCostReport.forEach((fc) => {
        if (fc.menuItemId) map[fc.menuItemId] = fc.recipeCost;
      });
    }
    return map;
  }, [foodCostReport]);

  const totalFoodCost = useMemo(() => {
    let cost = 0;
    filteredOrders.forEach((o) => {
      o.items?.forEach((it) => {
        const itemRecipeCost = foodCostMap[it.menuItemId] || parseFloat(it.menuItem?.costPrice) || parseFloat(it.costPrice) || 0;
        cost += itemRecipeCost * (it.quantity || 1);
      });
    });
    return cost;
  }, [filteredOrders, foodCostMap]);

  const totalExpensesPeriod = useMemo(() => {
    const directExpenses = Array.isArray(expenses)
      ? expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
      : 0;
    const wastageCost = wastages.reduce((sum, w) => sum + (parseFloat(w.totalCost) || 0), 0);
    return directExpenses + wastageCost;
  }, [expenses, wastages]);

  const grossProfit = Math.max(0, totalSales - totalFoodCost);
  const netProfit = grossProfit - totalExpensesPeriod;

  // 5. Customers (Total, New, Returning)
  const customerStats = useMemo(() => {
    const custMap = {};
    filteredOrders.forEach((o) => {
      const cId = o.customerId || o.customerName || "Guest";
      custMap[cId] = (custMap[cId] || 0) + 1;
    });

    let newCust = 0;
    let retCust = 0;
    Object.values(custMap).forEach((cnt) => {
      if (cnt === 1) newCust++;
      else retCust++;
    });

    return {
      total: Math.max(customersCount, Object.keys(custMap).length),
      newCust,
      retCust,
    };
  }, [filteredOrders, customersCount]);

  // 6. Average Order Value (AOV)
  const averageOrderValue = totalOrdersCount > 0 ? (totalSales / totalOrdersCount).toFixed(2) : "0.00";

  // 7. Table Status
  const tableStats = useMemo(() => {
    const total = tables.length;
    const available = tables.filter((t) => t.status === "AVAILABLE").length;
    const occupied = tables.filter((t) => t.status === "OCCUPIED").length;
    const reserved = tables.filter((t) => t.status === "RESERVED").length;
    const cleaning = tables.filter((t) => t.status === "CLEANING" || t.status === "DIRTY").length;
    const maintenance = tables.filter((t) => t.status === "MAINTENANCE").length;
    return { total, available, occupied, reserved, cleaning, maintenance };
  }, [tables]);

  // 8. Low Stock
  const lowStockIngredientsCount = useMemo(() => {
    return Array.isArray(products)
      ? products.filter((p) => {
          const qty = p.stock ?? p.quantity ?? 0;
          const min = p.minStockThreshold ?? p.minStock ?? 5;
          return qty <= min;
        }).length
      : 0;
  }, [products]);

  // ==========================================
  // SECTION 4: LIVE ORDER STATUS (7 CARDS)
  // ==========================================
  const liveOrderCounts = useMemo(() => {
    return {
      newOrders: orders.filter((o) => o.status === "NEW" || o.status === "PENDING").length,
      confirmedOrders: orders.filter((o) => o.status === "CONFIRMED" || o.status === "ACCEPTED").length,
      preparing: orders.filter((o) => o.status === "PREPARING" || o.status === "COOKING").length,
      ready: orders.filter((o) => o.status === "READY" || o.status === "PLATED").length,
      served: orders.filter((o) => o.status === "SERVED").length,
      completed: orders.filter((o) => o.status === "COMPLETED" || o.status === "DELIVERED").length,
      cancelled: orders.filter((o) => o.status === "CANCELLED" || o.status === "VOID").length,
    };
  }, [orders]);

  // ==========================================
  // SECTION 8: KITCHEN KDS & DELAYED ORDERS
  // ==========================================
  const delayedOrdersList = useMemo(() => {
    const delayed = [];
    kitchenOrders.forEach((k) => {
      if (k.status === "PREPARING" || k.status === "NEW") {
        const orderTime = new Date(k.createdAt || Date.now());
        const elapsedMins = Math.floor((Date.now() - orderTime.getTime()) / (1000 * 60));
        const expectedMins = k.expectedTime || 20; // 20 mins threshold
        if (elapsedMins >= expectedMins) {
          delayed.push({
            id: k.id,
            kotNumber: k.kotNumber || k.orderNumber || "KOT-OLD",
            tableNumber: k.tableNumber || "N/A",
            orderType: k.orderType || "DINE_IN",
            orderTime: orderTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            waitingTime: `${elapsedMins} mins`,
            status: k.status,
          });
        }
      }
    });
    return delayed;
  }, [kitchenOrders]);

  // ==========================================
  // SECTION 5: SALES OVERVIEW CHART DATA
  // ==========================================
  const salesOverviewChartData = useMemo(() => {
    if (salesChartView === "DAILY") {
      const hoursSlots = ["08 AM", "10 AM", "12 PM", "02 PM", "04 PM", "06 PM", "08 PM", "10 PM"];
      const map = {};
      hoursSlots.forEach((h) => (map[h] = { gross: 0, discount: 0, tax: 0, net: 0 }));

      filteredOrders.forEach((o) => {
        if (o.createdAt) {
          const hour = new Date(o.createdAt).getHours();
          let slot = "08 AM";
          if (hour >= 10 && hour < 12) slot = "10 AM";
          else if (hour >= 12 && hour < 14) slot = "12 PM";
          else if (hour >= 14 && hour < 16) slot = "02 PM";
          else if (hour >= 16 && hour < 18) slot = "04 PM";
          else if (hour >= 18 && hour < 20) slot = "06 PM";
          else if (hour >= 20 && hour < 22) slot = "08 PM";
          else if (hour >= 22) slot = "10 PM";

          const sub = parseFloat(o.subtotal) || parseFloat(o.totalAmount) || 0;
          const disc = parseFloat(o.discountAmount) || 0;
          const tx = parseFloat(o.taxAmount) || 0;
          const net = sub - disc;

          map[slot].gross += sub;
          map[slot].discount += disc;
          map[slot].tax += tx;
          map[slot].net += net;
        }
      });

      return hoursSlots.map((h) => ({
        label: h,
        GrossSales: map[h].gross,
        Discounts: map[h].discount,
        Tax: map[h].tax,
        NetSales: map[h].net,
      }));
    } else if (salesChartView === "WEEKLY") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const map = {};
      days.forEach((d) => (map[d] = { gross: 0, discount: 0, tax: 0, net: 0 }));

      filteredOrders.forEach((o) => {
        if (o.createdAt) {
          let idx = new Date(o.createdAt).getDay() - 1;
          if (idx < 0) idx = 6;
          const dName = days[idx];

          const sub = parseFloat(o.subtotal) || parseFloat(o.totalAmount) || 0;
          const disc = parseFloat(o.discountAmount) || 0;
          const tx = parseFloat(o.taxAmount) || 0;
          const net = sub - disc;

          map[dName].gross += sub;
          map[dName].discount += disc;
          map[dName].tax += tx;
          map[dName].net += net;
        }
      });

      return days.map((d) => ({
        label: d,
        GrossSales: map[d].gross,
        Discounts: map[d].discount,
        Tax: map[d].tax,
        NetSales: map[d].net,
      }));
    } else {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const map = {};
      months.forEach((m) => (map[m] = { gross: 0, discount: 0, tax: 0, net: 0 }));

      filteredOrders.forEach((o) => {
        if (o.createdAt) {
          const mIdx = new Date(o.createdAt).getMonth();
          const mName = months[mIdx];

          const sub = parseFloat(o.subtotal) || parseFloat(o.totalAmount) || 0;
          const disc = parseFloat(o.discountAmount) || 0;
          const tx = parseFloat(o.taxAmount) || 0;
          const net = sub - disc;

          map[mName].gross += sub;
          map[mName].discount += disc;
          map[mName].tax += tx;
          map[mName].net += net;
        }
      });

      return months.map((m) => ({
        label: m,
        GrossSales: map[m].gross,
        Discounts: map[m].discount,
        Tax: map[m].tax,
        NetSales: map[m].net,
      }));
    }
  }, [filteredOrders, salesChartView]);

  // ==========================================
  // SECTION 6: ORDER TYPE SUMMARY
  // ==========================================
  const orderTypeSummary = useMemo(() => {
    const map = {
      DINE_IN: { name: "Dine In", count: 0, sales: 0, color: "#2563eb" },
      TAKEAWAY: { name: "Takeaway", count: 0, sales: 0, color: "#1d4ed8" },
      DELIVERY: { name: "Delivery", count: 0, sales: 0, color: "#1e40af" },
      ONLINE: { name: "Online Orders", count: 0, sales: 0, color: "#3b82f6" },
    };

    filteredOrders.forEach((o) => {
      const type = (o.orderType || "DINE_IN").toUpperCase();
      const targetKey = map[type] ? type : "DINE_IN";
      const amt = parseFloat(o.totalAmount) || 0;
      map[targetKey].count += 1;
      map[targetKey].sales += amt;
    });

    const grandSales = totalSales || 1;
    return Object.values(map).map((item) => ({
      ...item,
      pct: ((item.sales / grandSales) * 100).toFixed(1),
    }));
  }, [filteredOrders, totalSales]);

  // ==========================================
  // SECTION 9: TOP SELLING MENU ITEMS
  // ==========================================
  const topSellingItemsList = useMemo(() => {
    const map = {};
    filteredOrders.forEach((o) => {
      o.items?.forEach((it) => {
        const name = it.menuItem?.name || it.name || "Menu Dish";
        const cat = it.menuItem?.category?.name || "Main Course";
        const qty = it.quantity || 1;
        const total = parseFloat(it.total) || parseFloat(it.unitPrice || 0) * qty;

        if (!map[name]) {
          map[name] = { name, category: cat, qty: 0, sales: 0 };
        }
        map[name].qty += qty;
        map[name].sales += total;
      });
    });

    const list = Object.values(map);
    list.sort((a, b) => b.qty - a.qty);
    return list.slice(0, 5).map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [filteredOrders]);

  // ==========================================
  // SECTION 10: LOW STOCK ALERTS
  // ==========================================
  const lowStockAlertsList = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products
      .filter((p) => {
        const qty = p.stock ?? p.quantity ?? 0;
        const min = p.minStockThreshold ?? p.minStock ?? 5;
        return qty <= min;
      })
      .map((p) => {
        const qty = p.stock ?? p.quantity ?? 0;
        const min = p.minStockThreshold ?? p.minStock ?? 5;
        let status = "Low Stock";
        if (qty === 0) status = "Out of Stock";
        else if (qty <= min / 2) status = "Critical";

        return {
          id: p.id,
          name: p.name,
          code: p.sku || p.code || "ING-01",
          stock: qty,
          minStock: min,
          reorderLevel: min * 2,
          unit: p.unit?.code || p.stockUnit || "Unit",
          status,
        };
      })
      .slice(0, 6);
  }, [products]);

  // ==========================================
  // SECTION 13: PAYMENT SUMMARY
  // ==========================================
  const paymentSummaryData = useMemo(() => {
    const methods = {
      Cash: { count: 0, amount: 0 },
      Card: { count: 0, amount: 0 },
      UPI: { count: 0, amount: 0 },
      "Online Payment": { count: 0, amount: 0 },
      "Bank Transfer": { count: 0, amount: 0 },
      "Split Payment": { count: 0, amount: 0 },
    };

    let totalPaid = 0;
    let pendingPayments = 0;

    filteredOrders.forEach((o) => {
      const amt = parseFloat(o.totalAmount) || 0;
      const m = (o.paymentMethod || o.paymentMode || "CASH").toUpperCase();

      if (o.paymentStatus === "PAID" || o.status === "COMPLETED") {
        totalPaid += amt;
      } else {
        pendingPayments += amt;
      }

      if (m.includes("CARD")) {
        methods.Card.count++;
        methods.Card.amount += amt;
      } else if (m.includes("UPI")) {
        methods.UPI.count++;
        methods.UPI.amount += amt;
      } else if (m.includes("ONLINE")) {
        methods["Online Payment"].count++;
        methods["Online Payment"].amount += amt;
      } else if (m.includes("BANK")) {
        methods["Bank Transfer"].count++;
        methods["Bank Transfer"].amount += amt;
      } else if (m.includes("SPLIT")) {
        methods["Split Payment"].count++;
        methods["Split Payment"].amount += amt;
      } else {
        methods.Cash.count++;
        methods.Cash.amount += amt;
      }
    });

    return { methods, totalPaid, pendingPayments, refunded: totalReturns };
  }, [filteredOrders, totalReturns]);

  // ==========================================
  // SECTION 15: WASTAGE SUMMARY
  // ==========================================
  const wastageSummaryData = useMemo(() => {
    const totalEntries = wastages.length;
    const totalQty = wastages.reduce((sum, w) => sum + (parseFloat(w.quantity) || 0), 0);
    const totalCost = wastages.reduce((sum, w) => sum + (parseFloat(w.totalCost) || 0), 0);

    const wasteMap = {};
    wastages.forEach((w) => {
      const name = w.product?.name || w.ingredientName || "Raw Item";
      wasteMap[name] = (wasteMap[name] || 0) + (parseFloat(w.totalCost) || 0);
    });

    let mostWasted = "None";
    let maxCost = 0;
    Object.entries(wasteMap).forEach(([name, cost]) => {
      if (cost > maxCost) {
        maxCost = cost;
        mostWasted = name;
      }
    });

    return { totalEntries, totalQty, totalCost, mostWasted, list: wastages.slice(0, 5) };
  }, [wastages]);

  if (loading) {
    return (
      <div className={styles.dashboardWrapper} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <FiRefreshCw className="animate-spin" size={36} style={{ color: "#d4af37", marginBottom: "18px" }} />
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "22px", color: "#1c120c", margin: "0 0 8px 0" }}>Loading Restaurant Operations & Intelligence...</h2>
        <p style={{ color: "#786b5d", fontSize: "14px", margin: 0 }}>Aggregating Outlet Data, Live Table Status, KDS Queue & Financial Analytics...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardWrapper}>
      
      {/* ==========================================
          SECTION 1: DASHBOARD HEADER & FILTERS
      ========================================== */}
      <div className={styles.headerCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 className={styles.headerTitle}>
              <FiCoffee className={styles.headerIcon} /> Restaurant ERP Operations & Intelligence
            </h1>
            <p className={styles.headerSubtext}>
              Unified Real-Time Overview of Sales, Live Orders, Dining Tables, KDS Kitchen, Stock Alerts & Financial Performance
            </p>
          </div>

          <button onClick={fetchDashboardMetrics} className={styles.refreshBtn}>
            <FiRefreshCw size={15} /> Refresh Operations
          </button>
        </div>

        {/* FILTERS BAR: Outlet Filter | Date Range Filter */}
        <div className={styles.filterBar}>
          {/* Outlet Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className={styles.filterLabel}>Outlet:</span>
            {restaurants.length === 0 ? (
              <button onClick={() => router.push("/restaurant/manage")} className={styles.noOutletBtn}>
                ⚠️ No restaurant outlet found (+ Create Outlet)
              </button>
            ) : (
              <select
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(e.target.value)}
                className={styles.selectControl}
              >
                <option value="ALL">🏢 All Outlets ({restaurants.length})</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    🏬 {r.name} ({r.code || "OUTLET"})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date Range Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className={styles.filterLabel}>Period:</span>
            <div className={styles.dateGroup}>
              {["TODAY", "YESTERDAY", "WEEK", "MONTH", "CUSTOM"].map((df) => (
                <button
                  key={df}
                  onClick={() => setDateFilter(df)}
                  className={`${styles.dateBtn} ${dateFilter === df ? styles.dateBtnActive : styles.dateBtnInactive}`}
                >
                  {df}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Pickers */}
          {dateFilter === "CUSTOM" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className={styles.customDateInput}
              />
              <span style={{ fontSize: "12px", color: "#b8a898" }}>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className={styles.customDateInput}
              />
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          SECTION 2: TOP SUMMARY METRIC CARDS (8 CARDS - UNIFIED MONOCHROME)
      ========================================== */}
      <div className={styles.summaryGrid}>
        
        {/* Card 1: Total Sales */}
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Total Sales</span>
            <div className={styles.cardIconBox}>
              <FiDollarSign size={19} />
            </div>
          </div>
          <div className={styles.metricValue}>
            ₹{totalSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className={styles.metricSubtext} style={{ color: "#2563eb" }}>
            {parseFloat(salesGrowthPct) >= 0 ? `↑ ${salesGrowthPct}% vs prev period` : `↓ ${salesGrowthPct}% vs prev period`}
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Total Orders</span>
            <div className={styles.cardIconBox}>
              <FiShoppingCart size={19} />
            </div>
          </div>
          <div className={styles.metricValue}>
            {totalOrdersCount} <span style={{ fontSize: "16px", fontWeight: "600", color: "#64748b" }}>Orders</span>
          </div>
          <div className={styles.metricSubtext} style={{ color: "#64748b" }}>
            {completedOrdersCount} Completed | {pendingOrdersCount} Pending
          </div>
        </div>

        {/* Card 3: Net Sales */}
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Net Sales</span>
            <div className={styles.cardIconBox}>
              <FiTrendingUp size={19} />
            </div>
          </div>
          <div className={styles.metricValue}>
            ₹{netSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className={styles.metricSubtext} style={{ color: "#64748b" }}>
            Gross ₹{grossSales.toFixed(0)} - Disc ₹{totalDiscounts.toFixed(0)}
          </div>
        </div>

        {/* Card 4: Net Profit */}
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Net Profit</span>
            <div className={styles.cardIconBox}>
              <FiActivity size={19} />
            </div>
          </div>
          <div className={styles.metricValue}>
            ₹{netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className={styles.metricSubtext} style={{ color: "#2563eb" }}>
            Food Cost ₹{totalFoodCost.toFixed(0)} | Exp ₹{totalExpensesPeriod.toFixed(0)}
          </div>
        </div>

        {/* Card 5: Customers */}
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Customers</span>
            <div className={styles.cardIconBox}>
              <FiUsers size={19} />
            </div>
          </div>
          <div className={styles.metricValue}>
            {customerStats.total} <span style={{ fontSize: "16px", fontWeight: "600", color: "#64748b" }}>Profiles</span>
          </div>
          <div className={styles.metricSubtext} style={{ color: "#64748b" }}>
            {customerStats.newCust} New | {customerStats.retCust} Returning
          </div>
        </div>

        {/* Card 6: Average Order Value */}
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Avg Order Value</span>
            <div className={styles.cardIconBox}>
              <FiPercent size={19} />
            </div>
          </div>
          <div className={styles.metricValue}>
            ₹{averageOrderValue}
          </div>
          <div className={styles.metricSubtext} style={{ color: "#64748b" }}>
            Average spend per dining order
          </div>
        </div>

        {/* Card 7: Table Status */}
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Table Status</span>
            <div className={styles.cardIconBox}>
              <FiCoffee size={19} />
            </div>
          </div>
          <div className={styles.metricValue}>
            {tableStats.occupied} / {tableStats.total} <span style={{ fontSize: "15px", fontWeight: "600", color: "#64748b" }}>Occupied</span>
          </div>
          <div className={styles.metricSubtext} style={{ color: "#64748b" }}>
            {tableStats.available} Available | {tableStats.reserved} Reserved
          </div>
        </div>

        {/* Card 8: Low Stock */}
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardHeaderTitle}>Low Stock Items</span>
            <div className={styles.cardIconBox}>
              <FiAlertCircle size={19} />
            </div>
          </div>
          <div className={styles.metricValue}>
            {lowStockIngredientsCount} <span style={{ fontSize: "15px", fontWeight: "600", color: "#64748b" }}>Items</span>
          </div>
          <div className={styles.metricSubtext} style={{ color: "#64748b" }}>
            Below min reorder threshold
          </div>
        </div>

      </div>

      {/* ==========================================
          SECTION 3: LIVE ORDER STATUS (7 CLICKABLE CARDS - UNIFIED SINGLE COLOR)
      ========================================== */}
      <div className={styles.liveStatusSection}>
        <h3 className={styles.sectionHeaderTitle}>
          <FiShoppingCart style={{ color: "#2563eb" }} /> Live Order Status (Clickable Quick Views)
        </h3>

        <div className={styles.liveStatusGrid}>
          
          <div onClick={() => router.push("/restaurant/orders?status=NEW")} className={styles.statusCard}>
            <span className={styles.statusCardTitle}>New Orders</span>
            <div className={styles.statusCardValue}>{liveOrderCounts.newOrders}</div>
            <span className={styles.statusCardLink}>View New Orders →</span>
          </div>

          <div onClick={() => router.push("/restaurant/orders?status=CONFIRMED")} className={styles.statusCard}>
            <span className={styles.statusCardTitle}>Confirmed Orders</span>
            <div className={styles.statusCardValue}>{liveOrderCounts.confirmedOrders}</div>
            <span className={styles.statusCardLink}>View Confirmed →</span>
          </div>

          <div onClick={() => router.push("/restaurant/orders?status=PREPARING")} className={styles.statusCard}>
            <span className={styles.statusCardTitle}>Preparing (KDS)</span>
            <div className={styles.statusCardValue}>{liveOrderCounts.preparing}</div>
            <span className={styles.statusCardLink}>View KDS Cooking →</span>
          </div>

          <div onClick={() => router.push("/restaurant/orders?status=READY")} className={styles.statusCard}>
            <span className={styles.statusCardTitle}>Plated & Ready</span>
            <div className={styles.statusCardValue}>{liveOrderCounts.ready}</div>
            <span className={styles.statusCardLink}>View Ready →</span>
          </div>

          <div onClick={() => router.push("/restaurant/orders?status=SERVED")} className={styles.statusCard}>
            <span className={styles.statusCardTitle}>Served</span>
            <div className={styles.statusCardValue}>{liveOrderCounts.served}</div>
            <span className={styles.statusCardLink}>View Served →</span>
          </div>

          <div onClick={() => router.push("/restaurant/orders?status=COMPLETED")} className={styles.statusCard}>
            <span className={styles.statusCardTitle}>Completed</span>
            <div className={styles.statusCardValue}>{liveOrderCounts.completed}</div>
            <span className={styles.statusCardLink}>View History →</span>
          </div>

          <div onClick={() => router.push("/restaurant/orders?status=CANCELLED")} className={styles.statusCard}>
            <span className={styles.statusCardTitle}>Cancelled</span>
            <div className={styles.statusCardValue}>{liveOrderCounts.cancelled}</div>
            <span className={styles.statusCardLink}>View Voided →</span>
          </div>

        </div>
      </div>

      {/* ==========================================
          ANALYTICS SECTION: SALES OVERVIEW & ORDER TYPE
      ========================================== */}
      <div className={styles.analyticsGrid}>
        
        {/* SECTION 4: SALES OVERVIEW CHART */}
        <div className={styles.sectionCard}>
          <div className={styles.cardTitleRow}>
            <div>
              <h4 className={styles.cardMainHeading}>Sales Overview Performance</h4>
              <span className={styles.cardSubHeading}>Gross Sales, Net Revenue, Discounts & Tax Breakdown</span>
            </div>

            {/* Daily, Weekly, Monthly Toggle */}
            <div className={styles.dateGroup}>
              {["DAILY", "WEEKLY", "MONTHLY"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSalesChartView(mode)}
                  className={`${styles.chartModeBtn} ${salesChartView === mode ? styles.chartModeBtnActive : ""}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesOverviewChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#0f172a", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  formatter={(val) => [`₹${Number(val).toFixed(2)}`]} 
                />
                <Legend verticalAlign="top" height={34} iconType="circle" />
                <Bar dataKey="GrossSales" name="Gross Sales" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="NetSales" name="Net Sales" fill="#059669" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Discounts" name="Discounts" fill="#d97706" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Tax" name="Tax" fill="#7e22ce" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION 5: ORDER TYPE SUMMARY */}
        <div className={styles.sectionCard}>
          <div style={{ marginBottom: "18px" }}>
            <h4 className={styles.cardMainHeading}>Order Type Distribution</h4>
            <span className={styles.cardSubHeading}>Dine In vs Takeaway vs Delivery vs Online Channel</span>
          </div>

          <div className={styles.orderTypeGrid}>
            {orderTypeSummary.map((item) => (
              <div key={item.name} className={styles.orderTypeItem} style={{ borderLeft: `4px solid ${item.color}` }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#786b5d", textTransform: "uppercase" }}>{item.name}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: "800", color: "#1c120c", marginTop: "2px" }}>₹{item.sales.toFixed(2)}</div>
                <div style={{ fontSize: "11px", color: "#8c7d6e", fontWeight: "600" }}>{item.count} orders ({item.pct}%)</div>
              </div>
            ))}
          </div>

          <div style={{ width: "100%", height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderTypeSummary} dataKey="sales" nameKey="name" cx="50%" cy="50%" innerRadius={38} outerRadius={62}>
                  {orderTypeSummary.map((entry, idx) => (
                    <Cell key={`cell-ot-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1c120c", border: "1px solid #d4af37", borderRadius: "10px", color: "#fff" }}
                  formatter={(val) => [`₹${Number(val).toFixed(2)}`, "Sales"]} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ==========================================
          LIVE OPERATIONS: KITCHEN KDS & TABLE STATUS
      ========================================== */}
      <div className={styles.operationsGrid}>
        
        {/* KITCHEN STATUS (KDS) */}
        <div className={styles.sectionCard}>
          <div className={styles.cardTitleRow}>
            <div>
              <h4 className={styles.cardMainHeading}>Kitchen Queue (KDS Display)</h4>
              <span className={styles.cardSubHeading}>Active Cooking & Preparation Status</span>
            </div>
            <Link href="/restaurant/kitchen" style={{ color: "#2563eb", fontWeight: "700", fontSize: "12px", textDecoration: "none" }}>
              Open KDS Display →
            </Link>
          </div>

          {/* KDS Status Counters */}
          <div className={styles.kdsCounters}>
            <div className={styles.kdsBox} style={{ background: "#eff6ff", borderColor: "#dbeafe" }}>
              <div style={{ fontSize: "11px", color: "#1e40af", fontWeight: "700" }}>New</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: "800", color: "#1e40af" }}>{liveOrderCounts.newOrders}</div>
            </div>
            <div className={styles.kdsBox} style={{ background: "#eff6ff", borderColor: "#dbeafe" }}>
              <div style={{ fontSize: "11px", color: "#1e40af", fontWeight: "700" }}>Preparing</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: "800", color: "#1e40af" }}>{liveOrderCounts.preparing}</div>
            </div>
            <div className={styles.kdsBox} style={{ background: "#eff6ff", borderColor: "#dbeafe" }}>
              <div style={{ fontSize: "11px", color: "#1e40af", fontWeight: "700" }}>Ready</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: "800", color: "#1e40af" }}>{liveOrderCounts.ready}</div>
            </div>
            <div className={styles.kdsBox} style={{ background: "#eff6ff", borderColor: "#dbeafe" }}>
              <div style={{ fontSize: "11px", color: "#1e40af", fontWeight: "700" }}>Delayed</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: "800", color: "#1e40af" }}>{delayedOrdersList.length}</div>
            </div>
          </div>

          {/* Delayed Orders List */}
          <h5 style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "700", color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.4px" }}>
            Delayed KOT Preparation Alerts
          </h5>
          {delayedOrdersList.length === 0 ? (
            <p style={{ color: "#8c7d6e", fontSize: "13px", margin: 0, textAlign: "center", padding: "18px", background: "#fbf9f5", borderRadius: "8px", border: "1px dashed #e8e2d8" }}>
              ✨ All Kitchen Preparation KOTs are running on time.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
              {delayedOrdersList.map((d) => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fef2f2", border: "1px solid #fca5a5", padding: "10px 14px", borderRadius: "8px", fontSize: "12px" }}>
                  <div>
                    <strong style={{ color: "#991b1b" }}>{d.kotNumber}</strong> (Table {d.tableNumber}) - {d.orderType}
                    <div style={{ fontSize: "11px", color: "#7f1d1d" }}>Time: {d.orderTime}</div>
                  </div>
                  <span style={{ fontWeight: "800", color: "#dc2626", background: "#fee2e2", padding: "3px 10px", borderRadius: "6px" }}>
                    ⚠️ {d.waitingTime}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LIVE TABLE STATUS */}
        <div className={styles.sectionCard}>
          <div className={styles.cardTitleRow}>
            <div>
              <h4 className={styles.cardMainHeading}>Dining Floor Plan ({tables.length} Tables)</h4>
              <span className={styles.cardSubHeading}>Live Occupancy & Status Indicator</span>
            </div>
            <Link href="/restaurant/tables" style={{ color: "#d97706", fontWeight: "700", fontSize: "12px", textDecoration: "none" }}>
              View All Tables →
            </Link>
          </div>

          {tables.length === 0 ? (
            <p style={{ color: "#8c7d6e", textAlign: "center", padding: "28px", background: "#fbf9f5", borderRadius: "8px", border: "1px dashed #e8e2d8" }}>
              No dining floor tables configured yet.
            </p>
          ) : (
            <div className={styles.tableGrid}>
              {tables.map((tbl) => {
                const isOccupied = tbl.status === "OCCUPIED";
                const isReserved = tbl.status === "RESERVED";
                const isAvailable = tbl.status === "AVAILABLE";
                const isCleaning = tbl.status === "CLEANING" || tbl.status === "DIRTY";

                const bg = isOccupied ? "#fef2f2" : isReserved ? "#eff6ff" : isAvailable ? "#f0fdf4" : isCleaning ? "#fffbeb" : "#f8fafc";
                const border = isOccupied ? "#ef4444" : isReserved ? "#3b82f6" : isAvailable ? "#10b981" : isCleaning ? "#f59e0b" : "#cbd5e1";
                const text = isOccupied ? "#991b1b" : isReserved ? "#1e40af" : isAvailable ? "#065f46" : isCleaning ? "#92400e" : "#475569";

                return (
                  <div
                    key={tbl.id}
                    onClick={() => router.push(`/restaurant/tables`)}
                    className={styles.tableBox}
                    style={{
                      backgroundColor: bg,
                      border: `2px solid ${border}`,
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: "800", color: text }}>{tbl.tableNumber}</div>
                    <div style={{ fontSize: "10px", color: text, opacity: 0.85 }}>{tbl.capacity} Seats</div>
                    <div style={{ fontSize: "9px", fontWeight: "800", color: text, marginTop: "4px", textTransform: "uppercase" }}>
                      {tbl.status}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ==========================================
          SECTION 6: 3-COLUMN FEATURE CARDS
      ========================================== */}
      <div className={styles.threeColGrid}>
        
        {/* TODAY'S RESERVATIONS */}
        <div className={styles.sectionCard}>
          <div className={styles.cardTitleRow}>
            <h4 className={styles.cardMainHeading} style={{ fontSize: "16px" }}>Today's Reservations</h4>
            <Link href="/restaurant/reservations" style={{ color: "#7e22ce", fontWeight: "700", fontSize: "11px", textDecoration: "none" }}>
              View All →
            </Link>
          </div>

          {reservations.length === 0 ? (
            <p style={{ color: "#8c7d6e", fontSize: "12px", textAlign: "center", padding: "30px 0" }}>No table reservations for this date.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "220px", overflowY: "auto" }}>
              {reservations.slice(0, 5).map((r) => (
                <div key={r.id} className={styles.listItemRow} style={{ borderLeft: "3px solid #7e22ce" }}>
                  <div style={{ fontWeight: "700", color: "#1c120c" }}>{r.customerName || "Guest"} ({r.guestCount || 2} Guests)</div>
                  <div style={{ fontSize: "11px", color: "#786b5d" }}>Time: {r.reservationTime || "07:30 PM"} | Phone: {r.phone || "N/A"}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TOP SELLING MENU ITEMS */}
        <div className={styles.sectionCard}>
          <div style={{ marginBottom: "14px" }}>
            <h4 className={styles.cardMainHeading} style={{ fontSize: "16px" }}>Top Selling Dishes</h4>
            <span className={styles.cardSubHeading}>Highest grossing menu items</span>
          </div>

          {topSellingItemsList.length === 0 ? (
            <p style={{ color: "#8c7d6e", fontSize: "12px", textAlign: "center", padding: "30px 0" }}>No dish sales recorded yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {topSellingItemsList.map((item) => {
                const rankColor = item.rank === 1 ? "#d4af37" : item.rank === 2 ? "#94a3b8" : item.rank === 3 ? "#b45309" : "#64748b";
                return (
                  <div key={item.name} className={styles.listItemRow} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span className={styles.rankBadge} style={{ color: rankColor }}>#{item.rank}</span>
                      <span style={{ fontWeight: "700", color: "#1c120c" }}>{item.name}</span>
                    </div>
                    <div style={{ textAlign: "right", fontWeight: "700", color: "#059669" }}>
                      ₹{item.sales.toFixed(2)} <span style={{ fontSize: "10px", color: "#786b5d" }}>({item.qty} sold)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LOW STOCK ALERTS */}
        <div className={styles.sectionCard}>
          <div className={styles.cardTitleRow}>
            <h4 className={styles.cardMainHeading} style={{ fontSize: "16px" }}>Low Stock Ingredients</h4>
            <Link href="/purchases/add" style={{ color: "#dc2626", fontWeight: "700", fontSize: "11px", textDecoration: "none" }}>
              + Create PO →
            </Link>
          </div>

          {lowStockAlertsList.length === 0 ? (
            <p style={{ color: "#8c7d6e", fontSize: "12px", textAlign: "center", padding: "30px 0" }}>✨ All ingredient stock levels normal.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "220px", overflowY: "auto" }}>
              {lowStockAlertsList.map((ing) => (
                <div key={ing.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fef2f2", border: "1px solid #fee2e2", padding: "8px 10px", borderRadius: "8px", fontSize: "12px" }}>
                  <div>
                    <div style={{ fontWeight: "700", color: "#991b1b" }}>{ing.name} ({ing.code})</div>
                    <div style={{ fontSize: "10px", color: "#7f1d1d" }}>Stock: {ing.stock} {ing.unit} (Min: {ing.minStock})</div>
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: "800", color: "#dc2626", background: "#fee2e2", padding: "2px 6px", borderRadius: "4px" }}>
                    {ing.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ==========================================
          FINANCIAL & WASTAGE SUMMARIES
      ========================================== */}
      <div className={styles.threeColGrid} style={{ gridTemplateColumns: "1fr 1fr" }}>
        
        {/* PAYMENT SUMMARY */}
        <div className={styles.sectionCard}>
          <h4 className={styles.cardMainHeading} style={{ fontSize: "16px", marginBottom: "14px" }}>Payment Summary</h4>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", marginBottom: "16px" }}>
            {Object.entries(paymentSummaryData.methods).map(([mName, data]) => (
              <div key={mName} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #eee8df" }}>
                <span style={{ color: "#64748b" }}>{mName}</span>
                <span style={{ fontWeight: "700", color: "#1c120c" }}>₹{data.amount.toFixed(2)} ({data.count} txns)</span>
              </div>
            ))}
          </div>

          <div style={{ background: "#fbf9f5", padding: "12px", borderRadius: "10px", border: "1px solid #eee8df", fontSize: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>Total Paid: <strong style={{ color: "#059669" }}>₹{paymentSummaryData.totalPaid.toFixed(2)}</strong></div>
            <div>Pending: <strong style={{ color: "#d97706" }}>₹{paymentSummaryData.pendingPayments.toFixed(2)}</strong></div>
          </div>
        </div>

        {/* FOOD COST & PROFIT SUMMARY */}
        <div className={styles.sectionCard}>
          <h4 className={styles.cardMainHeading} style={{ fontSize: "16px", marginBottom: "14px" }}>Food Cost & Profit Summary</h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#786b5d" }}>Total Sales Revenue:</span>
              <strong style={{ color: "#1c120c" }}>₹{totalSales.toFixed(2)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#786b5d" }}>Food Cost (COGS):</span>
              <strong style={{ color: "#d97706" }}>₹{totalFoodCost.toFixed(2)} ({totalSales > 0 ? ((totalFoodCost / totalSales) * 100).toFixed(1) : 0}%)</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#786b5d" }}>Gross Profit:</span>
              <strong style={{ color: "#2563eb" }}>₹{grossProfit.toFixed(2)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#786b5d" }}>Operating Expenses:</span>
              <strong style={{ color: "#dc2626" }}>₹{totalExpensesPeriod.toFixed(2)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", borderTop: "2px solid #e8e2d8", fontWeight: "800", fontFamily: "'Playfair Display', serif", fontSize: "16px" }}>
              <span>Net Profit:</span>
              <span style={{ color: netProfit >= 0 ? "#059669" : "#dc2626" }}>₹{netProfit.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ==========================================
          SECTION 7: RECENT ORDERS TABLE
      ========================================== */}
      <div className={styles.sectionCard} style={{ marginBottom: "30px" }}>
        <div className={styles.cardTitleRow}>
          <div>
            <h4 className={styles.cardMainHeading}>Recent Restaurant Orders</h4>
            <span className={styles.cardSubHeading}>Latest live restaurant transactions</span>
          </div>
          <Link href="/restaurant/orders" style={{ color: "#d4af37", fontWeight: "700", fontSize: "13px", textDecoration: "none" }}>
            View All Orders →
          </Link>
        </div>

        {filteredOrders.length === 0 ? (
          <p style={{ color: "#8c7d6e", textAlign: "center", padding: "28px" }}>No orders found for the selected filter.</p>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.customTable}>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Table</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.slice(0, 8).map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: "800", color: "#2563eb" }}>{o.orderNumber}</td>
                    <td style={{ color: "#786b5d" }}>
                      {o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"}
                    </td>
                    <td style={{ fontWeight: "600", color: "#1c120c" }}>{o.customerName || o.customer?.name || "Guest Customer"}</td>
                    <td style={{ color: "#786b5d" }}>{o.table?.tableNumber || o.tableNumber || "N/A"}</td>
                    <td style={{ fontWeight: "600", color: "#4a3c31" }}>{o.orderType}</td>
                    <td style={{ fontWeight: "800", color: "#1c120c" }}>₹{parseFloat(o.totalAmount || 0).toFixed(2)}</td>
                    <td>
                      <span style={{ fontSize: "11px", fontWeight: "800", padding: "3px 10px", borderRadius: "12px", backgroundColor: o.paymentStatus === "PAID" ? "#d1fae5" : "#fef3c7", color: o.paymentStatus === "PAID" ? "#065f46" : "#92400e" }}>
                        {o.paymentStatus || "PENDING"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "11px", fontWeight: "800", padding: "3px 10px", borderRadius: "12px", backgroundColor: o.status === "COMPLETED" ? "#d1fae5" : o.status === "CANCELLED" ? "#fee2e2" : "#dbeafe", color: o.status === "COMPLETED" ? "#065f46" : o.status === "CANCELLED" ? "#991b1b" : "#1e40af" }}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==========================================
          SECTION 8: OPERATIONAL QUICK ACTIONS
      ========================================== */}
      <div className={styles.sectionCard}>
        <h4 className={styles.cardMainHeading} style={{ marginBottom: "16px" }}>Operational Quick Actions</h4>
        
        <div className={styles.quickActionsGrid}>
          <Link href="/restaurant/pos" className={styles.quickActionLink} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8" }}>
            <FiMonitor size={17} /> New Order (POS)
          </Link>
          <Link href="/restaurant/tables" className={styles.quickActionLink} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d" }}>
            <FiGrid size={17} /> Manage Tables
          </Link>
          <Link href="/restaurant/reservations" className={styles.quickActionLink} style={{ background: "#faf5ff", border: "1px solid #e9d5ff", color: "#7e22ce" }}>
            <FiCalendar size={17} /> New Reservation
          </Link>
          <Link href="/restaurant/menu" className={styles.quickActionLink} style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#b45309" }}>
            <FiBox size={17} /> Manage Menu
          </Link>
          <Link href="/admin/products/view" className={styles.quickActionLink} style={{ background: "#f0fdfa", border: "1px solid #99f6e4", color: "#0f766e" }}>
            <FiPackage size={17} /> Ingredients Stock
          </Link>
          <Link href="/restaurant/kitchen" className={styles.quickActionLink} style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857" }}>
            <FiTv size={17} /> Open KDS Display
          </Link>
          <Link href="/admin/employees/view" className={styles.quickActionLink} style={{ background: "#fdf4ff", border: "1px solid #f5d0fe", color: "#86198f" }}>
            <FiUsers size={17} /> Staff Management
          </Link>
          <Link href="/restaurant/reports" className={styles.quickActionLink} style={{ background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0369a1" }}>
            <FiBarChart2 size={17} /> Reports & Analytics
          </Link>
        </div>
      </div>

    </div>
  );
}
