import bwipjs from "bwip-js";
import * as barcodeRepository from "./barcode.repository.js";
import * as productRepository from "../products/product.repository.js";

export const createBarcode = async (data) => {
  const product = await productRepository.getProductById(
    data.productId
  );

  if (!product) {
    throw new Error("Product not found.");
  }

  const existingBarcode =
    await barcodeRepository.getBarcodeByCode(data.barcode);

  if (existingBarcode) {
    throw new Error("Barcode already exists.");
  }

  return await barcodeRepository.createBarcode(data);
};

export const getAllBarcodes = async () => {
  return await barcodeRepository.getAllBarcodes();
};

export const getBarcodeById = async (id) => {
  const barcode = await barcodeRepository.getBarcodeById(id);

  if (!barcode) {
    throw new Error("Barcode not found.");
  }

  return barcode;
};

export const getBarcodeByProductId = async (productId) => {
  const barcode =
    await barcodeRepository.getBarcodeByProductId(productId);

  if (!barcode) {
    throw new Error("Barcode not found.");
  }

  return barcode;
};


export const updateBarcode = async (id, data) => {
  const barcode = await barcodeRepository.getBarcodeById(id);

  if (!barcode) {
    throw new Error("Barcode not found.");
  }

  if (data.barcode && data.barcode !== barcode.barcode) {
    const existingBarcode =
      await barcodeRepository.getBarcodeByCode(data.barcode);

    if (existingBarcode) {
      throw new Error("Barcode already exists.");
    }
  }

  return await barcodeRepository.updateBarcode(id, data);
};

export const deleteBarcode = async (id) => {
  const barcode = await barcodeRepository.getBarcodeById(id);

  if (!barcode) {
    throw new Error("Barcode not found.");
  }

  return await barcodeRepository.deleteBarcode(id);
};

export const createBarcodeForProduct = async (productId) => {
  const barcode = generateBarcodeNumber();

  const existingBarcode =
    await barcodeRepository.getBarcodeByCode(barcode);

  if (existingBarcode) {
    throw new Error("Barcode already exists.");
  }

  const savedBarcode = await barcodeRepository.createBarcode({
    productId,
    barcode,
    type: "CODE128",
  });

  return savedBarcode;
};

const generateBarcodeNumber = () => {
  const time = Date.now().toString();

  return time.slice(-12);
};

export const generateBarcodeImage = async (barcode) => {
  return await bwipjs.toBuffer({
    bcid: "code128",
    text: barcode,
    scale: 3,
    height: 10,
    includetext: true,
    textxalign: "center",
  });
};

export const getProductByBarcode = async (barcode) => {
  const barcodeData =
    await barcodeRepository.getBarcodeWithProduct(barcode);

  if (!barcodeData) {
    throw new Error("Barcode not found.");
  }

  return barcodeData.product;
};