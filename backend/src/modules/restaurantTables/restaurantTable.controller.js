import * as tableService from "./restaurantTable.service.js";

export const createTable = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      return res.status(403).json({ success: false, message: "Tenant context required." });
    }
    const table = await tableService.createTable(companyId, req.body);
    return res.status(201).json({ success: true, message: "Table created successfully", data: table });
  } catch (error) { next(error); }
};

export const getTables = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      return res.status(200).json({ success: true, data: [] });
    }
    const { restaurantId, areaId } = req.query;
    const tables = await tableService.getTables(companyId, restaurantId, areaId);
    return res.status(200).json({ success: true, data: tables });
  } catch (error) { next(error); }
};

export const getTableById = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const table = await tableService.getTableById(req.params.id, companyId);
    return res.status(200).json({ success: true, data: table });
  } catch (error) { next(error); }
};

export const updateTable = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const table = await tableService.updateTable(req.params.id, companyId, req.body);
    return res.status(200).json({ success: true, message: "Table updated successfully", data: table });
  } catch (error) { next(error); }
};

export const updateTableStatus = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const { status } = req.body;
    const table = await tableService.updateTableStatus(req.params.id, companyId, status);
    return res.status(200).json({ success: true, message: "Table status updated successfully", data: table });
  } catch (error) { next(error); }
};

export const deleteTable = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    await tableService.deleteTable(req.params.id, companyId);
    return res.status(200).json({ success: true, message: "Table deleted successfully" });
  } catch (error) { next(error); }
};
