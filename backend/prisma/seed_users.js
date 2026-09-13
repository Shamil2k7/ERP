import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🔑 Seeding Default System Users & Roles...");

  const superAdminRole = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: {},
    create: { name: "SUPER_ADMIN" },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN" },
  });

  const retailIndustry = await prisma.industry.findUnique({ where: { code: "RETAIL" } });
  const gymIndustry = await prisma.industry.findUnique({ where: { code: "GYM" } });

  // Default Companies
  const retailCompany = await prisma.company.upsert({
    where: { id: "default-retail-company-id" },
    update: {},
    create: {
      id: "default-retail-company-id",
      name: "ABC Supermarket",
      industryId: retailIndustry?.id || "",
    },
  });

  const gymCompany = await prisma.company.upsert({
    where: { id: "default-gym-company-id" },
    update: {},
    create: {
      id: "default-gym-company-id",
      name: "ABC Fitness",
      industryId: gymIndustry?.id || "",
    },
  });

  // Populate CompanyModules for default companies
  const allModules = await prisma.module.findMany({ where: { status: true } });

  const retailModuleCodes = [
    "DASHBOARD", "PRODUCTS", "CATEGORIES", "BRANDS", "INVENTORY",
    "CUSTOMERS", "SUPPLIERS", "PURCHASES", "SALES", "PAYMENTS",
    "EXPENSES", "BRANCHES", "EMPLOYEES", "REPORTS", "SETTINGS"
  ];

  const gymModuleCodes = [
    "DASHBOARD", "MEMBERS", "MEMBERSHIP_PLANS", "TRAINERS", "ATTENDANCE",
    "PAYMENTS", "EXPENSES", "BRANCHES", "EMPLOYEES", "REPORTS", "SETTINGS"
  ];

  for (const mod of allModules) {
    if (retailModuleCodes.includes(mod.code)) {
      await prisma.companyModule.upsert({
        where: { companyId_moduleId: { companyId: retailCompany.id, moduleId: mod.id } },
        update: { enabled: true },
        create: { companyId: retailCompany.id, moduleId: mod.id, enabled: true },
      });
    }

    if (gymModuleCodes.includes(mod.code)) {
      await prisma.companyModule.upsert({
        where: { companyId_moduleId: { companyId: gymCompany.id, moduleId: mod.id } },
        update: { enabled: true },
        create: { companyId: gymCompany.id, moduleId: mod.id, enabled: true },
      });
    }
  }

  const passwordHash = await bcrypt.hash("admin123", 10);

  // 1. Super Admin Account
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@erp.com" },
    update: {
      passwordHash,
      isVerified: true,
      role: "SUPER_ADMIN",
      roleId: superAdminRole.id,
      companyId: retailCompany.id,
    },
    create: {
      fullName: "Super Admin",
      email: "superadmin@erp.com",
      employeeId: "SA-001",
      phone: "9998887770",
      passwordHash,
      plainPassword: "admin123",
      role: "SUPER_ADMIN",
      roleId: superAdminRole.id,
      isVerified: true,
      type: "RETAIL",
      companyId: retailCompany.id,
    },
  });

  console.log("==========================================");
  console.log("👑 SUPER ADMIN LOGIN:");
  console.log("Email: superadmin@erp.com");
  console.log("Password: admin123");
  console.log("Employee ID / Login: SA-001");
  console.log("==========================================");
}

main()
  .catch((e) => {
    console.error("❌ Seed Users Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
