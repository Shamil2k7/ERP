import * as modifierRepository from "./modifier.repository.js";

export const createModifierGroup = async (companyId, data) => {
  if (!data.name) {
    throw new Error("Modifier group name is required.");
  }
  if (!data.restaurantId) {
    throw new Error("Restaurant ID is required.");
  }
  return await modifierRepository.createModifierGroup(companyId, data);
};

export const getModifierGroups = async (companyId, restaurantId) => {
  return await modifierRepository.getModifierGroups(companyId, restaurantId);
};

export const getModifierGroupById = async (id, companyId) => {
  const group = await modifierRepository.getModifierGroupById(id, companyId);
  if (!group) {
    const error = new Error("Modifier group not found or access denied.");
    error.statusCode = 404;
    throw error;
  }
  return group;
};

export const updateModifierGroup = async (id, companyId, data) => {
  return await modifierRepository.updateModifierGroup(id, companyId, data);
};

export const linkMenuItem = async (companyId, menuItemId, modifierGroupId) => {
  return await modifierRepository.linkMenuItemModifierGroup(companyId, menuItemId, modifierGroupId);
};

export const unlinkMenuItem = async (companyId, menuItemId, modifierGroupId) => {
  return await modifierRepository.unlinkMenuItemModifierGroup(companyId, menuItemId, modifierGroupId);
};

export const deleteModifierGroup = async (id, companyId) => {
  return await modifierRepository.deleteModifierGroup(id, companyId);
};
