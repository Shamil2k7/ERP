import * as wastageRepo from "./wastage.repository.js";

export const createWastage = async (companyId, data) => {
  return await wastageRepo.createWastage(companyId, data);
};

export const getWastages = async (companyId, params) => {
  return await wastageRepo.getWastages(companyId, params);
};

export const getWastageById = async (id, companyId) => {
  const wastage = await wastageRepo.getWastageById(id, companyId);
  if (!wastage) {
    const error = new Error("Wastage not found or access denied.");
    error.statusCode = 404;
    throw error;
  }
  return wastage;
};

export const deleteWastage = async (id, companyId) => {
  return await wastageRepo.deleteWastage(id, companyId);
};
