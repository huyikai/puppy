# 白板的成长日记

> 白板的私人摄影集。

一只边牧的成长记录。每天一张或几张照片，偶尔一段视频，按日装订成册。

---

## 🚀 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 处理素材（首次或新增一天后必跑）
npm run process-photos          # 处理所有天
npm run process-photos 2026-10-15  # 只处理某一天

# 3. 启动 dev server
npm run dev
# → http://localhost:4321/

# 4. 生产构建
npm run build
```

构建会先跑图片处理，再 `astro build`。

---

## 📷 添加新的一天

```bash
# 1. 创建当日文件夹
mkdir -p src/content/days/2026-10-15/raw

# 2. 把素材拷进去
cp /path/to/photos/*.HEIC src/content/days/2026-10-15/raw/
cp /path/to/videos/*.MOV  src/content/days/2026-10-15/raw/

# 3.（可选）写 meta.md
cat > src/content/days/2026-10-15/meta.md <<'EOF'
---
date: "2026-10-15"
title: "第一次出门散步"
mood: "brave"
weather: "多云"
photos:
  - src: IMG_1900.HEIC
  - src: IMG_1901.HEIC
videos:
  - src: IMG_1900.MOV
---
EOF

# 4. 处理该天
npm run process-photos 2026-10-15

# 5. 推送（Vercel 自动部署）
git add src/content/days/2026-10-15/
git commit -m "Day 8: 第一次出门散步"
git push origin main
```

不写 `meta.md` 也行。脚本会自动读 `raw/` 里所有图片/视频，按文件名排序。

---

## 📝 meta.md 字段

```yaml
---
date: "2026-10-08"   # 必填，YYYY-MM-DD（必须加引号，避免 YAML 解析成 Date 对象）
title: ""           # 可选，一句话标题（留空就用日期作为标题）
mood: "curious"    # 可选：happy | playful | calm | sleepy | curious | brave
weather: ""         # 可选，自由文本
note: ""             # 可选，正文（建议一句话以内）
photos:              # 必填，按顺序展示，第一张是当天的头图
  - src: ""          # 必填，相对 raw/ 的路径
videos:              # 可选
  - src: ""
```

`date`、`title`、`mood`、`weather`、`note` 都有默认值。`photos` 留空脚本会自动读 `raw/`。

---

## 🎨 设计说明

按 design-taste-frontend skill 设计：把站点当成一本摄影书，不当成网站。

- **Cover（首页）**：小方形 portrait + 大标题 + 出生日期
- **Spreads（首页最近 30 天）**：每 Day 一页，顶部一行日期 + 第几天/共几天，下方先一张 lead photo，再 2-3 列 grid 剩余照片，最后视频
- **Archive（`/archive/`）**：30 天之前的更早日子，按月分组，每行是日期 + 缩略图 + 标题 + 数量统计
- **About（关于页）**：标题 + portrait + 手记 + 居中排列的事实列表
- **EndMark（页面底部）**：大数字 + 备忘话 + ©

调色板：`#F2EFE9` 暖 off-white + `#0A0A0A` 黑字 + `#8B2C2C` 深酒红 accent（极少量使用）
字体：苹方 / 思源黑体 / Songti SC（仅备用）
完全交给照片：照片之外不写叙事文字

---

## 🛠  核心文件

```
src/
  components/
    Header.astro         # 居中 nav（记录 / 关于）
    BookCover.astro      # 封面（首页）
    Spread.astro         # 每个 Day 的书页（首页 + /day/<date>/）
    PhotoPlate.astro     # 单张图片容器（plate 纸感）
    VideoPlate.astro     # 单个视频容器（hover 静音预览 + 点击全屏）
    Lightbox.astro       # 全屏图片预览
    EndMark.astro         # 页面底部
  pages/
    index.astro          # 首页（封面 + 最近 30 天 spread）
    day/[date].astro     # 单日详情（一个 spread）
    archive/index.astro  # 更早的记录（按月分组）
    about.astro          # 关于页
    404.astro
  layouts/
    BaseLayout.astro      # HTML 框架 + IntersectionObserver 动效
  lib/
    days.ts              # BIRTHDAY / HOMECOMING_DATE 常量 + 计算函数
  styles/
    global.css           # 设计 token + reveal 动效
  content/
    days/<date>/meta.md  # 每天的元数据
    days/<date>/raw/     # 原始素材（git 内）
public/
  processed/<date>/      # sharp 处理后产物（gitignore）
  icons/                 # PWA 图标
  og-cover.jpg
  favicon.svg
  apple-touch-icon.png
  manifest.webmanifest
scripts/
  process-photos.mjs     # HEIC → WebP（400/800/1600w）+ 视频 poster
```

## 部署

Vercel 已配置。push 到 `main` 自动构建+部署。

---

© 2026 白板的成长日记 · Born 2026.09.10 · Home 2026.10.08