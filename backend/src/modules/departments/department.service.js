import {
  getAllDepartments,
  getDepartmentById,
  getDepartmentByName,
  getDepartmentByCode,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "./department.repository.js";

const fetchAllDepartments = async () => {
  const departments = await getAllDepartments();

  return {
    success: true,
    data: departments,
  };
};

const fetchDepartmentById = async (id) => {
  const department = await getDepartmentById(id);

  if (!department) {
    throw new Error("Department not found");
  }

  return {
    success: true,
    data: department,
  };
};

const addDepartment = async (departmentData) => {
  const { name, code } = departmentData;

  const existingName = await getDepartmentByName(name);
  if (existingName) {
    throw new Error("Department Name already exists");
  }

  const existingCode = await getDepartmentByCode(code);
  if (existingCode) {
    throw new Error("Department Code already exists");
  }

  const department = await createDepartment(departmentData);

  return {
    success: true,
    message: "Department created successfully",
    data: department,
  };
};

const modifyDepartment = async (id, updateData) => {
  const existingDepartment = await getDepartmentById(id);

  if (!existingDepartment) {
    throw new Error("Department not found");
  }

  // Check for uniqueness if name or code is being updated
  if (updateData.name && updateData.name !== existingDepartment.name) {
    const existingName = await getDepartmentByName(updateData.name);
    if (existingName) {
      throw new Error("Department Name already exists");
    }
  }

  if (updateData.code && updateData.code !== existingDepartment.code) {
    const existingCode = await getDepartmentByCode(updateData.code);
    if (existingCode) {
      throw new Error("Department Code already exists");
    }
  }

  const updatedDepartment = await updateDepartment(id, updateData);

  return {
    success: true,
    message: "Department updated successfully",
    data: updatedDepartment,
  };
};

const removeDepartment = async (id) => {
  const existingDepartment = await getDepartmentById(id);

  if (!existingDepartment) {
    throw new Error("Department not found");
  }

  await deleteDepartment(id);

  return {
    success: true,
    message: "Department deleted successfully",
  };
};

export {
  fetchAllDepartments,
  fetchDepartmentById,
  addDepartment,
  modifyDepartment,
  removeDepartment,
};
