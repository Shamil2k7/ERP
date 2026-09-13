import bcrypt from "bcrypt";
import crypto from "crypto";

import { sendOTPEmail } from "../../config/mail.js";
import { generateToken } from "../../config/jwt.js";
import { DEFAULT_INDUSTRY_MODULES } from "../../config/industries.js";

import {
  findUserByLogin,
  findUserByEmail,
  findUserByPhone,
  findUserByEmployeeId,
  createUser,
  findFirstCompany,
  saveOTP,
  findOTPByEmail,
  markOTPAsUsed,
  updatePassword,
  updateEmail,
} from "./auth.repository.js";

// Login
const loginService = async (login, password) => {
  const employee = await findUserByLogin(login);

  if (!employee) {
    throw new Error("Employee not found");
  }

  const passwordMatched = await bcrypt.compare(
    password,
    employee.passwordHash
  );

  if (!passwordMatched) {
    throw new Error("Invalid password");
  }

  if (!employee.isVerified) {
    throw new Error("Please verify your email first");
  }

  const rawRole = (employee.roleRef?.name || employee.role || "Employee").trim();
  const normalizedRole = rawRole.toUpperCase().replace(/\s+/g, "_");

  const token = generateToken({
    id: employee.id,
    email: employee.email,
    role: normalizedRole,
    companyId: employee.companyId || employee.company?.id || null,
  });

  const rawCodeUpper = (
    employee.company?.industry?.code || employee.type || "RETAIL"
  ).toUpperCase();
  const industryCodeUpper = rawCodeUpper.includes("GYM")
    ? "GYM"
    : rawCodeUpper.includes("TEXTILE")
    ? "TEXTILE"
    : rawCodeUpper.includes("RESTAURANT")
    ? "RESTAURANT"
    : rawCodeUpper.includes("LAUNDRY")
    ? "LAUNDRY"
    : rawCodeUpper.includes("MEDICAL")
    ? "MEDICAL_SHOP"
    : rawCodeUpper;

  const companyModules =
    employee.company?.modules
      ?.filter((cm) => cm.enabled)
      .map((cm) => cm.module.code) || [];

  const defaultCodes =
    DEFAULT_INDUSTRY_MODULES[industryCodeUpper] ||
    DEFAULT_INDUSTRY_MODULES.RETAIL;

  let enabledModuleCodes = companyModules.length > 0 ? companyModules : defaultCodes;
  if (employee.permissions) {
    try {
      const parsed = JSON.parse(employee.permissions);
      if (Array.isArray(parsed) && parsed.length > 0) {
        enabledModuleCodes = parsed;
      }
    } catch (e) {
      if (typeof employee.permissions === "string" && employee.permissions.trim().length > 0) {
        enabledModuleCodes = employee.permissions.split(",").map((s) => s.trim().toUpperCase());
      }
    }
  }

  // If Laundry industry, apply strictly role-based permissions

  if (industryCodeUpper === "LAUNDRY" && !normalizedRole.includes("SUPER") && !normalizedRole.includes("ADMIN")) {
    const { getLaundryRoleModules } = await import("../../config/laundryPermissions.js");
    enabledModuleCodes = getLaundryRoleModules(normalizedRole);
  }

  // If Restaurant industry, apply default role-based modules
  if (industryCodeUpper === "RESTAURANT" && !normalizedRole.includes("SUPER") && !normalizedRole.includes("ADMIN")) {
    if (normalizedRole.includes("MANAGER")) {
      enabledModuleCodes = [
        "DASHBOARD",
        "RESTAURANT",
        "PRODUCTS",
        "CATEGORIES",
        "BRANDS",
        "UNITS",
        "INVENTORY",
        "SUPPLIERS",
        "EMPLOYEES",
        "REPORTS",
        "SETTINGS",
      ];
    } else if (normalizedRole.includes("CASHIER")) {
      enabledModuleCodes = ["DASHBOARD", "RESTAURANT", "POS", "SALES", "ORDERS", "CUSTOMERS", "INVOICES"];
    } else if (normalizedRole.includes("WAITER") || normalizedRole.includes("STEWARD") || normalizedRole.includes("SERVER")) {
      enabledModuleCodes = ["RESTAURANT", "POS", "TABLES", "RESERVATIONS", "ORDERS"];
    } else if (normalizedRole.includes("KITCHEN") || normalizedRole.includes("CHEF") || normalizedRole.includes("COOK")) {
      enabledModuleCodes = ["RESTAURANT", "KITCHEN", "KDS"];
    }
  }


  return {
    success: true,
    message: "Login successful",
    token,
    user: {
      id: employee.id,
      fullName: employee.fullName,
      email: employee.email,
      employeeId: employee.employeeId,
      phone: employee.phone,
      role: normalizedRole,
      type: industryCodeUpper,
      companyId: employee.companyId || employee.company?.id || null,
    },
    company: {
      id: employee.company?.id || null,
      name: employee.company?.name || "ERP Enterprise",
      industry: {
        code: industryCodeUpper,
        name:
          employee.company?.industry?.name ||
          (industryCodeUpper === "GYM"
            ? "Gym"
            : industryCodeUpper === "TEXTILE"
            ? "Textile"
            : industryCodeUpper === "RESTAURANT"
            ? "Restaurant"
            : industryCodeUpper === "LAUNDRY"
            ? "Laundry"
            : industryCodeUpper === "MEDICAL_SHOP"
            ? "Medical Shop / Pharmacy"
            : "Retail"),
      },
    },
    modules: enabledModuleCodes,
    permissions: [
      "DASHBOARD_VIEW",
      "PRODUCTS_VIEW",
      "MEMBERS_VIEW",
      "MEMBERS_CREATE",
      "MEMBERS_EDIT",
      "PAYMENTS_VIEW",
      "PAYMENTS_COLLECT",
      "ATTENDANCE_VIEW",
      "ATTENDANCE_CHECKIN",
    ],
  };
};

// Change Password
const changePasswordService = async (
  email,
  currentPassword,
  newPassword
) => {
  const employee = await findUserByEmail(email);

  if (!employee) {
    throw new Error("Employee not found");
  }

  const passwordMatched = await bcrypt.compare(
    currentPassword,
    employee.passwordHash
  );

  if (!passwordMatched) {
    throw new Error("Current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(
    newPassword,
    10
  );

  await updatePassword(email, passwordHash);

  return {
    success: true,
    message: "Password changed successfully",
  };
};

// Forgot Password
const forgotPasswordService = async (email) => {
  const employee = await findUserByEmail(email);

  if (!employee) {
    throw new Error("Employee not found");
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  const expiresAt = new Date(
    Date.now() + 5 * 60 * 1000
  );

  await saveOTP({
    email,
    otp,
    expiresAt,
  });

  await sendOTPEmail(email, otp);

  return {
    success: true,
    message: "OTP sent successfully",
  };
};

// Verify Reset OTP
const verifyResetOTPService = async (email, otp) => {
  const savedOTP = await findOTPByEmail(email);

  if (!savedOTP) {
    throw new Error("OTP not found");
  }

  if (savedOTP.isUsed) {
    throw new Error("OTP already used");
  }

  if (savedOTP.expiresAt < new Date()) {
    throw new Error("OTP expired");
  }

  if (savedOTP.otp !== otp) {
    throw new Error("Invalid OTP");
  }

  await markOTPAsUsed(savedOTP.id);

  return {
    success: true,
    message: "OTP verified successfully",
  };
};

// Reset Password
const resetPasswordService = async (
  email,
  password
) => {
  const employee = await findUserByEmail(email);

  if (!employee) {
    throw new Error("Employee not found");
  }

  const passwordHash = await bcrypt.hash(
    password,
    10
  );

  await updatePassword(email, passwordHash);

  return {
    success: true,
    message: "Password reset successfully",
  };
};

// Change Email
const changeEmailService = async (currentEmail, password, newEmail) => {
  const employee = await findUserByEmail(currentEmail);

  if (!employee) {
    throw new Error("Employee not found");
  }

  const passwordMatched = await bcrypt.compare(
    password,
    employee.passwordHash
  );

  if (!passwordMatched) {
    throw new Error("Password is incorrect");
  }

  const cleanNewEmail = newEmail.trim().toLowerCase();

  // Check new email not already taken
  const emailTaken = await findUserByEmail(cleanNewEmail);
  if (emailTaken) {
    throw new Error("This email is already in use");
  }

  await updateEmail(currentEmail, cleanNewEmail);

  return {
    success: true,
    message: "Email updated successfully",
    newEmail: cleanNewEmail,
  };
};

// Get Current User Profile
const getMeService = async (user) => {
  if (!user) {
    throw new Error("User context not found");
  }

  return {
    success: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
      companyId: user.companyId,
      branchId: user.branchId,
      type: user.industryCode || "RETAIL",
    },
    company: {
      id: user.companyId,
      name: user.companyName,
      industry: {
        code: user.industryCode,
        name: user.industryName,
      },
    },
    modules: user.enabledModules || [],
    permissions: user.permissions || [],
  };
};

// Send Registration OTP
const sendRegistrationOTP = async (email) => {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error("Email is required");
  }

  const existing = await findUserByEmail(cleanEmail);
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await saveOTP({
    email: cleanEmail,
    otp,
    expiresAt,
  });

  await sendOTPEmail(cleanEmail, otp);

  return {
    success: true,
    message: "Verification OTP sent to your email",
  };
};

// Verify Registration OTP
const verifyRegistrationOTP = async (email, otp) => {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanOtp = (otp || "").trim();

  const savedOTP = await findOTPByEmail(cleanEmail);
  if (!savedOTP) {
    throw new Error("No pending OTP found for this email");
  }

  if (savedOTP.isUsed) {
    throw new Error("OTP already used");
  }

  if (savedOTP.expiresAt < new Date()) {
    throw new Error("OTP has expired. Please request a new one");
  }

  if (savedOTP.otp !== cleanOtp) {
    throw new Error("Invalid OTP");
  }

  await markOTPAsUsed(savedOTP.id);

  return {
    success: true,
    message: "Email verified successfully",
  };
};

// Signup / Register New User
const signupService = async ({ email, phone, password, employeeId, fullName }) => {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPhone = (phone || "").trim();
  const cleanEmpId = employeeId ? employeeId.trim() : null;

  if (!cleanEmail || !password) {
    throw new Error("Email and password are required");
  }

  const existingEmail = await findUserByEmail(cleanEmail);
  if (existingEmail) {
    throw new Error("An account with this email already exists");
  }

  if (cleanPhone) {
    const existingPhone = await findUserByPhone(cleanPhone);
    if (existingPhone) {
      throw new Error("Phone number already in use");
    }
  }

  if (cleanEmpId) {
    const existingEmp = await findUserByEmployeeId(cleanEmpId);
    if (existingEmp) {
      throw new Error("Employee ID already in use");
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const defaultCompany = await findFirstCompany();

  const newUser = await createUser({
    email: cleanEmail,
    phone: cleanPhone || `N/A-${Date.now()}`,
    passwordHash,
    employeeId: cleanEmpId,
    fullName: fullName || cleanEmail.split("@")[0],
    isVerified: true,
    role: "EMPLOYEE",
    type: defaultCompany?.industry?.code || "RETAIL",
    companyId: defaultCompany?.id || null,
  });

  const token = generateToken({
    id: newUser.id,
    email: newUser.email,
    role: newUser.role || "EMPLOYEE",
    companyId: newUser.companyId || null,
  });

  return {
    success: true,
    message: "Account registered successfully",
    token,
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      employeeId: newUser.employeeId,
      phone: newUser.phone,
      role: newUser.role,
      type: newUser.type,
      companyId: newUser.companyId,
    },
  };
};

export {
  loginService,
  changePasswordService,
  changeEmailService,
  forgotPasswordService,
  verifyResetOTPService,
  resetPasswordService,
  getMeService,
  sendRegistrationOTP,
  verifyRegistrationOTP,
  signupService,
};