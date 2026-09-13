import {
  getIndustriesService,
  getDefaultModulesForIndustryService,
  getAllCompaniesService,
} from "./company.service.js";

export const getIndustriesController = async (req, res) => {
  try {
    const data = await getIndustriesService();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getDefaultModulesController = async (req, res) => {
  try {
    const { code } = req.params;
    const data = await getDefaultModulesForIndustryService(code);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllCompaniesController = async (req, res) => {
  try {
    const data = await getAllCompaniesService();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
