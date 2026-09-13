import {
  findAllBusinessTypes,
  findBusinessTypeById,
  createBusinessType,
  updateBusinessType,
  deleteBusinessType,
} from "./businessType.repository.js";

const fetchAllBusinessTypes = async () => {
  const data = await findAllBusinessTypes();
  return { success: true, data };
};

const fetchBusinessTypeById = async (id) => {
  const data = await findBusinessTypeById(id);
  if (!data) throw new Error("Business Type not found");
  return { success: true, data };
};

const addBusinessType = async (payload) => {
  const { name, code, description, status } = payload;
  const data = await createBusinessType({
    name: name.trim(),
    code: code.trim().toUpperCase(),
    description: description ? description.trim() : null,
    status: status || "ACTIVE",
  });
  return { success: true, data, message: "Business Type created successfully" };
};

const modifyBusinessType = async (id, payload) => {
  const { name, code, description, status } = payload;
  const data = await updateBusinessType(id, {
    name: name.trim(),
    code: code.trim().toUpperCase(),
    description: description ? description.trim() : null,
    status: status || "ACTIVE",
  });
  return { success: true, data, message: "Business Type updated successfully" };
};

const removeBusinessType = async (id) => {
  await deleteBusinessType(id);
  return { success: true, message: "Business Type deleted successfully" };
};

export {
  fetchAllBusinessTypes,
  fetchBusinessTypeById,
  addBusinessType,
  modifyBusinessType,
  removeBusinessType,
};
