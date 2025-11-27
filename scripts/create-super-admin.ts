import "dotenv/config";
import { Role } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createSuperAdmin() {
  console.log("\n🔧 Super Admin Setup\n");

  const name = await question("Enter Super Admin name: ");
  const email = await question("Enter Super Admin email: ");
  const password = await question("Enter Super Admin password: ");
  const confirmPassword = await question("Confirm password: ");

  if (password !== confirmPassword) {
    console.error("\n❌ Passwords do not match!");
    rl.close();
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("\n❌ Password must be at least 8 characters!");
    rl.close();
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.error(`\n❌ User with email ${email} already exists!`);
      rl.close();
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Super Admin
    const superAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.SUPER_ADMIN,
        emailVerified: new Date(),
      },
    });

    console.log("\n✅ Super Admin created successfully!");
    console.log("\n📋 Details:");
    console.log(`   Name: ${superAdmin.name}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Role: ${superAdmin.role}`);
    console.log(`   ID: ${superAdmin.id}`);
    console.log("\n🔐 You can now login at /login using the Super Admin tab");
  } catch (error) {
    console.error("\n❌ Error creating Super Admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

createSuperAdmin();
