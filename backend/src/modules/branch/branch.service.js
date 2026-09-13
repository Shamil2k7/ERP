import {
  createBranch,
  getAllBranches,
  getBranchById,
  findBranchByCode,
  updateBranch,
  deleteBranch,
} from "./branch.repository.js";

// Add branch
const addBranchService = async (data) => {
  const existingBranch = await findBranchByCode(data.code);

  if (existingBranch) {
    throw new Error("Branch code already exists");
  }

  return await createBranch(data);
};

// Get all branches
const getAllBranchesService = async (companyId) => {
  return await getAllBranches(companyId);
};

// Get one branch
const getBranchService = async (id) => {
  const branch = await getBranchById(id);

  if (!branch) {
    throw new Error("Branch not found");
  }

  return branch;
};

// Edit branch
const editBranchService = async (id, data) => {
  const branch = await getBranchById(id);

  if (!branch) {
    throw new Error("Branch not found");
  }

  if (data.code) {
    const existingBranch = await findBranchByCode(data.code);

    if (existingBranch && existingBranch.id !== id) {
      throw new Error("Branch code already exists");
    }
  }

  return await updateBranch(id, data);
};

// Delete branch
const deleteBranchService = async (id) => {
  const branch = await getBranchById(id);

  if (!branch) {
    throw new Error("Branch not found");
  }

  return await deleteBranch(id);
};

export {
  addBranchService,
  getAllBranchesService,
  getBranchService,
  editBranchService,
  deleteBranchService,
};