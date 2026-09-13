/*
  Warnings:

  - The `discountType` column on the `products` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "discountType",
ADD COLUMN     "discountType" "public"."ProductDiscountType";
