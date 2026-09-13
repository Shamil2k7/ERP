import * as warehouseService from "./warehouse.service.js";

export const createWarehouse = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const warehouse = await warehouseService.createWarehouse({
      ...req.body,
      companyId: companyId || req.body.companyId,
    });

    return res.status(201).json({
      success: true,
      message: "Warehouse created successfully",
      data: warehouse,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllWarehouses = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;
    const warehouses = await warehouseService.getAllWarehouses(companyId);

    return res.status(200).json({
      success: true,
      message: "Warehouses fetched successfully",
      count: warehouses.length,
      data: warehouses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;

    const warehouse = await warehouseService.getWarehouseById(id);

    return res.status(200).json({
      success: true,
      message: "Warehouse fetched successfully",
      data: warehouse,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const searchWarehouses = async (req, res) => {
  try {
    const { search } = req.query;

    const warehouses = await warehouseService.searchWarehouses(
      search || ""
    );

    return res.status(200).json({
      success: true,
      message: "Warehouses fetched successfully",
      count: warehouses.length,
      data: warehouses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;

    const warehouse = await warehouseService.updateWarehouse(
      id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Warehouse updated successfully",
      data: warehouse,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;

    await warehouseService.deleteWarehouse(id);

    return res.status(200).json({
      success: true,
      message: "Warehouse deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};
