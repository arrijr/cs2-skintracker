// backend/scripts/render-deploy.js — [Backend]
// {/* Render Deploy Script - Automatically runs Prisma migrations */}
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runRenderDeploy() {
  console.log('🚀 Starting Render deployment process...');
  
  try {
    // Step 1: Generate Prisma Client
    console.log('📦 Generating Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Step 2: Run database migrations
    console.log('🗄️ Running database migrations...');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Migrations completed successfully');
    } catch (migrationError) {
      console.log('⚠️ Migration failed, trying db push as fallback...');
      try {
        execSync('npx prisma db push', { stdio: 'inherit' });
        console.log('✅ Database schema updated via db push');
      } catch (pushError) {
        console.error('❌ Both migration and db push failed:', pushError.message);
        throw pushError;
      }
    }
    
    // Step 3: Verify database connection
    console.log('🔍 Verifying database connection...');
    await prisma.$connect();
    console.log('✅ Database connection verified');
    
    // Step 4: Check if tables exist
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log(`📊 Found ${tableCount[0].count} tables in database`);
    
    console.log('🎉 Render deployment process completed successfully!');
    
  } catch (error) {
    console.error('❌ Render deployment failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runRenderDeploy();
}

export default runRenderDeploy;
