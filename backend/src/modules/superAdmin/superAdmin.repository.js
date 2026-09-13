import prisma from "../../config/prisma.js";

export const getSystemStatsRepo = async () => {
  const companyCount = await prisma.company.count();
  const userCount = await prisma.user.count();
  return { companyCount, userCount };
};

export const getAllCompaniesRepo = async (query = {}) => {
  const where = {};
  if (query.search) {
    where.name = { contains: query.search, mode: "insensitive" };
  }
  return await prisma.company.findMany({ where });
};

export const updateCompanyStatusRepo = async (id, status) => {
  return await prisma.company.update({
    where: { id },
    data: { status },
  });
};
