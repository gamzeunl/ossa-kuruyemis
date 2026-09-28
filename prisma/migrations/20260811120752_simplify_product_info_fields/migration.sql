/*
  Warnings:

  - You are about to drop the column `allergenInformation` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `manufacturer` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `nutritionalValues` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `originCountry` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `productNote` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `usageSuggestion` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "allergenInformation",
DROP COLUMN "manufacturer",
DROP COLUMN "nutritionalValues",
DROP COLUMN "originCountry",
DROP COLUMN "productNote",
DROP COLUMN "usageSuggestion";
