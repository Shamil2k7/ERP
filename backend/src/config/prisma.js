import { PrismaClient } from "@prisma/client";
import { AsyncLocalStorage } from "async_hooks";

const prismaInstance = new PrismaClient();
export const tenantStorage = new AsyncLocalStorage();

const prisma = prismaInstance.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const tenantId = tenantStorage.getStore();
        
        const tenantModels = [
          "Department", "Role", "Branch", "Product", "Category", "Brand",
          "Unit", "Warehouse", "Customer", "Supplier", "Purchase", "SalesOrder",
          "Invoice", "Payment", "StockMovement", "StockTransfer", "Return",
          "Discount", "AuditLog", "SystemSettings", "GymMember",
          "GymMembershipPlan", "GymTrainer", "GymAttendance", "GymPayment", "Restaurant",
          "RestaurantOrder", "Wastage", "Laundry", "LaundryOrder",
          "Medicine", "Prescription"
        ];

        if (tenantId && tenantModels.includes(model)) {
          if (["findMany", "findFirst", "findUnique", "count", "updateMany", "deleteMany", "update", "delete", "aggregate"].includes(operation)) {
            args.where = args.where || {};
            if (operation === "findUnique") {
              return prismaInstance[model.charAt(0).toLowerCase() + model.slice(1)].findFirst({
                ...args,
                where: {
                  ...args.where,
                  companyId: tenantId,
                }
              });
            } else {
              args.where.companyId = tenantId;
            }
          } else if (operation === "create" || operation === "createMany") {
            if (operation === "create") {
              args.data = args.data || {};
              args.data.companyId = tenantId;
            } else if (operation === "createMany") {
              if (Array.isArray(args.data)) {
                args.data = args.data.map(item => ({ ...item, companyId: tenantId }));
              } else if (args.data) {
                args.data.companyId = tenantId;
              }
            }
          } else if (operation === "upsert") {
            args.create = args.create || {};
            args.create.companyId = tenantId;
            args.update = args.update || {};
            args.update.companyId = tenantId;
            args.where = args.where || {};
            args.where.companyId = tenantId;
          }
        }
        
        return query(args);
      }
    }
  }
});

export default prisma;