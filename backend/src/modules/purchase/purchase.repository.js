import prisma from "../../config/prisma.js";

export const createPurchase = async (data) => {
  return await prisma.purchase.create({
    data,
    include: {
      supplier: true,
      warehouse: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });
};

export const getAllPurchases = async () => {
  return await prisma.purchase.findMany({
    include: {
      supplier: true,
      warehouse: true,
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

export const getPurchaseById = async (id) => {
  return await prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: true,
      warehouse: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });
};

export const getPurchaseByNumber = async (purchaseNo) => {
  return await prisma.purchase.findUnique({
    where: {
      purchaseNo,
    },
  });
};

export const updatePurchase = async (id, data) => {
  return await prisma.purchase.update({
    where: { id },
    data,
    include: {
      supplier: true,
      warehouse: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });
};

export const deletePurchase = async (id) => {
  return await prisma.purchase.delete({
    where: { id },
  });
};