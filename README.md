# 白板的成长日记

> 一只边牧，慢慢长大的样子。

白板的私人成长记录站点。一日一记，按时间线倒序展示照片和视频。

---

## 🚀 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 处理素材（HEIC → WebP，生成视频 poster 等）
npm run process-photos

# 3. 启动 dev server
npm run dev
# → http://localhost:4321/

# 4. 生产构建
npm run build
```

第一次或新增一天后必须跑一次 `npm run process-photos`。

---

## 📷 添加新的一天

```bash
# 1. 创建当日文件夹，把素材拷进去
mkdir -p src/content/days/2026-10-15/raw
cp /path/to/photos/*.HEIC src/content/days/2026-10-15/raw/
cp /path/to/videos/*.MOV  src/content/days/2026-10-15/raw/

# 2.（可选）创建 meta.md，记录标题/心情/一段话
#    字段见下方"meta.md 字段"
cat > src/content/days/2026-10-15/meta.md <<'EOF'
---
date: "2026-10-15"
title: "第一次出门散步"
mood: "brave"
weather: "多云"
photos:
  - src: IMG_1900.HEIC
    caption: "在电梯里有点怕"
  - src: IMG_1901.HEIC
videos:
  - src: IMG_1900.MOV
---
EOF

# 3. 处理新一天的素材
npm run process-photos 2026-10-15
# （不带日期参数则处理所有天）

# 4. 推送到 GitHub → Vercel 自动部署
git add src/content/days/2026-10-15/
git commit -m "Day 8: 第一次出门散步"
git push origin main
```

不写 `meta.md` 也行，脚本会自动读 `raw/` 里所有图片/视频（按文件名排序），首页时间线显示前 6 张，其余进 `/day/<date>/` 详情页。

---

## 📝 meta.md 字段

```yaml
---
date: "2026-10-08"              # 必填，YYYY-MM-DD（必须加引号避免被解析成 Date 对象）
title: "到家的第一天"            # 可选，一句话标题
mood: "curious"                 # 可选：happy | playful | calm | sleepy | curious | brave
weather: "晴"                    # 可选，自由文本
note: "白板来家里了。"           # 可选，多行日记
photos:                         # 可选；留空则自动读 raw/ 内所有图片
  - src: IMG_1789.HEIC          # 相对 raw/ 的路径
    caption: "在新家四处探索"    # 可选
videos:                         # 可选；留空则自动读 raw/ 内所有视频
  - src: IMG_1784.MOV
---
```

**`photos[]` 顺序决定时间线显示顺序**：数组前 6 张进入首页时间线，其余进单日详情页。

---

## 🏗 技术栈

- **Astro** — 静态站点生成，零 JS 默认（仅 Lightbox / Hero 视差等局部使用）
- **Tailwind CSS** — 配合自定义温暖治愈系设计 Token
- **sharp** — 图片处理（HEIC → WebP 三档，自动剥离 EXIF）
- **heic-convert** — WASM 兜底解码 HEIC
- **ffmpeg** — 视频抽 poster 帧
- **PWA** — manifest + icons，支持「添加到主屏」

---

## 🌐 部署

部署到 **Vercel**（自动识别 Astro）：

1. 把代码推到 GitHub
2. Vercel 导入项目，零配置
3. 每次 push 自动构建：`npm run build`（内部先处理图片，再 Astro build）

如需绑定自定义域名（`puppy.huyikai.com`）：
1. Vercel → Project → Settings → Domains
2. 添加域名，按提示在 DNS 服务商加 CNAME 记录

---

## 📂 目录结构

```
puppy/
├── src/
│   ├── components/         # Astro 组件
│   ├── content/days/       # 每日素材（git 内）
│   │   └── 2026-10-08/
│   │       ├── meta.md     # 当日元数据
│   │       └── raw/        # 原始 HEIC / MOV
│   ├── layouts/            # BaseLayout
│   ├── lib/                # 共享 helper（days.ts）
│   ├── pages/              # 路由（index / about / day/[date] / 404）
│   └── styles/global.css   # 设计 Token + 基础样式
├── public/
│   ├── processed/          # 处理后图片（git 忽略，构建时生成）
│   ├── icons/              # PWA 图标
│   ├── apple-touch-icon.png
│   ├── favicon.svg
│   ├── manifest.webmanifest
│   └── og-cover.jpg        # 社交分享封面
├── scripts/process-photos.mjs
├── astro.config.mjs
├── tailwind.config.mjs
├── vercel.json
└── package.json
```

---

## 🎨 设计 Token

| 类别 | 值 |
|------|----|
| 主色 | `#C49B6C`（奶茶棕） |
| 强调 | `#E8A87C`（暖橙） |
| 背景 | `#FAF7F2`（米白）+ 1% SVG 纸纹 |
| 文字 | `#2E2A26` 标题 / `#4A4540` 正文 |
| 标题字体 | Songti SC / STSong（系统衬线） |
| 正文字体 | -apple-system / PingFang SC（系统无衬线） |
| 圆角 | 6 / 12 / 20px |
| 阴影 | 暖色调低对比 |

详细见 `src/styles/global.css` 与 `tailwind.config.mjs`。

---

## 📜 License

私人项目，未经授权请勿复制。