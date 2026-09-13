import prisma from "../../config/prisma.js";

export const createStockTransfer = async (data) => {
  return await prisma.stockTransfer.create({
    data,
    include: {
      fromWarehouse: true,
      toWarehouse: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });
};

export const getAllStockTransfers = async () => {
  return await prisma.stockTransfer.findMany({
    include: {
      fromWarehouse: true,
      toWarehouse: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getStockTransferById = async (id) => {
  return await prisma.stockTransfer.findUnique({
    where: {
      id,
    },
    include: {
      fromWarehouse: true,
      toWarehouse: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });
};

export const getStockTransferByTransferNo = async (transferNo) => {
  return await prisma.stockTransfer.findUnique({
    where: {
      transferNo,
    },
  });
};

export const updateStockTransfer = async (id, data) => {
  return await prisma.stockTransfer.update({
    where: {
      id,
    },
    data,
    include: {
      fromWarehouse: true,
      toWarehouse: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });
};

export const deleteStockTransfer = async (id) => {
  return await prisma.stockTransfer.delete({
    where: {
      id,
    },
  });
};