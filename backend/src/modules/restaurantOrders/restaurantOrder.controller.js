import * as orderService from "./restaurantOrder.service.js";

export const createOrder = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      return res.status(403).json({ success: false, message: "Tenant context required." });
    }
    const data = { ...req.body, createdBy: req.user?.fullName };
    const order = await orderService.createOrder(companyId, data);
    return res.status(201).json({ success: true, message: "Order created successfully", data: order });
  } catch (error) { next(error); }
};

export const getOrders = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      return res.status(200).json({ success: true, data: [] });
    }
    const orders = await orderService.getOrders(companyId, req.query);
    return res.status(200).json({ success: true, data: orders });
  } catch (error) { next(error); }
};

export const getOrderById = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const order = await orderService.getOrderById(req.params.id, companyId);
    return res.status(200).json({ success: true, data: order });
  } catch (error) { next(error); }
};

export const updateOrder = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const order = await orderService.updateOrder(req.params.id, companyId, req.body);
    return res.status(200).json({ success: true, message: "Order updated successfully", data: order });
  } catch (error) { next(error); }
};

export const checkStockAvailability = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const { warehouseId } = req.query;
    const result = await orderService.checkStockAvailability(req.params.id, companyId, warehouseId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const confirmOrderAndSendKOT = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const { warehouseId, allowStockOverride } = req.body;
    const result = await orderService.confirmOrderAndSendKOT(req.params.id, companyId, warehouseId, allowStockOverride);
    return res.status(200).json({
      success: true,
      message: "Order confirmed & KOT generated successfully",
      data: result,
    });
  } catch (error) { next(error); }
};

export const completeOrderAndPay = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const result = await orderService.completeOrderAndPay(req.params.id, companyId, req.body);
    return res.status(200).json({
      success: true,
      message: "Order completed & payment processed successfully",
      data: result,
    });
  } catch (error) { next(error); }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const { reason } = req.body;
    const order = await orderService.cancelOrder(req.params.id, companyId, reason || "Cancelled by user");
    return res.status(200).json({ success: true, message: "Order cancelled successfully", data: order });
  } catch (error) { next(error); }
};
