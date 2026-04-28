const fs = require('fs');
const path = require('path');

const files = [
  'builder_bed.html', 'builder_bookshelf.html', 'builder_cabinet.html',
  'builder_chair.html', 'builder_desk.html', 'builder_sofa.html',
  'builder_stool.html', 'builder_table.html'
];

files.forEach(f => {
  const filePath = path.join(__dirname, f);
  let content = fs.readFileSync(filePath, 'utf8');

  // We want to replace the body of uploadToTemplates() with a more robust one that alerts on error.
  const regex = /function uploadToTemplates\(\) \{([\s\S]*?)window\.location\.href = 'templates\.html';\s*\n\s*\}/;
  
  const match = content.match(regex);
  if (!match) {
    console.log(`Could not find uploadToTemplates in ${f}`);
    return;
  }

  // Extract the type from the tmpl object to keep it dynamic per file
  const typeMatch = match[1].match(/type:\s*'([^']+)'/);
  const typeStr = typeMatch ? typeMatch[1] : 'furniture';
  const iconMatch = match[1].match(/icon:\s*'([^']+)'/);
  const iconStr = iconMatch ? iconMatch[1] : 'fa-couch';
  
  const newBody = `function uploadToTemplates() {
      try {
        let previewDataUrl = '';
        try {
          if (typeof controls !== 'undefined') controls.autoRotate = false;
          if (typeof showDimensions !== 'undefined' && typeof build3DScene === 'function') { showDimensions = false; build3DScene(); }
          if (typeof renderer !== 'undefined' && typeof scene !== 'undefined' && typeof camera !== 'undefined') renderer.render(scene, camera);
          const canvas = document.querySelector('#canvas-container canvas');
          if (canvas) previewDataUrl = canvas.toDataURL('image/png');
          if (typeof controls !== 'undefined') controls.autoRotate = true;
          if (typeof showDimensions !== 'undefined' && typeof build3DScene === 'function') { showDimensions = true; build3DScene(); }
        } catch(e) { console.warn("Screenshot failed:", e); }

        const nameInput = document.getElementById('project-name');
        const projectName = (nameInput && nameInput.value ? nameInput.value.trim() : '') || 'Custom ${typeStr}';
        const priceEl = document.getElementById('total-price');
        const priceText = priceEl ? priceEl.innerText.replace(/[^0-9.]/g, '') : '8000';
        const costVal = parseFloat(priceText) || 8000;

        const ai = (typeof getActiveItem === 'function') ? getActiveItem() : null;
        const selections = (ai && ai.selections) ? JSON.parse(JSON.stringify(ai.selections)) : {};
        const carvings = (ai && ai.carvings) ? JSON.parse(JSON.stringify(ai.carvings)) : {};
        const shapes = (ai && ai.shapes) ? JSON.parse(JSON.stringify(ai.shapes)) : {};
        const dims = (ai && ai.dims) ? JSON.parse(JSON.stringify(ai.dims)) : {};
        const scale = (ai && ai.globalScale) ? JSON.parse(JSON.stringify(ai.globalScale)) : {x:1,y:1,z:1};
        const partsList = (ai && ai.parts) ? ai.parts : Object.keys(selections);

        const tmpl = {
          id: Date.now() + Math.floor(Math.random()*9000+10000),
          type: '${typeStr}', name: projectName, icon: '${iconStr}', badge: 'new', gender: 'neutral',
          description: 'Custom ${typeStr} crafted in the 3D studio by ' + (sessionStorage.getItem('username') || 'Shop Owner') + '.',
          tags: ['${typeStr.charAt(0).toUpperCase() + typeStr.slice(1)}', 'Custom', 'Shop Design'],
          parts: partsList, selections: selections, carvings: carvings, shapes: shapes, dims: dims, scale: scale, basePrice: costVal,
          previewDataUrl: previewDataUrl, publishedBy: sessionStorage.getItem('username') || 'Shop Owner',
          publishedAt: new Date().toISOString(), designData: ai
        };

        let globals = [];
        try { globals = JSON.parse(localStorage.getItem('shop_templates_global') || '[]'); } catch(e) { globals = []; }
        if (!Array.isArray(globals)) globals = [];
        globals.unshift(tmpl); 
        localStorage.setItem('shop_templates_global', JSON.stringify(globals));
        
        let custom = [];
        try { custom = JSON.parse(localStorage.getItem('shop_custom_designs') || '[]'); } catch(e) { custom = []; }
        if (!Array.isArray(custom)) custom = [];
        custom.unshift(tmpl); 
        localStorage.setItem('shop_custom_designs', JSON.stringify(custom));
        
        if (typeof saveState === 'function') saveState();
        alert('\\u2705 "' + tmpl.name + '" has been uploaded to Templates!');
        window.location.href = 'templates.html';
      } catch (err) {
        alert("Error saving template: " + err.message);
        console.error(err);
      }
    }`;

  content = content.replace(regex, newBody);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${f}`);
});
