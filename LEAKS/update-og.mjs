
import fs from 'node:fs';
import path from 'node:path';

// index.html 경로
const file = path.resolve(
  process.env.INDEX_FILE || 'LEAKS/index.html'
);

if (!fs.existsSync(file)) {
  console.error(`HTML 파일을 찾을 수 없습니다: ${file}`);
  process.exit(1);
}

const html = fs.readFileSync(file, 'utf8');

// CONFIG 설정 추출
const configMatch = html.match(
  /const\s+CONFIG\s*=\s*\{([\s\S]*?)\n\};/
);

if (!configMatch) {
  console.error('CONFIG 설정 블록을 찾지 못했습니다.');
  process.exit(1);
}

const config = configMatch[1];

function getValue(key) {
  const match = config.match(
    new RegExp(`\\b${key}\\s*:\\s*['"]([^'"]+)['"]`)
  );
  return match?.[1] || null;
}

const owner = getValue('owner');
const repo = getValue('repo');
const tag = getValue('tag');

const assetsMatch = config.match(
  /ogAssets\s*:\s*\[([^\]]*)\]/
);

const order = assetsMatch
  ? [...assetsMatch[1].matchAll(/['"]([^'"]+)['"]/g)]
      .map(m => m[1].replace(/\.[^.]+$/, '').toLowerCase())
  : ['link0', 'link1'];

if (!owner || !repo || !tag) {
  console.error('CONFIG(owner/repo/tag) 설정이 올바르지 않습니다.');
  process.exit(1);
}

console.log(`Repository: ${owner}/${repo}`);
console.log(`Release tag: ${tag}`);
console.log(`OG image priority: ${order.join(', ')}`);

// GitHub API
const headers = {
  Accept: 'application/vnd.github+json'
};

if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

const api =
  `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`;

const res = await fetch(api, { headers });

if (!res.ok) {
  console.error(`Release 조회 실패: HTTP ${res.status}`);
  console.error(await res.text());
  process.exit(1);
}

const release = await res.json();
const assets = release.assets || [];

console.log(`Release assets: ${assets.length}개`);

const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

let selected = null;

for (const base of order) {
  for (const ext of extensions) {
    selected = assets.find(
      asset => asset.name.toLowerCase() === `${base}.${ext}`
    );

    if (selected) break;
  }

  if (selected) break;
}

if (!selected) {
  console.warn('OG 이미지 후보를 찾지 못했습니다.');
  console.warn('확인한 파일명:', order.join(', '));
  process.exit(0);
}

// OG 이미지 주소 갱신
const url = selected.browser_download_url;

const next = html.replace(
  /(<meta\s+property=["']og:image["']\s+content=["'])[^"']*(["']\s*\/?>)/i,
  `$1${url}$2`
);

if (next === html) {
  console.log('OG 이미지 주소 변경 없음:', url);
} else {
  fs.writeFileSync(file, next, 'utf8');
  console.log('OG 이미지 갱신 완료:', url);
}
