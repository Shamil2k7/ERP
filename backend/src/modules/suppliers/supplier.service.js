import * as supplierRepository from "./supplier.repository.js";

export const createSupplier = async (data) => {
  if (data.email) {
    const existingSupplier = await supplierRepository.getSupplierByEmail(
      data.email
    );

    if (existingSupplier) {
      throw new Error("Supplier email already exists.");
    }
  }

  return await supplierRepository.createSupplier(data);
};

export const getAllSuppliers = async (companyId) => {
  return await supplierRepository.getAllSuppliers(companyId);
};

export const getSupplierById = async (id) => {
  const supplier = await supplierRepository.getSupplierById(id);

  if (!supplier) {
    throw new Error("Supplier not found.");
  }

  return supplier;
};

export const searchSuppliers = async (search) => {
  return await supplierRepository.searchSuppliers(search);
};

export const updateSupplier = async (id, data) => {
  const supplier = await supplierRepository.getSupplierById(id);

  if (!supplier) {
    throw new Error("Supplier not found.");
  }

  if (data.email && data.email !== supplier.email) {
    const existingSupplier = await supplierRepository.getSupplierByEmail(
      data.email
    );

    if (existingSupplier) {
      throw new Error("Supplier email already exists.");
    }
  }

  return await supplierRepository.updateSupplier(id, data);
};

export const deleteSupplier = async (id) => {
  const supplier = await supplierRepository.getSupplierById(id);

  if (!supplier) {
    throw new Error("Supplier not found.");
  }

  return await supplierRepository.deleteSupplier(id);
};