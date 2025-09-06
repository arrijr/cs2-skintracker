// /backend/scripts/generate-build-info.js (Backend)
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';

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

function getPackageVersion() {
  try {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
    return packageJson.version || '1.0.0';
  } catch (error) {
    console.warn('Could not read package.json:', error.message);
    return '1.0.0';
  }
}

function generateBuildInfo() {
  const { commit, branch } = getGitInfo();
  const version = getPackageVersion();
  const now = new Date();
  
  const buildInfo = {
    version,
    buildTime: now.toISOString(),
    gitCommit: commit,
    gitBranch: branch,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    lastDeploy: now.toISOString()
  };

  // Write to .env for backend
  const envContent = Object.entries(buildInfo)
    .map(([key, value]) => `${key.toUpperCase()}=${value}`)
    .join('\n');

  const envPath = join(process.cwd(), '.env');
  writeFileSync(envPath, envContent + '\n', { flag: 'a' });

  // Write to build-info.json for reference
  const buildInfoPath = join(process.cwd(), 'build-info.json');
  writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

  console.log('Backend build info generated:');
  console.log(JSON.stringify(buildInfo, null, 2));
}

generateBuildInfo();
