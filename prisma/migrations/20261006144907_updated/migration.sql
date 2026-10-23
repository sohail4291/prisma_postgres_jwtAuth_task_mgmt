-- AlterTable
ALTER TABLE "Posts" ADD CONSTRAINT "Posts_pkey" PRIMARY KEY ("id");

-- DropIndex
DROP INDEX "Posts_id_key";

-- AlterTable
ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- DropIndex
DROP INDEX "User_id_key";
