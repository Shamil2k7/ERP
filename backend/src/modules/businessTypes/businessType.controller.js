import {
  fetchAllBusinessTypes,
  fetchBusinessTypeById,
  addBusinessType,
  modifyBusinessType,
  removeBusinessType,
} from "./businessType.service.js";

const getBusinessTypes = async (req, res) => {
  try {
    const result = await fetchAllBusinessTypes();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getBusinessType = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await fetchBusinessTypeById(id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

const createBusinessType = async (req, res) => {
  try {
    const result = await addBusinessType(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateBusinessType = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await modifyBusinessType(id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const deleteBusinessType = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await removeBusinessType(id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export {
  getBusinessTypes,
  getBusinessType,
  createBusinessType,
  updateBusinessType,
  deleteBusinessType,
};
