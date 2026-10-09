/* ============================================================================
 * src/lib/days.ts
 *
 * 与内容集合相关的辅助函数：
 *   - 列出所有天（按日期倒序）
 *   - 拿到某天的 manifest（来自 public/processed/<date>/_manifest.json）
 *   - 拿到 Hero 图、Avatar
 *   - 计算 Day N（白板到家第几天）
 * ============================================================================ */

import { getCollection, getEntries, type CollectionEntry } from 'astro:content';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// ----------------------------------------------------------------------------
// 类型
// ----------------------------------------------------------------------------

export type DayEntry = CollectionEntry<'days'>;
export type DayData = DayEntry['data'];

export type PhotoMeta = {
  src: string;
  srcset: string;
  width: number;
  height: number;
  aspectRatio: number;
  original: string;
};

export type VideoMeta = {
  video: string; // 绝对 URL 路径
  poster: string | null;
  original: string;
};

export type Manifest = {
  date: string;
  photos: PhotoMeta[];
  videos: VideoMeta[];
  generatedAt: string;
};

// ----------------------------------------------------------------------------
// 常量
// ----------------------------------------------------------------------------

/** 到家日（用于计算 N 天大） */
export const HOMECOMING_DATE = '2026-10-08';

/** Hero 用图（在首页最大那张）：从 Day 1 第一张精选中取 */
/** 这里手动指定文件名，避免每次跑扫描 */
export const HERO_IMAGE = {
  src: '/processed/2026-10-08/IMG_1805-1600.webp',
  srcset:
    '/processed/2026-10-08/IMG_1805-400.webp 400w, /processed/2026-10-08/IMG_1805-800.webp 800w, /processed/2026-10-08/IMG_1805-1600.webp 1600w',
  sizes: '100vw',
  alt: '白板 · 边牧肖像',
};

/** 关于页头像（方形） */
export const AVATAR_IMAGE = {
  src: '/processed/2026-10-08/IMG_1802-800.webp',
  srcset:
    '/processed/2026-10-08/IMG_1802-400.webp 400w, /processed/2026-10-08/IMG_1802-800.webp 800w',
  sizes: '(min-width: 768px) 240px, 60vw',
  alt: '白板头像',
};

// ----------------------------------------------------------------------------
// 读取所有天
// ----------------------------------------------------------------------------

/** 拿到所有 day，按日期倒序（新→旧） */
export async function getAllDays(): Promise<DayEntry[]> {
  const all = await getCollection('days');
  return all.sort((a, b) => (a.data.date < b.data.date ? 1 : -1));
}

/** 拿到某一天（按 date 字段） */
export async function getDay(date: string): Promise<DayEntry | undefined> {
  const all = await getCollection('days');
  return all.find((d) => d.data.date === date);
}

/** 某一天在所有天里的索引（1-based，新→旧） */
export async function getDayIndex(date: string): Promise<number> {
  const all = await getAllDays();
  return all.findIndex((d) => d.data.date === date) + 1;
}

// ----------------------------------------------------------------------------
// Manifest：处理后的图片/视频元数据
// ----------------------------------------------------------------------------

/** 从 public/processed/<date>/_manifest.json 读取（构建时拷贝到 public） */
export async function getManifest(date: string): Promise<Manifest | null> {
  const path = join(process.cwd(), 'public/processed', date, '_manifest.json');
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw) as Manifest;
  } catch {
    return null;
  }
}

/** 把 meta.md 中的 photos[] 顺序应用到 manifest 上，返回有序的 PhotoMeta[] */
export function resolvePhotos(
  metaPhotos: Array<{ src: string; caption?: string; cover?: boolean }>,
  manifest: Manifest | null,
): Array<PhotoMeta & { caption: string; cover: boolean }> {
  if (!manifest) return [];

  // manifest 用 original 文件名查；meta 引用可能是 `IMG_1789.HEIC` 或 `IMG_1789`
  return metaPhotos
    .map((mp) => {
      const base = mp.src.replace(/\.[^.]+$/, ''); // IMG_1789.HEIC → IMG_1789
      const m = manifest.photos.find((p) => p.original.startsWith(base));
      if (!m) return null;
      return { ...m, caption: mp.caption || '', cover: mp.cover || false };
    })
    .filter((x): x is PhotoMeta & { caption: string; cover: boolean } => x !== null);
}

/** meta 里 videos[] 顺序应用到 manifest 上 */
export function resolveVideos(
  metaVideos: Array<{ src: string; poster?: string }>,
  manifest: Manifest | null,
): Array<VideoMeta & { caption: string }> {
  if (!manifest) return [];

  return metaVideos
    .map((mv) => {
      const base = mv.src.replace(/\.[^.]+$/, '');
      const v = manifest.videos.find((vid) => vid.original.startsWith(base));
      if (!v) return null;
      return { ...v, caption: '' };
    })
    .filter((x): x is VideoMeta & { caption: string } => x !== null);
}

// ----------------------------------------------------------------------------
// Day N 计算
// ----------------------------------------------------------------------------

/** 白板今天 N 天大（基于 HOMECOMING_DATE） */
export function daysSinceHomecoming(now: Date = new Date()): number {
  const home = new Date(HOMECOMING_DATE + 'T00:00:00');
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = today.getTime() - home.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/** 某天在白板生命中是第几天 */
export function dayNumber(date: string): number {
  const target = new Date(date + 'T00:00:00');
  const home = new Date(HOMECOMING_DATE + 'T00:00:00');
  const diffMs = target.getTime() - home.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

// ----------------------------------------------------------------------------
// 格式化
// ----------------------------------------------------------------------------

/** `2026-10-08` → `2026年10月8日` */
export function formatChineseDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

/** `2026-10-08` → `2026.10.08`（紧凑） */
export function formatCompactDate(date: string): string {
  return date.replace(/-/g, '.');
}

/** mood 字段 → emoji */
export function moodToEmoji(mood?: string): string {
  switch (mood) {
    case 'happy': return '😊';
    case 'playful': return '🐾';
    case 'calm': return '😌';
    case 'sleepy': return '💤';
    case 'curious': return '👀';
    case 'brave': return '🐶';
    default: return '';
  }
}