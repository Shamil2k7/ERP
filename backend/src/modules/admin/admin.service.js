import bcrypt from "bcrypt";
import { sendAdminCredentialsEmail } from "../../config/mail.js";
import { validatePhoneNumber, cleanPhoneNumber } from "../../utils/phoneValidator.js";

import {
  findUserByEmail,
  findUserByPhone,
  findAdminRole,
  createAdmin,
  getAllAdmins,
  getAdminById,
  deleteAdmin,
} from "./admin.repository.js";

import prisma from "../../config/prisma.js";
import { DEFAULT_INDUSTRY_MODULES } from "../../config/industries.js";

// CREATE ADMIN / CREATE CLIENT
export const createAdminService = async ({
  name,
  companyName,
  email,
  phone,
  password,
  type,
  enabledModules,
}) => {
  const cleanedPhone = cleanPhoneNumber(phone);
  if (!validatePhoneNumber(cleanedPhone, true)) {
    throw new Error("Phone number must contain exactly 10 digits");
  }

  // Check email
  const existingEmail = await findUserByEmail(email);
  if (existingEmail) {
    throw new Error("Email already exists");
  }

  // Check phone
  const existingPhone = await findUserByPhone(cleanedPhone);
  if (existingPhone) {
    throw new Error("Phone number already exists");
  }


  // Find or create ADMIN role
  const adminRole = await findAdminRole();

  // Find or determine Industry
  const typeUpper = (type || "RETAIL").toUpperCase();
  let industry = await prisma.industry.findUnique({
    where: { code: typeUpper },
  });

  let industryCodeUpper = typeUpper;

  if (!industry) {
    industryCodeUpper = typeUpper.includes("GYM")
      ? "GYM"
      : typeUpper.includes("TEXTILE")
      ? "TEXTILE"
      : typeUpper.includes("RESTAURANT")
      ? "RESTAURANT"
      : typeUpper.includes("LAUNDRY")
      ? "LAUNDRY"
      : typeUpper.includes("MEDICAL")
      ? "MEDICAL_SHOP"
      : "RETAIL";

    industry = await prisma.industry.findUnique({
      where: { code: industryCodeUpper },
    });

    if (!industry) {
      industry = await prisma.industry.create({
        data: {
          code: industryCodeUpper,
          name:
            industryCodeUpper === "GYM"
              ? "Gym"
              : industryCodeUpper === "TEXTILE"
              ? "Textile"
              : industryCodeUpper === "RESTAURANT"
              ? "Restaurant"
              : industryCodeUpper === "LAUNDRY"
              ? "Laundry"
              : industryCodeUpper === "MEDICAL_SHOP"
              ? "Medical Shop / Pharmacy"
              : "Retail",
          status: true,
        },
      });
    }
  }

  // Create Company
  const finalCompanyName = (companyName || "").trim() || `${name}'s Company`;
  const company = await prisma.company.create({
    data: {
      name: finalCompanyName,
      industryId: industry?.id || null,
      status: "ACTIVE",
    },
  });

  // Determine enabled modules
  let moduleCodesToEnable = enabledModules;
  if (!moduleCodesToEnable || moduleCodesToEnable.length === 0) {
    moduleCodesToEnable =
      DEFAULT_INDUSTRY_MODULES[industryCodeUpper] ||
      DEFAULT_INDUSTRY_MODULES.RETAIL;
  }

  // Fetch target module records
  const allModules = await prisma.module.findMany({
    where: { code: { in: moduleCodesToEnable } },
  });

  if (allModules.length > 0 && company?.id) {
    await prisma.companyModule.createMany({
      data: allModules.map((m) => ({
        companyId: company.id,
        moduleId: m.id,
        enabled: true,
      })),
      skipDuplicates: true,
    });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Generate unique employee ID
  const generateUniqueAdminId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `ADM-${timestamp}-${random}`;
  };

  let generatedId = generateUniqueAdminId();

  // Create admin
  const admin = await createAdmin({
    fullName: name,
    email,
    phone,
    employeeId: generatedId,
    passwordHash,
    plainPassword: password,

    // Fixed role
    role: "ADMIN",

    // Role table relation
    roleId: adminRole?.id || null,

    // Business type / Industry code
    type: industryCodeUpper,

    // Company Link
    companyId: company?.id || null,

    isVerified: true,
    firstLogin: true,
  });

  // Send credentials email to the new admin
  sendAdminCredentialsEmail(email, generatedId, name, password, industryCodeUpper).catch(
    (err) => console.error("Admin Email Error:", err.message)
  );

  // Remove sensitive fields
  const {
    passwordHash: removedPassword,
    plainPassword: removedPlain,
    verificationToken,
    verificationExpires,
    ...safeAdmin
  } = admin;

  return safeAdmin;
};


// GET ALL ADMINS
export const getAllAdminsService = async () => {
  const admins = await getAllAdmins();

  return admins.map((admin) => {
    const {
      passwordHash,
      plainPassword,
      verificationToken,
      verificationExpires,
      ...safeAdmin
    } = admin;

    return safeAdmin;
  });
};


// GET ADMIN BY ID
export const getAdminByIdService = async (id) => {
  const admin = await getAdminById(id);

  if (!admin) {
    throw new Error("Admin not found");
  }

  const {
    passwordHash,
    plainPassword,
    verificationToken,
    verificationExpires,
    ...safeAdmin
  } = admin;

  return safeAdmin;
};


// DELETE ADMIN
export const deleteAdminService = async (id) => {
  const admin = await getAdminById(id);

  if (!admin) {
    throw new Error("Admin not found");
  }

  await deleteAdmin(id);

  return {
    message: "Admin deleted successfully",
  };
};