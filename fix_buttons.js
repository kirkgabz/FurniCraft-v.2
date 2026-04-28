const fs = require('fs');
const path = require('path');

const files = [
    'bed.html', 'cabinet.html', 'chair.html', 'desk.html',
    'sofa.html', 'stool.html', 'table.html', 'bookshelf.html'
];

const robust_function = `    function goToExport() {
      let previewImageURL = '';
      try {
        const wasRotating = (typeof controls !== 'undefined' && controls) ? controls.autoRotate : false;
        const wereDimsShowing = typeof showDimensions !== 'undefined' ? showDimensions : false;
        if (wasRotating && typeof controls !== 'undefined' && controls) controls.autoRotate = false;
        if (wereDimsShowing && typeof build3DScene === 'function') { showDimensions = false; build3DScene(); }
        if (typeof renderer !== 'undefined' && renderer && typeof scene !== 'undefined' && scene && typeof camera !== 'undefined' && camera) {
          renderer.render(scene, camera);
        }
        const canvas = document.querySelector('#canvas-container canvas');
        if (canvas) previewImageURL = canvas.toDataURL('image/png');
        if (wasRotating && typeof controls !== 'undefined' && controls) controls.autoRotate = true;
        if (wereDimsShowing && typeof build3DScene === 'function') { showDimensions = true; build3DScene(); }
      } catch(e) { console.warn('Export screenshot failed:', e); }

      const activeItem = typeof getActiveItem === 'function' ? getActiveItem() : null;
      if (!activeItem) {
        if(typeof saveState === 'function') saveState();
        window.location.href = 'export_area.html';
        return;
      }

      const priceEl = document.getElementById('total-price');
      const priceText = priceEl ? (priceEl.innerText || priceEl.textContent || '0') : '0';
      const numericPrice = parseFloat(priceText.replace(/[^0-9.-]+/g, '')) || 0;
      
      const duraEl = document.getElementById('score-dura-val');
      const qualEl = document.getElementById('score-qual-val');
      const durabilityText = duraEl ? (duraEl.innerText || duraEl.textContent || '90').replace('%','') : '90';
      const qualityText = qualEl ? (qualEl.innerText || qualEl.textContent || '90').replace('%','') : '90';
      
      const formattedMaterials = {};
      Object.keys(activeItem.selections || {}).forEach(p => {
        const hex = activeItem.selections[p];
        const matKey = typeof materialDB !== 'undefined' ? Object.keys(materialDB).find(k => materialDB[k].hex && materialDB[k].hex.toLowerCase() === hex.toLowerCase()) : null;
        formattedMaterials[p] = matKey ? materialDB[matKey].name : 'Custom Material';
      });

      let configObj = { style: activeItem.style };
      if (activeItem.shelfCount !== undefined) configObj.shelfCount = activeItem.shelfCount;
      if (activeItem.doorCount !== undefined) configObj.doorCount = activeItem.doorCount;
      if (activeItem.drawerCount !== undefined) configObj.drawerCount = activeItem.drawerCount;
      if (activeItem.seatCount !== undefined) configObj.seatCount = activeItem.seatCount;
      
      let fType = "Designer Pro";
      if(window.location.pathname.includes("bed")) fType = "Bed Designer Pro";
      else if(window.location.pathname.includes("cabinet")) fType = "Cabinet Designer Pro";
      else if(window.location.pathname.includes("chair")) fType = "Chair Designer Pro";
      else if(window.location.pathname.includes("desk")) fType = "Desk Designer Pro";
      else if(window.location.pathname.includes("sofa")) fType = "Sofa Designer Pro";
      else if(window.location.pathname.includes("stool")) fType = "Stool Designer Pro";
      else if(window.location.pathname.includes("table")) fType = "Table Designer Pro";
      else if(window.location.pathname.includes("bookshelf")) fType = "Bookshelf Designer Pro";

      const exportData = {
        exportId: 'EXP-' + Date.now().toString().slice(-6),
        projectName: activeItem.name || 'Custom Design',
        furnitureType: fType,
        estimatedPriceText: '₱' + numericPrice.toLocaleString('en-US'),
        previewDataUrl: previewImageURL,
        cadState: JSON.stringify({ items: [{ id: activeItem.id, globalScale: activeItem.globalScale || {x:1,y:1,z:1}, materials: formattedMaterials, dims: activeItem.dims || {}, config: configObj, analysis: { durability: parseInt(durabilityText)||90, quality: parseInt(qualityText)||90 } }] })
      };
      
      const drafts = JSON.parse(localStorage.getItem('exportDrafts') || '[]');
      drafts.unshift(exportData);
      localStorage.setItem('exportDrafts', JSON.stringify(drafts));
      sessionStorage.setItem('currentExportId', exportData.exportId);
      if(typeof saveState === 'function') saveState();
      window.location.href = 'export_area.html';
    }`;

const dir = 'c:\\CASE STUDY\\FurniCraft';
const pattern1 = /function\s+goToExport\(\)\s*\{[\s\S]*?window\.location\.href\s*=\s*'export_area\.html';\s*\n?\s*\}/g;
const pattern2 = /function\s+goToExport\(\)\s*\{[\s\S]*?renderer\.render\(scene,\s*camera\);[\s\S]*?window\.location\.href\s*=\s*'export_area\.html';\s*\n?\s*\}/g;

files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let matches = content.match(pattern1) || content.match(pattern2);
        
        if (matches) {
            let newContent = content.replace(matches[0], robust_function);
            for (let i = 1; i < matches.length; i++) {
                newContent = newContent.replace(matches[i], '');
            }
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Fixed ${file} (found ${matches.length} occurrences)`);
        } else {
            console.log(`No match found in ${file}`);
        }
    } else {
        console.log(`${file} does not exist.`);
    }
});
