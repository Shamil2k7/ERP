import * as salonRepo from "./salon.repository.js";

export const getSalonServices = async (companyId, query) => {
  return await salonRepo.getSalonServicesRepo(companyId, query);
};

export const getSalonServiceById = async (companyId, id) => {
  return await salonRepo.getSalonServiceByIdRepo(companyId, id);
};

export const createSalonService = async (companyId, data) => {
  return await salonRepo.createSalonServiceRepo({ ...data, companyId });
};

export const updateSalonService = async (companyId, id, data) => {
  return await salonRepo.updateSalonServiceRepo(companyId, id, data);
};

export const deleteSalonService = async (companyId, id) => {
  return await salonRepo.deleteSalonServiceRepo(companyId, id);
};
