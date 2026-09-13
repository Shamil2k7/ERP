import * as warehouseRepository from "./warehouse.repository.js";

// Helper function to map database Warehouse to frontend response model
const mapWarehouseResponse = (warehouse) => {
  if (!warehouse) return null;
  return {
    ...warehouse,
    location: warehouse.city || warehouse.location || null,
  };
};

export const createWarehouse = async (data) => {
  const existingWarehouse = await warehouseRepository.getWarehouseByCode(
    data.code
  );

  if (existingWarehouse) {
    throw new Error("Warehouse code already exists.");
  }

  // Map location -> city for database insertion
  const dbData = { ...data };
  if (dbData.location !== undefined) {
    dbData.city = dbData.location;
    delete dbData.location;
  }

  const warehouse = await warehouseRepository.createWarehouse(dbData);
  return mapWarehouseResponse(warehouse);
};

export const getAllWarehouses = async (companyId) => {
  const warehouses = await warehouseRepository.getAllWarehouses(companyId);
  return warehouses.map(mapWarehouseResponse);
};

export const getWarehouseById = async (id) => {
  const warehouse = await warehouseRepository.getWarehouseById(id);

  if (!warehouse) {
    throw new Error("Warehouse not found.");
  }

  return mapWarehouseResponse(warehouse);
};

export const searchWarehouses = async (search) => {
  const warehouses = await warehouseRepository.searchWarehouses(search);
  return warehouses.map(mapWarehouseResponse);
};

export const updateWarehouse = async (id, data) => {
  const warehouse = await warehouseRepository.getWarehouseById(id);

  if (!warehouse) {
    throw new Error("Warehouse not found.");
  }

  if (data.code && data.code !== warehouse.code) {
    const existingWarehouse = await warehouseRepository.getWarehouseByCode(
      data.code
    );

    if (existingWarehouse) {
      throw new Error("Warehouse code already exists.");
    }
  }

  // Map location -> city for database update
  const dbData = { ...data };
  if (dbData.location !== undefined) {
    dbData.city = dbData.location;
    delete dbData.location;
  }

  const updated = await warehouseRepository.updateWarehouse(id, dbData);
  return mapWarehouseResponse(updated);
};

export const deleteWarehouse = async (id) => {
  const warehouse = await warehouseRepository.getWarehouseById(id);

  if (!warehouse) {
    throw new Error("Warehouse not found.");
  }

  return await warehouseRepository.deleteWarehouse(id);
};
