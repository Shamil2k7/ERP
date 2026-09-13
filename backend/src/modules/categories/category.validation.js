import { body } from "express-validator";

export const createCategoryValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters"),

  body("code")
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage("Category code must be between 1 and 20 characters"),

  body("description")
    .optional()
    .trim(),

  body("image")
    .optional()
    .custom((value) => {
      if (!value) return true;

      // Accept URL
      const isUrl = /^https?:\/\/.+/i.test(value);

      // Accept local upload path
      const isUploadPath =
        value.startsWith("/uploads/") ||
        value.startsWith("uploads/");

      if (isUrl || isUploadPath) {
        return true;
      }

      throw new Error(
        "Image must be a valid URL or uploaded image path"
      );
    }),

  body("status")
    .optional()
    .isIn(["ACTIVE", "INACTIVE"])
    .withMessage("Status must be ACTIVE or INACTIVE"),
];

export const updateCategoryValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters"),

  body("code")
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage("Category code must be between 2 and 20 characters"),

  body("description")
    .optional()
    .trim(),

  body("image")
    .optional()
    .custom((value) => {
      if (!value) return true;

      // Accept URL
      const isUrl = /^https?:\/\/.+/i.test(value);

      // Accept local upload path
      const isUploadPath =
        value.startsWith("/uploads/") ||
        value.startsWith("uploads/");

      if (isUrl || isUploadPath) {
        return true;
      }

      throw new Error(
        "Image must be a valid URL or uploaded image path"
      );
    }),

  body("status")
    .optional()
    .isIn(["ACTIVE", "INACTIVE"])
    .withMessage("Status must be ACTIVE or INACTIVE"),
];