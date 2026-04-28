const fs = require('fs');
const path = require('path');

const dir = __dirname;

const furnitures = [
  { type: 'table', icon: 'fa-utensils', defaultName: 'Custom Dining Table', tag: 'Table' },
  { type: 'bed', icon: 'fa-bed', defaultName: 'Custom Bed', tag: 'Bed' },
  { type: 'bookshelf', icon: 'fa-book', defaultName: 'Custom Bookshelf', tag: 'Bookshelf' },
  { type: 'cabinet', icon: 'fa-door-closed', defaultName: 'Custom Cabinet', tag: 'Cabinet' },
  { type: 'desk', icon: 'fa-desktop', defaultName: 'Custom Desk', tag: 'Desk' },
  { type: 'sofa', icon: 'fa-couch', defaultName: 'Custom Sofa', tag: 'Sofa' },
  { type: 'stool', icon: 'fa-chair', defaultName: 'Custom Stool', tag: 'Stool' },
  { type: 'chair', icon: 'fa-chair', defaultName: 'Custom Chair', tag: 'Chair' }
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

furnitures.forEach(({ type, icon, defaultName, tag }) => {
  const sourceFile = path.join(dir, type + '.html');
  const targetFile = path.join(dir, 'builder_' + type + '.html');
  
  if (!fs.existsSync(sourceFile)) {
    console.log('Source file missing: ' + sourceFile);
    return;
  }
  
  let content = fs.readFileSync(sourceFile, 'utf8');

  // 1. Replace the Export button with Upload to Templates button
  content = content.replace(
    /<button class="btn-export"\s*onclick="goToExport\(\)">/g,
    '<button class="btn-export" style="background: linear-gradient(135deg,#10b981,#059669) !important;" onclick="uploadToTemplates()">'
  );
  content = content.replace(/<i class="fas fa-file-export"><\/i>\s*Export/g, '<i class="fas fa-cloud-upload-alt"></i> Upload to Templates');

  // Also remove any existing initShopMode IIFE or hidden buttons if they exist
  content = content.replace(/\/\*[\s\S]*?Shop Mode:[\s\S]*?\*\/\s*\([\s\S]*?\}\)\(\);/g, '');
  content = content.replace(/<button[^>]*id="btn-upload-template"[^>]*>[\s\S]*?<\/button>/g, '');
  content = content.replace(/<button[^>]*id="btn-main-export"[^>]*>[\s\S]*?<\/button>/g, 
    '<button class="btn-export" style="background: linear-gradient(135deg,#10b981,#059669) !important;" onclick="uploadToTemplates()">\n        <i class="fas fa-cloud-upload-alt"></i> Upload to Templates\n      </button>'
  );

  // 2. Replace goToExport() with uploadToTemplates()
  const fnRegex = /function goToExport\(\)\s*\{[\s\S]*?window\.location\.href\s*=\s*'export_area\.html';\s*\n?\s*\}/g;
  const newFn = makeUploadFn(type, icon, defaultName, tag);
  
  if (fnRegex.test(content)) {
    content = content.replace(fnRegex, newFn);
  } else {
    // If we couldn't find goToExport, check if it's uploadToTemplates already
    const uploadRegex = /function uploadToTemplates\(\)\s*\{[\s\S]*?window\.location\.href\s*=\s*'templates\.html';\s*\n?\s*\}/g;
    if (uploadRegex.test(content)) {
      content = content.replace(uploadRegex, newFn);
    }
  }

  // 3. Update any back button that goes to 'craft.html' to maybe keep the style or ID if needed, 
  // but since we are mirroring, it's fine.

  fs.writeFileSync(targetFile, content);
  console.log('Successfully cloned and updated: ' + targetFile);
});
