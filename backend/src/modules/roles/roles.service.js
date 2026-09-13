import {
  getAllRoles,
  getRoleById,
  getRoleByName,
  createRole,
  updateRole,
  deleteRole,
  unassignUsersFromRole,
} from "./roles.repository.js";

const fetchAllRoles = async (companyId) => {
  const roles = await getAllRoles(companyId);
  return {
    success: true,
    data: roles,
  };
};

const fetchRoleById = async (id) => {
  const role = await getRoleById(id);
  if (!role) {
    throw new Error("Role not found");
  }
  return {
    success: true,
    data: role,
  };
};

const addRole = async (roleData) => {
  const { name } = roleData;

  if (!name || !name.trim()) {
    throw new Error("Role name is required");
  }

  const existingRole = await getRoleByName(name);
  if (existingRole) {
    throw new Error("Role name already exists");
  }

  const role = await createRole({
    name,
    isTextile: roleData.isTextile === true || roleData.category === "TEXTILE",
    category: roleData.category || (roleData.isTextile ? "TEXTILE" : "RETAIL"),
    companyId: roleData.companyId || null,
  });

  return {
    success: true,
    message: "Role created successfully",
    data: role,
  };
};

const modifyRole = async (id, updateData) => {
  const existingRole = await getRoleById(id);
  if (!existingRole) {
    throw new Error("Role not found");
  }

  if (updateData.name && updateData.name.trim().toLowerCase() !== existingRole.name.toLowerCase()) {
    const existingName = await getRoleByName(updateData.name);
    if (existingName && existingName.id !== id) {
      throw new Error("Role name already exists");
    }
  }

  const updatedRole = await updateRole(id, updateData);

  return {
    success: true,
    message: "Role updated successfully",
    data: updatedRole,
  };
};

const removeRole = async (id) => {
  const existingRole = await getRoleById(id);
  if (!existingRole) {
    throw new Error("Role not found");
  }

  // Safely unassign any employees/users assigned to this role first
  await unassignUsersFromRole(id);

  await deleteRole(id);

  return {
    success: true,
    message: "Role deleted successfully",
  };
};

export {
  fetchAllRoles,
  fetchRoleById,
  addRole,
  modifyRole,
  removeRole,
};
