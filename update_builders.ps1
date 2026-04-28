# Script to update all builder_*.html files:
# 1. Replace Export button with "Upload to Templates" button
# 2. Replace goToExport() function with uploadToTemplates()

$builderDir = "c:\CASE STUDY\FurniCraft"
$files = @("builder_table.html","builder_chair.html","builder_bed.html","builder_bookshelf.html","builder_cabinet.html","builder_desk.html","builder_sofa.html","builder_stool.html")

# Furniture type metadata for each builder
$meta = @{
    'builder_table.html' = @{ type='table'; icon='fa-utensils'; defaultName='Custom Dining Table' }
    'builder_chair.html' = @{ type='chair'; icon='fa-chair'; defaultName='Custom Chair' }
    'builder_bed.html' = @{ type='bed'; icon='fa-bed'; defaultName='Custom Bed' }
    'builder_bookshelf.html' = @{ type='bookshelf'; icon='fa-book'; defaultName='Custom Bookshelf' }
    'builder_cabinet.html' = @{ type='cabinet'; icon='fa-door-closed'; defaultName='Custom Cabinet' }
    'builder_desk.html' = @{ type='desk'; icon='fa-desktop'; defaultName='Custom Desk' }
    'builder_sofa.html' = @{ type='sofa'; icon='fa-couch'; defaultName='Custom Sofa' }
    'builder_stool.html' = @{ type='stool'; icon='fa-chair'; defaultName='Custom Stool' }
}

foreach ($file in $files) {
    $filePath = Join-Path $builderDir $file
    $m = $meta[$file]
    $type = $m.type
    $icon = $m.icon
    $defaultName = $m.defaultName
    
    Write-Host "Processing $file (type=$type)..."
    
    # Read file content as single string
    $content = [System.IO.File]::ReadAllText($filePath)
    
    # ===== STEP 1: Replace the Export button HTML =====
    # Pattern: button with onclick="goToExport()" containing Export text
    # We need to handle various whitespace patterns
    
    # Remove any existing hidden upload-template button (like in chair.html)
    $content = $content -replace '(?s)\s*<button class="btn-export" id="btn-upload-template"[^>]*>.*?</button>', ''
    
    # Replace the export button with upload to templates button
    # Match the export button pattern flexibly
    $content = $content -replace '(?s)<button class="btn-export"(\s+id="btn-main-export")?\s+onclick="goToExport\(\)"\s*>(.*?)</button>', @"
<button class="btn-export" id="btn-upload-template" onclick="uploadToTemplates()" style="background: linear-gradient(135deg,#10b981,#059669) !important;">
        <i class="fas fa-cloud-upload-alt"></i> Upload to Templates
      </button>
"@

    # ===== STEP 2: Replace goToExport() function with uploadToTemplates() =====
    # The goToExport function body varies but always starts with "function goToExport() {"
    # and ends before the next function definition. We replace the entire function.
    
    $uploadFn = @"
function uploadToTemplates() {
      // Capture 3D preview screenshot
      let previewDataUrl = '';
      try {
        if (typeof controls !== 'undefined') controls.autoRotate = false;
        if (typeof showDimensions !== 'undefined' && typeof build3DScene === 'function') { showDimensions = false; build3DScene(); }
        if (typeof renderer !== 'undefined' && typeof scene !== 'undefined' && typeof camera !== 'undefined') renderer.render(scene, camera);
        const canvas = document.querySelector('#canvas-container canvas');
        if (canvas) previewDataUrl = canvas.toDataURL('image/png');
        if (typeof controls !== 'undefined') controls.autoRotate = true;
        if (typeof showDimensions !== 'undefined' && typeof build3DScene === 'function') { showDimensions = true; build3DScene(); }
      } catch(e) {}

      // Get project name
      const nameInput = document.getElementById('project-name');
      const projectName = (nameInput && nameInput.value.trim()) || '$defaultName';

      // Get price
      const priceEl = document.getElementById('total-price');
      const priceText = priceEl ? priceEl.innerText.replace(/[^0-9.]/g, '') : '8000';
      const costVal = parseFloat(priceText) || 8000;

      // Read active design item state
      const ai = (typeof getActiveItem === 'function') ? getActiveItem() : null;
      const selections = (ai && ai.selections) ? JSON.parse(JSON.stringify(ai.selections)) : {};
      const carvings = (ai && ai.carvings) ? JSON.parse(JSON.stringify(ai.carvings)) : {};
      const shapes = (ai && ai.shapes) ? JSON.parse(JSON.stringify(ai.shapes)) : {};
      const dims = (ai && ai.dims) ? JSON.parse(JSON.stringify(ai.dims)) : {};
      const scale = (ai && ai.globalScale) ? JSON.parse(JSON.stringify(ai.globalScale)) : {x:1,y:1,z:1};
      const partsList = (ai && ai.parts) ? ai.parts : Object.keys(selections);

      const tmpl = {
        id: Date.now() + Math.floor(Math.random()*9000+10000),
        type: '$type',
        name: projectName,
        icon: '$icon',
        badge: 'new',
        gender: 'neutral',
        description: 'Custom $type crafted in the 3D studio by ' + (sessionStorage.getItem('username') || 'Shop Owner') + '.',
        tags: ['$($type.Substring(0,1).ToUpper() + $type.Substring(1))', 'Custom', 'Shop Design'],
        parts: partsList,
        selections: selections,
        carvings: carvings,
        shapes: shapes,
        dims: dims,
        scale: scale,
        basePrice: costVal,
        previewDataUrl: previewDataUrl,
        publishedBy: sessionStorage.getItem('username') || 'Shop Owner',
        publishedAt: new Date().toISOString(),
        designData: ai
      };

      // Save to global templates list (used by templates.html)
      let globals = JSON.parse(localStorage.getItem('shop_templates_global') || '[]');
      globals.unshift(tmpl);
      localStorage.setItem('shop_templates_global', JSON.stringify(globals));

      // Also save to shop custom designs
      let custom = JSON.parse(localStorage.getItem('shop_custom_designs') || '[]');
      custom.unshift(tmpl);
      localStorage.setItem('shop_custom_designs', JSON.stringify(custom));

      if (typeof saveState === 'function') saveState();
      alert('\u2705 "' + tmpl.name + '" has been uploaded to Templates!');
      window.location.href = 'templates.html';
    }
"@

    # Replace the goToExport function - match from "function goToExport()" to just before the next function/closing
    # We need to find the function and replace it
    $pattern = "(?s)function goToExport\(\)\s*\{.+?window\.location\.href\s*=\s*'export_area\.html';\s*\n?\s*\}"
    
    if ($content -match $pattern) {
        $content = [regex]::Replace($content, $pattern, $uploadFn, [System.Text.RegularExpressions.RegexOptions]::None)
        Write-Host "  -> Replaced goToExport() function"
    } else {
        Write-Host "  -> WARNING: Could not find goToExport() function pattern!"
    }
    
    # ===== STEP 3: Remove any old shop mode IIFE that toggles buttons =====
    # These are in <script> tags at the top that try to show/hide buttons based on craftMode
    # They reference btn-upload-template and btn-main-export which we've changed
    # Remove the initShopMode IIFE blocks that were injected inside <script src="..."> tags
    $content = $content -replace '(?s)\s*/\*\s*[―─—]+\s*Shop Mode:?\s*Upload to Templates\s*[―─—]+\s*\*/\s*\(function\s+initShopMode\(\)\s*\{.*?\}\)\(\);\s*function\s+uploadToTemplates\(\)\s*\{.*?\}', ''
    
    # Also remove standalone initShopMode IIFE blocks in the main script section
    $content = $content -replace '(?s)/\*\s*[─―—]+\s*Shop Mode:?\s*Upload to Templates\s*[─―—]+\s*\*/\s*\(function\s+initShopMode\(\)\s*\{[^}]*\}\)\(\);', ''
    
    # Write back
    [System.IO.File]::WriteAllText($filePath, $content)
    Write-Host "  -> Done writing $file"
}

Write-Host "`nAll builder files updated successfully!"
