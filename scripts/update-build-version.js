/**
 * AUTO-UPDATE BUILD VERSION
 * 
 * Purpose: Updates build version timestamp on every dev server start
 * This forces browser cache invalidation when code changes
 */

const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, '../lib/build-version.ts');
const buildVersion = Date.now().toString();
const buildDate = new Date().toISOString();

const content = `// Auto-generated build version - DO NOT EDIT MANUALLY
// Generated: ${buildDate}
export const BUILD_VERSION = '${buildVersion}';
export const BUILD_DATE = '${buildDate}';
`;

fs.writeFileSync(versionFile, content, 'utf8');

console.log(`✅ Updated build version: ${buildVersion}`);

