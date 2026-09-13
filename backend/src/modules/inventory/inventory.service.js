import * as inventoryRepository from "./inventory.repository.js";
import * as productRepository from "../products/product.repository.js";
import * as warehouseRepository from "../warehouse/warehouse.repository.js";


export const createInventory = async (data) => {
  const product = await productRepository.getProductById(data.productId);

  if (!product) {
    throw new Error("Product not found.");
  }

  const warehouse = await warehouseRepository.getWarehouseById(
    data.warehouseId
  );

  if (!warehouse) {
    throw new Error("Warehouse not found.");
  }

  const existingInventory =
    await inventoryRepository.getInventoryByProductAndWarehouse(
      data.productId,
      data.warehouseId
    );

  let inventory;
  if (existingInventory) {
    const newQty = Number(existingInventory.quantity || 0) + Number(data.quantity || 0);
    inventory = await inventoryRepository.updateInventory(existingInventory.id, {
      quantity: newQty,
      minimumStock: data.minimumStock !== undefined ? Number(data.minimumStock) : existingInventory.minimumStock,
      maximumStock: data.maximumStock !== undefined ? Number(data.maximumStock) : existingInventory.maximumStock,
      reorderLevel: data.reorderLevel !== undefined ? Number(data.reorderLevel) : existingInventory.reorderLevel,
    });
  } else {
    inventory = await inventoryRepository.createInventory(data);
  }

  if (Number(data.quantity) > 0) {
    try {
      const prismaModule = (await import("../../config/prisma.js")).default;
      await prismaModule.stockMovement.create({
        data: {
          productId: product.id,
          warehouseId: warehouse.id,
          companyId: product.companyId || null,
          type: "IN",
          quantity: Number(data.quantity),
          referenceType: "STOCK_IN",
          reason: `Stock added to ${warehouse.name}`,
          date: new Date(),
        },
      });
    } catch (e) {
      console.warn("Soft notice recording stock movement on inventory create:", e);
    }
  }

  return inventory;
};

export const getAllInventories = async (companyId) => {
  return await inventoryRepository.getAllInventories(companyId);
};

export const getInventoryById = async (id) => {
  const inventory = await inventoryRepository.getInventoryById(id);

  if (!inventory) {
    throw new Error("Inventory not found.");
  }

  return inventory;
};

export const getInventoryByProduct = async (productId) => {
  return await inventoryRepository.getInventoryByProduct(productId);
};

export const getInventoryByWarehouse = async (warehouseId) => {
  return await inventoryRepository.getInventoryByWarehouse(warehouseId);
};

export const updateInventory = async (id, data) => {
  const inventory = await inventoryRepository.getInventoryById(id);

  if (!inventory) {
    throw new Error("Inventory not found.");
  }

  return await inventoryRepository.updateInventory(id, data);
};

export const deleteInventory = async (id) => {
  const inventory = await inventoryRepository.getInventoryById(id);

  if (!inventory) {
    throw new Error("Inventory not found.");
  }

  return await inventoryRepository.deleteInventory(id);
};