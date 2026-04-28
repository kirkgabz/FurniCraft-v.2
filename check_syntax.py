import os
import subprocess
import tempfile

def check_js_syntax(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    import re
    # Extract all script tags
    scripts = re.findall(r'<script>(.*?)</script>', html_content, re.DOTALL)
    
    for i, script in enumerate(scripts):
        with tempfile.NamedTemporaryFile(suffix='.js', delete=False, mode='w', encoding='utf-8') as tmp:
            tmp.write(script)
            tmp_path = tmp.name
            
        try:
            result = subprocess.run(['node', '-c', tmp_path], capture_output=True, text=True)
            if result.returncode != 0:
                print(f"Error in {file_path} Script {i+1}:")
                print(result.stderr)
            else:
                pass # print(f"{file_path} Script {i+1} is valid.")
        finally:
            os.remove(tmp_path)

files = [
    'builder_bed.html', 'builder_bookshelf.html', 'builder_cabinet.html',
    'builder_chair.html', 'builder_desk.html', 'builder_sofa.html',
    'builder_stool.html', 'builder_table.html'
]

for f in files:
    check_js_syntax(os.path.join(r'c:\CASE STUDY\FurniCraft', f))
print("Syntax check complete.")
