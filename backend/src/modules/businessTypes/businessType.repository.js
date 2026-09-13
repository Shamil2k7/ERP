import prisma from "../../config/prisma.js";

const findAllBusinessTypes = async () => {
  return await prisma.businessType.findMany({
    orderBy: { createdAt: "desc" },
  });
};

const findBusinessTypeById = async (id) => {
  return await prisma.businessType.findUnique({
    where: { id },
  });
};

const createBusinessType = async (data) => {
  return await prisma.businessType.create({
    data,
  });
};

const updateBusinessType = async (id, data) => {
  return await prisma.businessType.update({
    where: { id },
    data,
  });
};

const deleteBusinessType = async (id) => {
  return await prisma.businessType.delete({
    where: { id },
  });
};

export {
  findAllBusinessTypes,
  findBusinessTypeById,
  createBusinessType,
  updateBusinessType,
  deleteBusinessType,
};
