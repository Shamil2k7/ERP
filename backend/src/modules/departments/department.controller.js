import {
  fetchAllDepartments,
  fetchDepartmentById,
  addDepartment,
  modifyDepartment,
  removeDepartment,
} from "./department.service.js";

const getDepartments = async (req, res) => {
  try {
    const result = await fetchAllDepartments();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await fetchDepartmentById(id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const createDepartment = async (req, res) => {
  try {
    const result = await addDepartment(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await modifyDepartment(id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await removeDepartment(id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
