import { body } from "express-validator";

export const updateLandingPageValidation = [
  body("logoText")
    .optional()
    .trim(),

  body("logoHighlight")
    .optional()
    .trim(),

  body("heroTitle")
    .optional()
    .trim(),

  body("heroDescription")
    .optional()
    .trim(),

  body("footerText")
    .optional()
    .trim(),
];
