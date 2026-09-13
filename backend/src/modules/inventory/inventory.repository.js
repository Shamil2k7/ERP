import prisma from "../../config/prisma.js";

export const createInventory = async (data) => {
  return await prisma.inventory.create({
    data,
    include: {
      product: {
        include: {
          category: true,
        },
      },
      warehouse: true,
    },
  });
};

export const getAllInventories = async (companyId) => {
  const productWhere = companyId ? { companyId } : {};

  // 1. Fetch all products for the tenant including existing inventories
  const products = await prisma.product.findMany({
    where: productWhere,
    include: {
      category: true,
      brand: true,
      inventories: {
        include: {
          warehouse: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 2. Identify products without inventory records and link them to default warehouse
  const productsWithoutInventory = products.filter((p) => !p.inventories || p.inventories.length === 0);

  if (productsWithoutInventory.length > 0) {
    let defaultWarehouse = await prisma.warehouse.findFirst({
      where: companyId ? { companyId } : {},
      orderBy: { createdAt: "asc" },
    });

    if (!defaultWarehouse) {
      defaultWarehouse = await prisma.warehouse.create({
        data: {
          name: "Main Warehouse",
          code: "WH-MAIN",
          location: "Main Store",
          companyId: companyId || null,
          status: "ACTIVE",
        },
      }).catch(() => null);
    }

    if (defaultWarehouse) {
      for (const prod of productsWithoutInventory) {
        try {
          await prisma.inventory.create({
            data: {
              productId: prod.id,
              warehouseId: defaultWarehouse.id,
              quantity: prod.initialStock ? parseFloat(prod.initialStock) : 0,
              reorderLevel: prod.reorderLevel ? parseInt(prod.reorderLevel) : 10,
              minimumStock: prod.minimumStock ? parseInt(prod.minimumStock) : 5,
              maximumStock: prod.maximumStock ? parseInt(prod.maximumStock) : 500,
            },
          });
        } catch (err) {
          // Concurrency safe
        }
      }
    }
  }

  // 3. Return all complete inventories joined with products and warehouses
  const where = companyId ? { product: { companyId } } : {};
  return await prisma.inventory.findMany({
    where,
    include: {
      product: {
        include: {
          category: true,
          brand: true,
        },
      },
      warehouse: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getInventoryById = async (id) => {
  return await prisma.inventory.findUnique({
    where: { id },
    include: {
      product: {
        include: {
          category: true,
        },
      },
      warehouse: true,
    },
  });
};

export const getInventoryByProductAndWarehouse = async (
  productId,
  warehouseId
) => {
  return await prisma.inventory.findFirst({
    where: {
      productId,
      warehouseId,
    },
  });
};

export const getInventoryByProduct = async (productId) => {
  return await prisma.inventory.findMany({
    where: { productId },
    include: {
      warehouse: true,
    },
  });
};

export const getInventoryByWarehouse = async (warehouseId) => {
  return await prisma.inventory.findMany({
    where: { warehouseId },
    include: {
      product: true,
    },
  });
};

export const updateInventory = async (id, data) => {
  return await prisma.inventory.update({
    where: { id },
    data,
    include: {
      product: {
        include: {
          category: true,
        },
      },
      warehouse: true,
    },
  });
};

export const deleteInventory = async (id) => {
  return await prisma.inventory.delete({
    where: { id },
  });
};