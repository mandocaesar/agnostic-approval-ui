-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'DOMAIN_ADMIN', 'MAKER', 'CHECKER');

-- Add password column for Super Admin authentication
ALTER TABLE "User" ADD COLUMN "password" TEXT;

-- Add temporary new_role column with enum type
ALTER TABLE "User" ADD COLUMN "new_role" "Role" NOT NULL DEFAULT 'MAKER';

-- Migrate existing role data (all existing users become MAKER by default)
-- If you have specific users that should be SUPER_ADMIN, update them after migration

-- Drop old role column
ALTER TABLE "User" DROP COLUMN "role";

-- Rename new_role to role
ALTER TABLE "User" RENAME COLUMN "new_role" TO "role";
