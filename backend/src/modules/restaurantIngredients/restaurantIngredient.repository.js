import prisma from "../../config/prisma.js";

/**
 * Helper to ensure a dedicated category exists for Raw Materials & Ingredients
 */
export const getOrCreateRawMaterialCategory = async (companyId) => {
  if (companyId) {
    const existing = await prisma.category.findFirst({
      where: {
        companyId,
        name: { in: ["Raw Materials", "Ingredients", "Raw Materials & Ingredients", "Restaurant Raw Materials"] },
      },
    });
    if (existing) return existing.id;

    // Create default category
    const created = await prisma.category.create({
      data: {
        name: "Raw Materials & Ingredients",
        code: "RAW_MATERIALS",
        companyId,
        status: "ACTIVE",
      },
    });
    return created.id;
  }

  const fallback = await prisma.category.create({
    data: {
      name: "Raw Materials & Ingredients",
      code: "RAW_MATERIALS",
      status: "ACTIVE",
    },
  });
  return fallback.id;
};

/**
 * Helper to resolve or create unit
 */
export const resolveUnitId = async (unitInput, companyId) => {
  if (!unitInput) {
    if (companyId) {
      const existing = await prisma.unit.findFirst({ where: { companyId } });
      if (existing) return existing.id;
    }
    const def = await prisma.unit.create({
      data: { name: "Kilogram", code: "kg", companyId: companyId || null },
    });
    return def.id;
  }

  // Check if unitInput is a valid UUID
  const byId = await prisma.unit.findFirst({
    where: { id: unitInput, ...(companyId && { companyId }) },
  });
  if (byId) return byId.id;

  // Search by code or name within company
  const byCode = await prisma.unit.findFirst({
    where: {
      ...(companyId && { companyId }),
      OR: [
        { code: { equals: unitInput, mode: "insensitive" } },
        { name: { equals: unitInput, mode: "insensitive" } },
      ],
    },
  });
  if (byCode) return byCode.id;

  // Create new unit
  const newUnit = await prisma.unit.create({
    data: {
      name: unitInput,
      code: unitInput.toLowerCase().slice(0, 10),
      companyId: companyId || null,
    },
  });
  return newUnit.id;
};

/**
 * Helper to get default warehouse for inventory tracking
 */
export const getDefaultWarehouseId = async (companyId) => {
  if (companyId) {
    const wh = await prisma.warehouse.findFirst({
      where: { companyId },
    });
    if (wh) return wh.id;

    const created = await prisma.warehouse.create({
      data: {
        name: "Main Kitchen Store",
        code: "WH-KITCHEN",
        companyId,
        status: "ACTIVE",
      },
    });
    return created.id;
  }

  const defWh = await prisma.warehouse.create({
    data: {
      name: "Main Kitchen Store",
      code: "WH-KITCHEN",
      status: "ACTIVE",
    },
  });
  return defWh.id;
};

const ingredientInclude = {
  unit: true,
  supplier: true,
  inventories: {
    include: {
      warehouse: true,
    },
  },
};

/**
 * Create a new Restaurant Raw Material / Ingredient
 */
export const createIngredient = async (payload) => {
  const {
    companyId,
    name,
    ingredientName,
    sku,
    ingredientCode,
    description,
    status = "ACTIVE",
    baseUnitId,
    unitId,
    baseUnit,
    openingStock = 0,
    initialStock = 0,
    minimumStockLevel = 0,
    minimumStock = 0,
    reorderQuantity = 0,
    purchaseCost = 0,
    costPrice = 0,
    restaurantOutletId,
    preferredSupplierId,
    supplierId,
    defaultStorageLocation = "Main Store",
    warehouseLocation,
    storageType = "Dry",
    isPerishable = false,
    expiryTracking = false,
    isExpiryTracking = false,
    batchTracking = false,
    isBatchTracking = false,
    image = null,
  } = payload;

  if (!companyId) {
    const error = new Error("Tenant company context required.");
    error.statusCode = 403;
    throw error;
  }

  const finalName = (name || ingredientName || "").trim();
  const finalSku = (sku || ingredientCode || `ING-${Date.now().toString().slice(-6)}`).trim();
  const finalCost = parseFloat(purchaseCost || costPrice || 0);
  const finalOpeningStock = parseFloat(openingStock || initialStock || 0);
  const finalMinStock = parseInt(minimumStockLevel || minimumStock || 0, 10);
  const finalReorderQty = parseFloat(reorderQuantity || 0);
  const finalSupplierId = preferredSupplierId || supplierId || null;
  const finalLocation = (defaultStorageLocation || warehouseLocation || "Main Store").trim();
  const finalStorageType = storageType || "Dry";

  const resolvedUnitId = await resolveUnitId(baseUnitId || unitId || baseUnit, companyId);
  const resolvedCategoryId = await getOrCreateRawMaterialCategory(companyId);

  return await prisma.$transaction(async (tx) => {
    // 1. Create the ingredient product
    const ingredient = await tx.product.create({
      data: {
        companyId,
        name: finalName,
        sku: finalSku,
        barcode: finalSku,
        description: description ? description.trim() : null,
        status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        productType: "RAW_MATERIAL",
        isTextile: false,
        categoryId: resolvedCategoryId,
        unitId: resolvedUnitId,
        costPrice: finalCost,
        sellingPrice: 0,
        averageCost: finalCost,
        lastPurchaseCost: finalCost,
        initialStock: finalOpeningStock,
        minimumStock: finalMinStock,
        reorderQuantity: finalReorderQty,
        supplierId: finalSupplierId,
        restaurantOutletId: restaurantOutletId || null,
        defaultStorageLocation: finalLocation,
        warehouseLocation: finalLocation,
        storageType: finalStorageType,
        isPerishable: Boolean(isPerishable),
        isExpiryTracking: Boolean(expiryTracking || isExpiryTracking),
        isBatchTracking: Boolean(batchTracking || isBatchTracking),
        image: image || null,
      },
      include: ingredientInclude,
    });

    // 2. Initialize stock in inventory
    const warehouseId = await getDefaultWarehouseId(companyId);
    if (warehouseId) {
      await tx.inventory.create({
        data: {
          productId: ingredient.id,
          warehouseId,
          quantity: finalOpeningStock,
          minimumStock: finalMinStock,
          reorderLevel: parseInt(finalReorderQty, 10) || 0,
        },
      });
    }

    return ingredient;
  });
};

/**
 * Get all ingredients with filtering
 */
export const getAllIngredients = async (params) => {
  const { companyId, restaurantOutletId, search, status } = params;

  if (!companyId) return [];

  const where = {
    companyId,
    productType: "RAW_MATERIAL",
  };

  if (restaurantOutletId && restaurantOutletId !== "ALL" && restaurantOutletId !== "undefined" && restaurantOutletId !== "null" && String(restaurantOutletId).trim() !== "") {
    where.OR = [
      { restaurantOutletId },
      { restaurantOutletId: null },
    ];
  }

  if (status && status !== "ALL" && status !== "undefined" && status !== "null") {
    where.status = status;
  }

  if (search && String(search).trim() !== "") {
    where.AND = [
      {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { defaultStorageLocation: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  const ingredients = await prisma.product.findMany({
    where,
    include: ingredientInclude,
    orderBy: { createdAt: "desc" },
  });

  return ingredients.map((item) => {
    const invQty = (item.inventories || []).reduce(
      (sum, inv) => sum + (parseFloat(inv.quantity) || 0),
      0
    );
    const currentStock = (item.inventories && item.inventories.length > 0)
      ? invQty
      : (parseFloat(item.initialStock) || 0);

    return {
      ...item,
      currentStock,
    };
  });
};

/**
 * Get ingredient by ID
 */
export const getIngredientById = async (id, companyId) => {
  if (!id) return null;

  const item = await prisma.product.findFirst({
    where: {
      id,
      ...(companyId && { companyId }),
    },
    include: ingredientInclude,
  });

  if (!item) return null;

  const invQty = (item.inventories || []).reduce(
    (sum, inv) => sum + (parseFloat(inv.quantity) || 0),
    0
  );
  const currentStock = (item.inventories && item.inventories.length > 0)
    ? invQty
    : (parseFloat(item.initialStock) || 0);

  return {
    ...item,
    currentStock,
  };
};

/**
 * Update ingredient
 */
export const updateIngredient = async (id, companyId, payload) => {
  const existing = await getIngredientById(id, companyId);
  if (!existing) {
    const error = new Error("Ingredient not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  const {
    name,
    ingredientName,
    sku,
    ingredientCode,
    description,
    status,
    baseUnitId,
    unitId,
    baseUnit,
    minimumStockLevel,
    minimumStock,
    reorderQuantity,
    purchaseCost,
    costPrice,
    restaurantOutletId,
    preferredSupplierId,
    supplierId,
    defaultStorageLocation,
    warehouseLocation,
    storageType,
    isPerishable,
    expiryTracking,
    isExpiryTracking,
    batchTracking,
    isBatchTracking,
    image,
  } = payload;

  const updateData = {};

  if (name || ingredientName) updateData.name = (name || ingredientName).trim();
  if (sku || ingredientCode) updateData.sku = (sku || ingredientCode).trim();
  if (description !== undefined) updateData.description = description ? description.trim() : null;
  if (status) updateData.status = status;
  if (purchaseCost !== undefined || costPrice !== undefined) {
    updateData.costPrice = parseFloat(purchaseCost !== undefined ? purchaseCost : costPrice);
  }
  if (minimumStockLevel !== undefined || minimumStock !== undefined) {
    updateData.minimumStock = parseInt(minimumStockLevel !== undefined ? minimumStockLevel : minimumStock, 10);
  }
  if (reorderQuantity !== undefined) updateData.reorderQuantity = parseFloat(reorderQuantity);
  if (preferredSupplierId !== undefined || supplierId !== undefined) {
    updateData.supplierId = preferredSupplierId || supplierId || null;
  }
  if (restaurantOutletId !== undefined) updateData.restaurantOutletId = restaurantOutletId || null;
  if (defaultStorageLocation !== undefined || warehouseLocation !== undefined) {
    const loc = (defaultStorageLocation || warehouseLocation || "").trim();
    updateData.defaultStorageLocation = loc;
    updateData.warehouseLocation = loc;
  }
  if (storageType !== undefined) updateData.storageType = storageType;
  if (isPerishable !== undefined) updateData.isPerishable = Boolean(isPerishable);
  if (expiryTracking !== undefined || isExpiryTracking !== undefined) {
    updateData.isExpiryTracking = Boolean(expiryTracking !== undefined ? expiryTracking : isExpiryTracking);
  }
  if (batchTracking !== undefined || isBatchTracking !== undefined) {
    updateData.isBatchTracking = Boolean(batchTracking !== undefined ? batchTracking : isBatchTracking);
  }
  if (image !== undefined) updateData.image = image;

  if (baseUnitId || unitId || baseUnit) {
    updateData.unitId = await resolveUnitId(baseUnitId || unitId || baseUnit, companyId);
  }

  return await prisma.product.update({
    where: { id },
    data: updateData,
    include: ingredientInclude,
  });
};

/**
 * Add stock to an existing restaurant ingredient
 */
export const addIngredientStock = async (id, companyId, data) => {
  const existing = await getIngredientById(id, companyId);
  if (!existing) {
    const error = new Error("Ingredient not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  const quantityToAdd = parseFloat(data.quantity || data.addQuantity || 0);
  if (quantityToAdd <= 0) {
    const error = new Error("Valid positive quantity is required to add stock.");
    error.statusCode = 400;
    throw error;
  }

  const unitCost = parseFloat(data.unitCost !== undefined ? data.unitCost : existing.costPrice) || 0;
  const remarks = data.remarks || data.notes || "Direct Stock In / Purchase Receipt";
  const warehouseId = data.warehouseId || await getDefaultWarehouseId(companyId);

  return await prisma.$transaction(async (tx) => {
    // 1. Locate or create inventory record
    let inventory = await tx.inventory.findFirst({
      where: {
        productId: id,
        warehouseId,
      },
    });

    const currentInvQty = inventory ? parseFloat(inventory.quantity) : (parseFloat(existing.initialStock) || 0);
    const newInvQty = currentInvQty + quantityToAdd;

    if (inventory) {
      await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: newInvQty },
      });
    } else if (warehouseId) {
      await tx.inventory.create({
        data: {
          productId: id,
          warehouseId,
          quantity: newInvQty,
          minimumStock: existing.minimumStock || 0,
        },
      });
    }

    // 2. Update product lastPurchaseCost and averageCost if unitCost is provided
    if (unitCost > 0) {
      const prevCost = parseFloat(existing.costPrice) || 0;
      const newAverage = currentInvQty > 0
        ? ((currentInvQty * prevCost) + (quantityToAdd * unitCost)) / newInvQty
        : unitCost;

      await tx.product.update({
        where: { id },
        data: {
          lastPurchaseCost: unitCost,
          averageCost: newAverage,
          costPrice: unitCost,
        },
      });
    }

    // 3. Create Stock Movement entry
    if (warehouseId) {
      await tx.stockMovement.create({
        data: {
          companyId,
          productId: id,
          warehouseId,
          type: "PURCHASE",
          quantity: quantityToAdd,
          referenceNo: `STK-IN-${Date.now().toString().slice(-6)}`,
          remarks: `Added ${quantityToAdd} stock to ${existing.name} - ${remarks}`,
        },
      });
    }

    return await getIngredientById(id, companyId);
  });
};

/**
 * Delete ingredient
 */
export const deleteIngredient = async (id, companyId) => {
  const existing = await getIngredientById(id, companyId);
  if (!existing) {
    const error = new Error("Ingredient not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    await tx.inventory.deleteMany({
      where: { productId: id },
    });
    return await tx.product.delete({
      where: { id },
    });
  });
};

