import * as stockRepository from "./stock.repository.js";
import * as productRepository from "../products/product.repository.js";
import * as warehouseRepository from "../warehouse/warehouse.repository.js";

export const createStockMovement = async (data) => {
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

  return await stockRepository.createStockMovement(data);
};

export const getAllStockMovements = async () => {
  return await stockRepository.getAllStockMovements();
};

export const getStockMovementById = async (id) => {
  const stockMovement = await stockRepository.getStockMovementById(id);

  if (!stockMovement) {
    throw new Error("Stock movement not found.");
  }

  return stockMovement;
};

export const getStockMovementsByProduct = async (productId) => {
  return await stockRepository.getStockMovementsByProduct(productId);
};

export const getStockMovementsByWarehouse = async (warehouseId) => {
  return await stockRepository.getStockMovementsByWarehouse(warehouseId);
};

export const updateStockMovement = async (id, data) => {
  const stockMovement = await stockRepository.getStockMovementById(id);

  if (!stockMovement) {
    throw new Error("Stock movement not found.");
  }

  return await stockRepository.updateStockMovement(id, data);
};

export const deleteStockMovement = async (id) => {
  const stockMovement = await stockRepository.getStockMovementById(id);

  if (!stockMovement) {
    throw new Error("Stock movement not found.");
  }

  return await stockRepository.deleteStockMovement(id);
};