// Automatic Documentation Update Script
// Usage: node scripts/update-docs.js [type] [description]

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const CHANGELOG_PATH = path.join(DOCS_DIR, 'CHANGELOG.md');

function updateChangelog(type, description) {
  const date = new Date().toISOString().split('T')[0];
  const entry = `## ${date} - ${type}: ${description}
- **Timestamp:** ${new Date().toISOString()}
- **Type:** ${type}
- **Description:** ${description}

`;

  if (fs.existsSync(CHANGELOG_PATH)) {
    const content = fs.readFileSync(CHANGELOG_PATH, 'utf8');
    const updatedContent = entry + content;
    fs.writeFileSync(CHANGELOG_PATH, updatedContent);
    console.log('✅ Updated CHANGELOG.md');
  } else {
    console.log('❌ CHANGELOG.md not found');
  }
}

function updateAPI(files) {
  // Auto-update API.md based on changed files
  console.log('📝 API documentation update needed for:', files);
  // TODO: Implement automatic API doc updates
}

function updateArchitecture(changes) {
  // Auto-update ARCHITECTURE.md
  console.log('🏗️ Architecture documentation update needed for:', changes);
  // TODO: Implement automatic architecture doc updates
}

// Main function
const args = process.argv.slice(2);
const type = args[0] || 'change';
const description = args[1] || 'Documentation update';

console.log('📚 Updating documentation...');
updateChangelog(type, description);

// Check for specific file types that need special handling
const changedFiles = args.slice(2) || [];
const apiFiles = changedFiles.filter(f => f.includes('/routes/') || f.includes('/controllers/'));
const archFiles = changedFiles.filter(f => f.includes('/cron/') || f.includes('/services/'));

if (apiFiles.length > 0) {
  updateAPI(apiFiles);
}

if (archFiles.length > 0) {
  updateArchitecture(archFiles);
}

console.log('✅ Documentation update complete!');
