import * as reportsRepository from "./reports.repository.js";
import prisma from "../../config/prisma.js";

/**
 * Format date for grouping in chart
 */
const getGroupKey = (dateStr, groupBy) => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  
  if (groupBy === "month") {
    return `${year}-${month}`;
  }
  
  if (groupBy === "week") {
    // Group by the starting Monday of the week
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split("T")[0];
  }
  
  if (groupBy === "year") {
    return `${year}`;
  }
  
  // default is "day"
  return date.toISOString().split("T")[0];
};

/**
 * Get Sales Report
 */
export const getSalesReport = async (startDate, endDate, groupBy = "day", customerId, companyId) => {
  // Fetch raw sales order records
  const sales = await reportsRepository.getSalesData(startDate, endDate, customerId, companyId);
  
  // Collect customer IDs and fetch names
  const customerIds = [...new Set(sales.map(s => s.customerId).filter(Boolean))];
  const customers = customerIds.length > 0 ? await reportsRepository.getCustomersByIds(customerIds) : [];
  const customerMap = customers.reduce((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {});

  // Compute summary metrics
  let totalSales = 0;
  let totalTax = 0;
  let totalDiscount = 0;
  const totalOrders = sales.length;

  // Initialize grouping for chart
  const chartMap = {};

  const items = sales.map(order => {
    const netAmount = Number(order.netAmount || order.totalAmount || 0);
    const taxAmount = Number(order.taxAmount || 0);
    const discountAmount = Number(order.discountAmount || 0);
    const totalAmount = Number(order.totalAmount || netAmount);

    totalSales += netAmount;
    totalTax += taxAmount;
    totalDiscount += discountAmount;

    // Grouping for chart
    const groupKey = getGroupKey(order.orderDate || order.createdAt, groupBy);
    if (!chartMap[groupKey]) {
      chartMap[groupKey] = {
        date: groupKey,
        sales: 0,
        orders: 0,
        tax: 0,
        discount: 0,
      };
    }
    chartMap[groupKey].sales += netAmount;
    chartMap[groupKey].orders += 1;
    chartMap[groupKey].tax += taxAmount;
    chartMap[groupKey].discount += discountAmount;

    return {
      id: order.id,
      orderNumber: order.orderNumber || order.orderNo || `ORD-${order.id?.slice(0, 6)}`,
      orderDate: order.orderDate || order.createdAt,
      customerId: order.customerId,
      customerName: customerMap[order.customerId] || "Guest Customer",
      netAmount,
      taxAmount,
      discountAmount,
      totalAmount,
      status: order.status,
    };
  });

  // Calculate Top Selling Products from real invoice items
  let topProducts = [];
  try {
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          invoiceDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
          ...(companyId ? { companyId } : {}),
        },
      },
      select: {
        productId: true,
        quantity: true,
        total: true,
      },
    });

    const productMap = {};
    invoiceItems.forEach(item => {
      if (!productMap[item.productId]) {
        productMap[item.productId] = { qty: 0, revenue: 0 };
      }
      productMap[item.productId].qty += Number(item.quantity || 0);
      productMap[item.productId].revenue += Number(item.total || 0);
    });

    const productIds = Object.keys(productMap);
    if (productIds.length > 0) {
      const prods = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, sku: true, sellingPrice: true },
      });
      prods.forEach(p => {
        topProducts.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          unitsSold: productMap[p.id]?.qty || 0,
          revenue: productMap[p.id]?.revenue || 0,
        });
      });
      topProducts.sort((a, b) => b.unitsSold - a.unitsSold);
    }
  } catch (err) {
    console.error("Error aggregating top products:", err);
  }

  const averageOrderValue = totalOrders > 0 ? (totalSales / totalOrders) : 0;
  const chartData = Object.values(chartMap).sort((a, b) => a.date.localeCompare(b.date));

  return {
    summary: {
      totalSales,
      totalOrders,
      totalTax,
      totalDiscount,
      averageOrderValue,
    },
    topProducts: topProducts.slice(0, 5),
    chartData,
    items,
  };
};

/**
 * Get Purchase Report
 */
export const getPurchaseReport = async (startDate, endDate, groupBy = "day", supplierId, companyId) => {
  const purchases = await reportsRepository.getPurchaseData(startDate, endDate, supplierId, companyId);

  let totalPurchases = 0;
  let pendingCount = 0;
  let receivedCount = 0;
  let partialCount = 0;
  let cancelledCount = 0;

  const totalOrders = purchases.length;
  const chartMap = {};
  const supplierSummaryMap = {};

  const items = purchases.map(purchase => {
    const amount = Number(purchase.totalAmount || 0);
    totalPurchases += amount;

    const st = (purchase.status || "PENDING").toUpperCase();
    if (st === "PENDING") pendingCount++;
    else if (st === "RECEIVED") receivedCount++;
    else if (st === "PARTIAL") partialCount++;
    else if (st === "CANCELLED") cancelledCount++;

    const supId = purchase.supplierId || "unknown";
    const supName = purchase.supplier?.companyName || purchase.supplier?.name || "Unknown Supplier";
    if (!supplierSummaryMap[supId]) {
      supplierSummaryMap[supId] = { id: supId, name: supName, orderCount: 0, totalSpend: 0 };
    }
    supplierSummaryMap[supId].orderCount += 1;
    supplierSummaryMap[supId].totalSpend += amount;

    // Grouping for chart
    const groupKey = getGroupKey(purchase.purchaseDate || purchase.createdAt, groupBy);
    if (!chartMap[groupKey]) {
      chartMap[groupKey] = {
        date: groupKey,
        purchases: 0,
        orders: 0,
      };
    }
    chartMap[groupKey].purchases += amount;
    chartMap[groupKey].orders += 1;

    return {
      id: purchase.id,
      purchaseNo: purchase.purchaseNo,
      purchaseDate: purchase.purchaseDate,
      supplierId: purchase.supplierId,
      supplierName: supName,
      warehouseId: purchase.warehouseId,
      warehouseName: purchase.warehouse?.name || "Unknown Warehouse",
      totalAmount: amount,
      status: purchase.status,
      notes: purchase.notes,
    };
  });

  const topSuppliers = Object.values(supplierSummaryMap).sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5);
  const averageOrderValue = totalOrders > 0 ? (totalPurchases / totalOrders) : 0;
  const chartData = Object.values(chartMap).sort((a, b) => a.date.localeCompare(b.date));

  return {
    summary: {
      totalPurchases,
      totalOrders,
      pendingPurchases: pendingCount,
      receivedPurchases: receivedCount,
      partialPurchases: partialCount,
      cancelledPurchases: cancelledCount,
      averageOrderValue,
    },
    topSuppliers,
    chartData,
    items,
  };
};

/**
 * Get Inventory Report
 */
export const getInventoryReport = async (warehouseId, companyId) => {
  const inventory = await reportsRepository.getInventoryData(warehouseId, companyId);

  let totalItems = 0;
  let totalValuationCost = 0;
  let totalValuationRetail = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  const warehouseMap = {};
  const lowStockItems = [];

  const items = inventory.map(item => {
    const qty = Number(item.quantity || 0);
    const cost = Number(item.product?.costPrice || 0);
    const retail = Number(item.product?.sellingPrice || 0);
    const reorder = item.reorderLevel !== undefined ? Number(item.reorderLevel) : 10;

    totalItems += qty;
    totalValuationCost += (qty * cost);
    totalValuationRetail += (qty * retail);

    let status = "IN_STOCK";
    if (qty <= 0) {
      status = "OUT_OF_STOCK";
      outOfStockCount += 1;
    } else if (qty <= reorder) {
      status = "LOW_STOCK";
      lowStockCount += 1;
    }

    const whId = item.warehouseId || item.warehouse?.id || "main";
    const whName = item.warehouse?.name || "Main Warehouse";
    if (!warehouseMap[whId]) {
      warehouseMap[whId] = {
        id: whId,
        name: whName,
        totalStock: 0,
        valuationCost: 0,
        valuationRetail: 0,
        lowStockCount: 0,
      };
    }
    warehouseMap[whId].totalStock += qty;
    warehouseMap[whId].valuationCost += (qty * cost);
    warehouseMap[whId].valuationRetail += (qty * retail);
    if (status === "LOW_STOCK" || status === "OUT_OF_STOCK") {
      warehouseMap[whId].lowStockCount += 1;
    }

    const mappedItem = {
      id: item.id,
      productId: item.productId,
      productName: item.product?.name || "Unknown Product",
      sku: item.product?.sku || "N/A",
      categoryName: item.product?.category?.name || "Uncategorized",
      warehouseName: whName,
      quantity: qty,
      reorderLevel: reorder,
      status,
      costPrice: cost,
      sellingPrice: retail,
      valuationCost: qty * cost,
      valuationRetail: qty * retail,
    };

    if (status === "LOW_STOCK" || status === "OUT_OF_STOCK") {
      lowStockItems.push(mappedItem);
    }

    return mappedItem;
  });

  const totalProducts = await prisma.product.count({
    where: {
      status: "ACTIVE",
      ...(companyId ? { companyId } : {}),
    },
  });

  const totalWarehouses = Object.keys(warehouseMap).length || 1;

  return {
    summary: {
      totalItems,
      totalValuationCost,
      totalValuationRetail,
      lowStockCount,
      outOfStockCount,
      totalProducts,
      totalWarehouses,
    },
    warehouseBreakdown: Object.values(warehouseMap),
    lowStockProducts: lowStockItems.slice(0, 10),
    items,
  };
};


/**
 * Get Report Filtering options
 */
export const getReportFilters = async (companyId) => {
  const [customers, suppliers, warehouses] = await Promise.all([
    reportsRepository.getAllCustomers(companyId),
    reportsRepository.getAllSuppliers(companyId),
    reportsRepository.getAllWarehouses(companyId),
  ]);

  return {
    customers,
    suppliers,
    warehouses,
  };
};

export const getDashboardSummary = async (companyId) => {
  const companyWhere = companyId ? { companyId } : {};

  const totalProducts = await prisma.product.count({
    where: {
      status: "ACTIVE",
      ...companyWhere,
    },
  });

  const totalEmployees = await prisma.user.count({
    where: {
      ...companyWhere,
    },
  });

  const lowStockProducts = await prisma.inventory.count({
    where: {
      quantity: {
        lte: prisma.inventory.reorderLevel,
      },
      product: {
        ...companyWhere,
      },
    },
  }).catch(() => 0);

  const inventories = await prisma.inventory.findMany({
    where: {
      product: {
        ...companyWhere,
      },
    },
    include: {
      product: true,
    },
  });

  let totalValuation = 0;
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  inventories.forEach((item) => {
    const qty = Number(item.quantity || 0);
    const price = Number(item.product?.sellingPrice || 0);
    totalValuation += qty * price;

    if (qty <= 0) {
      outOfStockCount++;
    } else if (qty <= (item.reorderLevel || 10)) {
      lowStockCount++;
    } else {
      inStockCount++;
    }
  });

  const salesOrders = await prisma.salesOrder.findMany({
    where: {
      status: "COMPLETED",
      ...companyWhere,
    },
  });

  const totalEarnings = salesOrders.reduce((sum, order) => sum + Number(order.netAmount || order.totalAmount || 0), 0);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const recentSales = await prisma.salesOrder.findMany({
    where: {
      orderDate: {
        gte: sixMonthsAgo,
      },
      status: "COMPLETED",
      ...companyWhere,
    },
    orderBy: {
      orderDate: "asc",
    },
  });

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const earningsMap = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mName = d.toLocaleString("default", { month: "short" });
    earningsMap[mName] = 0;
  }

  recentSales.forEach((sale) => {
    const d = new Date(sale.orderDate || sale.createdAt);
    const mName = d.toLocaleString("default", { month: "short" });
    if (earningsMap[mName] !== undefined) {
      earningsMap[mName] += Number(sale.netAmount || sale.totalAmount || 0);
    }
  });

  const earningsChartData = Object.keys(earningsMap).map((m) => ({
    name: m,
    earnings: Math.round(earningsMap[m]),
  }));

  const [lastSales, lastPurchases, lastTransfers] = await Promise.all([
    prisma.salesOrder.findMany({
      where: companyWhere,
      take: 4,
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
    prisma.purchase.findMany({
      where: companyWhere,
      take: 4,
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
    prisma.stockTransfer.findMany({
      where: companyWhere,
      take: 4,
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
  ]);

  const activities = [];
  lastSales.forEach((s) => {
    activities.push({
      title: "New Sale completed",
      sub: `Order ${s.orderNumber || "INV-N/A"} of ₹${Number(s.netAmount || s.totalAmount || 0).toFixed(2)}`,
      icon: "↩️",
      time: s.createdAt,
    });
  });

  lastPurchases.forEach((p) => {
    activities.push({
      title: "New Purchase Order",
      sub: `PO ${p.purchaseNo} total: ₹${Number(p.totalAmount || 0).toFixed(2)}`,
      icon: "🧾",
      time: p.createdAt,
    });
  });

  lastTransfers.forEach((t) => {
    activities.push({
      title: "Stock Transfer executed",
      sub: `Transfer ${t.transferNo} completed`,
      icon: "📦",
      time: t.createdAt,
    });
  });

  // Calculate Total Outstanding from Customers
  const totalOutstandingRes = await prisma.customer.aggregate({
    where: companyWhere,
    _sum: {
      currentBalance: true,
    },
  }).catch(() => ({ _sum: { currentBalance: 0 } }));
  const totalOutstanding = Math.round(Number(totalOutstandingRes?._sum?.currentBalance || 0));

  // Calculate Top Categories by Product Count
  const categoriesWithProducts = await prisma.category.findMany({
    where: companyWhere,
    include: {
      _count: {
        select: { products: true },
      },
    },
    take: 6,
    orderBy: {
      products: {
        _count: "desc",
      },
    },
  }).catch(() => []);

  const totalCatProducts = categoriesWithProducts.reduce((sum, c) => sum + (c._count?.products || 0), 0) || 1;
  const colors = ["#3B4CCA", "#0F9D77", "#F5A623", "#E11D48", "#16A34A", "#8B5CF6"];
  const topCategoriesData = categoriesWithProducts.map((c, i) => ({
    name: c.name,
    pct: Math.round(((c._count?.products || 0) / totalCatProducts) * 100),
    color: colors[i % colors.length],
  }));

  // Deliveries / Purchases Live
  const liveDeliveries = lastPurchases.map((p) => ({
    title: `Supplier Restock — PO ${p.purchaseNo || p.id?.slice(0, 6)}`,
    date: p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-GB"),
    time: p.status || "IN_TRANSIT",
    tone: p.status === "RECEIVED" ? "blue" : "rose",
  }));

  activities.sort((a, b) => new Date(b.time) - new Date(a.time));

  return {
    stats: {
      totalProducts,
      totalEmployees,
      lowStock: lowStockCount || lowStockProducts,
      totalValue: Math.round(totalValuation),
      totalEarnings: Math.round(totalEarnings),
      totalOutstanding,
      inStock: inStockCount,
      outOfStock: outOfStockCount,
    },
    earningsChart: earningsChartData,
    recentActivities: activities.slice(0, 5),
    topCategories: topCategoriesData,
    deliveries: liveDeliveries,
  };
};
