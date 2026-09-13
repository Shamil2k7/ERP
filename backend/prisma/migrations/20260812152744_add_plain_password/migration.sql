-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "plainPassword" TEXT;

-- AlterTable
ALTER TABLE "public"."designations" ADD COLUMN     "departmentId" TEXT;

-- AlterTable
ALTER TABLE "public"."landing_page" ADD COLUMN     "aboutTag" TEXT NOT NULL DEFAULT 'ABOUT ERP CLOUD',
ADD COLUMN     "dashboardSubtitle" TEXT NOT NULL DEFAULT 'Business Overview',
ADD COLUMN     "dashboardTitle" TEXT NOT NULL DEFAULT 'ERP Dashboard',
ADD COLUMN     "footerText" TEXT NOT NULL DEFAULT '© ERP Cloud. All Rights Reserved.',
ADD COLUMN     "heroBackgroundImage" TEXT,
ADD COLUMN     "heroButtonText" TEXT NOT NULL DEFAULT 'Upgrade Your Company In Minutes',
ADD COLUMN     "heroTag" TEXT NOT NULL DEFAULT 'CLOUD ERP PLATFORM',
ADD COLUMN     "loginText" TEXT NOT NULL DEFAULT 'Login →',
ADD COLUMN     "logoHighlight" TEXT NOT NULL DEFAULT 'Cloud',
ADD COLUMN     "logoText" TEXT NOT NULL DEFAULT 'ERP';

-- AddForeignKey
ALTER TABLE "public"."designations" ADD CONSTRAINT "designations_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
