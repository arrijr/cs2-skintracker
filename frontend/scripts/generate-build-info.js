// /frontend/scripts/generate-build-info.js (Frontend)
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

function getGitInfo() {
  try {
    const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    return { commit, branch };
  } catch (error) {
    console.warn('Could not get git info:', error.message);
    return { commit: 'unknown', branch: 'main' };
  }
}

function generateBuildInfo() {
  const { commit, branch } = getGitInfo();
  const now = new Date();
  
  const buildInfo = {
    version: process.env.npm_package_version || '1.0.0',
    buildTime: now.toISOString(),
    gitCommit: commit,
    gitBranch: branch,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    lastDeploy: now.toISOString()
  };

  // Write to .env.local for Next.js
  const envContent = Object.entries(buildInfo)
    .map(([key, value]) => `NEXT_PUBLIC_${key.toUpperCase()}=${value}`)
    .join('\n');

  const envPath = join(process.cwd(), '.env.local');
  writeFileSync(envPath, envContent + '\n', { flag: 'a' });

  // Write to build-info.json for reference
  const buildInfoPath = join(process.cwd(), 'build-info.json');
  writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

  console.log('Build info generated:');
  console.log(JSON.stringify(buildInfo, null, 2));
}

generateBuildInfo();
