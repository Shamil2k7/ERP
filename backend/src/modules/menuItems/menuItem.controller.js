import * as menuItemService from "./menuItem.service.js";

export const createMenuItem = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      return res.status(403).json({ success: false, message: "Tenant context required." });
    }
    if (req.file) {
      req.body.image = "/uploads/" + req.file.filename;
    }
    const item = await menuItemService.createMenuItem(companyId, req.body);
    return res.status(201).json({ success: true, message: "Menu item created successfully", data: item });
  } catch (error) { next(error); }
};

export const getMenuItems = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      return res.status(200).json({ success: true, data: [] });
    }
    const { restaurantId, categoryId } = req.query;
    const items = await menuItemService.getMenuItems(companyId, restaurantId, categoryId);
    return res.status(200).json({ success: true, data: items });
  } catch (error) { next(error); }
};

export const getMenuItemById = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const item = await menuItemService.getMenuItemById(req.params.id, companyId);
    return res.status(200).json({ success: true, data: item });
  } catch (error) { next(error); }
};

export const updateMenuItem = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (req.file) {
      req.body.image = "/uploads/" + req.file.filename;
    }
    const item = await menuItemService.updateMenuItem(req.params.id, companyId, req.body);
    return res.status(200).json({ success: true, message: "Menu item updated successfully", data: item });
  } catch (error) { next(error); }
};

export const deleteMenuItem = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    await menuItemService.deleteMenuItem(req.params.id, companyId);
    return res.status(200).json({ success: true, message: "Menu item deleted successfully" });
  } catch (error) { next(error); }
};
