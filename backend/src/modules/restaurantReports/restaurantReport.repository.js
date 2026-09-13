import prisma from "../../config/prisma.js";

/**
 * Helper to compute date range window
 */
export const buildDateRange = (startDate, endDate, period = "today") => {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  const normalizedPeriod = (period || "").toLowerCase();

  if (startDate && endDate) {
    start = new Date(startDate);
    if (!startDate.includes("T")) start.setHours(0, 0, 0, 0);

    end = new Date(endDate);
    if (!endDate.includes("T")) end.setHours(23, 59, 59, 999);
  } else if (normalizedPeriod === "yesterday") {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else if (normalizedPeriod === "last_7_days") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (normalizedPeriod === "last_30_days") {
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (normalizedPeriod === "this_month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (normalizedPeriod === "last_month") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else {
    // Default: today
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  // Calculate comparison previous period with same duration
  const durationMs = Math.max(end.getTime() - start.getTime(), 1000);
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  return { start, end, prevStart, prevEnd };
};

/**
 * Fetch Comprehensive Restaurant Reports & Analytics Data
 */
export const getRestaurantAnalytics = async (params) => {
  const { restaurantId, companyId, branchId, startDate, endDate, period } = params;

  const { start, end, prevStart, prevEnd } = buildDateRange(startDate, endDate, period);

  if (!companyId) {
    return {
      overview: { totalSales: 0, previousPeriodSales: 0, salesGrowthPercent: 0, totalOrders: 0, completedOrdersCount: 0, averageOrderValue: 0, liveActiveOrders: 0, totalCustomers: 0 },
      salesTimeline: [],
      salesByOrderType: [],
      orderAnalytics: { totalOrders: 0, validOrders: 0, completedOrders: 0, activeOrders: 0, cancelledOrders: 0, pendingOrders: 0, statusBreakdown: {} },
      menuPerformance: { topSelling: [], topRevenue: [], totalItemsSold: 0, distinctItemsCount: 0 },
      tablePerformance: [],
      paymentAnalytics: [],
      staffPerformance: [],
      inventoryInsights: { lowStock: [], outOfStock: [], totalTrackedIngredients: 0 },
    };
  }

  // Build Base Filter for Orders
  const orderWhere = {
    companyId,
    createdAt: {
      gte: start,
      lte: end,
    },
  };

  if (restaurantId && restaurantId !== "ALL" && restaurantId !== "undefined" && restaurantId !== "null" && String(restaurantId).trim() !== "") {
    orderWhere.restaurantId = restaurantId;
  }
  if (branchId) {
    orderWhere.branchId = branchId;
  }

  // Previous period filter for comparison
  const prevOrderWhere = {
    ...orderWhere,
    createdAt: {
      gte: prevStart,
      lte: prevEnd,
    },
  };

  // 1. Fetch Orders within date range
  const currentOrders = await prisma.restaurantOrder.findMany({
    where: orderWhere,
    include: {
      table: {
        include: {
          area: true,
        },
      },
      customer: true,
      items: {
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
      },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Fetch Comparison Previous Period Orders (for sales growth)
  const prevOrders = await prisma.restaurantOrder.findMany({
    where: prevOrderWhere,
    select: {
      id: true,
      status: true,
      totalAmount: true,
    },
  });

  // 3. Fetch all current Active Orders in the restaurant (Live state, regardless of date filter)
  const liveActiveWhere = {
    status: { in: ["CONFIRMED", "PREPARING", "READY", "SERVED"] },
  };
  if (restaurantId && restaurantId !== "ALL") {
    liveActiveWhere.restaurantId = restaurantId;
  }
  if (companyId) {
    liveActiveWhere.companyId = companyId;
  }
  const liveActiveOrdersCount = await prisma.restaurantOrder.count({
    where: liveActiveWhere,
  });

  // 4. OVERVIEW SUMMARY CALCULATIONS
  const completedOrders = currentOrders.filter((o) => o.status === "COMPLETED");
  const totalSales = completedOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

  const prevCompletedOrders = prevOrders.filter((o) => o.status === "COMPLETED");
  const prevTotalSales = prevCompletedOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

  let salesGrowthPercent = 0;
  if (prevTotalSales > 0) {
    salesGrowthPercent = ((totalSales - prevTotalSales) / prevTotalSales) * 100;
  } else if (totalSales > 0) {
    salesGrowthPercent = 100;
  }

  const totalOrdersCount = currentOrders.filter((o) => o.status !== "DRAFT").length;
  const completedCount = completedOrders.length;
  const averageOrderValue = completedCount > 0 ? totalSales / completedCount : 0;

  // Distinct Customers
  const customerSet = new Set();
  currentOrders.forEach((o) => {
    if (o.customerId) customerSet.add(o.customerId);
    else if (o.customer?.name) customerSet.add(o.customer.name.trim().toLowerCase());
  });
  const totalCustomers = customerSet.size;

  // 5. SALES BY ORDER TYPE
  const dineInOrders = completedOrders.filter((o) => o.orderType === "DINE_IN");
  const takeawayOrders = completedOrders.filter((o) => o.orderType === "TAKEAWAY");
  const deliveryOrders = completedOrders.filter((o) => o.orderType === "DELIVERY");

  const dineInSales = dineInOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
  const takeawaySales = takeawayOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
  const deliverySales = deliveryOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);

  const salesByOrderType = [
    {
      type: "DINE_IN",
      label: "Dine In",
      amount: dineInSales,
      ordersCount: dineInOrders.length,
      percentage: totalSales > 0 ? (dineInSales / totalSales) * 100 : 0,
    },
    {
      type: "TAKEAWAY",
      label: "Takeaway",
      amount: takeawaySales,
      ordersCount: takeawayOrders.length,
      percentage: totalSales > 0 ? (takeawaySales / totalSales) * 100 : 0,
    },
    {
      type: "DELIVERY",
      label: "Delivery",
      amount: deliverySales,
      ordersCount: deliveryOrders.length,
      percentage: totalSales > 0 ? (deliverySales / totalSales) * 100 : 0,
    },
  ];

  // 6. ORDER ANALYTICS & STATUS BREAKDOWN
  const statusCounts = {
    DRAFT: 0,
    HELD: 0,
    CONFIRMED: 0,
    PREPARING: 0,
    READY: 0,
    SERVED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  currentOrders.forEach((o) => {
    if (statusCounts[o.status] !== undefined) {
      statusCounts[o.status]++;
    }
  });

  const activeInPeriodCount =
    statusCounts.CONFIRMED + statusCounts.PREPARING + statusCounts.READY + statusCounts.SERVED;

  const orderAnalytics = {
    totalOrders: currentOrders.length,
    validOrders: totalOrdersCount,
    completedOrders: statusCounts.COMPLETED,
    activeOrders: activeInPeriodCount,
    cancelledOrders: statusCounts.CANCELLED,
    pendingOrders: statusCounts.DRAFT + statusCounts.HELD,
    statusBreakdown: statusCounts,
  };

  // 7. SALES TIMELINE (Dynamic Hourly or Daily granularity)
  const isSingleDay =
    start.toDateString() === end.toDateString() ||
    end.getTime() - start.getTime() <= 24 * 60 * 60 * 1000 + 1000;

  const timelineMap = {};

  if (isSingleDay) {
    // Generate 24 hourly buckets: 00:00 to 23:00
    for (let h = 0; h < 24; h++) {
      const label = `${h.toString().padStart(2, "0")}:00`;
      timelineMap[label] = { label, sales: 0, orders: 0, timestamp: h };
    }
    completedOrders.forEach((o) => {
      const orderDate = new Date(o.createdAt);
      const h = orderDate.getHours();
      const label = `${h.toString().padStart(2, "0")}:00`;
      if (timelineMap[label]) {
        timelineMap[label].sales += parseFloat(o.totalAmount) || 0;
        timelineMap[label].orders += 1;
      }
    });
  } else {
    // Generate Daily buckets
    const curr = new Date(start);
    while (curr <= end) {
      const label = curr.toISOString().split("T")[0]; // YYYY-MM-DD
      const displayLabel = curr.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      timelineMap[label] = { label: displayLabel, rawDate: label, sales: 0, orders: 0 };
      curr.setDate(curr.getDate() + 1);
    }
    completedOrders.forEach((o) => {
      const label = new Date(o.createdAt).toISOString().split("T")[0];
      if (timelineMap[label]) {
        timelineMap[label].sales += parseFloat(o.totalAmount) || 0;
        timelineMap[label].orders += 1;
      }
    });
  }

  const salesTimeline = Object.values(timelineMap);

  // 8. MENU ITEM PERFORMANCE
  const itemMap = {};
  currentOrders
    .filter((o) => o.status !== "CANCELLED")
    .forEach((o) => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item) => {
          const id = item.menuItemId;
          if (!itemMap[id]) {
            itemMap[id] = {
              menuItemId: id,
              name: item.menuItem?.name || "Unknown Item",
              categoryName: item.menuItem?.category?.name || "General",
              quantitySold: 0,
              totalRevenue: 0,
              unitPrice: parseFloat(item.unitPrice) || 0,
            };
          }
          itemMap[id].quantitySold += parseFloat(item.quantity) || 0;
          if (o.status === "COMPLETED") {
            itemMap[id].totalRevenue += parseFloat(item.total) || 0;
          }
        });
      }
    });

  const allMenuItems = Object.values(itemMap);
  const topSellingItems = [...allMenuItems]
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 10)
    .map((item, index) => ({ rank: index + 1, ...item }));

  const topRevenueItems = [...allMenuItems]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10)
    .map((item, index) => ({ rank: index + 1, ...item }));

  const totalItemsSold = allMenuItems.reduce((sum, i) => sum + i.quantitySold, 0);

  // 9. TABLE PERFORMANCE (Dine-In only)
  const tableMap = {};
  const tableQuery = {
    restaurant: { companyId },
  };
  if (restaurantId && restaurantId !== "ALL" && restaurantId !== "undefined" && restaurantId !== "null" && String(restaurantId).trim() !== "") {
    tableQuery.restaurantId = restaurantId;
  }
  const allTables = await prisma.restaurantTable.findMany({
    where: tableQuery,
    include: { area: true },
  });

  allTables.forEach((t) => {
    tableMap[t.id] = {
      tableId: t.id,
      tableNumber: t.tableNumber,
      areaName: t.area?.name || "Main Dining",
      capacity: t.capacity,
      currentStatus: t.status,
      totalOrders: 0,
      totalSales: 0,
      averageOrderValue: 0,
    };
  });

  currentOrders
    .filter((o) => o.orderType === "DINE_IN" && o.tableId)
    .forEach((o) => {
      if (!tableMap[o.tableId]) {
        tableMap[o.tableId] = {
          tableId: o.tableId,
          tableNumber: o.table?.tableNumber || "Table",
          areaName: o.table?.area?.name || "Main Dining",
          capacity: o.table?.capacity || 4,
          currentStatus: o.table?.status || "AVAILABLE",
          totalOrders: 0,
          totalSales: 0,
          averageOrderValue: 0,
        };
      }
      tableMap[o.tableId].totalOrders += 1;
      if (o.status === "COMPLETED") {
        tableMap[o.tableId].totalSales += parseFloat(o.totalAmount) || 0;
      }
    });

  const tablePerformance = Object.values(tableMap)
    .map((t) => ({
      ...t,
      averageOrderValue: t.totalOrders > 0 ? t.totalSales / t.totalOrders : 0,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);

  // 10. PAYMENT ANALYTICS
  const paymentMap = {
    CASH: { method: "CASH", label: "Cash", count: 0, amount: 0 },
    CARD: { method: "CARD", label: "Card", count: 0, amount: 0 },
    UPI: { method: "UPI", label: "UPI / QR", count: 0, amount: 0 },
    ONLINE: { method: "ONLINE", label: "Online", count: 0, amount: 0 },
    CREDIT: { method: "CREDIT", label: "Credit", count: 0, amount: 0 },
    OTHER: { method: "OTHER", label: "Other", count: 0, amount: 0 },
  };

  currentOrders.forEach((o) => {
    if (o.payments && Array.isArray(o.payments) && o.payments.length > 0) {
      o.payments.forEach((p) => {
        const m = (p.method || "CASH").toUpperCase();
        const bucket = paymentMap[m] || paymentMap.OTHER;
        bucket.count += 1;
        bucket.amount += parseFloat(p.amount) || 0;
      });
    }
  });

  const totalPaymentAmount = Object.values(paymentMap).reduce((sum, p) => sum + p.amount, 0);
  const paymentAnalytics = Object.values(paymentMap).map((p) => ({
    ...p,
    percentage: totalPaymentAmount > 0 ? (p.amount / totalPaymentAmount) * 100 : 0,
  }));

  // 11. STAFF PERFORMANCE
  const staffMap = {};
  currentOrders
    .filter((o) => o.status !== "DRAFT")
    .forEach((o) => {
      const staffName = o.createdBy || "Direct POS";
      if (!staffMap[staffName]) {
        staffMap[staffName] = {
          staffName,
          ordersTaken: 0,
          completedOrders: 0,
          totalSales: 0,
        };
      }
      staffMap[staffName].ordersTaken += 1;
      if (o.status === "COMPLETED") {
        staffMap[staffName].completedOrders += 1;
        staffMap[staffName].totalSales += parseFloat(o.totalAmount) || 0;
      }
    });

  const staffPerformance = Object.values(staffMap).sort((a, b) => b.totalSales - a.totalSales);

  // 12. INGREDIENT / INVENTORY STOCK INSIGHTS (Using real Product & Inventory relations)
  const productWhere = {};
  if (companyId) productWhere.companyId = companyId;

  const rawMaterials = await prisma.product.findMany({
    where: productWhere,
    include: {
      unit: true,
      supplier: true,
      inventories: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const processedMaterials = rawMaterials.map((p) => {
    const invQty = (p.inventories || []).reduce(
      (sum, inv) => sum + (parseFloat(inv.quantity) || 0),
      0
    );
    const currentStock = p.inventories && p.inventories.length > 0 ? invQty : (parseFloat(p.initialStock) || 0);
    const minStock = parseFloat(p.minimumStock) || 5;

    return {
      id: p.id,
      name: p.name,
      sku: p.sku || "N/A",
      currentStock,
      minimumStock: minStock,
      unit: p.unit?.name || p.unit?.code || "kg",
      supplierName: p.supplier?.companyName || p.supplier?.name || "N/A",
      costPrice: parseFloat(p.costPrice) || 0,
    };
  });

  const lowStockIngredients = processedMaterials
    .filter((p) => p.currentStock > 0 && p.currentStock <= p.minimumStock)
    .map((p) => ({ ...p, status: "LOW_STOCK" }));

  const outOfStockIngredients = processedMaterials
    .filter((p) => p.currentStock <= 0)
    .map((p) => ({ ...p, status: "OUT_OF_STOCK" }));

  return {
    overview: {
      totalSales,
      previousPeriodSales: prevTotalSales,
      salesGrowthPercent,
      totalOrders: totalOrdersCount,
      completedOrdersCount: completedCount,
      averageOrderValue,
      liveActiveOrders: liveActiveOrdersCount,
      totalCustomers,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
        period,
      },
    },
    salesTimeline,
    salesByOrderType,
    orderAnalytics,
    menuPerformance: {
      topSelling: topSellingItems,
      topRevenue: topRevenueItems,
      totalItemsSold,
      distinctItemsCount: allMenuItems.length,
    },
    tablePerformance,
    paymentAnalytics,
    staffPerformance,
    inventoryInsights: {
      lowStock: lowStockIngredients,
      outOfStock: outOfStockIngredients,
      totalTrackedIngredients: rawMaterials.length,
    },
  };
};
