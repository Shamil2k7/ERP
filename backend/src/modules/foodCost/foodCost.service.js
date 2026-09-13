import * as foodCostRepository from "./foodCost.repository.js";

export const getFoodCostingReport = async (companyId, restaurantId) => {
  return await foodCostRepository.getFoodCostingReport(companyId, restaurantId);
};
