import {
  addBranchService,
  getAllBranchesService,
  getBranchService,
  editBranchService,
  deleteBranchService,
} from "./branch.service.js";

import {
  branchSchema,
  updateBranchSchema,
} from "./branch.validation.js";

// Add branch
const addBranch = async (req, res) => {
  try {
    const { error, value } = branchSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errorMessages = error.details.map((item) => item.message);
      return res.status(400).json({
        success: false,
        message: errorMessages.join(", "),
        errors: errorMessages,
      });
    }

    const companyId = req.user?.companyId;
    const branch = await addBranchService({
      ...value,
      companyId: companyId || value.companyId,
    });

    return res.status(201).json({
      success: true,
      message: "Branch added successfully",
      data: branch,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all branches
const getBranches = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;
    const branches = await getAllBranchesService(companyId);

    return res.status(200).json({
      success: true,
      data: branches,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get one branch
const getBranch = async (req, res) => {
  try {
    const branch = await getBranchService(req.params.id);

    return res.status(200).json({
      success: true,
      data: branch,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Edit branch
const editBranch = async (req, res) => {
  try {
    const { error, value } = updateBranchSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errorMessages = error.details.map((item) => item.message);
      return res.status(400).json({
        success: false,
        message: errorMessages.join(", "),
        errors: errorMessages,
      });
    }

    const branch = await editBranchService(
      req.params.id,
      value
    );

    return res.status(200).json({
      success: true,
      message: "Branch updated successfully",
      data: branch,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete branch
const deleteBranch = async (req, res) => {
  try {
    await deleteBranchService(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Branch deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  addBranch,
  getBranches,
  getBranch,
  editBranch,
  deleteBranch,
};