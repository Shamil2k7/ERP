import prisma from "../../config/prisma.js";

// Fetch all industries
export const getAllIndustriesRepo = async () => {
  return await prisma.industry.findMany({
    where: { status: true },
    include: {
      modules: {
        where: { defaultEnabled: true },
        include: { module: true },
      },
    },
    orderBy: { name: "asc" },
  });
};

// Find industry by code
export const findIndustryByCodeRepo = async (code) => {
  return await prisma.industry.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      modules: {
        include: { module: true },
      },
    },
  });
};

// Get all modules
export const getAllModulesRepo = async () => {
  return await prisma.module.findMany({
    where: { status: true },
    orderBy: { name: "asc" },
  });
};

// Create Company
export const createCompanyRepo = async ({ name, industryId }) => {
  return await prisma.company.create({
    data: {
      name,
      industryId,
      status: "ACTIVE",
    },
    include: {
      industry: true,
    },
  });
};

// Create Company Modules
export const setCompanyModulesRepo = async (companyId, moduleCodes) => {
  // First fetch modules by codes
  const modules = await prisma.module.findMany({
    where: { code: { in: moduleCodes } },
  });

  const companyModuleData = modules.map((mod) => ({
    companyId,
    moduleId: mod.id,
    enabled: true,
  }));

  // Delete old if exists and create new
  await prisma.companyModule.deleteMany({
    where: { companyId },
  });

  await prisma.companyModule.createMany({
    data: companyModuleData,
  });

  return await prisma.companyModule.findMany({
    where: { companyId },
    include: { module: true },
  });
};

// Get all companies
export const getAllCompaniesRepo = async () => {
  return await prisma.company.findMany({
    include: {
      industry: true,
      users: {
        select: { id: true, fullName: true, email: true, role: true },
      },
      modules: {
        where: { enabled: true },
        include: { module: true },
      },
      _count: {
        select: {
          branches: true,
          products: true,
          warehouses: true,
          customers: true,
          salesOrders: true,
          purchases: true,
          users: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });
};
