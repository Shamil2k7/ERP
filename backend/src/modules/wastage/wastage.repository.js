import prisma from "../../config/prisma.js";

export const createWastage = async (companyId, data) => {
  if (!companyId) {
    const error = new Error("Tenant company context required.");
    error.statusCode = 403;
    throw error;
  }

  const { items, ...wastageData } = data;
  const wastageNumber = wastageData.wastageNumber || `WST-${Date.now().toString().slice(-6)}`;

  return await prisma.$transaction(async (tx) => {
    let totalCost = 0;
    const formattedItems = [];

    if (items && items.length > 0) {
      for (const item of items) {
        const qty = parseFloat(item.quantity) || 1;
        const product = await tx.product.findFirst({
          where: { id: item.productId, companyId },
        });

        const unitCost = parseFloat(item.unitCost) || (product ? parseFloat(product.costPrice) : 0);
        const itemTotal = unitCost * qty;
        totalCost += itemTotal;

        formattedItems.push({
          productId: item.productId,
          quantity: qty,
          unitCost,
          totalCost: itemTotal,
          reason: item.reason || wastageData.reason || "SPOILED",
        });

        // Reduce inventory if warehouseId is provided
        if (wastageData.warehouseId) {
          const inventory = await tx.inventory.findFirst({
            where: {
              productId: item.productId,
              warehouseId: wastageData.warehouseId,
            },
          });

          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                quantity: parseFloat(inventory.quantity) - qty,
              },
            });
          }

          // Create stock movement record
          await tx.stockMovement.create({
            data: {
              companyId,
              productId: item.productId,
              warehouseId: wastageData.warehouseId,
              type: "WASTAGE",
              quantity: -qty,
              referenceNo: wastageNumber,
              remarks: `Wastage (${item.reason || wastageData.reason || "SPOILED"}): ${wastageData.notes || ""}`,
            },
          });
        }
      }
    }

    const wastage = await tx.wastage.create({
      data: {
        ...wastageData,
        companyId,
        wastageNumber,
        totalCost,
        items: {
          create: formattedItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        restaurant: true,
        warehouse: true,
      },
    });

    return wastage;
  });
};

export const getWastages = async (companyId, params = {}) => {
  if (!companyId) return [];

  const { restaurantId, warehouseId } = params;
  const where = { companyId };

  if (restaurantId && restaurantId !== "ALL" && restaurantId !== "undefined" && restaurantId !== "null" && String(restaurantId).trim() !== "") {
    where.restaurantId = restaurantId;
  }
  if (warehouseId && warehouseId !== "ALL" && warehouseId !== "undefined" && warehouseId !== "null" && String(warehouseId).trim() !== "") {
    where.warehouseId = warehouseId;
  }

  return await prisma.wastage.findMany({
    where,
    include: {
      items: {
        include: {
          product: true,
        },
      },
      restaurant: true,
      warehouse: true,
    },
    orderBy: { wastageDate: "desc" },
  });
};

export const getWastageById = async (id, companyId) => {
  if (!id) return null;

  const where = { id };
  if (companyId) {
    where.companyId = companyId;
  }

  return await prisma.wastage.findFirst({
    where,
    include: {
      items: {
        include: {
          product: true,
        },
      },
      restaurant: true,
      warehouse: true,
    },
  });
};

export const deleteWastage = async (id, companyId) => {
  const existing = await getWastageById(id, companyId);
  if (!existing) {
    const error = new Error("Wastage record not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.wastage.delete({
    where: { id },
  });
};
