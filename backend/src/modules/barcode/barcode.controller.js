import * as barcodeService from "./barcode.service.js";

export const createBarcode = async (req, res) => {
  try {
    const barcode = await barcodeService.createBarcode(req.body);

    return res.status(201).json({
      success: true,
      message: "Barcode created successfully",
      data: barcode,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllBarcodes = async (req, res) => {
  try {
    const barcodes = await barcodeService.getAllBarcodes();

    return res.status(200).json({
      success: true,
      message: "Barcodes fetched successfully",
      count: barcodes.length,
      data: barcodes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBarcodeById = async (req, res) => {
  try {
    const { id } = req.params;

    const barcode = await barcodeService.getBarcodeById(id);

    return res.status(200).json({
      success: true,
      message: "Barcode fetched successfully",
      data: barcode,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBarcodeByProductId = async (req, res) => {
  try {
    const { productId } = req.params;

    const barcode = await barcodeService.getBarcodeByProductId(productId);

    return res.status(200).json({
      success: true,
      message: "Barcode fetched successfully",
      data: barcode,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateBarcode = async (req, res) => {
  try {
    const { id } = req.params;

    const barcode = await barcodeService.updateBarcode(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Barcode updated successfully",
      data: barcode,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteBarcode = async (req, res) => {
  try {
    const { id } = req.params;

    await barcodeService.deleteBarcode(id);

    return res.status(200).json({
      success: true,
      message: "Barcode deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const generateBarcodeImage = async (req, res) => {
  try {
    const { barcode } = req.params;

    const image = await barcodeService.generateBarcodeImage(barcode);

    res.setHeader("Content-Type", "image/png");
    return res.send(image);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    const product =
      await barcodeService.getProductByBarcode(barcode);

    return res.status(200).json({
      success: true,
      message: "Product found by barcode",
      data: product,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};