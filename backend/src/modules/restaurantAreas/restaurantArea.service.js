import * as areaRepository from "./restaurantArea.repository.js";

export const createArea = async (companyId, data) => {
  if (!data.name) {
    throw new Error("Area/Floor name is required.");
  }
  if (!data.restaurantId) {
    throw new Error("Restaurant ID is required.");
  }
  return await areaRepository.createArea(companyId, data);
};

export const getAreasByRestaurant = async (companyId, restaurantId) => {
  return await areaRepository.getAreasByRestaurant(companyId, restaurantId);
};

export const getAreaById = async (id, companyId) => {
  const area = await areaRepository.getAreaById(id, companyId);
  if (!area) {
    const error = new Error("Area/Floor not found or access denied.");
    error.statusCode = 404;
    throw error;
  }
  return area;
};

export const updateArea = async (id, companyId, data) => {
  return await areaRepository.updateArea(id, companyId, data);
};

export const deleteArea = async (id, companyId) => {
  return await areaRepository.deleteArea(id, companyId);
};
