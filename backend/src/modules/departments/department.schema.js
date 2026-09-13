import Joi from "joi";

const departmentSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Department Name is required",
    "any.required": "Department Name is required",
  }),
  code: Joi.string().trim().required().messages({
    "string.empty": "Department Code is required",
    "any.required": "Department Code is required",
  }),
  head: Joi.string().trim().allow("").optional(),
  employees: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid("ACTIVE", "INACTIVE").optional(),
});

export { departmentSchema };
