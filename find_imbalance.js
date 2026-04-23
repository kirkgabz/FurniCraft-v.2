const fs = require('fs');
const content = fs.readFileSync('chair.html', 'utf8');

let depth = 0;
let lines = content.split('\n');
let inScript = false;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.includes('<script>')) inScript = true;
    if (line.includes('</script>')) inScript = false;
    
    if (inScript) {
        for (let char of line) {
            if (char === '{') depth++;
            if (char === '}') depth--;
        }
        if (depth < 0) {
            console.log(`Unbalanced '}' on line ${i + 1}: ${line}`);
            depth = 0; // reset to keep searching
        }
    }
}
console.log(`Final depth: ${depth}`);
