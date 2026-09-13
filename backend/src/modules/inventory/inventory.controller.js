import * as inventoryService from "./inventory.service.js";

export const createInventory = async (req, res) => {
  try {
    const inventory = await inventoryService.createInventory(req.body);

    return res.status(201).json({
      success: true,
      message: "Inventory created successfully",
      data: inventory,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllInventories = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;
    const inventories = await inventoryService.getAllInventories(companyId);

    return res.status(200).json({
      success: true,
      message: "Inventories fetched successfully",
      count: inventories.length,
      data: inventories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const inventory = await inventoryService.getInventoryById(id);

    return res.status(200).json({
      success: true,
      message: "Inventory fetched successfully",
      data: inventory,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInventoryByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const inventories = await inventoryService.getInventoryByProduct(
      productId
    );

    return res.status(200).json({
      success: true,
      message: "Inventory fetched successfully",
      count: inventories.length,
      data: inventories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInventoryByWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    const inventories = await inventoryService.getInventoryByWarehouse(
      warehouseId
    );

    return res.status(200).json({
      success: true,
      message: "Inventory fetched successfully",
      count: inventories.length,
      data: inventories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;

    const inventory = await inventoryService.updateInventory(
      id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      data: inventory,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;

    await inventoryService.deleteInventory(id);

    return res.status(200).json({
      success: true,
      message: "Inventory deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};