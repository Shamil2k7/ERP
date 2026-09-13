import prisma from "../../config/prisma.js";

/**
 * Fetch sales data within a date range
 */
export const getSalesData = async (startDate, endDate, customerId, companyId) => {
  const where = {
    orderDate: {
      gte: new Date(startDate),
      lte: new Date(endDate),
    },
    status: {
      not: "CANCELLED",
    },
    ...(companyId ? { companyId } : {}),
  };

  if (customerId) {
    where.customerId = customerId;
  }

  return await prisma.salesOrder.findMany({
    where,
    orderBy: {
      orderDate: "asc",
    },
  });
};

/**
 * Fetch customer details for mapping
 */
export const getCustomersByIds = async (customerIds) => {
  return await prisma.customer.findMany({
    where: {
      id: {
        in: customerIds,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  });
};

/**
 * Fetch purchase data within a date range
 */
export const getPurchaseData = async (startDate, endDate, supplierId, companyId) => {
  const where = {
    purchaseDate: {
      gte: new Date(startDate),
      lte: new Date(endDate),
    },
    status: {
      not: "CANCELLED",
    },
    ...(companyId ? { companyId } : {}),
  };

  if (supplierId) {
    where.supplierId = supplierId;
  }

  return await prisma.purchase.findMany({
    where,
    include: {
      supplier: {
        select: {
          id: true,
          companyName: true,
        },
      },
      warehouse: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      purchaseDate: "asc",
    },
  });
};

/**
 * Fetch inventory data, optionally filtered by warehouse
 */
export const getInventoryData = async (warehouseId, companyId) => {
  const where = {
    ...(warehouseId ? { warehouseId } : {}),
    ...(companyId ? { product: { companyId } } : {}),
  };

  return await prisma.inventory.findMany({
    where,
    include: {
      product: {
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
      },
      warehouse: {
        select: {
          name: true,
        },
      },
    },
  });
};

/**
 * Fetch all customers to list in filters
 */
export const getAllCustomers = async (companyId) => {
  const where = companyId ? { companyId } : {};
  return await prisma.customer.findMany({
    where,
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

/**
 * Fetch all suppliers to list in filters
 */
export const getAllSuppliers = async (companyId) => {
  const where = companyId ? { companyId } : {};
  return await prisma.supplier.findMany({
    where,
    select: {
      id: true,
      companyName: true,
    },
    orderBy: {
      companyName: "asc",
    },
  });
};

/**
 * Fetch all warehouses to list in filters
 */
export const getAllWarehouses = async (companyId) => {
  const where = companyId ? { companyId } : {};
  return await prisma.warehouse.findMany({
    where,
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};
