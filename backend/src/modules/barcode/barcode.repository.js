import prisma from "../../config/prisma.js";

export const createBarcode = async (data) => {
  return await prisma.barcode.create({
    data,
    include: {
      product: true,
    },
  });
};

export const getAllBarcodes = async () => {
  return await prisma.barcode.findMany({
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getBarcodeById = async (id) => {
  return await prisma.barcode.findUnique({
    where: {
      id,
    },
    include: {
      product: true,
    },
  });
};

export const getBarcodeByCode = async (barcode) => {
  return await prisma.barcode.findUnique({
    where: {
      barcode,
    },
  });
};

export const getBarcodeByProductId = async (productId) => {
  return await prisma.barcode.findFirst({
    where: {
      productId,
    },
    include: {
      product: true,
    },
  });
};

export const updateBarcode = async (id, data) => {
  return await prisma.barcode.update({
    where: {
      id,
    },
    data,
  });
};

export const deleteBarcode = async (id) => {
  return await prisma.barcode.delete({
    where: {
      id,
    },
  });
};

export const getBarcodeWithProduct = async (barcode) => {
  return await prisma.barcode.findUnique({
    where: {
      barcode,
    },
    include: {
      product: {
        include: {
          category: true,
          brand: true,
          unit: true,
          inventories: true,
        },
      },
    },
  });
};