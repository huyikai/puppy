#!/usr/bin/env node
/* ============================================================================
 * scripts/process-photos.mjs
 *
 * 处理 `src/content/days/<date>/raw/` 下所有原始素材：
 *   - 图片：HEIC/JPG/PNG → WebP 三档（400/800/1600w），剥离 GPS EXIF
 *   - 视频：MOV/MP4 原样复制到 public/processed/，并用 ffmpeg 抽 1s 处帧作 poster
 *
 * 输出：
 *   - public/processed/<date>/<basename>-{400,800,1200}.webp
 *   - public/processed/<date>/<videoname>.<ext>
 *   - public/processed/<date>/<videoname>-poster.jpg
 *   - public/processed/<date>/_manifest.json（前端用）
 *
 * 用法：
 *   node scripts/process-photos.mjs           # 处理所有日期
 *   node scripts/process-photos.mjs 2026-10-08 # 只处理某一天
 * ============================================================================ */

import { readdir, mkdir, writeFile, copyFile, stat } from 'node:fs/promises';
import { existsSync, statSync, readFileSync } from 'node:fs';
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
    try {
      const input = await readFile(srcPath);
      const output = await heicConvert({
        buffer: input,
        format: 'JPEG',
        quality: 0.95,
      });
      return Buffer.from(output);
    } catch (err) {
      // Fallback: return null to let sharp handle it directly
      // sharp may have HEIC support depending on the libvips build
      logErr(`  heic-convert failed for ${srcPath}, falling back to sharp: ${err.message}`);
      return null;
    }
  }
  return null;
}

// ----------------------------------------------------------------------------
// 路径常量
// ----------------------------------------------------------------------------
const __dirname = pathDirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DAYS_SRC = join(ROOT, 'src/content/days');
const PROCESSED_BASE = join(ROOT, 'public/processed');

const SIZES = [400, 800, 1200];
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
 * 处理单张图片。
 * force=true 时无视 mtime，直接处理（用于修复空 manifest 等场景）。
 */
async function tryProcessPhoto(srcPath, outDir, base, ext, force = false) {
  const outName = base;

  if (!force) {
    // 增量检查：所有目标文件存在且都比源文件新 → 跳过
    let inMtime = 0;
    let allUpToDate = false;
    try {
      inMtime = statSync(srcPath).mtimeMs;
      allUpToDate = SIZES.every((w) => {
        const p = join(outDir, `${outName}-${w}.webp`);
        if (!existsSync(p)) return false;
        return statSync(p).mtimeMs >= inMtime;
      });
    } catch { /* fall through */ }

    if (allUpToDate) return { processed: false };
  }

  try {
    const heicBuffer = await decodeToBuffer(srcPath, ext);
    const input = heicBuffer || srcPath;

    const img = sharp(input, { failOn: 'none' });
    const meta = await img.metadata();
    const aspectRatio = meta.width && meta.height ? meta.width / meta.height : 1;

    for (const w of SIZES) {
      const outPath = join(outDir, `${outName}-${w}.webp`);
      await sharp(input, { failOn: 'none' })
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY, effort: 4 })
        .toFile(outPath);
    }

    return {
      processed: true,
      result: {
        width: meta.width,
        height: meta.height,
        aspectRatio: Number(aspectRatio.toFixed(4)),
        sizes: SIZES,
      },
    };
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
  const posterOutPath = join(outDir, `${base}-poster.jpg`);

  // Skip if both output files present and newer than source (增量 build)
  if (existsSync(videoOutPath) && existsSync(posterOutPath)) {
    try {
      const inMtime = stat(srcPath).mtimeMs;
      const videoMtime = stat(videoOutPath).mtimeMs;
      const posterMtime = stat(posterOutPath).mtimeMs;
      if (videoMtime >= inMtime && posterMtime >= inMtime) {
        return {
          video: `/processed/${date}/${base}${ext}`,
          poster: `/processed/${date}/${base}-poster.jpg`,
        };
      }
    } catch { /* fall through */ }
  }

  await copyFile(srcPath, videoOutPath);

  // 1. 先用 ffprobe 拿视频时长
  let duration = 0;
  try {
    const { stdout } = await execFileP('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      srcPath,
    ], { timeout: 8000 });
    duration = parseFloat(stdout.trim()) || 0;
  } catch { /* ignore */ }

  // 2. 取视频 50% 位置作为封面（避开开头黑帧；适合短片段）
  const moment = duration > 0 ? Math.max(0.5, duration * 0.5) : 1;

  try {
    await execFileP('ffmpeg', [
      '-y',
      '-ss', String(moment),
      '-i', srcPath,
      '-frames:v', '1',
      '-update', '1',
      '-q:v', '3',
      '-vf', 'scale=-2:1200',
      posterOutPath,
    ], { timeout: 15000 });
  } catch (err) {
    logErr(`视频 ${base}${ext} 中点抽帧失败：${err.message}，兜底用 1s 处`);
    try {
      await execFileP('ffmpeg', [
        '-y',
        '-ss', '1',
        '-i', srcPath,
        '-frames:v', '1',
        '-update', '1',
        '-q:v', '3',
        '-vf', 'scale=-2:1200',
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

  // 读旧 manifest（用于跳过时直接复用元数据）
  const manifestPath = join(outDir, '_manifest.json');
  let oldManifest = {};
  if (existsSync(manifestPath)) {
    try {
      oldManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    } catch { /* ignore */ }
  }
  const oldPhotosByName = new Map();
  for (const p of oldManifest.photos ?? []) {
    if (p.original) oldPhotosByName.set(p.original, p);
  }
  const oldVideosByName = new Map();
  for (const v of oldManifest.videos ?? []) {
    if (v.original) oldVideosByName.set(v.original, v);
  }

  const entries = await readdir(rawDir);
  const photos = [];
  const videos = [];

  log('📦', `${date} 发现 ${entries.length} 项`);

  for (const name of entries) {
    if (name.startsWith('.')) continue;
    const srcPath = join(rawDir, name);
    let s;
    try { s = statSync(srcPath); } catch { continue; }
    if (!s.isFile()) continue;

    const { name: base, ext } = parse(name);
    const lowerExt = ext.toLowerCase();

    if (PHOTO_EXTS.has(lowerExt)) {
      try {
        const { processed, result } = await tryProcessPhoto(srcPath, outDir, base, ext);
        if (processed && result) {
          photos.push({
            src: `/processed/${date}/${base}-800.webp`,
            srcset: SIZES.map((w) => `/processed/${date}/${base}-${w}.webp ${w}w`).join(', '),
            width: result.width,
            height: result.height,
            aspectRatio: result.aspectRatio,
            original: name,
          });
          log('  🖼 ', `${name} → ${base}-{${SIZES.join(',')}}.webp`);
        } else {
          // 跳过：复用旧 manifest 的元数据（零开支）
          const old = oldPhotosByName.get(name);
          if (old) {
            photos.push(old);
          } else {
            // 旧 manifest 没这条：强制重新处理（ignore mtime）
            const fallback = await tryProcessPhoto(srcPath, outDir, base, ext, true);
            if (fallback.processed && fallback.result) {
              photos.push({
                src: `/processed/${date}/${base}-800.webp`,
                srcset: SIZES.map((w) => `/processed/${date}/${base}-${w}.webp ${w}w`).join(', '),
                width: fallback.result.width,
                height: fallback.result.height,
                aspectRatio: fallback.result.aspectRatio,
                original: name,
              });
            }
          }
        }
      } catch (e) {
        // skip
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