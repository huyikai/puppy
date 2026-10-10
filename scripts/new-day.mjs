#!/usr/bin/env node
/* ============================================================================
 * scripts/new-day.mjs
 *
 * 一键创建当天的记录目录 + 合法的 meta.md 模板。
 *
 * 用法：
 *   npm run new-day                     # 用今天日期
 *   npm run new-day 2026-10-15          # 指定日期
 *
 * 之后把照片/视频拷进 raw/，跑 npm run process-photos，git push。
 * ============================================================================ */

import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ----------------------------------------------------------------------------
// 解析日期参数
// ----------------------------------------------------------------------------
function resolveDate(arg) {
  if (arg) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(arg)) {
      console.error(`✗ 日期格式错误：${arg}（需要 YYYY-MM-DD）`);
      process.exit(1);
    }
    return arg;
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const date = resolveDate(process.argv[2]);
const dayDir = join(ROOT, 'src/content/days', date);
const rawDir = join(dayDir, 'raw');
const metaPath = join(dayDir, 'meta.md');

// ----------------------------------------------------------------------------
// 已存在则提示
// ----------------------------------------------------------------------------
if (existsSync(metaPath)) {
  console.log(`ℹ  ${date} 的 meta.md 已存在，不覆盖：`);
  console.log(`   ${metaPath}`);
  process.exit(0);
}

// ----------------------------------------------------------------------------
// 创建目录 + 写模板
// ----------------------------------------------------------------------------
await mkdir(rawDir, { recursive: true });

const template = `---
date: "${date}"
title: ""
mood: ""
weather: ""
note: ""
photos: []
videos: []
---

# 把 raw/ 里的照片按需列进 photos（第一张是头图），或留空自动读取全部
`;

await writeFile(metaPath, template, 'utf-8');

console.log(`✓ 已创建 ${date}`);
console.log(`  ${metaPath}`);
console.log(`  ${rawDir}/`);
console.log('');
console.log('下一步：');
console.log(`  1. 把照片/视频拷进 src/content/days/${date}/raw/`);
console.log(`     （HEIC 请先转 JPG：sips -s format jpeg xx.HEIC --out xx.jpg）`);
console.log('  2. （可选）编辑 meta.md 填 title / mood / note');
console.log(`  3. npm run process-photos`);
console.log('  4. git add . && git commit && git push');
