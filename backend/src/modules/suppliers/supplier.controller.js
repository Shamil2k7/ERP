import * as supplierService from "./supplier.service.js";
import { validatePhoneNumber, cleanPhoneNumber } from "../../utils/phoneValidator.js";

export const createSupplier = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.body.companyId;
    const companyName = (req.body.companyName || req.body.name || "").trim();
    const contactPerson = req.body.contactPerson ? String(req.body.contactPerson).trim() : null;
    const email = req.body.email && String(req.body.email).trim() !== "" ? String(req.body.email).trim() : null;
    const phone = cleanPhoneNumber(req.body.phone || "");

    if (!validatePhoneNumber(phone, true)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must contain exactly 10 digits",
      });
    }

    const address = req.body.address ? String(req.body.address).trim() : null;
    const city = req.body.city ? String(req.body.city).trim() : null;
    const state = req.body.state ? String(req.body.state).trim() : null;
    const country = req.body.country ? String(req.body.country).trim() : null;
    const taxNumber = req.body.taxNumber ? String(req.body.taxNumber).trim() : null;
    const status = (req.body.status || "ACTIVE").toUpperCase();
    const category = req.body.category ? String(req.body.category).trim() : "RETAIL";
    const isTextile = Boolean(req.body.isTextile);

    const supplier = await supplierService.createSupplier({
      companyName,
      contactPerson,
      email,
      phone,
      address,
      city,
      state,
      country,
      taxNumber,
      status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      category,
      isTextile,
      companyId: companyId || undefined,
    });

    return res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllSuppliers = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;
    const suppliers = await supplierService.getAllSuppliers(companyId);

    return res.status(200).json({
      success: true,
      message: "Suppliers fetched successfully",
      count: suppliers.length,
      data: suppliers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await supplierService.getSupplierById(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Supplier fetched successfully",
      data: supplier,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const searchSuppliers = async (req, res) => {
  try {
    const { search } = req.query;

    const suppliers = await supplierService.searchSuppliers(search || "");

    return res.status(200).json({
      success: true,
      message: "Suppliers fetched successfully",
      count: suppliers.length,
      data: suppliers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = { ...req.body };
    if (req.body.name && !req.body.companyName) {
      updateData.companyName = req.body.name;
      delete updateData.name;
    }
    if (updateData.phone !== undefined) {
      updateData.phone = cleanPhoneNumber(updateData.phone);
      if (!validatePhoneNumber(updateData.phone, true)) {
        return res.status(400).json({
          success: false,
          message: "Phone number must contain exactly 10 digits",
        });
      }
    }
    if (updateData.email === "") updateData.email = null;
    if (updateData.contactPerson === "") updateData.contactPerson = null;
    if (updateData.address === "") updateData.address = null;
    if (updateData.city === "") updateData.city = null;
    if (updateData.state === "") updateData.state = null;
    if (updateData.country === "") updateData.country = null;
    if (updateData.taxNumber === "") updateData.taxNumber = null;

    const supplier = await supplierService.updateSupplier(id, updateData);


    return res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: supplier,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await supplierService.deleteSupplier(id);

    return res.status(200).json({
      success: true,
      message: "Supplier deleted successfully",
      data: supplier,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};