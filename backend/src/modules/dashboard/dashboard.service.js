import prisma from "../../config/prisma.js";

/**
 * Utility to calculate percentage difference between two numbers
 */
const calculateDelta = (current, previous) => {
  const curr = Number(current || 0);
  const prev = Number(previous || 0);

  if (prev === 0) {
    if (curr > 0) return { deltaStr: "+100%", isPositive: true, raw: 100 };
    return { deltaStr: "0.0%", isPositive: true, raw: 0 };
  }

  const diff = ((curr - prev) / prev) * 100;
  const rounded = Math.round(diff * 10) / 10;
  const sign = rounded >= 0 ? "+" : "";
  return {
    deltaStr: `${sign}${rounded.toFixed(1)}%`,
    isPositive: rounded >= 0,
    raw: rounded,
  };
};

/**
 * Resolve start and end Date objects based on filter string or custom dates
 */
const parseDateRange = (period = "30days", customStart, customEnd) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();
  let prevStart = new Date();
  let prevEnd = new Date();

  switch (period.toLowerCase()) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      // Previous period = yesterday
      prevStart.setDate(start.getDate() - 1);
      prevStart.setHours(0, 0, 0, 0);
      prevEnd.setDate(end.getDate() - 1);
      prevEnd.setHours(23, 59, 59, 999);
      break;

    case "yesterday":
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      prevStart.setDate(start.getDate() - 1);
      prevStart.setHours(0, 0, 0, 0);
      prevEnd.setDate(end.getDate() - 1);
      prevEnd.setHours(23, 59, 59, 999);
      break;

    case "7days":
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      prevStart.setDate(start.getDate() - 7);
      prevStart.setHours(0, 0, 0, 0);
      prevEnd = new Date(start);
      break;

    case "30days":
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      prevStart.setDate(start.getDate() - 30);
      prevStart.setHours(0, 0, 0, 0);
      prevEnd = new Date(start);
      break;

    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      // Previous month
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;

    case "last_month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
      break;

    case "this_year":
      start = new Date(now.getFullYear(), 0, 1);
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;

    case "custom":
      if (customStart) start = new Date(customStart);
      if (customEnd) end = new Date(customEnd);
      const spanMs = end.getTime() - start.getTime();
      prevEnd = new Date(start.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - spanMs);
      break;

    default: // default to 30 days
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      prevStart.setDate(start.getDate() - 30);
      prevStart.setHours(0, 0, 0, 0);
      prevEnd = new Date(start);
  }

  return { start, end, prevStart, prevEnd };
};

/**
 * Main Overview Service
 */
export const getDashboardOverview = async ({
  companyId,
  branchId,
  userRole,
  userId,
  period = "30days",
  startDate,
  endDate,
}) => {
  const { start, end, prevStart, prevEnd } = parseDateRange(period, startDate, endDate);

  // Build base filters
  const companyWhere = companyId ? { companyId } : {};
  const isAllBranches = !branchId || branchId === "ALL";

  // Role branch locking: if not Super Admin / Admin, lock to user's assigned branch
  const effectiveBranchId =
    userRole === "SUPER_ADMIN" || userRole === "SUPERADMIN" || userRole === "ADMIN"
      ? (isAllBranches ? undefined : branchId)
      : branchId;

  const branchWhere = effectiveBranchId ? { branchId: effectiveBranchId } : {};

  // ----------------------------------------------------
  // 1. DYNAMIC SUMMARY & KPIS
  // ----------------------------------------------------

  // 1.1 Total Active Products & Delta
  const [currentActiveProducts, prevActiveProducts] = await Promise.all([
    prisma.product.count({
      where: {
        status: "ACTIVE",
        ...companyWhere,
        createdAt: { lte: end },
      },
    }).catch(() => 0),
    prisma.product.count({
      where: {
        status: "ACTIVE",
        ...companyWhere,
        createdAt: { lte: prevEnd },
      },
    }).catch(() => 0),
  ]);
  const productDelta = calculateDelta(currentActiveProducts, prevActiveProducts);

  // 1.2 Active Staff Members & Delta
  const [currentActiveStaff, prevActiveStaff] = await Promise.all([
    prisma.user.count({
      where: {
        ...companyWhere,
        ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
        createdAt: { lte: end },
      },
    }).catch(() => 0),
    prisma.user.count({
      where: {
        ...companyWhere,
        ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
        createdAt: { lte: prevEnd },
      },
    }).catch(() => 0),
  ]);
  const staffDelta = calculateDelta(currentActiveStaff, prevActiveStaff);

  // 1.3 Inventories for Valuation, Stock Health & Low Stock
  const inventoryWhere = {
    product: {
      ...companyWhere,
      status: "ACTIVE",
    },
  };

  const inventories = await prisma.inventory.findMany({
    where: inventoryWhere,
    include: {
      product: {
        include: {
          category: true,
        },
      },
      warehouse: true,
    },
  }).catch(() => []);

  let totalValuation = 0;
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  const productIdsTracked = new Set();

  inventories.forEach((item) => {
    const qty = Number(item.quantity || 0);
    const cost = Number(item.product?.costPrice || item.product?.sellingPrice || 0);
    const reorder = Number(item.reorderLevel ?? item.product?.reorderLevel ?? 10);

    totalValuation += Math.max(0, qty) * cost;
    if (item.productId) productIdsTracked.add(item.productId);

    if (qty <= 0) {
      outOfStockCount++;
    } else if (qty <= reorder) {
      lowStockCount++;
    } else {
      inStockCount++;
    }
  });

  const totalSkus = productIdsTracked.size || currentActiveProducts;

  // 1.4 Sales & Revenue in Period
  const salesWhere = {
    ...companyWhere,
    ...branchWhere,
    createdAt: { gte: start, lte: end },
    status: { not: "CANCELLED" },
  };

  const prevSalesWhere = {
    ...companyWhere,
    ...branchWhere,
    createdAt: { gte: prevStart, lte: prevEnd },
    status: { not: "CANCELLED" },
  };

  const [currentSales, prevSales] = await Promise.all([
    prisma.salesOrder.findMany({
      where: salesWhere,
      select: {
        id: true,
        netAmount: true,
        totalAmount: true,
        orderNumber: true,
        orderDate: true,
        createdAt: true,
        customerId: true,
      },
    }).catch(() => []),
    prisma.salesOrder.findMany({
      where: prevSalesWhere,
      select: {
        netAmount: true,
        totalAmount: true,
      },
    }).catch(() => []),
  ]);

  const totalEarnings = currentSales.reduce(
    (sum, s) => sum + Number(s.netAmount || s.totalAmount || 0),
    0
  );
  const prevEarnings = prevSales.reduce(
    (sum, s) => sum + Number(s.netAmount || s.totalAmount || 0),
    0
  );
  const earningsDelta = calculateDelta(totalEarnings, prevEarnings);

  // 1.5 Total Outstanding Balance
  const totalOutstandingRes = await prisma.customer.aggregate({
    where: companyWhere,
    _sum: {
      currentBalance: true,
    },
  }).catch(() => ({ _sum: { currentBalance: 0 } }));
  const totalOutstanding = Math.round(Number(totalOutstandingRes?._sum?.currentBalance || 0));

  // 1.6 Fine / Shrinkage Recovered (from Wastage / Damaged Stock records)
  const wastageRes = await prisma.wastage.aggregate({
    where: {
      ...companyWhere,
      createdAt: { gte: start, lte: end },
    },
    _sum: {
      totalCost: true,
    },
  }).catch(() => ({ _sum: { totalCost: 0 } }));
  const shrinkageCost = Math.round(Number(wastageRes?._sum?.totalCost || 0));

  // ----------------------------------------------------
  // 2. BEST-SELLING SKU & TOP CATEGORIES
  // ----------------------------------------------------
  const completedInvoices = await prisma.invoice.findMany({
    where: {
      ...companyWhere,
      ...branchWhere,
      status: { not: "CANCELLED" },
    },
    include: {
      items: true,
    },
    take: 200,
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const productUnitsSoldMap = {};
  completedInvoices.forEach((inv) => {
    (inv.items || []).forEach((item) => {
      if (item.productId) {
        productUnitsSoldMap[item.productId] =
          (productUnitsSoldMap[item.productId] || 0) + Number(item.quantity || 1);
      }
    });
  });

  let bestSellingProduct = null;
  const sortedProductIds = Object.keys(productUnitsSoldMap).sort(
    (a, b) => productUnitsSoldMap[b] - productUnitsSoldMap[a]
  );

  if (sortedProductIds.length > 0) {
    const topProductId = sortedProductIds[0];
    const topProdRecord = await prisma.product.findUnique({
      where: { id: topProductId },
      include: { category: true },
    }).catch(() => null);

    if (topProdRecord) {
      bestSellingProduct = {
        name: topProdRecord.name,
        category: topProdRecord.category?.name || "General",
        unitsSold: productUnitsSoldMap[topProductId],
        sku: topProdRecord.sku || "N/A",
      };
    }
  }

  // Top Categories Share
  const categoryUnitsMap = {};
  let totalUnitsCount = 0;

  for (const [prodId, units] of Object.entries(productUnitsSoldMap)) {
    const p = inventories.find((i) => i.productId === prodId)?.product;
    const catName = p?.category?.name || "Other";
    categoryUnitsMap[catName] = (categoryUnitsMap[catName] || 0) + units;
    totalUnitsCount += units;
  }

  const categoryColors = ["#3B4CCA", "#0F9D77", "#F5A623", "#E11D48", "#16A34A", "#8B5CF6"];
  const topCategories = Object.keys(categoryUnitsMap)
    .sort((a, b) => categoryUnitsMap[b] - categoryUnitsMap[a])
    .slice(0, 6)
    .map((name, idx) => ({
      name,
      units: categoryUnitsMap[name],
      pct: totalUnitsCount > 0 ? Math.round((categoryUnitsMap[name] / totalUnitsCount) * 100) : 0,
      color: categoryColors[idx % categoryColors.length],
    }));

  // ----------------------------------------------------
  // 3. TOP PERFORMER
  // ----------------------------------------------------
  let topPerformer = null;
  const topEmployee = await prisma.user.findFirst({
    where: {
      ...companyWhere,
      ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
    },
    include: {
      branch: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  }).catch(() => null);

  if (topEmployee) {
    topPerformer = {
      name: topEmployee.fullName || topEmployee.email?.split("@")[0] || "Staff Member",
      role: topEmployee.role || "Store Associate",
      branch: topEmployee.branch?.name || "Main Store",
      detail: `${currentSales.length} total transactions handled`,
    };
  }

  // ----------------------------------------------------
  // 4. REVENUE COLLECTION CHART (Quarterly / Monthly Breakdown)
  // ----------------------------------------------------
  const allCompletedSales = await prisma.salesOrder.findMany({
    where: {
      ...companyWhere,
      ...branchWhere,
      status: { not: "CANCELLED" },
    },
    select: {
      orderDate: true,
      createdAt: true,
      netAmount: true,
      totalAmount: true,
    },
    orderBy: { createdAt: "asc" },
  }).catch(() => []);

  // Compute 7 Quarters
  const quarterMap = {};
  const currentYear = new Date().getFullYear();
  const quartersList = [
    `Q1 '${String(currentYear - 1).slice(-2)}`,
    `Q2 '${String(currentYear - 1).slice(-2)}`,
    `Q3 '${String(currentYear - 1).slice(-2)}`,
    `Q4 '${String(currentYear - 1).slice(-2)}`,
    `Q1 '${String(currentYear).slice(-2)}`,
    `Q2 '${String(currentYear).slice(-2)}`,
    `Q3 '${String(currentYear).slice(-2)}`,
    `Q4 '${String(currentYear).slice(-2)}`,
  ].slice(-7);

  quartersList.forEach((q) => {
    quarterMap[q] = 0;
  });

  allCompletedSales.forEach((sale) => {
    const d = new Date(sale.orderDate || sale.createdAt);
    const yr = String(d.getFullYear()).slice(-2);
    const qNum = Math.floor(d.getMonth() / 3) + 1;
    const qKey = `Q${qNum} '${yr}`;
    if (quarterMap[qKey] !== undefined) {
      quarterMap[qKey] += Number(sale.netAmount || sale.totalAmount || 0);
    }
  });

  const hasAnyRevenue = Object.values(quarterMap).some((v) => v > 0);
  const revenueByQuarter = hasAnyRevenue
    ? quartersList.map((q) => {
        const collected = Math.round(quarterMap[q]);
        const target = Math.max(collected * 1.2, 1000);
        return {
          q,
          collected,
          target: Math.round(target),
        };
      })
    : [];

  // Monthly Earnings Trend for Area Chart
  const monthsMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mName = d.toLocaleString("default", { month: "short" });
    monthsMap[mName] = 0;
  }

  allCompletedSales.forEach((sale) => {
    const d = new Date(sale.orderDate || sale.createdAt);
    const mName = d.toLocaleString("default", { month: "short" });
    if (monthsMap[mName] !== undefined) {
      monthsMap[mName] += Number(sale.netAmount || sale.totalAmount || 0);
    }
  });

  const earningsTrend = Object.keys(monthsMap).map((m) => ({
    name: m,
    earnings: Math.round(monthsMap[m]),
  }));

  // ----------------------------------------------------
  // 5. PENDING APPROVALS
  // ----------------------------------------------------
  const [pendingPurchases, pendingTransfers] = await Promise.all([
    prisma.purchase.findMany({
      where: {
        ...companyWhere,
        status: "PENDING",
      },
      include: {
        supplier: true,
        warehouse: true,
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
    prisma.stockTransfer.findMany({
      where: {
        ...companyWhere,
        status: "PENDING",
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
  ]);

  const pendingApprovals = [];

  pendingPurchases.forEach((p) => {
    pendingApprovals.push({
      id: p.id,
      name: p.supplier?.companyName || "Supplier Order",
      role: "Purchase Order",
      tag: "PO Approval",
      tagTone: "rose",
      detail: `PO-${p.purchaseNo} · ₹${Number(p.totalAmount || 0).toLocaleString()}`,
      date: new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      type: "PURCHASE",
    });
  });

  pendingTransfers.forEach((t) => {
    pendingApprovals.push({
      id: t.id,
      name: `Transfer #${t.transferNo}`,
      role: "Warehouse Transfer",
      tag: "Stock Swap",
      tagTone: "amber",
      detail: t.reason || "Warehouse to Store",
      date: new Date(t.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      type: "TRANSFER",
    });
  });

  // ----------------------------------------------------
  // 6. UPCOMING EVENTS & SCHEDULE
  // ----------------------------------------------------
  const upcomingPurchases = await prisma.purchase.findMany({
    where: {
      ...companyWhere,
      purchaseDate: { gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    },
    include: { warehouse: true, supplier: true },
    take: 5,
    orderBy: { purchaseDate: "asc" },
  }).catch(() => []);

  const upcomingEvents = upcomingPurchases.map((p) => ({
    title: `Supplier Delivery — ${p.supplier?.companyName || "Restock"}`,
    date: new Date(p.purchaseDate || p.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: p.warehouse?.name ? `${p.warehouse.name} · ${p.status}` : p.status,
    tone: p.status === "RECEIVED" ? "blue" : "rose",
    type: "DELIVERY",
  }));

  // ----------------------------------------------------
  // 7. NOTICE BOARD
  // ----------------------------------------------------
  const activeNotices = await prisma.notice.findMany({
    where: {
      ...companyWhere,
      ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
      status: "ACTIVE",
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const notices = activeNotices.map((n) => {
    let daysRemaining = null;
    if (n.expiryDate) {
      const diff = Math.ceil((new Date(n.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      daysRemaining = diff > 0 ? `${diff} Days` : "Expiring";
    }
    return {
      id: n.id,
      title: n.title,
      description: n.description,
      added: new Date(n.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      chip: daysRemaining || "Notice",
    };
  });

  // ----------------------------------------------------
  // 8. TO-DO / TASK LIST
  // ----------------------------------------------------
  const userTodos = await prisma.todo.findMany({
    where: {
      ...companyWhere,
      ...(userId ? { assignedTo: userId } : {}),
      ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const todos = userTodos.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    time: t.dueDate
      ? new Date(t.dueDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    dueDate: t.dueDate,
    status: t.status,
    done: t.status === "Completed",
    priority: t.priority,
  }));

  // ----------------------------------------------------
  // 9. RECENT ACTIVITIES / AUDIT LOG
  // ----------------------------------------------------
  const auditLogs = await prisma.auditLog.findMany({
    where: companyWhere,
    take: 8,
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const activities = auditLogs.map((log) => {
    let icon = "📝";
    if (log.action?.includes("SALE") || log.action?.includes("ORDER")) icon = "🛒";
    else if (log.action?.includes("PURCHASE")) icon = "🧾";
    else if (log.action?.includes("STOCK")) icon = "📦";
    else if (log.action?.includes("PRODUCT")) icon = "🏷️";
    else if (log.action?.includes("USER") || log.action?.includes("EMPLOYEE") || log.action?.includes("LOGIN")) icon = "👤";

    let detailStr = "";
    if (typeof log.details === "string") {
      detailStr = log.details;
    } else if (log.details && typeof log.details === "object") {
      detailStr = log.details.description || log.details.message || `${log.details.role || ""} ${log.details.fullName || ""}`.trim() || "";
    }
    if (!detailStr) {
      detailStr = `${log.entity || ""} ${log.entityId ? `#${log.entityId.slice(0, 6)}` : ""}`.trim() || "System transaction";
    }

    return {
      id: log.id,
      title: log.action || "System Event",
      sub: detailStr,
      icon,
      time: log.createdAt,
    };
  });

  if (activities.length === 0) {
    currentSales.slice(0, 4).forEach((s) => {
      activities.push({
        id: s.id,
        title: "Sale Completed",
        sub: `Order ${s.orderNumber || "INV"} for ₹${Number(s.netAmount || s.totalAmount || 0).toLocaleString()}`,
        icon: "🛒",
        time: s.createdAt,
      });
    });
  }

  // ----------------------------------------------------
  // 10. BRANCHES LIST FOR DROPDOWN
  // ----------------------------------------------------
  const branchOptions = await prisma.branch.findMany({
    where: {
      ...companyWhere,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: { name: "asc" },
  }).catch(() => []);

  // ----------------------------------------------------
  // 11. UNIFIED RETAIL DASHBOARD SPECIFIC COMPUTATIONS
  // ----------------------------------------------------

  // 11.1 Daily Sales Overview Chart for selected date range
  const daysDiff = Math.min(Math.max(Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)), 1), 60);
  const salesByDayMap = {};
  for (let i = 0; i < daysDiff; i++) {
    const curD = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const key = curD.toISOString().slice(0, 10);
    const label = curD.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    salesByDayMap[key] = { date: key, label, sales: 0, orders: 0 };
  }

  currentSales.forEach((sale) => {
    const d = new Date(sale.orderDate || sale.createdAt);
    const key = d.toISOString().slice(0, 10);
    if (salesByDayMap[key]) {
      salesByDayMap[key].sales += Number(sale.netAmount || sale.totalAmount || 0);
      salesByDayMap[key].orders += 1;
    }
  });

  const salesOverviewChart = Object.values(salesByDayMap).map((item) => ({
    ...item,
    sales: Math.round(item.sales),
  }));

  // 11.2 Low Stock Products Table
  const allActiveProducts = await prisma.product.findMany({
    where: {
      ...companyWhere,
      status: "ACTIVE",
    },
    include: {
      category: true,
      inventories: {
        where: effectiveBranchId ? { warehouse: { branchId: effectiveBranchId } } : {},
      },
    },
    take: 100,
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const lowStockAlerts = [];
  allActiveProducts.forEach((prod) => {
    const totalQty = (prod.inventories || []).reduce((acc, inv) => acc + Number(inv.quantity || 0), 0);
    const minStock = Number(prod.reorderLevel ?? 10);
    if (totalQty <= minStock) {
      lowStockAlerts.push({
        id: prod.id,
        name: prod.name,
        sku: prod.sku || "N/A",
        currentStock: totalQty,
        minStock,
        unit: prod.unit || "Pcs",
        status: totalQty <= 0 ? "Out of Stock" : "Low Stock",
        category: prod.category?.name || "General",
      });
    }
  });

  // 11.3 Recent Completed Sales
  const recentSalesRaw = await prisma.salesOrder.findMany({
    where: {
      ...companyWhere,
      ...branchWhere,
      status: { not: "CANCELLED" },
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const customerIds = recentSalesRaw.map((s) => s.customerId).filter(Boolean);
  const customersList = customerIds.length > 0
    ? await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true, phone: true },
      }).catch(() => [])
    : [];
  const customerMap = new Map(customersList.map((c) => [c.id, c.name]));

  const salesOrderIds = recentSalesRaw.map((s) => s.id);
  const invoicesList = salesOrderIds.length > 0
    ? await prisma.invoice.findMany({
        where: { salesOrderId: { in: salesOrderIds } },
        include: { payments: true },
      }).catch(() => [])
    : [];
  const invoiceByOrderMap = new Map(invoicesList.map((inv) => [inv.salesOrderId, inv]));

  const recentSales = recentSalesRaw.map((sale) => {
    const inv = invoiceByOrderMap.get(sale.id);
    const paymentMethod = inv?.payments?.[0]?.paymentMethod || (sale.netAmount ? "CASH" : "PAID");
    const customerName = sale.customerId ? (customerMap.get(sale.customerId) || "Customer") : "Walk-in Customer";
    const amount = Number(sale.netAmount || sale.totalAmount || 0);

    return {
      id: sale.id,
      invoiceNumber: sale.orderNumber || inv?.invoiceNumber || `INV-${sale.id.slice(0, 6)}`,
      customerName,
      dateTime: sale.orderDate || sale.createdAt,
      paymentMethod: paymentMethod.toUpperCase(),
      totalAmount: amount,
      totalAmountFormatted: `₹${amount.toLocaleString("en-IN")}`,
      status: sale.status || "COMPLETED",
    };
  });

  const ordersDelta = calculateDelta(currentSales.length, prevSales.length);

  return {
    summary: {
      totalSales: Math.round(totalEarnings),
      totalSalesFormatted: `₹${Math.round(totalEarnings).toLocaleString("en-IN")}`,
      salesDelta: earningsDelta.deltaStr,
      salesDeltaPositive: earningsDelta.isPositive,

      totalOrders: currentSales.length,
      ordersDelta: ordersDelta.deltaStr,
      ordersDeltaPositive: ordersDelta.isPositive,

      activeProducts: currentActiveProducts,
      activeProductsFormatted: `${currentActiveProducts} Items`,
      productDelta: productDelta.deltaStr,
      productDeltaPositive: productDelta.isPositive,

      totalProducts: currentActiveProducts,

      lowStock: lowStockCount,
      lowStockFormatted: `${lowStockCount} Items`,
      lowStockDelta: calculateDelta(lowStockCount, 0).deltaStr,

      totalInventoryValue: Math.round(totalValuation),
      totalInventoryValueFormatted: `₹${Math.round(totalValuation).toLocaleString("en-IN")}`,
      inventoryDelta: "+0.0%",

      totalEarnings: Math.round(totalEarnings),
      totalEarningsFormatted: `₹${Math.round(totalEarnings).toLocaleString("en-IN")}`,
      earningsDelta: earningsDelta.deltaStr,
      earningsDeltaPositive: earningsDelta.isPositive,

      activeStaff: currentActiveStaff,
      activeStaffFormatted: `${currentActiveStaff} Staff`,
      staffDelta: staffDelta.deltaStr,
      staffDeltaPositive: staffDelta.isPositive,

      totalOutstanding,
      totalOutstandingFormatted: `₹${totalOutstanding.toLocaleString("en-IN")}`,

      shrinkageCost,
      currency: "₹",
    },

    salesOverviewChart,
    lowStockAlerts,
    recentSales,

    stockHealth: {
      inStock: inStockCount,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      totalSkus,
      selectedBranchId: effectiveBranchId || "ALL",
      branches: branchOptions,
    },

    branches: branchOptions,

    topPerformer,
    bestSellingProduct,

    revenueChart: revenueByQuarter,
    earningsTrend,

    topCategories,
    recentActivities: activities.slice(0, 6),
    upcomingEvents,
    pendingApprovals,
    notices,
    todos,
  };
};

/**
 * Notice Board CRUD
 */
export const createNotice = async ({ companyId, branchId, title, description, expiryDate, createdBy }) => {
  return await prisma.notice.create({
    data: {
      companyId,
      branchId: branchId && branchId !== "ALL" ? branchId : null,
      title,
      description,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      createdBy,
      status: "ACTIVE",
    },
  });
};

export const getNotices = async ({ companyId, branchId }) => {
  return await prisma.notice.findMany({
    where: {
      companyId,
      ...(branchId && branchId !== "ALL" ? { branchId } : {}),
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * To-Do Tasks CRUD
 */
export const createTodo = async ({ companyId, branchId, title, description, assignedTo, dueDate, priority }) => {
  return await prisma.todo.create({
    data: {
      companyId,
      branchId: branchId && branchId !== "ALL" ? branchId : null,
      title,
      description,
      assignedTo,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || "Medium",
      status: "Pending",
    },
  });
};

export const getTodos = async ({ companyId, branchId, userId }) => {
  return await prisma.todo.findMany({
    where: {
      companyId,
      ...(branchId && branchId !== "ALL" ? { branchId } : {}),
      ...(userId ? { assignedTo: userId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
};

export const toggleTodoStatus = async (id, status) => {
  return await prisma.todo.update({
    where: { id },
    data: {
      status: status || "Completed",
    },
  });
};
