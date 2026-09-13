import * as modifierService from "./modifier.service.js";

export const createModifierGroup = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      return res.status(403).json({ success: false, message: "Tenant context required." });
    }
    const group = await modifierService.createModifierGroup(companyId, req.body);
    return res.status(201).json({ success: true, message: "Modifier group created successfully", data: group });
  } catch (error) { next(error); }
};

export const getModifierGroups = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      return res.status(200).json({ success: true, data: [] });
    }
    const { restaurantId } = req.query;
    const groups = await modifierService.getModifierGroups(companyId, restaurantId);
    return res.status(200).json({ success: true, data: groups });
  } catch (error) { next(error); }
};

export const getModifierGroupById = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const group = await modifierService.getModifierGroupById(req.params.id, companyId);
    return res.status(200).json({ success: true, data: group });
  } catch (error) { next(error); }
};

export const updateModifierGroup = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const group = await modifierService.updateModifierGroup(req.params.id, companyId, req.body);
    return res.status(200).json({ success: true, message: "Modifier group updated successfully", data: group });
  } catch (error) { next(error); }
};

export const linkMenuItem = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const { menuItemId, modifierGroupId } = req.body;
    const result = await modifierService.linkMenuItem(companyId, menuItemId, modifierGroupId);
    return res.status(200).json({ success: true, message: "Modifier linked successfully", data: result });
  } catch (error) { next(error); }
};

export const unlinkMenuItem = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const { menuItemId, modifierGroupId } = req.body;
    await modifierService.unlinkMenuItem(companyId, menuItemId, modifierGroupId);
    return res.status(200).json({ success: true, message: "Modifier unlinked successfully" });
  } catch (error) { next(error); }
};

export const deleteModifierGroup = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    await modifierService.deleteModifierGroup(req.params.id, companyId);
    return res.status(200).json({ success: true, message: "Modifier group deleted successfully" });
  } catch (error) { next(error); }
};
