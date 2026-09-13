import * as tableRepository from "./restaurantTable.repository.js";

export const createTable = async (companyId, data) => {
  if (!data.tableNumber) {
    throw new Error("Table number is required.");
  }
  if (!data.restaurantId) {
    throw new Error("Restaurant ID is required.");
  }
  if (!data.areaId) {
    throw new Error("Area/Floor ID is required.");
  }
  return await tableRepository.createTable(companyId, data);
};

export const getTables = async (companyId, restaurantId, areaId) => {
  return await tableRepository.getTables(companyId, restaurantId, areaId);
};

export const getTableById = async (id, companyId) => {
  const table = await tableRepository.getTableById(id, companyId);
  if (!table) {
    const error = new Error("Table not found or access denied.");
    error.statusCode = 404;
    throw error;
  }
  return table;
};

export const updateTable = async (id, companyId, data) => {
  return await tableRepository.updateTable(id, companyId, data);
};

export const updateTableStatus = async (id, companyId, status) => {
  return await tableRepository.updateTableStatus(id, companyId, status);
};

export const deleteTable = async (id, companyId) => {
  return await tableRepository.deleteTable(id, companyId);
};
