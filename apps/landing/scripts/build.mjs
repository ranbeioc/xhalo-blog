import fs from 'node:fs';
import path from 'node:path';

const src = path.resolve('src');
const dist = path.resolve('dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

if (fs.existsSync(src)) {
  for (const file of fs.readdirSync(src)) {
    fs.copyFileSync(path.join(src, file), path.join(dist, file));
  }
}
console.log('Landing page built.');
