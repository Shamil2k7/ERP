import * as superAdminRepo from "./superAdmin.repository.js";

export const getSystemStats = async () => {
  return await superAdminRepo.getSystemStatsRepo();
};

export const getAllCompanies = async (query) => {
  return await superAdminRepo.getAllCompaniesRepo(query);
};

export const toggleCompanyStatus = async (id, status) => {
  return await superAdminRepo.updateCompanyStatusRepo(id, status);
};
