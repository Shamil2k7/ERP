import * as restaurantRepository from "./restaurant.repository.js";

export const createRestaurant = async (data) => {
  if (!data.name) {
    throw new Error("Restaurant name is required.");
  }
  if (!data.branchId) {
    throw new Error("Branch ID is required.");
  }
  if (!data.companyId) {
    throw new Error("Company ID is required.");
  }
  return await restaurantRepository.createRestaurant(data);
};

export const getAllRestaurants = async (companyId, branchId) => {
  return await restaurantRepository.getAllRestaurants(companyId, branchId);
};

export const getRestaurantById = async (id, companyId) => {
  const restaurant = await restaurantRepository.getRestaurantById(id, companyId);
  if (!restaurant) {
    const error = new Error("Restaurant not found or access denied.");
    error.statusCode = 404;
    throw error;
  }
  return restaurant;
};

export const updateRestaurant = async (id, companyId, data) => {
  return await restaurantRepository.updateRestaurant(id, companyId, data);
};

export const deleteRestaurant = async (id, companyId) => {
  return await restaurantRepository.deleteRestaurant(id, companyId);
};
