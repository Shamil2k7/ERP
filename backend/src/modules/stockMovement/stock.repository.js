import prisma from "../../config/prisma.js";

export const createStockMovement = async (data) => {
  return await prisma.stockMovement.create({
    data,
    include: {
      product: true,
      warehouse: true,
    },
  });
};

export const getAllStockMovements = async () => {
  return await prisma.stockMovement.findMany({
    include: {
      product: true,
      warehouse: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getStockMovementById = async (id) => {
  return await prisma.stockMovement.findUnique({
    where: {
      id,
    },
    include: {
      product: true,
      warehouse: true,
    },
  });
};

export const getStockMovementsByProduct = async (productId) => {
  return await prisma.stockMovement.findMany({
    where: {
      productId,
    },
    include: {
      product: true,
      warehouse: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getStockMovementsByWarehouse = async (warehouseId) => {
  return await prisma.stockMovement.findMany({
    where: {
      warehouseId,
    },
    include: {
      product: true,
      warehouse: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const updateStockMovement = async (id, data) => {
  return await prisma.stockMovement.update({
    where: {
      id,
    },
    data,
    include: {
      product: true,
      warehouse: true,
    },
  });
};

export const deleteStockMovement = async (id) => {
  return await prisma.stockMovement.delete({
    where: {
      id,
    },
  });
};