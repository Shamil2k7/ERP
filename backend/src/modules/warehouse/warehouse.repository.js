import prisma from "../../config/prisma.js";

export const createWarehouse = async (data) => {
  return await prisma.warehouse.create({
    data,
  });
};

export const getAllWarehouses = async (companyId) => {
  const where = companyId ? { companyId } : {};
  return await prisma.warehouse.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      inventories: true,
    },
  });
};

export const getWarehouseById = async (id) => {
  return await prisma.warehouse.findUnique({
    where: {
      id,
    },
  });
};

export const getWarehouseByCode = async (code) => {
  return await prisma.warehouse.findFirst({
    where: {
      code,
    },
  });
};

export const updateWarehouse = async (id, data) => {
  return await prisma.warehouse.update({
    where: {
      id,
    },
    data,
  });
};

export const deleteWarehouse = async (id) => {
  return await prisma.warehouse.delete({
    where: {
      id,
    },
  });
};

export const searchWarehouses = async (search) => {
  return await prisma.warehouse.findMany({
    where: {
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          code: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          city: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};