import zipfile
import xml.etree.ElementTree as ET

path = r'd:\Material\React\focus-app\chapter_1,2,3[2].docx'

with zipfile.ZipFile(path) as z:
    xml_data = z.read('word/document.xml')

tree = ET.fromstring(xml_data)
texts = []
for para in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
    runs = ''.join(r.text or '' for r in para.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'))
    if runs.strip():
        texts.append(runs)

output = '\n'.join(texts)
with open(r'd:\Material\React\focus-app\chapter_text.txt', 'w', encoding='utf-8') as f:
    f.write(output)

print('Done, paragraphs:', len(texts))
