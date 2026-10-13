import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const manifest = JSON.parse(
  await fs.readFile('artwork/provenance/ar-runtime-20261007.json', 'utf8'),
);
for (const item of manifest.files) {
  let data;
  try {
    const existing = await fs.readFile(item.file);
    if (createHash('sha256').update(existing).digest('hex') === item.sha256) {
      console.log(`Verified ${item.file}`);
      continue;
    }
  } catch {
    /* Restore missing or damaged assets from the pinned source. */
  }
  if (item.packageFile) data = await fs.readFile(item.packageFile);
  else {
    const response = await fetch(item.url, { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`Model download failed: ${response.status}`);
    data = Buffer.from(await response.arrayBuffer());
  }
  if (createHash('sha256').update(data).digest('hex') !== item.sha256)
    throw new Error(`Checksum mismatch for ${item.file}; no file written.`);
  await fs.mkdir(path.dirname(item.file), { recursive: true });
  await fs.writeFile(item.file, data);
  console.log(`Restored ${item.file}`);
}
