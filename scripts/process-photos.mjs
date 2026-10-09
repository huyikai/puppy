#!/usr/bin/env node
/* ============================================================================
 * scripts/process-photos.mjs
 *
 * 处理 `src/content/days/<date>/raw/` 下所有原始素材：
 *   - 图片：HEIC/JPG/PNG → WebP 三档（400/800/1600w），剥离 GPS EXIF
 *   - 视频：MOV/MP4 原样复制到 public/processed/，并用 ffmpeg 抽 1s 处帧作 poster
 *
 * 输出：
 *   - public/processed/<date>/<basename>-{400,800,1600}.webp
 *   - public/processed/<date>/<videoname>.<ext>
 *   - public/processed/<date>/<videoname>-poster.jpg
 *   - public/processed/<date>/_manifest.json（前端用）
 *
 * 用法：
 *   node scripts/process-photos.mjs           # 处理所有日期
 *   node scripts/process-photos.mjs 2026-10-08 # 只处理某一天
 * ============================================================================ */

import { readdir, mkdir, writeFile, copyFile, stat, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, parse, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname as pathDirname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import sharp from 'sharp';
import heicConvert from 'heic-convert';

const execFileP = promisify(execFile);

/**
 * 把任意支持的图片源解码为 sharp 可处理的 Buffer
 * - HEIC/HEIF：sharp 的 libheif 不带 HEVC，用 heic-convert（WASM）兜底
 * - 其他格式：直接走 sharp
 */
async function decodeToBuffer(srcPath, ext) {
  const lower = ext.toLowerCase();
  if (lower === '.heic' || lower === '.heif') {
    const input = await readFile(srcPath);
    const output = await heicConvert({
      buffer: input,
      format: 'JPEG',
      quality: 0.95,
    });
    return Buffer.from(output);
  }
  return null; // 其他格式直接用 srcPath 让 sharp 自己读
}

// ----------------------------------------------------------------------------
// 路径常量
// ----------------------------------------------------------------------------
const __dirname = pathDirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DAYS_SRC = join(ROOT, 'src/content/days');
const PROCESSED_BASE = join(ROOT, 'public/processed');

const SIZES = [400, 800, 1600];
const WEBP_QUALITY = 80;
const PHOTO_EXTS = new Set(['.heic', '.heif', '.jpg', '.jpeg', '.png', '.webp']);
const VIDEO_EXTS = new Set(['.mov', '.mp4', '.m4v']);

// ----------------------------------------------------------------------------
// 工具
// ----------------------------------------------------------------------------
function log(emoji, msg) {
  process.stdout.write(`${emoji}  ${msg}\n`);
}

function logErr(msg) {
  process.stderr.write(`✗  ${msg}\n`);
}

/**
 * 处理单张图片
 */
async function processPhoto(srcPath, outDir, base, ext) {
  const outName = base; // 输出名去掉原后缀
  const results = {};

  try {
    // HEIC 用 heic-convert 解码，其他格式直接走 sharp
    const heicBuffer = await decodeToBuffer(srcPath, ext);
    const input = heicBuffer || srcPath;

    const img = sharp(input, { failOn: 'none' });
    const meta = await img.metadata();
    const aspectRatio = meta.width && meta.height ? meta.width / meta.height : 1;
    results.width = meta.width;
    results.height = meta.height;
    results.aspectRatio = Number(aspectRatio.toFixed(4));

    for (const w of SIZES) {
      const outPath = join(outDir, `${outName}-${w}.webp`);
      // 默认 sharp 不调用 keepMetadata / withMetadata，会自动剥离全部 EXIF
      // （包含 GPS 等隐私字段）。这正是我们想要的。
      await sharp(input, { failOn: 'none' })
        .rotate()
        .resize({
          width: w,
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY, effort: 4 })
        .toFile(outPath);
    }

    results.sizes = SIZES;
    return results;
  } catch (err) {
    logErr(`图片 ${base}${ext} 处理失败：${err.message}`);
    throw err;
  }
}

/**
 * 处理视频：复制原文件 + 抽 poster
 */
async function processVideo(srcPath, outDir, date, base, ext) {
  const videoOutPath = join(outDir, `${base}${ext}`);
  await copyFile(srcPath, videoOutPath);

  // 用 ffmpeg 抽 1 秒处帧（取首帧可能全黑；取 1s 处更稳）
  const posterOutPath = join(outDir, `${base}-poster.jpg`);
  try {
    await execFileP('ffmpeg', [
      '-y',
      '-ss', '1',
      '-i', srcPath,
      '-frames:v', '1',
      '-q:v', '3',
      posterOutPath,
    ], { timeout: 15000 });
  } catch (err) {
    logErr(`视频 ${base}${ext} 抽 poster 失败：${err.message}，使用首帧兜底`);
    try {
      await execFileP('ffmpeg', [
        '-y',
        '-i', srcPath,
        '-frames:v', '1',
        '-q:v', '3',
        posterOutPath,
      ], { timeout: 15000 });
    } catch (err2) {
      logErr(`  兜底失败：${err2.message}`);
    }
  }

  return {
    video: `/processed/${date}/${base}${ext}`,
    poster: existsSync(posterOutPath) ? `/processed/${date}/${base}-poster.jpg` : null,
  };
}

/**
 * 处理一天的素材
 */
async function processDay(date) {
  const rawDir = join(DAYS_SRC, date, 'raw');
  if (!existsSync(rawDir)) {
    logErr(`日期 ${date} 没有 raw 目录：${rawDir}`);
    return null;
  }

  const outDir = join(PROCESSED_BASE, date);
  await mkdir(outDir, { recursive: true });

  const entries = await readdir(rawDir);
  const photos = [];
  const videos = [];

  log('📦', `${date} 发现 ${entries.length} 项`);

  for (const name of entries) {
    if (name.startsWith('.')) continue;
    const srcPath = join(rawDir, name);
    const s = await stat(srcPath);
    if (!s.isFile()) continue;

    const { name: base, ext } = parse(name);
    const lowerExt = ext.toLowerCase();

    if (PHOTO_EXTS.has(lowerExt)) {
      try {
        const result = await processPhoto(srcPath, outDir, base, ext);
        photos.push({
          src: `/processed/${date}/${base}-800.webp`,
          srcset: SIZES.map((w) => `/processed/${date}/${base}-${w}.webp ${w}w`).join(', '),
          width: result.width,
          height: result.height,
          aspectRatio: result.aspectRatio,
          original: name,
        });
        log('  🖼 ', `${name} → ${base}-{400,800,1600}.webp`);
      } catch (e) {
        // 失败时跳过，但继续处理其他文件
      }
    } else if (VIDEO_EXTS.has(lowerExt)) {
      try {
        const result = await processVideo(srcPath, outDir, date, base, ext);
        videos.push({
          ...result,
          original: name,
        });
        log('  🎬', `${name} → 复制 + 抽 poster`);
      } catch (e) {
        // skip
      }
    } else {
      log('  ⏭', `${name}（不支持的格式，已跳过）`);
    }
  }

  // 按原始文件名排序
  photos.sort((a, b) => a.original.localeCompare(b.original, 'en', { numeric: true }));
  videos.sort((a, b) => a.original.localeCompare(b.original, 'en', { numeric: true }));

  const manifest = {
    date,
    photos,
    videos,
    generatedAt: new Date().toISOString(),
  };

  await writeFile(
    join(outDir, '_manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8',
  );

  log('✅', `${date} 处理完成：${photos.length} 张图 + ${videos.length} 个视频`);
  return manifest;
}

// ----------------------------------------------------------------------------
// 主流程
// ----------------------------------------------------------------------------
async function main() {
  const targetDate = process.argv[2]; // 可选：只处理某一天

  let days = [];
  if (targetDate) {
    days = [targetDate];
  } else {
    const all = await readdir(DAYS_SRC);
    days = all.filter((d) => {
      const rawDir = join(DAYS_SRC, d, 'raw');
      return existsSync(rawDir);
    });
  }

  if (days.length === 0) {
    log('⚠', '没有发现任何日期的素材');
    return;
  }

  log('🐾', `准备处理 ${days.length} 天：${days.join(', ')}`);

  await mkdir(PROCESSED_BASE, { recursive: true });

  for (const date of days) {
    await processDay(date);
  }

  log('🎉', '全部完成');
}

main().catch((err) => {
  logErr(`处理失败：${err.stack || err.message}`);
  process.exit(1);
});