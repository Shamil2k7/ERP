import * as salonService from "./salon.service.js";

export const getSalonServices = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const services = await salonService.getSalonServices(companyId, req.query);
    return res.status(200).json({ success: true, data: services });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getSalonServiceById = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const service = await salonService.getSalonServiceById(companyId, req.params.id);
    return res.status(200).json({ success: true, data: service });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
};

export const createSalonService = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const service = await salonService.createSalonService(companyId, req.body);
    return res.status(201).json({ success: true, message: "Salon service created successfully", data: service });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const updateSalonService = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const service = await salonService.updateSalonService(companyId, req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Salon service updated successfully", data: service });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteSalonService = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    await salonService.deleteSalonService(companyId, req.params.id);
    return res.status(200).json({ success: true, message: "Salon service deleted successfully" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};
