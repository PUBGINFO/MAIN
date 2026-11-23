// Release의 link0(없으면 link1) 이미지를 찾아 index.html의 og:image를 정적으로 갱신
import fs from 'node:fs';

const file = process.env.INDEX_FILE || 'index.html';
let html = fs.readFileSync(file, 'utf8');
const pick = re => (html.match(re) || [])[1];

const owner = pick(/owner:\s*'([^']+)'/);
const repo = pick(/repo:\s*'([^']+)'/);
const tag = pick(/tag:\s*'([^']+)'/);
const list = pick(/ogAssets:\s*\[([^\]]*)\]/) || "'link0','link1'";
const order = [...list.matchAll(/'([^']+)'/g)].map(m => m[1].replace(/\.[^.]+$/, '').toLowerCase());
const EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

if (!owner || !repo || !tag) { console.error('CONFIG(owner/repo/tag)를 찾지 못했습니다.'); process.exit(1); }

const headers = { Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`, { headers });
if (!res.ok) { console.error(`Release 조회 실패: ${res.status}`); process.exit(1); }
const assets = (await res.json()).assets || [];

let url = null;
outer: for (const base of order)
  for (const ext of EXT) {
    const a = assets.find(x => x.name.toLowerCase() === `${base}.${ext}`);
    if (a) { url = a.browser_download_url; break outer; }
  }
if (!url) { console.warn('link0/link1 이미지를 찾지 못해 변경하지 않습니다.'); process.exit(0); }

const next = html
  .replace(/(<meta property="og:image" content=")[^"]*(">)/, `$1${url}$2`);
if (next !== html) { fs.writeFileSync(file, next); console.log('갱신:', url); } else console.log('변경 없음:', url);
