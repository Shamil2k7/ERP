import prisma from "../../config/prisma.js";

// Add branch
const createBranch = async (data) => {
  return await prisma.branch.create({
    data,
  });
};

// Get all branches
const getAllBranches = async (companyId) => {
  const where = companyId ? { OR: [{ companyId }, { companyId: null }] } : {};
  return await prisma.branch.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });
};

// Get one branch
const getBranchById = async (id) => {
  return await prisma.branch.findUnique({
    where: {
      id,
    },
  });
};

// Find branch by code
const findBranchByCode = async (code) => {
  return await prisma.branch.findFirst({
    where: {
      code,
    },
  });
};

// Update branch
const updateBranch = async (id, data) => {
  return await prisma.branch.update({
    where: {
      id,
    },
    data,
  });
};

// Delete branch
const deleteBranch = async (id) => {
  return await prisma.branch.delete({
    where: {
      id,
    },
  });
};

export {
  createBranch,
  getAllBranches,
  getBranchById,
  findBranchByCode,
  updateBranch,
  deleteBranch,
};