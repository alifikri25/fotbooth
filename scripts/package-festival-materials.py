import json
import shutil
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'artwork/provenance/festival-materials-20261007.json').read_text(encoding='utf-8'))
for item in manifest['outputs']:
    original = root / item['original']
    original.parent.mkdir(parents=True, exist_ok=True)
    if not original.exists():
        shutil.copy2(item['generatedPath'], original)
    material = root / item['material']
    with Image.open(original) as image:
        image.convert('RGB').save(material, quality=88, optimize=True, progressive=True)
    print(f"{item['id']}: {material.stat().st_size // 1024} KiB")
