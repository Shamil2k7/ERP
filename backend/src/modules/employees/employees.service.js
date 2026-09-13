import bcrypt from "bcrypt";
import prisma from "../../config/prisma.js";
import { validatePhoneNumber, cleanPhoneNumber } from "../../utils/phoneValidator.js";

import {
  sendEmployeeCredentialsEmail,
  sendEmployeeUpdatedEmail,
} from "../../config/mail.js";

import { recordAuditLog } from "../audit/audit.service.js";

const isUuid = (str) => {
  if (typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

import {
  getAllEmployees,
  getEmployeeById,
  findEmployeeByEmail,
  findEmployeeByEmployeeId,
  findEmployeeByPhone,
  findRoleById,
  findRoleByName,
  createRoleInRepo,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "./employees.repository.js";


// Remove sensitive fields before sending employee data to frontend
const removeSensitiveFields = (employee) => {
  if (!employee) {
    return employee;
  }

  const {
    passwordHash,
    plainPassword,
    verificationToken,
    verificationExpires,
    ...safeEmployee
  } = employee;

  return safeEmployee;
};


// Get all employees
const fetchAllEmployees = async (companyId, type) => {
  const employees = await getAllEmployees(companyId, type);

  return {
    success: true,
    data: employees.map(removeSensitiveFields),
  };
};


// Get employee by ID
const fetchEmployeeById = async (id) => {
  const employee = await getEmployeeById(id);

  if (!employee) {
    throw new Error("Employee not found");
  }

  return {
    success: true,
    data: removeSensitiveFields(employee),
  };
};


// Add employee
const addEmployee = async (
  {
    fullName,
    employeeId,
    email,
    phone,
    role,
    password,
    branchId,
  },
  req
) => {

  // Basic validation
  if (
    !fullName ||
    !employeeId ||
    !email ||
    !phone ||
    !role ||
    !password ||
    !branchId
  ) {
    throw new Error("All employee fields are required");
  }


  // Clean input
  const cleanFullName = fullName.trim();
  const cleanEmployeeId = employeeId.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim();
  const cleanRole = role.trim();

  // Role Hierarchy & Security Validation
  const callerRole = (req?.user?.role || req?.user?.roleRef?.name || "").trim().toUpperCase();
  const industryCode = (req?.user?.company?.industry?.code || req?.user?.type || req?.body?.type || "RETAIL").trim().toUpperCase();
  const isRetail = !industryCode.includes("RESTAURANT") && !industryCode.includes("TEXTILE") && !industryCode.includes("GYM") && !industryCode.includes("LAUNDRY") && !industryCode.includes("SALON") && !industryCode.includes("MEDICAL");

  let requestedRoleName = cleanRole;
  if (isUuid(cleanRole)) {
    const rById = await findRoleById(cleanRole);
    if (rById) requestedRoleName = rById.name;
  } else {
    const rByName = await findRoleByName(cleanRole);
    if (rByName) requestedRoleName = rByName.name;
  }

  const reqRoleUpper = (requestedRoleName || "").toUpperCase().replace(/[\s_-]+/g, " ").trim();

  const isLaundry = industryCode.includes("LAUNDRY");

  if (isRetail) {
    const isSuperAdmin = callerRole.includes("SUPER");
    const isAdmin = !isSuperAdmin && callerRole.includes("ADMIN");
    const isStoreManager = !isSuperAdmin && !isAdmin && (callerRole.includes("MANAGER") || callerRole.includes("STORE MANAGER") || callerRole.includes("STORE_MANAGER"));

    const adminAllowedRoles = [
      "STORE MANAGER",
      "MANAGER",
      "CASHIER",
      "INVENTORY MANAGER",
      "PURCHASE MANAGER",
      "ACCOUNTANT",
    ];

    const managerAllowedRoles = [
      "CASHIER",
      "INVENTORY MANAGER",
      "PURCHASE MANAGER",
      "ACCOUNTANT",
    ];

    if (isStoreManager) {
      const isAllowed = managerAllowedRoles.some(
        (allowed) => reqRoleUpper === allowed || reqRoleUpper === allowed.replace(" ", "_")
      );
      if (!isAllowed) {
        const error = new Error("403 Forbidden: Store Managers are only permitted to assign subordinate roles (Cashier, Inventory Manager, Purchase Manager, Accountant).");
        error.status = 403;
        error.statusCode = 403;
        throw error;
      }
    } else if (isAdmin) {
      const isAllowed = adminAllowedRoles.some(
        (allowed) => reqRoleUpper === allowed || reqRoleUpper === allowed.replace(" ", "_")
      );
      if (!isAllowed) {
        const error = new Error("403 Forbidden: Admins are not permitted to register or assign Admin/Super Admin roles.");
        error.status = 403;
        error.statusCode = 403;
        throw error;
      }
    }
  } else if (isLaundry) {
    const isSuperAdmin = callerRole.includes("SUPER");
    const isAdmin = !isSuperAdmin && callerRole.includes("ADMIN");
    const isLaundryManager = !isSuperAdmin && !isAdmin && (callerRole.includes("MANAGER") || callerRole.includes("LAUNDRY MANAGER") || callerRole.includes("LAUNDRY_MANAGER"));

    const adminAllowedRoles = [
      "MANAGER",
      "LAUNDRY MANAGER",
      "CASHIER",
      "PROCESSING STAFF",
      "DELIVERY DRIVER",
    ];

    const managerAllowedRoles = [
      "CASHIER",
      "PROCESSING STAFF",
      "DELIVERY DRIVER",
    ];

    if (isLaundryManager) {
      const isAllowed = managerAllowedRoles.some(
        (allowed) => reqRoleUpper === allowed || reqRoleUpper === allowed.replace(" ", "_")
      );
      if (!isAllowed) {
        const error = new Error("403 Forbidden: Laundry Managers are only permitted to assign subordinate staff roles (Cashier, Processing Staff, Delivery Driver).");
        error.status = 403;
        error.statusCode = 403;
        throw error;
      }
    } else if (isAdmin) {
      const isAllowed = adminAllowedRoles.some(
        (allowed) => reqRoleUpper === allowed || reqRoleUpper === allowed.replace(" ", "_")
      );
      if (!isAllowed) {
        const error = new Error("403 Forbidden: Admins are not permitted to register or assign Admin/Super Admin roles.");
        error.status = 403;
        error.statusCode = 403;
        throw error;
      }
    }
  } else {
    if (callerRole.includes("ADMIN") || callerRole.includes("MANAGER")) {
      if (reqRoleUpper.includes("ADMIN") || reqRoleUpper.includes("SUPER")) {
        const error = new Error("403 Forbidden: Admins/Managers are not permitted to register or assign Admin/Super Admin roles.");
        error.status = 403;
        error.statusCode = 403;
        throw error;
      }
    }
  }

  // Check email
  const existingEmail = await findEmployeeByEmail(cleanEmail);

  if (existingEmail) {
    throw new Error("Email already exists");
  }

  // Check employee ID
  const existingEmployeeId =
    await findEmployeeByEmployeeId(cleanEmployeeId);

  if (existingEmployeeId) {
    throw new Error("Employee ID already exists");
  }

  // Check phone
  const existingPhone =
    await findEmployeeByPhone(cleanPhone);

  if (existingPhone) {
    throw new Error("Phone number already exists");
  }

  // Check role: lookup by ID, then by Name. If missing, create role in DB!
  let employeeRole = null;
  if (isUuid(cleanRole)) {
    employeeRole = await findRoleById(cleanRole);
  }

  if (!employeeRole) {
    employeeRole = await findRoleByName(cleanRole);
  }

  if (!employeeRole) {
    employeeRole = await createRoleInRepo(cleanRole);
  }

  // Hash password and store the plain text for future reference
  const passwordHash = await bcrypt.hash(password, 12);

  let assignedBranchId = null;
  const effectiveUnitId = req?.body?.manufacturingUnitId || req?.body?.branchId || branchId;

  if (effectiveUnitId) {
    const OR = [];
    if (isUuid(effectiveUnitId)) {
      OR.push({ id: effectiveUnitId });
    }
    OR.push({ code: effectiveUnitId });
    OR.push({ name: { equals: effectiveUnitId, mode: "insensitive" } });

    const dbBranch = await prisma.branch.findFirst({
      where: { OR }
    });

    if (dbBranch) {
      assignedBranchId = dbBranch.id;
    } else {
      let dbRest = null;
      if (isUuid(effectiveUnitId)) {
        dbRest = await prisma.restaurant.findUnique({ where: { id: effectiveUnitId } }).catch(() => null);
      }
      if (!dbRest) {
        dbRest = await prisma.restaurant.findFirst({ where: { OR } }).catch(() => null);
      }

      if (dbRest) {
        assignedBranchId = dbRest.branchId;
      } else {
        const isTexMode = req?.body?.type === "TEXTILE" || req?.user?.type === "TEXTILE";
        const newBranch = await prisma.branch.create({
          data: {
            name: effectiveUnitId.startsWith("b-") || effectiveUnitId.startsWith("mu-") ? (isTexMode ? "Main Manufacturing Mill" : "Main Store Branch") : effectiveUnitId,
            code: isTexMode ? `MU-${Date.now().toString().slice(-4)}` : `BR-${Date.now().toString().slice(-4)}`,
            isActive: true,
          }
        });
        assignedBranchId = newBranch.id;
      }
    }
  } else if (req?.body?.type === "TEXTILE" || req?.user?.type === "TEXTILE") {
    // For Textile ERP Admin or general employees without a specific unit, assign/create a General Mill Unit
    let generalUnit = await prisma.branch.findFirst({
      where: {
        OR: [
          { name: { contains: "Manufacturing", mode: "insensitive" } },
          { name: { contains: "Mill", mode: "insensitive" } },
          { name: { contains: "General", mode: "insensitive" } },
        ]
      }
    });
    if (!generalUnit) {
      generalUnit = await prisma.branch.create({
        data: {
          name: "Main Textile Manufacturing Unit",
          code: `MU-${Date.now().toString().slice(-4)}`,
          isActive: true,
        }
      });
    }
    assignedBranchId = generalUnit.id;
  }

  // Create employee
  const employee = await createEmployee({
    fullName: cleanFullName,
    employeeId: cleanEmployeeId,
    email: cleanEmail,
    phone: cleanPhone,
    passwordHash,
    plainPassword: password,

    // Admin created the account
    isVerified: true,

    // Employee must change password on first login
    firstLogin: true,

    role: employeeRole?.name || cleanRole,
    roleId: employeeRole?.id || null,

    // Required branch assignment
    branchId: assignedBranchId,

    companyId: req?.body?.companyId || req?.user?.companyId || null,
    type: req?.body?.type || req?.user?.type || "RETAIL",
    permissions: req?.body?.permissions
      ? (typeof req.body.permissions === "string" ? req.body.permissions : JSON.stringify(req.body.permissions))
      : null,
  });


  // Send credentials email
  let emailSent = false;

  try {
    await sendEmployeeCredentialsEmail(
      cleanEmail,
      cleanEmployeeId,
      password,
      employee.branch?.name
    );

    emailSent = true;

  } catch (emailError) {

    console.error(
      "Failed to send employee credentials email:",
      emailError.message
    );
  }


  // Audit log
  await recordAuditLog(req, {
    action: "CREATE",
    entity: "Employee",
    entityId: employee.id,

    // Never store the password here
    details: {
      fullName: cleanFullName,
      employeeId: cleanEmployeeId,
      email: cleanEmail,
      phone: cleanPhone,
      role: cleanRole,
      branch: employee.branch?.name || null,
      description: `Employee registered`,
    },
  });


  // Remove sensitive information
  const safeEmployee =
    removeSensitiveFields(employee);


  return {
    success: true,

    message: emailSent
      ? "Employee created successfully and credentials email sent"
      : "Employee created successfully, but email delivery failed",

    data: safeEmployee,

    // IMPORTANT:
    // Do NOT return the password here.
    emailSent,
  };
};


// Update employee
const modifyEmployee = async (
  id,
  updateData,
  req
) => {

  const existingEmployee =
    await getEmployeeById(id);

  if (!existingEmployee) {
    throw new Error("Employee not found");
  }


  const safeUpdateData = {};


  // Full Name
  if (updateData.fullName) {
    safeUpdateData.fullName = updateData.fullName.trim();
  }


  // Email normalization & check
  if (updateData.email) {
    const cleanEmail = updateData.email.trim().toLowerCase();

    if (cleanEmail !== existingEmployee.email) {
      const emailExists = await findEmployeeByEmail(cleanEmail);

      if (emailExists && emailExists.id !== id) {
        throw new Error("Email already exists");
      }
    }

    safeUpdateData.email = cleanEmail;
  }


  // Employee ID check
  if (updateData.employeeId) {
    const cleanEmployeeId = updateData.employeeId.trim();

    if (cleanEmployeeId !== existingEmployee.employeeId) {
      const employeeIdExists = await findEmployeeByEmployeeId(cleanEmployeeId);

      if (employeeIdExists && employeeIdExists.id !== id) {
        throw new Error("Employee ID already exists");
      }
    }

    safeUpdateData.employeeId = cleanEmployeeId;
  }


  // Phone check
  if (updateData.phone) {
    const cleanPhone = cleanPhoneNumber(updateData.phone);
    if (!validatePhoneNumber(cleanPhone, true)) {
      throw new Error("Phone number must contain exactly 10 digits");
    }

    if (cleanPhone !== existingEmployee.phone) {
      const phoneExists = await findEmployeeByPhone(cleanPhone);

      if (phoneExists && phoneExists.id !== id) {
        throw new Error("Phone number already exists");
      }
    }

    safeUpdateData.phone = cleanPhone;
  }



  // Role handling (by roleId or role name string)
  if (updateData.roleId || updateData.role) {
    const targetRoleVal = (updateData.roleId || updateData.role).trim();
    let roleObj = null;
    if (isUuid(targetRoleVal)) {
      roleObj = await findRoleById(targetRoleVal);
    }
    if (!roleObj) {
      roleObj = await findRoleByName(targetRoleVal);
    }

    const callerRole = (req?.user?.role || req?.user?.roleRef?.name || "").trim().toUpperCase();
    const industryCode = (req?.user?.company?.industry?.code || req?.user?.type || existingEmployee.type || "RETAIL").trim().toUpperCase();
    const isRetail = !industryCode.includes("RESTAURANT") && !industryCode.includes("TEXTILE") && !industryCode.includes("GYM") && !industryCode.includes("LAUNDRY") && !industryCode.includes("SALON") && !industryCode.includes("MEDICAL");

    const resolvedRoleName = roleObj?.name || targetRoleVal;
    const reqRoleUpper = (resolvedRoleName || "").toUpperCase().replace(/[\s_-]+/g, " ").trim();

    const isLaundry = industryCode.includes("LAUNDRY");

    if (isRetail) {
      const isSuperAdmin = callerRole.includes("SUPER");
      const isAdmin = !isSuperAdmin && callerRole.includes("ADMIN");
      const isStoreManager = !isSuperAdmin && !isAdmin && (callerRole.includes("MANAGER") || callerRole.includes("STORE MANAGER") || callerRole.includes("STORE_MANAGER"));

      const adminAllowedRoles = [
        "STORE MANAGER",
        "MANAGER",
        "CASHIER",
        "INVENTORY MANAGER",
        "PURCHASE MANAGER",
        "ACCOUNTANT",
      ];

      const managerAllowedRoles = [
        "CASHIER",
        "INVENTORY MANAGER",
        "PURCHASE MANAGER",
        "ACCOUNTANT",
      ];

      if (isStoreManager) {
        const isAllowed = managerAllowedRoles.some(
          (allowed) => reqRoleUpper === allowed || reqRoleUpper === allowed.replace(" ", "_")
        );
        if (!isAllowed) {
          const error = new Error("403 Forbidden: Store Managers are only permitted to assign subordinate roles (Cashier, Inventory Manager, Purchase Manager, Accountant).");
          error.status = 403;
          error.statusCode = 403;
          throw error;
        }
      } else if (isAdmin) {
        const isAllowed = adminAllowedRoles.some(
          (allowed) => reqRoleUpper === allowed || reqRoleUpper === allowed.replace(" ", "_")
        );
        if (!isAllowed) {
          const error = new Error("403 Forbidden: Admins are not permitted to register or assign Admin/Super Admin roles.");
          error.status = 403;
          error.statusCode = 403;
          throw error;
        }
      }
    } else if (isLaundry) {
      const isSuperAdmin = callerRole.includes("SUPER");
      const isAdmin = !isSuperAdmin && callerRole.includes("ADMIN");
      const isLaundryManager = !isSuperAdmin && !isAdmin && (callerRole.includes("MANAGER") || callerRole.includes("LAUNDRY MANAGER") || callerRole.includes("LAUNDRY_MANAGER"));

      const adminAllowedRoles = [
        "MANAGER",
        "LAUNDRY MANAGER",
        "CASHIER",
        "PROCESSING STAFF",
        "DELIVERY DRIVER",
      ];

      const managerAllowedRoles = [
        "CASHIER",
        "PROCESSING STAFF",
        "DELIVERY DRIVER",
      ];

      if (isLaundryManager) {
        const isAllowed = managerAllowedRoles.some(
          (allowed) => reqRoleUpper === allowed || reqRoleUpper === allowed.replace(" ", "_")
        );
        if (!isAllowed) {
          const error = new Error("403 Forbidden: Laundry Managers are only permitted to assign subordinate staff roles (Cashier, Processing Staff, Delivery Driver).");
          error.status = 403;
          error.statusCode = 403;
          throw error;
        }
      } else if (isAdmin) {
        const isAllowed = adminAllowedRoles.some(
          (allowed) => reqRoleUpper === allowed || reqRoleUpper === allowed.replace(" ", "_")
        );
        if (!isAllowed) {
          const error = new Error("403 Forbidden: Admins are not permitted to register or assign Admin/Super Admin roles.");
          error.status = 403;
          error.statusCode = 403;
          throw error;
        }
      }
    } else {
      if (callerRole.includes("ADMIN") || callerRole.includes("MANAGER")) {
        if (reqRoleUpper.includes("ADMIN") || reqRoleUpper.includes("SUPER")) {
          const error = new Error("403 Forbidden: Admins/Managers are not permitted to register or assign Admin/Super Admin roles.");
          error.status = 403;
          error.statusCode = 403;
          throw error;
        }
      }
    }

    if (!roleObj) {
      roleObj = await createRoleInRepo(targetRoleVal);
    }
    safeUpdateData.roleId = roleObj.id;
    safeUpdateData.role = roleObj.name;
  }


  // Branch handling — allow assigning or clearing the branch
  if (updateData.branchId !== undefined) {
    if (updateData.branchId) {
      const OR = [];
      if (isUuid(updateData.branchId)) {
        OR.push({ id: updateData.branchId });
      }
      OR.push({ code: updateData.branchId });
      OR.push({ name: { equals: updateData.branchId, mode: "insensitive" } });

      const dbBranch = await prisma.branch.findFirst({
        where: { OR }
      });

      if (dbBranch) {
        safeUpdateData.branchId = dbBranch.id;
      } else {
        const newBranch = await prisma.branch.create({
          data: {
            name: updateData.branchId.startsWith("b-") ? "Main Store Branch" : updateData.branchId,
            code: `BR-${Date.now().toString().slice(-4)}`,
            isActive: true,
          }
        });
        safeUpdateData.branchId = newBranch.id;
      }
    } else {
      safeUpdateData.branchId = null;
    }
  }


  // Password update — if admin provides a new password, save it (hashed + plain)
  // and email the plain text to the employee.
  let plainPasswordToSend = null;

  if (updateData.password && updateData.password.trim() !== "") {
    plainPasswordToSend = updateData.password.trim();
    safeUpdateData.passwordHash  = await bcrypt.hash(plainPasswordToSend, 12);
    safeUpdateData.plainPassword = plainPasswordToSend;
    safeUpdateData.firstLogin    = true;
  }



  // Flags
  if (updateData.isVerified !== undefined) {
    safeUpdateData.isVerified = Boolean(updateData.isVerified);
  }

  if (updateData.firstLogin !== undefined) {
    safeUpdateData.firstLogin = Boolean(updateData.firstLogin);
  }

  if (updateData.permissions !== undefined) {
    safeUpdateData.permissions = updateData.permissions
      ? (typeof updateData.permissions === "string" ? updateData.permissions : JSON.stringify(updateData.permissions))
      : null;
  }


  if (Object.keys(safeUpdateData).length === 0) {
    throw new Error("No valid fields to update");
  }


  const updatedEmployee =
    await updateEmployee(
      id,
      safeUpdateData
    );


  // Send notification email with the employee's current password
  let emailSent = false;

  try {
    const targetEmail = updatedEmployee.email;

    await sendEmployeeUpdatedEmail(
      targetEmail,
      updatedEmployee.employeeId,
      updatedEmployee.fullName,
      plainPasswordToSend,
      updatedEmployee.branch?.name
    );

    emailSent = true;
  } catch (emailErr) {
    console.error(
      "Failed to send employee update notification email:",
      emailErr.message
    );
  }


  // Audit log
  await recordAuditLog(req, {
    action: "UPDATE",
    entity: "Employee",
    entityId: id,

    details: {
      fullName: updatedEmployee.fullName || existingEmployee.fullName,
      employeeId: updatedEmployee.employeeId || existingEmployee.employeeId,
      email: updatedEmployee.email || existingEmployee.email,
      updatedFields: Object.keys(safeUpdateData),
      emailSent,
      description: `Employee updated`,
    },
  });


  return {
    success: true,
    message: emailSent
      ? `Employee updated successfully and email sent to ${updatedEmployee.email}`
      : "Employee updated successfully",
    data: removeSensitiveFields(updatedEmployee),
    emailSent,
  };
};


// Delete employee
const removeEmployee = async (
  id,
  req
) => {

  const existingEmployee =
    await getEmployeeById(id);

  if (!existingEmployee) {
    throw new Error(
      "Employee not found"
    );
  }


  await deleteEmployee(id);


  // Audit log
  await recordAuditLog(req, {
    action: "DELETE",
    entity: "Employee",
    entityId: id,

    details: {
      fullName: existingEmployee.fullName,
      employeeId: existingEmployee.employeeId,
      email: existingEmployee.email,
      description: `Employee deleted`,
    },
  });


  return {
    success: true,
    message:
      "Employee deleted successfully",
  };
};


export {
  fetchAllEmployees,
  fetchEmployeeById,
  addEmployee,
  modifyEmployee,
  removeEmployee,
};