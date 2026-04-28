function goToExport(){
  if(!activeTemplate) return;
  const price=document.getElementById('total-price').innerText.replace(/[^0-9.-]+/g,'');
  
  let prevImageUrl = activeTemplate.previewDataUrl || '';
  let itemData = null;

  // 1. Identify/Clone Item Data
  if (activeTemplate.id > 10000 && activeTemplate.designData) {
      itemData = JSON.parse(JSON.stringify(activeTemplate.designData));
  } else {
      itemData = {
          id: activeTemplate.id,
          type: activeTemplate.type,
          name: activeTemplate.name,
          dims: activeTemplate.dims || {},
          globalScale: activeTemplate.scale || {x:1, y:1, z:1},
          selections: activeTemplate.selections || {}
      };
  }

  // 2. Ensure Materials Map and Analysis Scores are accurate
  if (!itemData.materials) itemData.materials = {};
  let td=0, tq=0, count=0;
  const sels = itemData.selections || {};
  Object.keys(sels).forEach(part => {
      const hexC = sels[part];
      const mk = Object.keys(materialDB).find(k=>materialDB[k].hex.toLowerCase()===hexC.toLowerCase());
      if(mk) {
          const m=materialDB[mk];
          itemData.materials[part] = m.name; 
          td+=m.dura; tq+=m.qual; count++;
      } else {
          if (!itemData.materials[part]) itemData.materials[part] = 'Standard Wood';
          td+=50; tq+=50; count++;
      }
  });
  
  const finalD = count ? Math.round(td/count) : 0;
  const finalQ = count ? Math.round(tq/count) : 0;
  itemData.analysis = { durability: finalD, quality: finalQ };

  // 3. Helper to compress canvas
  function compressCanvas(canvasEl) {
      if (!canvasEl) return '';
      try {
          const tmp = document.createElement('canvas');
          tmp.width = 500;
          tmp.height = 400;
          const ctx = tmp.getContext('2d');
          ctx.fillStyle = '#1e1e24';
          ctx.fillRect(0,0,500,400);
          const s = Math.min(500/canvasEl.width, 400/canvasEl.height);
          ctx.drawImage(canvasEl, (500-canvasEl.width*s)/2, (400-canvasEl.height*s)/2, canvasEl.width*s, canvasEl.height*s);
          return tmp.toDataURL('image/jpeg', 0.8);
      } catch(e) { return ''; }
  }

  // 4. Capture EXACT current viewport
  try {
      // If there's an active renderer/scene/camera, render it as is
      if (typeof renderer !== 'undefined' && renderer && typeof scene !== 'undefined' && scene && typeof camera !== 'undefined' && camera) {
          renderer.render(scene, camera);
      }
      
      const canvas = document.querySelector('#canvas-container canvas');
      if (canvas) {
          const freshImg = compressCanvas(canvas);
          if (freshImg) prevImageUrl = freshImg;
      }
  } catch(e) { console.warn('Export screenshot failed:', e); }

  // 5. Build export object
  const exp={
      exportId:'EXP-'+Date.now().toString().slice(-6),
      projectName:activeTemplate.name,
      furnitureType: activeTemplate.id > 10000 ? 'Custom Shop Design' : 'Pre-Made Template',
      estimatedPriceText:'₱'+parseFloat(price).toLocaleString(),
      previewDataUrl:prevImageUrl,
      cadState:JSON.stringify({items:[itemData]})
  };
  
  try {
      let drafts=JSON.parse(localStorage.getItem('exportDrafts')||'[]');
      if (drafts.length > 15) drafts = drafts.slice(0, 15);
      drafts.unshift(exp); 
      localStorage.setItem('exportDrafts',JSON.stringify(drafts));
      sessionStorage.setItem('currentExportId',exp.exportId);
      window.location.href='export_area.html';
  } catch (err) {
      alert("Storage quota exceeded. Clearing old export drafts.");
      localStorage.removeItem('exportDrafts');
      localStorage.setItem('exportDrafts', JSON.stringify([exp]));
      sessionStorage.setItem('currentExportId',exp.exportId);
      window.location.href='export_area.html';
  }
}
