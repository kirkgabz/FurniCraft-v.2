// Cleanup script: Remove duplicate uploadToTemplates from head scripts in builder files
const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const origLen = content.length;
  
  // Pattern: match standalone uploadToTemplates function blocks (basic version with id: Date.now() + 20002)
  // These are the old duplicates that override the correct complete version
  const pattern = /\n\s*function uploadToTemplates\(\) \{\s*\n\s*const nameInput = document\.getElementById\('project-name'\);[\s\S]*?id: Date\.now\(\) \+ 20002[\s\S]*?window\.location\.href = 'templates\.html';\s*\n\s*\}/g;
  
  content = content.replace(pattern, '');
  
  if (content.length < origLen) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`${path.basename(filePath)}: Cleaned ${origLen - content.length} bytes (${origLen} -> ${content.length})`);
  } else {
    console.log(`${path.basename(filePath)}: No duplicates found`);
  }
}

const files = [
  'builder_sofa.html',
  'builder_stool.html', 
  'builder_table.html'
];

files.forEach(f => cleanFile(path.join(__dirname, f)));
console.log('Done!');
