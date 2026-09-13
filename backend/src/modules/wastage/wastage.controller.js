import * as wastageService from "./wastage.service.js";

export const createWastage = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      return res.status(403).json({ success: false, message: "Tenant context required." });
    }
    const data = { ...req.body, createdBy: req.user?.fullName };
    const wastage = await wastageService.createWastage(companyId, data);
    return res.status(201).json({ success: true, message: "Wastage recorded successfully", data: wastage });
  } catch (error) { next(error); }
};

export const getWastages = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      return res.status(200).json({ success: true, data: [] });
    }
    const wastages = await wastageService.getWastages(companyId, req.query);
    return res.status(200).json({ success: true, data: wastages });
  } catch (error) { next(error); }
};

export const getWastageById = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const wastage = await wastageService.getWastageById(req.params.id, companyId);
    return res.status(200).json({ success: true, data: wastage });
  } catch (error) { next(error); }
};

export const deleteWastage = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    await wastageService.deleteWastage(req.params.id, companyId);
    return res.status(200).json({ success: true, message: "Wastage deleted successfully" });
  } catch (error) { next(error); }
};
