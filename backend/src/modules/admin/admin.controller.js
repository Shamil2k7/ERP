import {
  createAdminService,
  getAllAdminsService,
  getAdminByIdService,
  deleteAdminService,
} from "./admin.service.js";

import { createAdminSchema } from "./admin.validation.js";

// CREATE ADMIN
export const createAdminController = async (req, res) => {
  try {
    const { error, value } = createAdminSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((item) => item.message),
      });
    }

    const admin = await createAdminService(value);

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: admin,
    });
  } catch (error) {
    console.error("Create Admin Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create admin",
    });
  }
};


// GET ALL ADMINS
export const getAllAdminsController = async (req, res) => {
  try {
    const admins = await getAllAdminsService();

    return res.status(200).json({
      success: true,
      message: "Admins fetched successfully",
      data: admins,
    });
  } catch (error) {
    console.error("Get All Admins Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admins",
    });
  }
};


// GET ADMIN BY ID
export const getAdminByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await getAdminByIdService(id);

    return res.status(200).json({
      success: true,
      message: "Admin fetched successfully",
      data: admin,
    });
  } catch (error) {
    console.error("Get Admin Error:", error);

    return res.status(404).json({
      success: false,
      message: error.message || "Admin not found",
    });
  }
};


// DELETE ADMIN
export const deleteAdminController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteAdminService(id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Delete Admin Error:", error);

    return res.status(404).json({
      success: false,
      message: error.message || "Failed to delete admin",
    });
  }
};