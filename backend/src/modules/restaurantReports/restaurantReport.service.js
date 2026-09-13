import * as reportRepo from "./restaurantReport.repository.js";

export const getRestaurantAnalytics = async (params) => {
  return await reportRepo.getRestaurantAnalytics(params);
};
