import prisma from "../../config/prisma.js";

export const getSalonServicesRepo = async (companyId, query = {}) => {
  const where = {};
  if (companyId) where.companyId = companyId;
  if (query.search) {
    where.name = { contains: query.search, mode: "insensitive" };
  }
  return await prisma.salonService?.findMany({ where }) || [];
};

export const getSalonServiceByIdRepo = async (companyId, id) => {
  const where = { id };
  if (companyId) where.companyId = companyId;
  return await prisma.salonService?.findFirst({ where });
};

export const createSalonServiceRepo = async (data) => {
  return await prisma.salonService?.create({ data });
};

export const updateSalonServiceRepo = async (companyId, id, data) => {
  return await prisma.salonService?.update({ where: { id }, data });
};

export const deleteSalonServiceRepo = async (companyId, id) => {
  return await prisma.salonService?.delete({ where: { id } });
};
