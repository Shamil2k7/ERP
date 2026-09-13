import * as superAdminService from "./superAdmin.service.js";

export const getSystemStats = async (req, res) => {
  try {
    const stats = await superAdminService.getSystemStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllCompanies = async (req, res) => {
  try {
    const companies = await superAdminService.getAllCompanies(req.query);
    return res.status(200).json({ success: true, data: companies });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleCompanyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const company = await superAdminService.toggleCompanyStatus(id, status);
    return res.status(200).json({ success: true, message: "Company status updated", data: company });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};
