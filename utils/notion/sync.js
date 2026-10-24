// notion.md <-> Notion 페이지 동기화 (실행할 때 한 번만 수행)
//   node sync.js        양쪽 변경을 비교해서 알아서 동기화
//   node sync.js push   로컬 → 노션 강제 덮어쓰기
//   node sync.js pull   노션 → 로컬 강제 덮어쓰기
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { markdownToBlocks } from '@tryfabric/martian';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(DIR, 'notion.md');  // CLI와 같은 디렉터리의 notion.md
const STATE = path.join(DIR, '.sync-state.json');  // 마지막 동기화 시점의 해시

dotenv.config({ path: path.join(DIR, '.env'), quiet: true });
const { NOTION_TOKEN, NOTION_PAGE_ID } = process.env;
if (!NOTION_TOKEN || !NOTION_PAGE_ID) {
  console.error('.env에 NOTION_TOKEN, NOTION_PAGE_ID를 설정하세요. (.env.example 참고)');
  process.exit(1);
}

const mode = process.argv[2] ?? 'sync';
if (!['sync', 'push', 'pull'].includes(mode)) {
  console.error('사용법: node sync.js [sync|push|pull]');
  process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });
const hash = (s) => crypto.createHash('sha256').update(s.replace(/\r\n/g, '\n').trim()).digest('hex');

const readLocal = () => (fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : '');
const writeLocal = (md) => fs.writeFileSync(FILE, md, 'utf8');

async function readNotion() {
  const blocks = await n2m.pageToMarkdown(NOTION_PAGE_ID);
  return n2m.toMarkdownString(blocks).parent ?? '';
}

async function listChildren() {
  const out = [];
  let cursor;
  do {
    const r = await notion.blocks.children.list({ block_id: NOTION_PAGE_ID, start_cursor: cursor });
    out.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return out;
}

async function push(md) {
  // 하위 페이지/DB는 지우면 안 되므로 제외
  for (const b of await listChildren()) {
    if (b.type === 'child_page' || b.type === 'child_database') continue;
    await notion.blocks.delete({ block_id: b.id });
  }
  const blocks = markdownToBlocks(md);
  for (let i = 0; i < blocks.length; i += 100) {  // API 제한: 한 번에 100블록
    await notion.blocks.children.append({ block_id: NOTION_PAGE_ID, children: blocks.slice(i, i + 100) });
  }
}

function backup(suffix) {
  const dest = path.join(DIR, `notion.${suffix}.md`);  // 백업은 utils/notion/ 안에
  fs.copyFileSync(FILE, dest);
  return path.basename(dest);
}

let state = null;
try { state = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch {}

const local = readLocal();
const remote = await readNotion();
const localChanged = !state || hash(local) !== state.local;
const remoteChanged = !state || hash(remote) !== state.remote;

let action;
if (mode !== 'sync') action = mode;
else if (!state) action = !remote.trim() && local.trim() ? 'push' : 'pull';  // 첫 실행: 노션 기준
else if (localChanged && remoteChanged) action = 'conflict';
else if (localChanged) action = 'push';
else if (remoteChanged) action = 'pull';
else action = 'none';

switch (action) {
  case 'none':
    console.log('변경 없음');
    break;
  case 'push':
    await push(local);
    console.log('로컬 → 노션 완료');
    break;
  case 'conflict':
    console.log('충돌: 양쪽 다 수정됨 → 로컬본 백업:', backup(`conflict-${Date.now()}`));
    // fallthrough: 노션 기준으로 맞춤
  case 'pull':
    if (mode === 'sync' && !state && local.trim() && hash(local) !== hash(remote)) {
      console.log('기존 로컬 백업:', backup('bak'));
    }
    writeLocal(remote);
    console.log('노션 → 로컬 완료');
    break;
}

// 변환 중 서식이 조금 바뀔 수 있으니, 실제 상태를 다시 읽어 기준으로 삼음
const after = action === 'push' ? await readNotion() : remote;
fs.writeFileSync(STATE, JSON.stringify({ local: hash(readLocal()), remote: hash(after) }, null, 2));
