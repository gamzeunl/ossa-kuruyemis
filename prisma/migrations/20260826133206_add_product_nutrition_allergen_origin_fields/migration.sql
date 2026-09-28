-- CreateEnum
CREATE TYPE "NutritionReferenceType" AS ENUM ('REFERENCE_AVERAGE', 'OSSA_LAB_ANALYSIS');

-- CreateEnum
CREATE TYPE "NutritionConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'RECIPE_REQUIRED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "allergenInfo" TEXT,
ADD COLUMN     "nutritionCarbohydrate" DECIMAL(6,2),
ADD COLUMN     "nutritionConfidence" "NutritionConfidence",
ADD COLUMN     "nutritionEnergyKcal" DECIMAL(7,2),
ADD COLUMN     "nutritionEnergyKj" DECIMAL(7,2),
ADD COLUMN     "nutritionFat" DECIMAL(6,2),
ADD COLUMN     "nutritionFiber" DECIMAL(6,2),
ADD COLUMN     "nutritionProtein" DECIMAL(6,2),
ADD COLUMN     "nutritionReferenceType" "NutritionReferenceType",
ADD COLUMN     "nutritionSalt" DECIMAL(6,3),
ADD COLUMN     "nutritionSaturatedFat" DECIMAL(6,2),
ADD COLUMN     "nutritionSourceName" TEXT,
ADD COLUMN     "nutritionSourceProduct" TEXT,
ADD COLUMN     "nutritionSourceUrl" TEXT,
ADD COLUMN     "nutritionSugars" DECIMAL(6,2),
ADD COLUMN     "originInfo" TEXT,
ADD COLUMN     "usageSuggestion" TEXT;
