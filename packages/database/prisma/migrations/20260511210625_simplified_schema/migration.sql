/*
  Warnings:

  - The values [OPEN,LOCKED] on the enum `GameStatus` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `AgentGame` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Game` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `bettingClosesAt` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `bettingOpensAt` on the `Game` table. All the data in the column will be lost.
  - The `id` column on the `Game` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `gameId` on the `AgentGame` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `gameId` on the `Bet` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GameStatus_new" AS ENUM ('UPCOMING', 'LIVE', 'ENDED', 'CANCELLED');
ALTER TABLE "public"."Game" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Game" ALTER COLUMN "status" TYPE "GameStatus_new" USING ("status"::text::"GameStatus_new");
ALTER TYPE "GameStatus" RENAME TO "GameStatus_old";
ALTER TYPE "GameStatus_new" RENAME TO "GameStatus";
DROP TYPE "public"."GameStatus_old";
ALTER TABLE "Game" ALTER COLUMN "status" SET DEFAULT 'UPCOMING';
COMMIT;

-- DropForeignKey
ALTER TABLE "AgentGame" DROP CONSTRAINT "AgentGame_gameId_fkey";

-- DropForeignKey
ALTER TABLE "Bet" DROP CONSTRAINT "Bet_gameId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_betId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- AlterTable
ALTER TABLE "AgentGame" DROP CONSTRAINT "AgentGame_pkey",
DROP COLUMN "gameId",
ADD COLUMN     "gameId" INTEGER NOT NULL,
ADD CONSTRAINT "AgentGame_pkey" PRIMARY KEY ("agentId", "gameId");

-- AlterTable
ALTER TABLE "Bet" DROP COLUMN "gameId",
ADD COLUMN     "gameId" INTEGER NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE BIGINT,
ALTER COLUMN "payout" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Game" DROP CONSTRAINT "Game_pkey",
DROP COLUMN "bettingClosesAt",
DROP COLUMN "bettingOpensAt",
ADD COLUMN     "feeAmount" BIGINT,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "totalPool" SET DATA TYPE BIGINT,
ADD CONSTRAINT "Game_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "netEarnings" SET DATA TYPE BIGINT,
ALTER COLUMN "totalPayout" SET DATA TYPE BIGINT,
ALTER COLUMN "totalWagered" SET DATA TYPE BIGINT;

-- DropTable
DROP TABLE "Transaction";

-- DropEnum
DROP TYPE "TransactionStatus";

-- DropEnum
DROP TYPE "TransactionType";

-- CreateIndex
CREATE INDEX "AgentGame_gameId_idx" ON "AgentGame"("gameId");

-- CreateIndex
CREATE INDEX "Bet_gameId_idx" ON "Bet"("gameId");

-- AddForeignKey
ALTER TABLE "AgentGame" ADD CONSTRAINT "AgentGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
