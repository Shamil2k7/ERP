import * as brandRepository from "./brand.repository.js";

export const createBrand = async (data) => {
  if (!data || !data.name) {
    throw new Error("Brand name is required.");
  }

  const existingBrand = await brandRepository.getBrandByName(data.name);

  if (existingBrand) {
    return existingBrand;
  }

  const payload = {
    name: String(data.name).trim(),
    description: data.description || null,
    status: data.status || "ACTIVE",
    companyId: data.companyId || null,
  };

  return await brandRepository.createBrand(payload);
};

export const getAllBrands = async (companyId) => {
  return await brandRepository.getAllBrands(companyId);
};

export const getBrandById = async (id) => {
  const brand = await brandRepository.getBrandById(id);

  if (!brand) {
    throw new Error("Brand not found.");
  }

  return brand;
};

export const updateBrand = async (id, data) => {
  const brand = await brandRepository.getBrandById(id);

  if (!brand) {
    throw new Error("Brand not found.");
  }

  if (data.name && data.name !== brand.name) {
    const existingBrand = await brandRepository.getBrandByName(data.name);

    if (existingBrand) {
      throw new Error("Brand already exists.");
    }
  }

  return await brandRepository.updateBrand(id, data);
};

export const deleteBrand = async (id) => {
  const brand = await brandRepository.getBrandById(id);

  if (!brand) {
    throw new Error("Brand not found.");
  }

  return await brandRepository.deleteBrand(id);
};