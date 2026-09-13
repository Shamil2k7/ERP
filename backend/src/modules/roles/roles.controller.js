import {
  fetchAllRoles,
  fetchRoleById,
  addRole,
  modifyRole,
  removeRole,
} from "./roles.service.js";

const getRoles = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.query.companyId;
    const result = await fetchAllRoles(companyId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getRole = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await fetchRoleById(id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const createRole = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const result = await addRole({
      ...req.body,
      companyId: companyId || req.body.companyId,
    });
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await modifyRole(id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await removeRole(id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
};
