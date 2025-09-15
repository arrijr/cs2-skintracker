// frontend/scripts/smoke.ts — [Frontend]
// {/* Smoke tests for critical endpoints */}

import 'dotenv/config';
import { apiUrl } from '../src/lib/api';

async function check(path: string) {
  const url = apiUrl(path);
  console.log(`🔍 Testing: ${path}`);
  
  try {
    const res = await fetch(url);
    console.log(`   Status: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      const body = await res.text();
      console.log(`   Body: ${body.substring(0, 200)}${body.length > 200 ? '...' : ''}`);
    }
    
    return res.ok;
  } catch (error) {
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function runSmokeTests() {
  console.log('🚀 Starting smoke tests...\n');
  
  const tests = [
    '/api/v1/health/build-info',
    '/api/v1/skins?sort=name_asc&page=1&pageSize=24',
    '/api/v1/skins/presets',
    '/api/v1/skins/filters',
    '/api/v1/skins/categories'
  ];
  
  const results = await Promise.all(tests.map(async (path) => {
    const success = await check(path);
    return { path, success };
  }));
  
  console.log('\n📊 Results:');
  results.forEach(({ path, success }) => {
    console.log(`${success ? '✅' : '❌'} ${path}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`\n🎯 ${successCount}/${totalCount} tests passed`);
  
  if (successCount === totalCount) {
    console.log('🎉 All smoke tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed!');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runSmokeTests().catch(console.error);
}

export { runSmokeTests };
