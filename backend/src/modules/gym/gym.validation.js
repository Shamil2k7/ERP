import { body } from "express-validator";

export const createGymMemberValidation = [
  body("fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .trim(),

  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must contain exactly 10 digits"),

  body("email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("membershipPlanId")
    .notEmpty()
    .withMessage("Membership plan is required")
    .isUUID()
    .withMessage("Invalid membership plan ID"),

  body("assignedTrainerId")
    .notEmpty()
    .withMessage("Assigned trainer is required")
    .isUUID()
    .withMessage("Invalid trainer ID"),

  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Invalid start date format"),

  body("expiryDate")
    .notEmpty()
    .withMessage("Expiry date is required")
    .isISO8601()
    .withMessage("Invalid expiry date format"),

  body("joinDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Invalid join date format"),

  body("dob")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Invalid date of birth format"),

  body("status")
    .optional({ checkFalsy: true })
    .isIn(["ACTIVE", "INACTIVE", "EXPIRED", "FROZEN"])
    .withMessage("Invalid status value"),
];

export const updateGymMemberValidation = [
  body("fullName")
    .optional()
    .notEmpty()
    .withMessage("Full name cannot be empty")
    .trim(),

  body("phone")
    .optional()
    .notEmpty()
    .withMessage("Phone number cannot be empty")
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must contain exactly 10 digits"),

  body("email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("membershipPlanId")
    .optional()
    .notEmpty()
    .withMessage("Membership plan ID cannot be empty")
    .isUUID()
    .withMessage("Invalid membership plan ID"),

  body("assignedTrainerId")
    .optional()
    .notEmpty()
    .withMessage("Assigned trainer ID cannot be empty")
    .isUUID()
    .withMessage("Invalid trainer ID"),

  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid start date format"),

  body("expiryDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid expiry date format"),

  body("joinDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Invalid join date format"),

  body("dob")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Invalid date of birth format"),

  body("status")
    .optional()
    .isIn(["ACTIVE", "INACTIVE", "EXPIRED", "FROZEN"])
    .withMessage("Invalid status value"),
];

export const createGymPlanValidation = [
  body("name")
    .notEmpty()
    .withMessage("Plan name is required")
    .trim(),

  body("durationMonths")
    .notEmpty()
    .withMessage("Duration in months is required")
    .isInt({ min: 1 })
    .withMessage("Duration must be at least 1 month"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be 0 or greater"),
];

export const createGymTrainerValidation = [
  body("name")
    .notEmpty()
    .withMessage("Trainer name is required")
    .trim(),

  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must contain exactly 10 digits"),
];


export const recordAttendanceValidation = [
  body("memberId")
    .notEmpty()
    .withMessage("Member ID is required"),
];

export const createGymPaymentValidation = [
  body("memberId")
    .notEmpty()
    .withMessage("Member ID is required"),

  body("amount")
    .notEmpty()
    .withMessage("Payment amount is required")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be greater than 0"),
];
