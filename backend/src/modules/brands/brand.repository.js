import prisma from "../../config/prisma.js";

export const createBrand = async (data) => {
  return await prisma.brand.create({
    data,
  });
};

export const getAllBrands = async (companyId) => {
  const where = {};
  if (companyId && companyId !== "ALL" && companyId !== "undefined" && companyId !== "null" && String(companyId).trim() !== "") {
    where.OR = [{ companyId }, { companyId: null }];
  }
  return await prisma.brand.findMany({
    where,
    include: {
      products: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

export const getBrandById = async (id) => {
  return await prisma.brand.findUnique({
    where: {
      id,
    },
    include: {
      products: true,
    },
  });
};

export const getBrandByName = async (name) => {
  if (!name) return null;
  return await prisma.brand.findFirst({
    where: {
      name: {
        equals: String(name).trim(),
        mode: "insensitive",
      },
    },
  });
};

export const updateBrand = async (id, data) => {
  return await prisma.brand.update({
    where: {
      id,
    },
    data,
  });
};

export const deleteBrand = async (id) => {
  return await prisma.brand.delete({
    where: {
      id,
    },
  });
};