import * as areaService from "./restaurantArea.service.js";

export const createArea = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      return res.status(403).json({ success: false, message: "Tenant context required." });
    }
    const area = await areaService.createArea(companyId, req.body);
    return res.status(201).json({ success: true, message: "Area created successfully", data: area });
  } catch (error) { next(error); }
};

export const getAreasByRestaurant = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      return res.status(200).json({ success: true, data: [] });
    }
    const { restaurantId } = req.query;
    const areas = await areaService.getAreasByRestaurant(companyId, restaurantId);
    return res.status(200).json({ success: true, data: areas });
  } catch (error) { next(error); }
};

export const getAreaById = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const area = await areaService.getAreaById(req.params.id, companyId);
    return res.status(200).json({ success: true, data: area });
  } catch (error) { next(error); }
};

export const updateArea = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const area = await areaService.updateArea(req.params.id, companyId, req.body);
    return res.status(200).json({ success: true, message: "Area updated successfully", data: area });
  } catch (error) { next(error); }
};

export const deleteArea = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    await areaService.deleteArea(req.params.id, companyId);
    return res.status(200).json({ success: true, message: "Area deleted successfully" });
  } catch (error) { next(error); }
};
