// /backend/scripts/testRBAC.js (Backend)
import "dotenv/config";
import { 
  getUserRoleFromDB, 
  getUserRoleByEmail, 
  isAdminUser, 
  hasRole,
  updateUserRole,
  getAllUsersWithRoles,
  ROLES
} from "../src/utils/roleHelpers.js";
import prisma from "../src/prisma/prismaClient.js";

async function testRBAC() {
  console.log("🧪 Testing RBAC System (DB-first approach)");
  console.log("==========================================");

  try {
    // 1. Test getting all users with roles
    console.log("\n1. Getting all users with roles:");
    const usersResult = await getAllUsersWithRoles();
    
    if (usersResult.success) {
      console.log(`✅ Found ${usersResult.users.length} users:`);
      usersResult.users.forEach(user => {
        console.log(`  - ${user.email}: ${user.role} (Admin: ${user.isAdmin})`);
      });
    } else {
      console.log(`❌ Error getting users: ${usersResult.error}`);
    }

    // 2. Test role checks for existing users
    console.log("\n2. Testing role checks:");
    const testUsers = await prisma.user.findMany({
      take: 3,
      select: { id: true, email: true, clerkId: true, role: true }
    });

    for (const user of testUsers) {
      console.log(`\n🔍 Testing user: ${user.email}`);
      
      // Test by Clerk ID
      if (user.clerkId) {
        const roleByClerkId = await getUserRoleFromDB(user.clerkId);
        console.log(`  By Clerk ID: ${roleByClerkId.role} (Admin: ${roleByClerkId.isAdmin})`);
      }
      
      // Test by email
      const roleByEmail = await getUserRoleByEmail(user.email);
      console.log(`  By Email: ${roleByEmail.role} (Admin: ${roleByEmail.isAdmin})`);
      
      // Test admin check
      if (user.clerkId) {
        const isAdmin = await isAdminUser(user.clerkId);
        console.log(`  Is Admin: ${isAdmin}`);
      }
      
      // Test specific role check
      if (user.clerkId) {
        const hasAdminRole = await hasRole(user.clerkId, 'admin');
        const hasUserRole = await hasRole(user.clerkId, 'user');
        console.log(`  Has Admin Role: ${hasAdminRole}, Has User Role: ${hasUserRole}`);
      }
    }

    // 3. Test role updates (if we have users)
    if (testUsers.length > 0) {
      console.log("\n3. Testing role updates:");
      const testUser = testUsers[0];
      
      console.log(`🔧 Testing role update for: ${testUser.email}`);
      console.log(`  Current role: ${testUser.role}`);
      
      // Try to update role (only if not already admin)
      if (testUser.role !== 'admin') {
        const updateResult = await updateUserRole(testUser.id, 'admin');
        if (updateResult.success) {
          console.log(`  ✅ Updated to admin: ${updateResult.user.role}`);
          
          // Verify the update
          const updatedRole = await getUserRoleFromDB(testUser.clerkId);
          console.log(`  ✅ Verified: ${updatedRole.role} (Admin: ${updatedRole.isAdmin})`);
          
          // Revert back to user
          const revertResult = await updateUserRole(testUser.id, 'user');
          if (revertResult.success) {
            console.log(`  ✅ Reverted to user: ${revertResult.user.role}`);
          }
        } else {
          console.log(`  ❌ Update failed: ${updateResult.error}`);
        }
      } else {
        console.log(`  ⏭️  User already admin, skipping update test`);
      }
    }

    // 4. Test invalid role handling
    console.log("\n4. Testing invalid role handling:");
    if (testUsers.length > 0) {
      const testUser = testUsers[0];
      const invalidRoleResult = await updateUserRole(testUser.id, 'invalid_role');
      if (!invalidRoleResult.success) {
        console.log(`  ✅ Correctly rejected invalid role: ${invalidRoleResult.error}`);
      } else {
        console.log(`  ❌ Should have rejected invalid role`);
      }
    }

    // 5. Test role constants
    console.log("\n5. Testing role constants:");
    console.log(`  Available roles: ${Object.values(ROLES).join(', ')}`);
    console.log(`  Admin role: ${ROLES.ADMIN}`);
    console.log(`  User role: ${ROLES.USER}`);

    // 6. Test edge cases
    console.log("\n6. Testing edge cases:");
    
    // Non-existent Clerk ID
    const nonExistentRole = await getUserRoleFromDB('non-existent-clerk-id');
    console.log(`  Non-existent Clerk ID: ${nonExistentRole.role} (Admin: ${nonExistentRole.isAdmin})`);
    
    // Non-existent email
    const nonExistentEmail = await getUserRoleByEmail('non-existent@example.com');
    console.log(`  Non-existent email: ${nonExistentEmail.role} (Admin: ${nonExistentEmail.isAdmin})`);

    // 7. Test database consistency
    console.log("\n7. Testing database consistency:");
    const dbUsers = await prisma.user.findMany({
      select: { id: true, email: true, clerkId: true, role: true }
    });
    
    let consistentCount = 0;
    for (const user of dbUsers) {
      if (user.clerkId) {
        const roleFromDB = await getUserRoleFromDB(user.clerkId);
        const isConsistent = roleFromDB.role === user.role;
        if (isConsistent) consistentCount++;
        
        if (!isConsistent) {
          console.log(`  ⚠️  Inconsistency for ${user.email}: DB=${user.role}, Helper=${roleFromDB.role}`);
        }
      }
    }
    
    console.log(`  ✅ Consistent roles: ${consistentCount}/${dbUsers.length} users`);

    console.log("\n✅ RBAC System Test Completed Successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRBAC();
