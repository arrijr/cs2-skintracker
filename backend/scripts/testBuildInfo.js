// /backend/scripts/testBuildInfo.js (Backend)
import "dotenv/config";
import { apiFetch } from "../src/lib/http.js";

async function testBuildInfo() {
  console.log("🧪 Testing Build Info System");
  console.log("=============================");

  try {
    // Test backend build info endpoint
    console.log("\n1. Testing Backend Build Info Endpoint:");
    const response = await apiFetch('/api/v1/health/build-info');
    
    if (response.ok) {
      console.log("✅ Backend build info retrieved successfully:");
      console.log(`  Version: ${response.version}`);
      console.log(`  Environment: ${response.environment}`);
      console.log(`  Git Commit: ${response.gitCommit}`);
      console.log(`  Git Branch: ${response.gitBranch}`);
      console.log(`  Node Version: ${response.nodeVersion}`);
      console.log(`  Build Time: ${response.buildTime}`);
      console.log(`  Last Deploy: ${response.lastDeploy}`);
      console.log(`  Uptime: ${response.uptime}s`);
      
      if (response.memory) {
        console.log(`  Memory: ${response.memory.used}MB / ${response.memory.total}MB`);
      }
      
      if (response.platform) {
        console.log(`  Platform: ${response.platform.os} ${response.platform.arch}`);
        console.log(`  PID: ${response.platform.pid}`);
      }
    } else {
      console.log(`❌ Backend build info failed: ${response.error}`);
    }

    // Test environment variables
    console.log("\n2. Testing Environment Variables:");
    const envVars = [
      'APP_VERSION',
      'BUILD_TIME', 
      'GIT_COMMIT',
      'GIT_BRANCH',
      'NODE_ENV',
      'LAST_DEPLOY'
    ];
    
    envVars.forEach(varName => {
      const value = process.env[varName];
      console.log(`  ${varName}: ${value || 'not set'}`);
    });

    // Test process info
    console.log("\n3. Testing Process Information:");
    console.log(`  Node Version: ${process.version}`);
    console.log(`  Platform: ${process.platform}`);
    console.log(`  Architecture: ${process.arch}`);
    console.log(`  PID: ${process.pid}`);
    console.log(`  Uptime: ${Math.floor(process.uptime())}s`);
    
    const memUsage = process.memoryUsage();
    console.log(`  Memory Usage:`);
    console.log(`    Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    console.log(`    Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
    console.log(`    External: ${Math.round(memUsage.external / 1024 / 1024)}MB`);
    console.log(`    RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);

    // Test build info file
    console.log("\n4. Testing Build Info File:");
    try {
      const fs = await import('fs');
      const path = await import('path');
      const buildInfoPath = path.join(process.cwd(), 'build-info.json');
      
      if (fs.existsSync(buildInfoPath)) {
        const buildInfoContent = fs.readFileSync(buildInfoPath, 'utf8');
        const buildInfo = JSON.parse(buildInfoContent);
        console.log("✅ Build info file found:");
        console.log(JSON.stringify(buildInfo, null, 2));
      } else {
        console.log("⚠️  Build info file not found");
      }
    } catch (error) {
      console.log(`❌ Error reading build info file: ${error.message}`);
    }

    // Test API health
    console.log("\n5. Testing API Health:");
    const healthResponse = await apiFetch('/api/v1/health');
    
    if (healthResponse.ok) {
      console.log("✅ API health check passed:");
      console.log(`  Service: ${healthResponse.service}`);
      console.log(`  Timestamp: ${healthResponse.ts}`);
    } else {
      console.log(`❌ API health check failed: ${healthResponse.error}`);
    }

    console.log("\n✅ Build Info System Test Completed Successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testBuildInfo();
