import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import authRoutes from "./modules/auth/auth.routes.js"
import adminRoutes from "./modules/admin/admin.routes.js";

import customerRoutes from "./modules/customers/customers.routes.js";
import salesRoutes from "./modules/sales/sales.routes.js";
import paymentRoutes from "./modules/payments/payments.routes.js";
import invoiceRoutes from "./modules/invoices/invoices.routes.js";
import returnRoutes from "./modules/returns/returns.routes.js";
import discountRoutes from "./modules/discounts/discounts.routes.js";
import taxRoutes from "./modules/taxes/taxes.routes.js";
import employeeRoutes from "./modules/employees/employees.routes.js";

import branchRoutes from "./modules/branch/branch.routes.js";

import categoryRoutes from "./modules/categories/category.routes.js";
import productRoutes from "./modules/products/product.routes.js";
import supplierRoutes from "./modules/suppliers/supplier.routes.js";
import warehouseRoutes from "./modules/warehouse/warehouse.routes.js";
import inventoryRoutes from "./modules/inventory/inventory.routes.js";
import purchaseRoutes from "./modules/purchase/purchase.routes.js";
import stockMovementRoutes from "./modules/stockMovement/stock.routes.js";
import stockTransferRoutes from "./modules/stockTransfer/stockTransfer.routes.js";
import barcodeRoutes from "./modules/barcode/barcode.routes.js";
import brandRoutes from "./modules/brands/brand.routes.js";
import unitRoutes from "./modules/units/unit.routes.js";

import departmentRoutes from "./modules/departments/department.routes.js";
import businessTypeRoutes from "./modules/businessTypes/businessType.routes.js";
import roleRoutes from "./modules/roles/roles.routes.js";

import landingRoutes from "./modules/landing/landing.routes.js";
import settingsRoutes from "./modules/settings/settings.routes.js";
import auditRoutes from "./modules/audit/audit.routes.js";
import reportsRoutes from "./modules/reports/reports.routes.js";

import companyRoutes from "./modules/company/company.routes.js";
import gymRoutes from "./modules/gym/gym.routes.js";
import textileRoutes from "./modules/textile/textile.routes.js";
import laundryRoutes from "./modules/laundry/laundry.routes.js";
import medicalRoutes from "./modules/medical/medical.routes.js";
import { tenantStorage } from "./config/prisma.js";

import restaurantRoutes from "./modules/restaurants/restaurant.routes.js";
import restaurantAreaRoutes from "./modules/restaurantAreas/restaurantArea.routes.js";
import restaurantTableRoutes from "./modules/restaurantTables/restaurantTable.routes.js";
import menuCategoryRoutes from "./modules/menuCategories/menuCategory.routes.js";
import menuItemRoutes from "./modules/menuItems/menuItem.routes.js";
import recipeRoutes from "./modules/recipes/recipe.routes.js";
import modifierRoutes from "./modules/modifiers/modifier.routes.js";
import restaurantOrderRoutes from "./modules/restaurantOrders/restaurantOrder.routes.js";
import kitchenRoutes from "./modules/kitchen/kitchen.routes.js";
import reservationRoutes from "./modules/reservations/reservation.routes.js";
import wastageRoutes from "./modules/wastage/wastage.routes.js";
import foodCostRoutes from "./modules/foodCost/foodCost.routes.js";
import restaurantReportRoutes from "./modules/restaurantReports/restaurantReport.routes.js";
import restaurantIngredientRoutes from "./modules/restaurantIngredients/restaurantIngredient.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";

import {
  attachUserIfAuthenticated,
} from "./middlewares/auth.middleware.js";
import { requireModuleAccess } from "./middlewares/moduleAccess.middleware.js";

const app = express();


app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  helmet()
);

app.use(compression());

app.use(morgan("dev"));

app.use(cookieParser());

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// Attach logged-in user if authentication cookie/token exists
app.use(attachUserIfAuthenticated);

// SaaS Multi-Tenant data isolation: run all database queries inside AsyncLocalStorage tenant storage context
app.use((req, res, next) => {
  const tenantId = req.user?.companyId || req.headers["x-company-override"];
  if (tenantId) {
    tenantStorage.run(tenantId, next);
  } else {
    next();
  }
});


app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader(
      "Cross-Origin-Resource-Policy",
      "cross-origin"
    );

    next();
  },
  express.static(path.join(__dirname, "uploads"))
);


app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "ERP Backend API Running Successfully",
  });
});


app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/companies",
  companyRoutes
);

app.use(
  "/api/gym",
  gymRoutes
);

app.use(
  "/api/textile",
  textileRoutes
);

app.use(
  "/api/admins",
  adminRoutes
);

app.use(
  "/api/customers",
  customerRoutes
);

app.use(
  "/api/sales",
  salesRoutes
);

app.use(
  "/api/returns",
  returnRoutes
);

app.use(
  "/api/payments",
  paymentRoutes
);

app.use(
  "/api/invoices",
  invoiceRoutes
);

app.use(
  "/api/discounts",
  discountRoutes
);

app.use(
  "/api/taxes",
  taxRoutes
);

app.use(
  "/api/employees",
  employeeRoutes
);

app.use(
  "/api/branches",
  branchRoutes
);

app.use(
  "/api/categories",
  categoryRoutes
);

app.use(
  "/api/products",
  requireModuleAccess("PRODUCTS"),
  productRoutes
);

app.use(
  "/api/suppliers",
  supplierRoutes
);

app.use(
  "/api/warehouses",
  warehouseRoutes
);

app.use(
  "/api/inventory",
  inventoryRoutes
);

app.use(
  "/api/purchases",
  purchaseRoutes
);

app.use(
  "/api/stock",
  stockMovementRoutes
);

app.use(
  "/api/stock-transfers",
  stockTransferRoutes
);

app.use(
  "/api/barcodes",
  barcodeRoutes
);

app.use(
  "/api/brands",
  brandRoutes
);

app.use(
  "/api/units",
  unitRoutes
);

app.use(
  "/api/departments",
  departmentRoutes
);

app.use(
  "/api/business-types",
  businessTypeRoutes
);

app.use(
  "/api/roles",
  roleRoutes
);

app.use(
  "/api/landing",
  landingRoutes
);

app.use(
  "/api/settings",
  settingsRoutes
);

app.use(
  "/api/audit",
  auditRoutes
);

app.use(
  "/api/reports",
  reportsRoutes
);

app.use("/api/restaurants", restaurantRoutes);
app.use("/api/laundry", laundryRoutes);
app.use("/api/medical", medicalRoutes);
app.use("/api/restaurant-areas", restaurantAreaRoutes);
app.use("/api/restaurant-tables", restaurantTableRoutes);
app.use("/api/menu-categories", menuCategoryRoutes);
app.use("/api/menu-items", menuItemRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/modifiers", modifierRoutes);
app.use("/api/restaurant-orders", restaurantOrderRoutes);
app.use("/api/kitchen", kitchenRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/wastage", wastageRoutes);
app.use("/api/food-cost", foodCostRoutes);
app.use("/api/restaurant-reports", restaurantReportRoutes);
app.use("/api/restaurant/ingredients", restaurantIngredientRoutes);
app.use("/api/restaurant-ingredients", restaurantIngredientRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/textile", textileRoutes);


app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route Not Found",
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  console.error("Global Error:", err);

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;