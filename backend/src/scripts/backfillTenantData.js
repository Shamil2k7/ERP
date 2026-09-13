import prisma from "../config/prisma.js";

async function backfillTenantData() {
  console.log("Starting Multi-Tenant Data Backfill...");

  // 1. Get or create a default company for legacy unassigned records
  let defaultRetailCompany = await prisma.company.findFirst({
    where: { industry: { code: "RETAIL" } },
  });

  if (!defaultRetailCompany) {
    let retailIndustry = await prisma.industry.findUnique({ where: { code: "RETAIL" } });
    if (!retailIndustry) {
      retailIndustry = await prisma.industry.create({
        data: { name: "Retail", code: "RETAIL", status: true },
      });
    }
    defaultRetailCompany = await prisma.company.create({
      data: { name: "Default Retail Enterprise", industryId: retailIndustry.id, status: "ACTIVE" },
    });
  }

  const defaultCompanyId = defaultRetailCompany.id;
  console.log(`Using default fallback Tenant ID: ${defaultCompanyId}`);

  // Helper to update records with missing companyId
  const updateModelCompanyId = async (modelName, modelRef) => {
    try {
      const result = await modelRef.updateMany({
        where: { companyId: null },
        data: { companyId: defaultCompanyId },
      });
      if (result.count > 0) {
        console.log(`Updated ${result.count} unassigned ${modelName} records to tenant ${defaultCompanyId}`);
      }
    } catch (err) {
      console.warn(`Could not update ${modelName}:`, err.message);
    }
  };

  await updateModelCompanyId("User", prisma.user);
  await updateModelCompanyId("Branch", prisma.branch);
  await updateModelCompanyId("Product", prisma.product);
  await updateModelCompanyId("Category", prisma.category);
  await updateModelCompanyId("Brand", prisma.brand);
  await updateModelCompanyId("Unit", prisma.unit);
  await updateModelCompanyId("Supplier", prisma.supplier);
  await updateModelCompanyId("Warehouse", prisma.warehouse);
  await updateModelCompanyId("Customer", prisma.customer);
  await updateModelCompanyId("SalesOrder", prisma.salesOrder);
  await updateModelCompanyId("Invoice", prisma.invoice);
  await updateModelCompanyId("Payment", prisma.payment);
  await updateModelCompanyId("Purchase", prisma.purchase);
  await updateModelCompanyId("StockMovement", prisma.stockMovement);
  await updateModelCompanyId("StockTransfer", prisma.stockTransfer);
  await updateModelCompanyId("Return", prisma.return);
  await updateModelCompanyId("Discount", prisma.discount);
  await updateModelCompanyId("AuditLog", prisma.auditLog);
  await updateModelCompanyId("SystemSettings", prisma.systemSettings);

  console.log("Multi-Tenant Data Backfill Completed Successfully!");
}

backfillTenantData()
  .catch((e) => {
    console.error("Backfill Error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
