import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Full Database Seed...");

  // 1. Seed Industries
  const retailIndustry = await prisma.industry.upsert({
    where: { code: "RETAIL" },
    update: { name: "Retail", status: true },
    create: { code: "RETAIL", name: "Retail", status: true },
  });

  const gymIndustry = await prisma.industry.upsert({
    where: { code: "GYM" },
    update: { name: "Gym", status: true },
    create: { code: "GYM", name: "Gym", status: true },
  });

  const textileIndustry = await prisma.industry.upsert({
    where: { code: "TEXTILE" },
    update: { name: "Textile", status: true },
    create: { code: "TEXTILE", name: "Textile", status: true },
  });

  const restaurantIndustry = await prisma.industry.upsert({
    where: { code: "RESTAURANT" },
    update: { name: "Restaurant", status: true },
    create: { code: "RESTAURANT", name: "Restaurant", status: true },
  });

  const laundryIndustry = await prisma.industry.upsert({
    where: { code: "LAUNDRY" },
    update: { name: "Laundry", status: true },
    create: { code: "LAUNDRY", name: "Laundry", status: true },
  });

  const medicalIndustry = await prisma.industry.upsert({
    where: { code: "MEDICAL_SHOP" },
    update: { name: "Medical Shop / Pharmacy", status: true },
    create: { code: "MEDICAL_SHOP", name: "Medical Shop / Pharmacy", status: true },
  });

  console.log("✅ Industries Seeded:", retailIndustry.code, gymIndustry.code, textileIndustry.code, restaurantIndustry.code, laundryIndustry.code, medicalIndustry.code);

  // 2. Seed Modules Catalog
  const moduleList = [
    { code: "DASHBOARD", name: "Dashboard", description: "Business analytics & key metrics overview" },
    { code: "PRODUCTS", name: "Products", description: "Product catalog and pricing management" },
    { code: "CATEGORIES", name: "Categories", description: "Product category hierarchy" },
    { code: "BRANDS", name: "Brands", description: "Brand tracking" },
    { code: "INVENTORY", name: "Inventory / Stock", description: "Warehouse stock management & alerts" },
    { code: "CUSTOMERS", name: "Customers", description: "Customer relationship tracking" },
    { code: "SUPPLIERS", name: "Suppliers", description: "Supplier and vendor management" },
    { code: "PURCHASES", name: "Purchases", description: "Purchase order management" },
    { code: "SALES", name: "Sales / Orders", description: "Sales orders and POS transaction management" },
    { code: "PAYMENTS", name: "Payments & Fees", description: "Payment processing and receipt tracking" },
    { code: "EXPENSES", name: "Expenses", description: "Company expense management" },
    { code: "BRANCHES", name: "Branches", description: "Branch location management" },
    { code: "EMPLOYEES", name: "Employees / Staff", description: "Employee roster and access control" },
    { code: "REPORTS", name: "Reports", description: "Financial and operational reports" },
    { code: "SETTINGS", name: "Settings", description: "System and company configuration" },
    { code: "MEMBERS", name: "Gym Members", description: "Gym member registration and status tracking" },
    { code: "MEMBERSHIP_PLANS", name: "Membership Plans", description: "Subscription plan management" },
    { code: "TRAINERS", name: "Gym Trainers", description: "Personal trainer allocation & profiles" },
    { code: "ATTENDANCE", name: "Attendance Log", description: "Member check-in & check-out log" },
    { code: "RAW_MATERIALS", name: "Raw Materials", description: "Yarn, Cotton, Dyes, and Chemical Stock" },
    { code: "PRODUCTION", name: "Production Tracking", description: "Textile batch processing & stage tracking" },
    { code: "QUALITY_CONTROL", name: "Quality Control", description: "Quality inspection and defect logging" },
    { code: "RESTAURANT", name: "Restaurant ERP", description: "Food POS, Tables, Recipes, KOT, & KDS" },
    { code: "LAUNDRY", name: "Laundry Management", description: "Laundry POS, Service Categories, Services, Garments tracking, Processing queues, Deliveries" },
    { code: "MEDICAL_SHOP", name: "Pharmacy Management", description: "Pharmacy POS, Medicine profile, Batches, Expiry tracking, Prescriptions, Purchases, Returns" },
  ];

  const createdModules = {};
  for (const mod of moduleList) {
    const record = await prisma.module.upsert({
      where: { code: mod.code },
      update: { name: mod.name, description: mod.description, status: true },
      create: { code: mod.code, name: mod.name, description: mod.description, status: true },
    });
    createdModules[mod.code] = record;
  }

  console.log(`✅ ${Object.keys(createdModules).length} Modules Seeded`);

  // 3. Link Default Industry Modules
  const retailModuleCodes = [
    "DASHBOARD", "PRODUCTS", "CATEGORIES", "BRANDS", "INVENTORY",
    "CUSTOMERS", "SUPPLIERS", "PURCHASES", "SALES", "PAYMENTS",
    "EXPENSES", "BRANCHES", "EMPLOYEES", "REPORTS", "SETTINGS"
  ];

  const gymModuleCodes = [
    "DASHBOARD", "MEMBERS", "MEMBERSHIP_PLANS", "TRAINERS", "ATTENDANCE",
    "PAYMENTS", "EXPENSES", "BRANCHES", "EMPLOYEES", "REPORTS", "SETTINGS"
  ];

  const textileModuleCodes = [
    "DASHBOARD", "PRODUCTS", "RAW_MATERIALS", "PRODUCTION", "INVENTORY",
    "QUALITY_CONTROL", "SUPPLIERS", "SALES", "PAYMENTS", "EXPENSES",
    "BRANCHES", "EMPLOYEES", "REPORTS", "SETTINGS"
  ];

  const laundryModuleCodes = [
    "DASHBOARD", "LAUNDRY", "INVENTORY", "WAREHOUSE", "CUSTOMERS", "SUPPLIERS", "PAYMENTS", "EXPENSES", "BRANCHES", "EMPLOYEES", "REPORTS", "SETTINGS"
  ];

  const medicalModuleCodes = [
    "DASHBOARD", "MEDICAL_SHOP", "PRODUCTS", "CATEGORIES", "BRANDS", "INVENTORY", "WAREHOUSE", "CUSTOMERS", "SUPPLIERS", "PURCHASES", "PAYMENTS", "EXPENSES", "BRANCHES", "EMPLOYEES", "REPORTS", "SETTINGS"
  ];

  for (const code of retailModuleCodes) {
    if (createdModules[code]) {
      await prisma.industryModule.upsert({
        where: {
          industryId_moduleId: {
            industryId: retailIndustry.id,
            moduleId: createdModules[code].id,
          },
        },
        update: { defaultEnabled: true },
        create: {
          industryId: retailIndustry.id,
          moduleId: createdModules[code].id,
          defaultEnabled: true,
        },
      });
    }
  }

  for (const code of gymModuleCodes) {
    if (createdModules[code]) {
      await prisma.industryModule.upsert({
        where: {
          industryId_moduleId: {
            industryId: gymIndustry.id,
            moduleId: createdModules[code].id,
          },
        },
        update: { defaultEnabled: true },
        create: {
          industryId: gymIndustry.id,
          moduleId: createdModules[code].id,
          defaultEnabled: true,
        },
      });
    }
  }

  for (const code of textileModuleCodes) {
    if (createdModules[code]) {
      await prisma.industryModule.upsert({
        where: {
          industryId_moduleId: {
            industryId: textileIndustry.id,
            moduleId: createdModules[code].id,
          },
        },
        update: { defaultEnabled: true },
        create: {
          industryId: textileIndustry.id,
          moduleId: createdModules[code].id,
          defaultEnabled: true,
        },
      });
    }
  }

  for (const code of laundryModuleCodes) {
    if (createdModules[code]) {
      await prisma.industryModule.upsert({
        where: {
          industryId_moduleId: {
            industryId: laundryIndustry.id,
            moduleId: createdModules[code].id,
          },
        },
        update: { defaultEnabled: true },
        create: {
          industryId: laundryIndustry.id,
          moduleId: createdModules[code].id,
          defaultEnabled: true,
        },
      });
    }
  }

  for (const code of medicalModuleCodes) {
    if (createdModules[code]) {
      await prisma.industryModule.upsert({
        where: {
          industryId_moduleId: {
            industryId: medicalIndustry.id,
            moduleId: createdModules[code].id,
          },
        },
        update: { defaultEnabled: true },
        create: {
          industryId: medicalIndustry.id,
          moduleId: createdModules[code].id,
          defaultEnabled: true,
        },
      });
    }
  }

  console.log("✅ Industry Default Modules Mapped");

  // 4. Seed Roles, Companies & Default User Accounts
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

  const retailCompany = await prisma.company.upsert({
    where: { id: "default-retail-company-id" },
    update: { name: "ABC Supermarket", industryId: retailIndustry.id },
    create: {
      id: "default-retail-company-id",
      name: "ABC Supermarket",
      industryId: retailIndustry.id,
    },
  });

  const gymCompany = await prisma.company.upsert({
    where: { id: "default-gym-company-id" },
    update: { name: "ABC Fitness", industryId: gymIndustry.id },
    create: {
      id: "default-gym-company-id",
      name: "ABC Fitness",
      industryId: gymIndustry.id,
    },
  });

  const laundryCompany = await prisma.company.upsert({
    where: { id: "default-laundry-company-id" },
    update: { name: "ABC Laundry & Dry Cleaning", industryId: laundryIndustry.id },
    create: {
      id: "default-laundry-company-id",
      name: "ABC Laundry & Dry Cleaning",
      industryId: laundryIndustry.id,
    },
  });

  const medicalCompany = await prisma.company.upsert({
    where: { id: "default-medical-company-id" },
    update: { name: "ABC Pharmacy", industryId: medicalIndustry.id },
    create: {
      id: "default-medical-company-id",
      name: "ABC Pharmacy",
      industryId: medicalIndustry.id,
    },
  });

  const allModules = await prisma.module.findMany({ where: { status: true } });
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

    if (laundryModuleCodes.includes(mod.code)) {
      await prisma.companyModule.upsert({
        where: { companyId_moduleId: { companyId: laundryCompany.id, moduleId: mod.id } },
        update: { enabled: true },
        create: { companyId: laundryCompany.id, moduleId: mod.id, enabled: true },
      });
    }

    if (medicalModuleCodes.includes(mod.code)) {
      await prisma.companyModule.upsert({
        where: { companyId_moduleId: { companyId: medicalCompany.id, moduleId: mod.id } },
        update: { enabled: true },
        create: { companyId: medicalCompany.id, moduleId: mod.id, enabled: true },
      });
    }
  }

  const passwordHash = await bcrypt.hash("admin123", 10);

  // Super Admin Account
  await prisma.user.upsert({
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
  console.log("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
  console.log("👑 SUPER ADMIN LOGIN: superadmin@erp.com / admin123");
  console.log("==========================================");
}

main()
  .catch((e) => {
    console.error("❌ Seed Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
