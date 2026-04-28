const fs = require('fs');
const html = fs.readFileSync('c:\\Users\\Lenovo\\Desktop\\Prototype\\FurniCraft\\cabinet.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/i);
if (scriptMatch) {
  const code = scriptMatch[1];
  try {
    new Function(code);
    console.log('No syntax errors found.');
  } catch (e) {
    console.error('Syntax error:', e.message);
    
    // Write the code to a file so we can run node -c on it to get line numbers
    fs.writeFileSync('c:\\Users\\Lenovo\\Desktop\\Prototype\\FurniCraft\\scratch\\cabinet_code.js', code);
    console.log('Saved to scratch/cabinet_code.js');
  }
} else {
  console.log('No script tag found');
}
