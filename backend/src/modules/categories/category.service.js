import * as categoryRepository from "./category.repository.js";


export const createCategory = async (data) => {
  let categoryCode = (data.code || "").trim();
  if (!categoryCode && data.name) {
    categoryCode = data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  }
  if (!categoryCode) {
    categoryCode = `CAT-${Date.now().toString().slice(-6)}`;
  }
  // PostgreSQL categories.code is VarChar(20)
  categoryCode = categoryCode.slice(0, 20);

  const existingCategory = await categoryRepository.getCategoryByCode(categoryCode);
  if (existingCategory) {
    const suffix = Date.now().toString().slice(-4);
    categoryCode = `${categoryCode.slice(0, 15)}-${suffix}`;
  }

  const cleanData = {
    name: data.name,
    description: data.description,
    image: data.image,
    status: data.status,
    companyId: data.companyId,
    code: categoryCode,
  };

  return await categoryRepository.createCategory(cleanData);
};


export const getAllCategories = async (companyId) => {
  return await categoryRepository.getAllCategories(companyId);
};

export const getCategoryById = async (id) => {
  const category = await categoryRepository.getCategoryById(id);

  if (!category) {
    throw new Error("Category not found.");
  }

  return category;
};

export const searchCategories = async (search) => {
  return await categoryRepository.searchCategories(search);
};

export const updateCategory = async (id, data) => {
  const category = await categoryRepository.getCategoryById(id);

  if (!category) {
    throw new Error("Category not found.");
  }

  if (data.code && data.code !== category.code) {
    const existingCategory = await categoryRepository.getCategoryByCode(
      data.code
    );

    if (existingCategory) {
      throw new Error("Category code already exists.");
    }
  }

  const cleanData = {};
  const allowedFields = ["name", "description", "image", "status", "companyId", "code"];
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      cleanData[field] = data[field];
    }
  }

  return await categoryRepository.updateCategory(id, cleanData);
};

export const deleteCategory = async (id) => {
  const category = await categoryRepository.getCategoryById(id);

  if (!category) {
    throw new Error("Category not found.");
  }

  const productsCount = await categoryRepository.getCategoryProductsCount(id);
  if (productsCount > 0) {
    throw new Error(
      "Cannot delete category because it contains active products. Please delete or reassign the products first."
    );
  }

  return await categoryRepository.deleteCategory(id);
};