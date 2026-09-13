import * as stockService from "./stock.service.js";

export const createStockMovement = async (req, res) => {
  try {
    const stockMovement = await stockService.createStockMovement(req.body);

    return res.status(201).json({
      success: true,
      message: "Stock movement created successfully",
      data: stockMovement,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllStockMovements = async (req, res) => {
  try {
    const stockMovements = await stockService.getAllStockMovements();

    return res.status(200).json({
      success: true,
      message: "Stock movements fetched successfully",
      count: stockMovements.length,
      data: stockMovements,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStockMovementById = async (req, res) => {
  try {
    const { id } = req.params;

    const stockMovement = await stockService.getStockMovementById(id);

    return res.status(200).json({
      success: true,
      message: "Stock movement fetched successfully",
      data: stockMovement,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStockMovementsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const stockMovements = await stockService.getStockMovementsByProduct(productId);

    return res.status(200).json({
      success: true,
      message: "Stock movements fetched successfully",
      count: stockMovements.length,
      data: stockMovements,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStockMovementsByWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    const stockMovements = await stockService.getStockMovementsByWarehouse(warehouseId);

    return res.status(200).json({
      success: true,
      message: "Stock movements fetched successfully",
      count: stockMovements.length,
      data: stockMovements,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateStockMovement = async (req, res) => {
  try {
    const { id } = req.params;

    const stockMovement = await stockService.updateStockMovement(
      id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Stock movement updated successfully",
      data: stockMovement,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteStockMovement = async (req, res) => {
  try {
    const { id } = req.params;

    await stockService.deleteStockMovement(id);

    return res.status(200).json({
      success: true,
      message: "Stock movement deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};
