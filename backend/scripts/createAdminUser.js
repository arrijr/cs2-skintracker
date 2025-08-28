import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    const email = "test@test.de";
    const password = "12345678";
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      if (existingAdmin.role === 'admin') {
        console.log(`✅ Admin user ${email} already exists`);
        return;
      } else {
        // Update existing user to admin
        await prisma.user.update({
          where: { email },
          data: { role: 'admin' }
        });
        console.log(`✅ Updated ${email} to admin role`);
        return;
      }
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const adminUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        displayName: "Test Admin",
        role: "admin",
        isPremium: true
      }
    });

    console.log(`✅ Admin user created successfully!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🆔 User ID: ${adminUser.id}`);
    console.log(`\n⚠️  IMPORTANT: Change the password after first login!`);

  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
