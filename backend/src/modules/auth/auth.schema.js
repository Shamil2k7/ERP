import Joi from "joi";

// Login
const loginSchema = Joi.object({
  login: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Email or Employee ID is required",
      "any.required": "Email or Employee ID is required",
    }),

  password: Joi.string()
    .required()
    .messages({
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
});

// Change Password
const changePasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Invalid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),

  currentPassword: Joi.string()
    .required()
    .messages({
      "string.empty": "Current password is required",
      "any.required": "Current password is required",
    }),

  newPassword: Joi.string()
    .min(8)
    .max(20)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters",
      "string.max": "Password cannot exceed 20 characters",
      "string.empty": "New password is required",
      "any.required": "New password is required",
    }),
});

// Forgot Password
const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Invalid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
});

// Verify Reset OTP
const verifyResetOTPSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Invalid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),

  otp: Joi.string()
    .length(6)
    .required()
    .messages({
      "string.length": "OTP must be 6 digits",
      "string.empty": "OTP is required",
      "any.required": "OTP is required",
    }),
});

// Reset Password
const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Invalid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),

  password: Joi.string()
    .min(8)
    .max(20)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters",
      "string.max": "Password cannot exceed 20 characters",
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
});

export {
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  verifyResetOTPSchema,
  resetPasswordSchema,
};