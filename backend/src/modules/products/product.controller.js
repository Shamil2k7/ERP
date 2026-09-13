import * as productService from "./product.service.js";

export const createProduct = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const product = await productService.createProduct({
      ...req.body,
      companyId: companyId || req.body.companyId,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;
    const products = await productService.getAllProducts(companyId);

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      count: products.length,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await productService.getProductById(id);

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: product,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};


export const searchProducts = async (req, res) => {
  try {
    const { search } = req.query;

    const products = await productService.searchProducts(search || "");

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      count: products.length,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await productService.updateProduct(
      id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await productService.deleteProduct(id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    const isNotFound = error.message === "Product not found.";
    return res.status(isNotFound ? 404 : 400).json({
      success: false,
      message: isNotFound ? error.message : "Failed to delete product. Active dependency exists.",
    });
  }
};