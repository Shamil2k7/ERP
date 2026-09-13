import { body } from "express-validator";

export const createSupplierValidation = [
  body("companyName")
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body("name")
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  // Custom validation to accept either companyName or name
  body().custom((value, { req }) => {
    const nameVal = (req.body.companyName || req.body.name || "").trim();
    if (!nameVal) {
      throw new Error("Supplier / Company name is required");
    }
    if (nameVal.length < 2 || nameVal.length > 150) {
      throw new Error("Supplier name must be between 2 and 150 characters");
    }
    return true;
  }),

  body("contactPerson")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Contact person cannot exceed 100 characters"),

  body("email")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!value || value.trim() === "") return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) {
        throw new Error("Invalid email address format");
      }
      return true;
    }),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must contain exactly 10 digits"),


  body("address")
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body("city")
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body("state")
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body("country")
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body("taxNumber")
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body("status")
    .optional({ nullable: true, checkFalsy: true })
    .custom((val) => {
      if (!val) return true;
      const s = String(val).toUpperCase();
      if (s !== "ACTIVE" && s !== "INACTIVE") {
        throw new Error("Status must be ACTIVE or INACTIVE");
      }
      return true;
    }),

  body("category")
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body("isTextile")
    .optional()
    .toBoolean(),
];

export const updateSupplierValidation = [
  body("companyName")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage("Company name must be between 2 and 150 characters"),

  body("name")
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body("contactPerson")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Contact person cannot exceed 100 characters"),

  body("email")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!value || value.trim() === "") return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) {
        throw new Error("Invalid email address format");
      }
      return true;
    }),

  body("phone")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must contain exactly 10 digits"),


  body("address")
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body("city")
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body("state")
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body("country")
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body("taxNumber")
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body("status")
    .optional({ nullable: true, checkFalsy: true })
    .custom((val) => {
      if (!val) return true;
      const s = String(val).toUpperCase();
      if (s !== "ACTIVE" && s !== "INACTIVE") {
        throw new Error("Status must be ACTIVE or INACTIVE");
      }
      return true;
    }),
];