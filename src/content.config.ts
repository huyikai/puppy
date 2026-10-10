import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const days = defineCollection({
  loader: glob({ pattern: '**/meta.md', base: './src/content/days' }),
  schema: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期必须是 YYYY-MM-DD 格式'),
    title: z.string().optional().default(''),
    // 空字符串等价于不填；非空时必须是枚举值
    mood: z
      .enum(['happy', 'playful', 'calm', 'sleepy', 'curious', 'brave'])
      .or(z.literal(''))
      .optional()
      .default(''),
    weather: z.string().optional().default(''),
    note: z.string().optional().default(''),
    photos: z
      .array(
        z.object({
          src: z.string(),
          caption: z.string().optional().default(''),
          cover: z.boolean().optional().default(false),
        }),
      )
      .optional()
      .default([]),
    videos: z
      .array(
        z.object({
          src: z.string(),
          poster: z.string().optional(),
        }),
      )
      .optional()
      .default([]),
  }),
});

export const collections = { days };