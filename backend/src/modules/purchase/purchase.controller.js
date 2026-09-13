import * as purchaseService from "./purchase.service.js";

export const createPurchase = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const purchase = await purchaseService.createPurchase({
      ...req.body,
      companyId,
    });

    return res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      data: purchase,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllPurchases = async (req, res) => {
  try {
    const purchases = await purchaseService.getAllPurchases();

    return res.status(200).json({
      success: true,
      message: "Purchases fetched successfully",
      count: purchases.length,
      data: purchases,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await purchaseService.getPurchaseById(id);

    return res.status(200).json({
      success: true,
      message: "Purchase fetched successfully",
      data: purchase,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await purchaseService.updatePurchase(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Purchase updated successfully",
      data: purchase,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;

    await purchaseService.deletePurchase(id);

    return res.status(200).json({
      success: true,
      message: "Purchase deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};