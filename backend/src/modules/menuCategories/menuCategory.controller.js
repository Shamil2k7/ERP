import * as menuCategoryService from "./menuCategory.service.js";

export const createMenuCategory = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      return res.status(403).json({ success: false, message: "Tenant context required." });
    }
    const category = await menuCategoryService.createMenuCategory(companyId, req.body);
    return res.status(201).json({ success: true, message: "Menu Category created successfully", data: category });
  } catch (error) { next(error); }
};

export const getMenuCategories = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      return res.status(200).json({ success: true, data: [] });
    }
    const { restaurantId } = req.query;
    const categories = await menuCategoryService.getMenuCategories(companyId, restaurantId);
    return res.status(200).json({ success: true, data: categories });
  } catch (error) { next(error); }
};

export const getMenuCategoryById = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const category = await menuCategoryService.getMenuCategoryById(req.params.id, companyId);
    return res.status(200).json({ success: true, data: category });
  } catch (error) { next(error); }
};

export const updateMenuCategory = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const category = await menuCategoryService.updateMenuCategory(req.params.id, companyId, req.body);
    return res.status(200).json({ success: true, message: "Menu Category updated successfully", data: category });
  } catch (error) { next(error); }
};

export const deleteMenuCategory = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    await menuCategoryService.deleteMenuCategory(req.params.id, companyId);
    return res.status(200).json({ success: true, message: "Menu Category deleted successfully" });
  } catch (error) { next(error); }
};
