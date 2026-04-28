import os
import re

files = [
    'builder_bed.html', 'builder_bookshelf.html', 'builder_cabinet.html',
    'builder_chair.html', 'builder_desk.html', 'builder_sofa.html',
    'builder_stool.html', 'builder_table.html'
]

# We want to replace the body of uploadToTemplates() in all files.
# For builder_cabinet.html which already has the try-catch, we replace it too.
# The general regex matches everything between `function uploadToTemplates() {` and `window.location.href = 'templates.html';\s*}` or `window.location.href = 'templates.html';\s*}\s*catch\s*\(err\)\s*{\s*alert[^}]*}\s*}`

pattern = re.compile(r'function uploadToTemplates\(\)\s*\{([\s\S]*?)(?:window\.location\.href\s*=\s*[\'"]templates\.html[\'"];\s*\}|window\.location\.href\s*=\s*[\'"]templates\.html[\'"];\s*\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*?\}\s*\})')

for f in files:
    filepath = os.path.join(r'c:\CASE STUDY\FurniCraft', f)
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
    
    match = pattern.search(content)
    if not match:
        print(f"Could not find uploadToTemplates in {f}")
        continue
    
    body = match.group(1)
    
    # Extract type and icon
    type_match = re.search(r"type:\s*'([^']+)'", body)
    icon_match = re.search(r"icon:\s*'([^']+)'", body)
    
    # Default fallback
    type_str = type_match.group(1) if type_match else 'furniture'
    icon_str = icon_match.group(1) if icon_match else 'fa-couch'
    
    new_func = f"""function uploadToTemplates() {{
      try {{
        // Capture 3D preview screenshot (Downscaled to prevent localStorage QuotaExceededError)
        let previewDataUrl = '';
        try {{
          if (typeof controls !== 'undefined') controls.autoRotate = false;
          if (typeof showDimensions !== 'undefined' && typeof build3DScene === 'function') {{ showDimensions = false; build3DScene(); }}
          if (typeof renderer !== 'undefined' && typeof scene !== 'undefined' && typeof camera !== 'undefined') renderer.render(scene, camera);
          
          const canvas = document.querySelector('#canvas-container canvas');
          if (canvas) {{
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = 400; // max width
            tmpCanvas.height = Math.floor(400 * (canvas.height / canvas.width));
            const ctx = tmpCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, 0, tmpCanvas.width, tmpCanvas.height);
            previewDataUrl = tmpCanvas.toDataURL('image/jpeg', 0.6); // heavily compress
          }}
          
          if (typeof controls !== 'undefined') controls.autoRotate = true;
          if (typeof showDimensions !== 'undefined' && typeof build3DScene === 'function') {{ showDimensions = true; build3DScene(); }}
        }} catch(e) {{ console.warn("Screenshot failed:", e); }}

        const nameInput = document.getElementById('project-name');
        const projectName = (nameInput && nameInput.value ? nameInput.value.trim() : '') || 'Custom {type_str.capitalize()}';
        const priceEl = document.getElementById('total-price');
        const priceText = priceEl ? priceEl.innerText.replace(/[^0-9.]/g, '') : '8000';
        const costVal = parseFloat(priceText) || 8000;

        const ai = (typeof getActiveItem === 'function') ? getActiveItem() : null;
        let selections = {{}}, carvings = {{}}, shapes = {{}}, dims = {{}}, scale = {{x:1,y:1,z:1}};
        try {{
          selections = (ai && ai.selections) ? JSON.parse(JSON.stringify(ai.selections)) : {{}};
          carvings = (ai && ai.carvings) ? JSON.parse(JSON.stringify(ai.carvings)) : {{}};
          shapes = (ai && ai.shapes) ? JSON.parse(JSON.stringify(ai.shapes)) : {{}};
          dims = (ai && ai.dims) ? JSON.parse(JSON.stringify(ai.dims)) : {{}};
          scale = (ai && ai.globalScale) ? JSON.parse(JSON.stringify(ai.globalScale)) : {{x:1,y:1,z:1}};
        }} catch(e) {{ console.warn("Deep copy failed:", e); }}
        
        const partsList = (ai && ai.parts) ? ai.parts : Object.keys(selections);

        const tmpl = {{
          id: Date.now() + Math.floor(Math.random()*9000+10000),
          type: '{type_str}', name: projectName, icon: '{icon_str}', badge: 'new', gender: 'neutral',
          description: 'Custom {type_str} crafted in the 3D studio by ' + (sessionStorage.getItem('username') || 'Shop Owner') + '.',
          tags: ['{type_str.capitalize()}','Custom','Shop Design'], parts: partsList, selections: selections,
          carvings: carvings, shapes: shapes, dims: dims, scale: scale, basePrice: costVal,
          previewDataUrl: previewDataUrl, publishedBy: sessionStorage.getItem('username') || 'Shop Owner',
          publishedAt: new Date().toISOString(), designData: ai
        }};

        let globals = [];
        try {{ globals = JSON.parse(localStorage.getItem('shop_templates_global') || '[]'); }} catch(e) {{ globals = []; }}
        if (!Array.isArray(globals)) globals = [];
        
        // Remove older templates if we exceed 20 to prevent quota issues even with compression
        if (globals.length > 20) globals = globals.slice(0, 20);
        
        globals.unshift(tmpl);
        localStorage.setItem('shop_templates_global', JSON.stringify(globals));
        
        let custom = [];
        try {{ custom = JSON.parse(localStorage.getItem('shop_custom_designs') || '[]'); }} catch(e) {{ custom = []; }}
        if (!Array.isArray(custom)) custom = [];
        
        if (custom.length > 20) custom = custom.slice(0, 20);
        
        custom.unshift(tmpl);
        localStorage.setItem('shop_custom_designs', JSON.stringify(custom));

        if (typeof saveState === 'function') saveState();
        alert('\\u2705 "' + tmpl.name + '" has been uploaded to Templates!');
        window.location.href = 'templates.html';
      }} catch (err) {{
        alert("Error saving template: " + err.message + "\\n\\nTry clearing your browser cache/storage if quota exceeded.");
        console.error(err);
      }}
    }}"""

    new_content = content[:match.start()] + new_func + content[match.end():]
    
    with open(filepath, 'w', encoding='utf-8') as file:
        file.write(new_content)
    print(f"Updated {f}")
