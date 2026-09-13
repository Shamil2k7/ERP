import prisma from "../../config/prisma.js";

export const createUnit = async (data) => {
  return await prisma.unit.create({
    data,
  });
};

export const getAllUnits = async (companyId) => {
  const where = companyId ? { OR: [{ companyId }, { companyId: null }] } : {};
  return await prisma.unit.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getUnitById = async (id) => {
  return await prisma.unit.findUnique({
    where: {
      id,
    },
  });
};

export const getUnitByCode = async (code) => {
  return await prisma.unit.findFirst({
    where: {
      code: code,
    },
  });
};

export const getUnitByName = async (name) => {
  return await prisma.unit.findFirst({
    where: {
      name: name,
    },
  });
};

export const updateUnit = async (id, data) => {
  return await prisma.unit.update({
    where: {
      id,
    },
    data,
  });
};

export const deleteUnit = async (id) => {
  return await prisma.unit.delete({
    where: {
      id,
    },
  });
};