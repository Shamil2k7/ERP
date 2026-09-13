import * as stockTransferService from "./stockTransfer.service.js";

export const createStockTransfer = async (req, res) => {
  try {
    const transfer = await stockTransferService.createStockTransfer(req.body);

    return res.status(201).json({
      success: true,
      message: "Stock transfer created successfully",
      data: transfer,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllStockTransfers = async (req, res) => {
  try {
    const transfers = await stockTransferService.getAllStockTransfers();

    return res.status(200).json({
      success: true,
      message: "Stock transfers fetched successfully",
      count: transfers.length,
      data: transfers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStockTransferById = async (req, res) => {
  try {
    const { id } = req.params;

    const transfer = await stockTransferService.getStockTransferById(id);

    return res.status(200).json({
      success: true,
      message: "Stock transfer fetched successfully",
      data: transfer,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateStockTransfer = async (req, res) => {
  try {
    const { id } = req.params;

    const transfer = await stockTransferService.updateStockTransfer(
      id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Stock transfer updated successfully",
      data: transfer,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteStockTransfer = async (req, res) => {
  try {
    const { id } = req.params;

    await stockTransferService.deleteStockTransfer(id);

    return res.status(200).json({
      success: true,
      message: "Stock transfer deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};
