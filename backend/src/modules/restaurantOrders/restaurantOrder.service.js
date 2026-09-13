import * as orderRepo from "./restaurantOrder.repository.js";

export const createOrder = async (companyId, data) => {
  return await orderRepo.createOrder(companyId, data);
};

export const getOrders = async (companyId, params) => {
  return await orderRepo.getOrders(companyId, params);
};

export const getOrderById = async (id, companyId) => {
  const order = await orderRepo.getOrderById(id, companyId);
  if (!order) {
    const error = new Error("Order not found or access denied.");
    error.statusCode = 404;
    throw error;
  }
  return order;
};

export const updateOrder = async (id, companyId, data) => {
  return await orderRepo.updateOrder(id, companyId, data);
};

export const checkStockAvailability = async (orderId, companyId, warehouseId) => {
  return await orderRepo.checkStockAvailability(orderId, companyId, warehouseId);
};

export const confirmOrderAndSendKOT = async (orderId, companyId, warehouseId, allowStockOverride) => {
  return await orderRepo.confirmOrderAndSendKOT(orderId, companyId, warehouseId, allowStockOverride);
};

export const completeOrderAndPay = async (orderId, companyId, paymentData) => {
  return await orderRepo.completeOrderAndPay(orderId, companyId, paymentData);
};

export const cancelOrder = async (orderId, companyId, reason) => {
  return await orderRepo.cancelOrder(orderId, companyId, reason);
};
