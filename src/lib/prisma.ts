import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const accelerateUrl = process.env.PRISMA_ACCELERATE_URL;
const useAccelerate = Boolean(accelerateUrl);
const databaseUrl = process.env.DATABASE_URL;

// Create adapter for direct database connection
const pool = databaseUrl ? new pg.Pool({ connectionString: databaseUrl }) : null;
const adapter = pool ? new PrismaPg(pool) : undefined;

const createClient = () => {
    if (useAccelerate && accelerateUrl) {
        return new PrismaClient({
            log: ["query", "error", "warn"],
            accelerateUrl,
        }).$extends(withAccelerate());
    }
    
    if (adapter) {
        return new PrismaClient({
            log: ["query", "error", "warn"],
            adapter,
        });
    }
    
    throw new Error("Either DATABASE_URL or PRISMA_ACCELERATE_URL must be configured");
};

export const prisma =
    globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma as any;
