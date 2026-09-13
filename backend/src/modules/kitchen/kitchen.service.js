import * as kitchenRepository from "./kitchen.repository.js";

export const getKitchenOrders = async (companyId, restaurantId, status) => {
  return await kitchenRepository.getKitchenOrders(companyId, restaurantId, status);
};

export const getKitchenOrderById = async (id, companyId) => {
  const kot = await kitchenRepository.getKitchenOrderById(id, companyId);
  if (!kot) {
    const error = new Error("Kitchen order ticket not found or access denied.");
    error.statusCode = 404;
    throw error;
  }
  return kot;
};

export const updateKOTStatus = async (id, companyId, status) => {
  return await kitchenRepository.updateKOTStatus(id, companyId, status);
};
