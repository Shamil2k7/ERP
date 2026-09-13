/*
  Warnings:

  - You are about to drop the column `baseUnit` on the `products` table. All the data in the column will be lost.
  - Added the required column `unitId` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "firstLogin" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "verificationExpires" TIMESTAMP(3),
ADD COLUMN     "verificationToken" TEXT;

-- AlterTable
ALTER TABLE "public"."landing_page" ALTER COLUMN "heroImage" DROP NOT NULL,
ALTER COLUMN "aboutImage1" DROP NOT NULL,
ALTER COLUMN "aboutImage2" DROP NOT NULL,
ALTER COLUMN "aboutImage3" DROP NOT NULL,
ALTER COLUMN "aboutImage4" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "baseUnit",
ADD COLUMN     "unitId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."Unit";

-- CreateTable
CREATE TABLE "public"."departments" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "head" VARCHAR(150),
    "employees" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."designations" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "designation" VARCHAR(150) NOT NULL,
    "department" VARCHAR(150) NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."units" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_name" TEXT,
    "user_email" TEXT,
    "action" VARCHAR(50) NOT NULL,
    "entity" VARCHAR(100) NOT NULL,
    "entity_id" TEXT,
    "details" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_settings" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL DEFAULT 'ERP Enterprise Ltd',
    "legal_name" TEXT,
    "tax_number" TEXT,
    "company_email" TEXT,
    "company_phone" TEXT,
    "company_address" TEXT,
    "company_logo" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "currency_symbol" TEXT NOT NULL DEFAULT '$',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "date_format" TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
    "fiscal_year_start" TEXT NOT NULL DEFAULT 'January',
    "invoice_prefix" TEXT NOT NULL DEFAULT 'INV-',
    "sales_order_prefix" TEXT NOT NULL DEFAULT 'SO-',
    "purchase_order_prefix" TEXT NOT NULL DEFAULT 'PO-',
    "default_tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "enable_multi_branch" BOOLEAN NOT NULL DEFAULT false,
    "enable_stock_alerts" BOOLEAN NOT NULL DEFAULT true,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 10,
    "receipt_header" TEXT,
    "receipt_footer" TEXT DEFAULT 'Thank you for your business!',
    "receipt_paper_size" TEXT NOT NULL DEFAULT '80mm',
    "auto_print_receipt" BOOLEAN NOT NULL DEFAULT true,
    "show_tax_on_receipt" BOOLEAN NOT NULL DEFAULT true,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "daily_report_email" BOOLEAN NOT NULL DEFAULT false,
    "session_timeout_minutes" INTEGER NOT NULL DEFAULT 60,
    "theme_preference" TEXT NOT NULL DEFAULT 'system',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "public"."departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "public"."departments"("code");

-- CreateIndex
CREATE INDEX "departments_name_idx" ON "public"."departments"("name");

-- CreateIndex
CREATE INDEX "departments_code_idx" ON "public"."departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "designations_code_key" ON "public"."designations"("code");

-- CreateIndex
CREATE INDEX "designations_designation_idx" ON "public"."designations"("designation");

-- CreateIndex
CREATE INDEX "designations_department_idx" ON "public"."designations"("department");

-- CreateIndex
CREATE UNIQUE INDEX "units_name_key" ON "public"."units"("name");

-- CreateIndex
CREATE UNIQUE INDEX "units_code_key" ON "public"."units"("code");

-- CreateIndex
CREATE INDEX "units_name_idx" ON "public"."units"("name");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "public"."audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "public"."audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "public"."audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "public"."Branch"("code");

-- CreateIndex
CREATE INDEX "products_unitId_idx" ON "public"."products"("unitId");

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
