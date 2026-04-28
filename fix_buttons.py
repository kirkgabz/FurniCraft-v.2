import os
import re

files = [
    'builder_bed.html', 'builder_bookshelf.html', 'builder_cabinet.html',
    'builder_chair.html', 'builder_desk.html', 'builder_sofa.html',
    'builder_stool.html', 'builder_table.html'
]

for f in files:
    filepath = os.path.join(r'c:\CASE STUDY\FurniCraft', f)
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Check if the button already has the ID
    if 'id="btn-upload-template"' not in content:
        # Find the button with onclick="uploadToTemplates()"
        content = re.sub(
            r'<button class="btn-export" style="background:\s*linear-gradient[^>]+onclick="uploadToTemplates\(\)"(?: style="display:none")?>',
            r'<button class="btn-export" id="btn-upload-template" onclick="uploadToTemplates()" style="background: linear-gradient(135deg,#10b981,#059669) !important; display: none;">',
            content
        )
        # Also catch variations where style might be slightly different
        content = re.sub(
            r'<button class="btn-export"\s*style="[^"]*"\s*onclick="uploadToTemplates\(\)"\s*>',
            r'<button class="btn-export" id="btn-upload-template" onclick="uploadToTemplates()" style="background: linear-gradient(135deg,#10b981,#059669) !important; display: none;">',
            content
        )
        with open(filepath, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Added ID to {f}")
    else:
        # Ensure it has display: none
        content = re.sub(
            r'<button class="btn-export"\s+id="btn-upload-template"\s+onclick="uploadToTemplates\(\)"\s+style="background:\s*linear-gradient[^>]+!important;"\s*>',
            r'<button class="btn-export" id="btn-upload-template" onclick="uploadToTemplates()" style="background: linear-gradient(135deg,#10b981,#059669) !important; display: none;">',
            content
        )
        with open(filepath, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Ensured ID and display:none in {f}")
