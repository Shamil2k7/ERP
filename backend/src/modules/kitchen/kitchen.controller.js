import * as kitchenService from "./kitchen.service.js";

export const getKitchenOrders = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      return res.status(200).json({ success: true, data: [] });
    }
    const { restaurantId, status } = req.query;
    const kots = await kitchenService.getKitchenOrders(companyId, restaurantId, status);
    return res.status(200).json({ success: true, data: kots });
  } catch (error) { next(error); }
};

export const getKitchenOrderById = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const kot = await kitchenService.getKitchenOrderById(req.params.id, companyId);
    return res.status(200).json({ success: true, data: kot });
  } catch (error) { next(error); }
};

export const startPreparation = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const kot = await kitchenService.updateKOTStatus(req.params.id, companyId, "PREPARING");
    return res.status(200).json({ success: true, message: "KOT marked as preparing", data: kot });
  } catch (error) { next(error); }
};

export const markReady = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const kot = await kitchenService.updateKOTStatus(req.params.id, companyId, "READY");
    return res.status(200).json({ success: true, message: "KOT marked as ready", data: kot });
  } catch (error) { next(error); }
};

export const markServed = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const kot = await kitchenService.updateKOTStatus(req.params.id, companyId, "SERVED");
    return res.status(200).json({ success: true, message: "KOT marked as served", data: kot });
  } catch (error) { next(error); }
};

export const updateKOTStatus = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const { status } = req.body;
    const kot = await kitchenService.updateKOTStatus(req.params.id, companyId, status);
    return res.status(200).json({ success: true, message: "KOT status updated successfully", data: kot });
  } catch (error) { next(error); }
};
