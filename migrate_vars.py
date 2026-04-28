import os
import re

files = [
    'bed.html', 'bookshelf.html', 'cabinet.html', 'chair.html', 'desk.html', 'sofa.html', 'stool.html', 'table.html',
    'builder_bed.html', 'builder_bookshelf.html', 'builder_cabinet.html', 'builder_chair.html', 'builder_desk.html', 'builder_sofa.html', 'builder_stool.html', 'builder_table.html'
]

workspace = r'c:\CASE STUDY\FurniCraft'

vars_to_fix = [
    'isRotating', 'showDimensions', 'scene', 'camera', 'renderer', 
    'currentGroup', 'controls', 'dimGroup', 'doorsOpen', 'cabinetOpen'
]

for f in files:
    filepath = os.path.join(workspace, f)
    if not os.path.exists(filepath):
        print(f"File not found: {f}")
        continue
        
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
    
    initial_content = content

    # 1. Replace 'let' with 'var' for the specific global variables
    for var in vars_to_fix:
        # Match 'let varname =', 'let varname;', 'let varname,'
        content = re.sub(r'(?<=[\s\n;])let\s+(' + var + r')\b', r'var \1', content)

    # 2. Handle comma separated lists starting with 'let'
    # e.g., let scene, camera, renderer;
    content = re.sub(r'let\s+(scene\s*,\s*camera\s*,\s*renderer)', r'var \1', content)
    content = re.sub(r'let\s+(isRotating\s*,\s*showDimensions)', r'var \1', content)

    # 3. Inject scene check into init3D() to prevent double initialization
    # Target both variants: 'function init3D(){' and 'function init3D() {'
    if 'function init3D()' in content:
        # Check if already patched
        if 'if(typeof scene !== "undefined" && scene) return;' not in content:
            content = content.replace('function init3D(){', 'function init3D(){\n  if(typeof scene !== "undefined" && scene) return;')
            content = content.replace('function init3D() {', 'function init3D() {\n  if(typeof scene !== "undefined" && scene) return;')

    if content != initial_content:
        with open(filepath, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Patched {f}")
    else:
        print(f"No changes needed for {f}")
