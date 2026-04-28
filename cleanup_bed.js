// Cleanup script: Remove duplicate uploadToTemplates from builder_bed.html
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'builder_bed.html');
let content = fs.readFileSync(filePath, 'utf8');
const origLen = content.length;

// Remove basic duplicates (id: Date.now() + 20002 pattern)
const basicPattern = /\n\s*function uploadToTemplates\(\) \{\s*\n\s*const nameInput = document\.getElementById\('project-name'\);[\s\S]*?id: Date\.now\(\) \+ 20002[\s\S]*?window\.location\.href = 'templates\.html';\s*\n\s*\}/g;
content = content.replace(basicPattern, '');

// Remove the SECOND complete duplicate at end of file (keep only the first one near line 1662)
// Find all complete uploadToTemplates and remove all but the first
const completePattern = /\n\s*function uploadToTemplates\(\) \{\s*\n\s*\/\/ Capture 3D preview screenshot[\s\S]*?window\.location\.href = 'templates\.html';\s*\n\s*\}/g;
let matchCount = 0;
content = content.replace(completePattern, (match) => {
  matchCount++;
  if (matchCount === 1) return match; // Keep first
  return ''; // Remove subsequent
});

fs.writeFileSync(filePath, content, 'utf8');
console.log(`builder_bed.html: Cleaned ${origLen - content.length} bytes (${origLen} -> ${content.length})`);
console.log(`Kept ${matchCount > 0 ? 1 : 0} complete uploadToTemplates, removed ${matchCount - 1} duplicate(s) and basic versions`);
