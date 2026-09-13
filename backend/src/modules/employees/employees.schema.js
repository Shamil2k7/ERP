import Joi from "joi";

const addEmployeeSchema = Joi.object({
  fullName: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      "string.empty": "Full name is required",
      "string.min": "Full name must be at least 3 characters",
      "string.max": "Full name cannot exceed 100 characters",
      "any.required": "Full name is required",
    }),

  employeeId: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Employee ID is required",
      "any.required": "Employee ID is required",
    }),

  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required()
    .messages({
      "string.email": "Invalid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),

  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.empty": "Phone number is required",
      "string.pattern.base": "Phone number must contain exactly 10 digits",
      "any.required": "Phone number is required",
    }),


  role: Joi.string()
    .required()
    .messages({
      "string.empty": "Role is required",
      "any.required": "Role is required",
    }),

  branchId: Joi.string()
    .trim()
    .allow("", null)
    .optional(),

  manufacturingUnitId: Joi.string()
    .trim()
    .allow("", null)
    .optional(),

  password: Joi.string()
    .min(6)
    .max(20)
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters",
      "string.max": "Password cannot exceed 20 characters",
      "string.empty": "Temporary password is required",
      "any.required": "Temporary password is required",
    }),

  companyId: Joi.string()
    .trim()
    .optional(),

  type: Joi.string()
    .trim()
    .optional(),

  permissions: Joi.any()
    .optional(),
});

export {
  addEmployeeSchema,
};
