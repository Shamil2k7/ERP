import prisma from "../../config/prisma.js";

export const createSupplier = async (data) => {
  return await prisma.supplier.create({
    data,
  });
};

export const getAllSuppliers = async (companyId) => {
  const where = {};
  if (companyId && companyId !== "ALL" && companyId !== "undefined" && companyId !== "null" && String(companyId).trim() !== "") {
    where.companyId = companyId;
  }
  return await prisma.supplier.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      purchases: {
        include: {
          items: true,
        },
      },
    },
  });
};

export const getSupplierById = async (id) => {
  return await prisma.supplier.findUnique({
    where: {
      id,
    },
  });
};

export const getSupplierByEmail = async (email) => {
  return await prisma.supplier.findFirst({
    where: {
      email,
    },
  });
};

export const updateSupplier = async (id, data) => {
  return await prisma.supplier.update({
    where: {
      id,
    },
    data,
  });
};


export const deleteSupplier = async (id) => {
  return await prisma.supplier.delete({
    where: {
      id,
    },
  });
};

export const searchSuppliers = async (search) => {
  return await prisma.supplier.findMany({
    where: {
      OR: [
        {
          companyName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          contactPerson: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          phone: {
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