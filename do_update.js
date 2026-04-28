const fs = require('fs');
const path = require('path');

const dir = __dirname;

const builderFiles = [
  { file: 'builder_table.html', type: 'table', icon: 'fa-utensils', defaultName: 'Custom Dining Table', tag: 'Table' },
  { file: 'builder_bed.html', type: 'bed', icon: 'fa-bed', defaultName: 'Custom Bed', tag: 'Bed' },
  { file: 'builder_bookshelf.html', type: 'bookshelf', icon: 'fa-book', defaultName: 'Custom Bookshelf', tag: 'Bookshelf' },
  { file: 'builder_cabinet.html', type: 'cabinet', icon: 'fa-door-closed', defaultName: 'Custom Cabinet', tag: 'Cabinet' },
  { file: 'builder_desk.html', type: 'desk', icon: 'fa-desktop', defaultName: 'Custom Desk', tag: 'Desk' },
  { file: 'builder_sofa.html', type: 'sofa', icon: 'fa-couch', defaultName: 'Custom Sofa', tag: 'Sofa' },
  { file: 'builder_stool.html', type: 'stool', icon: 'fa-chair', defaultName: 'Custom Stool', tag: 'Stool' },
];

function makeUploadFn(type, icon, defaultName, tag) {
  return `function uploadToTemplates() {
      // Capture 3D preview screenshot
      let previewDataUrl = '';
      try {
        // Capture exact current viewport state (including rotation and dimensions if visible)
        if (typeof renderer !== 'undefined' && typeof scene !== 'undefined' && typeof camera !== 'undefined') renderer.render(scene, camera);
        const canvas = document.querySelector('#canvas-container canvas');
        if (canvas) previewDataUrl = canvas.toDataURL('image/png');
      } catch(e) {}

      const nameInput = document.getElementById('project-name');
      const projectName = (nameInput && nameInput.value.trim()) || '${defaultName}';
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
        type: '${type}', name: projectName, icon: '${icon}', badge: 'new', gender: 'neutral',
        description: 'Custom ${type} crafted in the 3D studio by ' + (sessionStorage.getItem('username') || 'Shop Owner') + '.',
        tags: ['${tag}','Custom','Shop Design'], parts: partsList, selections: selections,
        carvings: carvings, shapes: shapes, dims: dims, scale: scale, basePrice: costVal,
        previewDataUrl: previewDataUrl, publishedBy: sessionStorage.getItem('username') || 'Shop Owner',
        publishedAt: new Date().toISOString(), designData: ai
      };

      let globals = JSON.parse(localStorage.getItem('shop_templates_global') || '[]');
      globals.unshift(tmpl); localStorage.setItem('shop_templates_global', JSON.stringify(globals));
      let custom = JSON.parse(localStorage.getItem('shop_custom_designs') || '[]');
      custom.unshift(tmpl); localStorage.setItem('shop_custom_designs', JSON.stringify(custom));
      if (typeof saveState === 'function') saveState();
      alert('\\u2705 \"' + tmpl.name + '\" has been uploaded to Templates!');
      window.location.href = 'templates.html';
    }`;
}

builderFiles.forEach(({ file, type, icon, defaultName, tag }) => {
  const fp = path.join(dir, file);
  let c = fs.readFileSync(fp, 'utf8');

  // 1. Replace button HTML - change onclick, icon, label, and add green gradient style
  // Match the export button pattern (not the Back button which has style="background:#444")
  c = c.replace(
    /<button class="btn-export"(\s*)onclick="goToExport\(\)">/g,
    '<button class="btn-export" style="background: linear-gradient(135deg,#10b981,#059669) !important;"$1onclick="uploadToTemplates()">'
  );
  // Change the icon and label inside that button
  c = c.replace(/<i class="fas fa-file-export"><\/i>\s*Export/g, '<i class="fas fa-cloud-upload-alt"></i> Upload to Templates');

  // 2. Replace the goToExport function body with uploadToTemplates
  const fnRegex = /function goToExport\(\)\s*\{[\s\S]*?window\.location\.href\s*=\s*'export_area\.html';\s*\n?\s*\}/;
  const newFn = makeUploadFn(type, icon, defaultName, tag);
  if (fnRegex.test(c)) {
    c = c.replace(fnRegex, newFn);
    console.log(file + ': replaced goToExport function body');
  } else {
    console.log(file + ': WARNING - could not find goToExport function');
  }

  // 3. Also handle any remaining goToExport references (there may be duplicates in some files)
  // Replace ALL remaining goToExport occurrences
  let count = 0;
  while (fnRegex.test(c)) {
    c = c.replace(fnRegex, newFn);
    count++;
    if (count > 5) break; // safety
  }
  if (count > 0) console.log(file + ': replaced ' + count + ' additional goToExport occurrences');

  fs.writeFileSync(fp, c);
  console.log(file + ': DONE');
});

console.log('\\nAll 7 builder files updated successfully!');
