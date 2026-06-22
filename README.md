# 群兆設計系統使用指南 (Megapower Design System)

群兆官方視覺設計系統。一行引用，任何專案即套群兆品牌。
權威來源：`megaweb/src/styles/*.css`（請勿在各專案複製，改用引用，避免走鐘）。

## 快速開始

HTML 加一行即可（零安裝、零 build，任何技術棧）：

```html
<link rel="stylesheet" href="https://www.megapower.asia/ds/megapower.css">
```

之後用語意 class + token，產出即群兆風格。megaweb 來源更新並部署後，所有引用者自動同步。

## 作為 npm 套件安裝（React / Tailwind 等需編譯的專案）

純靜態頁直接 link 上面的 CSS 即可；需要在 build 階段使用 token 的專案，可把本 repo 當套件安裝——**git 依賴，免 publish、免註冊 registry**：

```bash
npm install github:Megapower-Asia-LLC/design-system
```

```js
// 讀 token（顏色、字體、間距、logo URL）
import { color, fontSans, logo } from "@megapower/design-tokens";
// color.primary === "#F06000"
```

```css
/* 或直接引入 CSS 變數 */
@import "@megapower/design-tokens/css";
```

更新品牌：改 megaweb 來源 → 同步本 repo → 各專案 `npm update @megapower/design-tokens`。

## 樣式語彙（BEM class）

| 類型 | class |
|------|-------|
| 按鈕 | `.btn` + `.btn--primary｜secondary｜outline` + `.btn--sm｜md｜lg` |
| 區塊 | `.section` + `.section--soft｜dark`；限寬 `.section__inner`(1200) / `.section__inner--narrow`(720) |
| 卡片 | `.card` + `.card--soft｜accent｜interactive` |
| 其他 | `.container`、`.skip-link`、`.sr-only`、`:focus-visible`（品牌橘外框） |

## 核心 token（一律 `var(--…)`，勿寫死色碼）

| 用途 | token | 值 |
|------|-------|----|
| 品牌主色 | `--color-primary` | `#F06000`（官方 logo 橘） |
| 主色 hover | `--color-primary-hover` | `#D45200` |
| 文字 / 次要 | `--color-text` / `--color-text-muted` | `#1E293B` / `#64748B` |
| 底色 / 柔底 | `--color-bg` / `--color-bg-soft` | `#FFFFFF` / `#F8FAFC` |
| 邊框 | `--color-border` | `#E2E8F0` |

字級 `--text-sm/base/lg/xl`、`--text-display-md/lg`；間距 `--space-2/4/6/8/12`；圓角 `--radius-sm/md/lg/full`；陰影 `--shadow-sm/md/lg`；過場 `--transition-fast/base`。

## 複製即用範例

```html
<link rel="stylesheet" href="https://www.megapower.asia/ds/megapower.css">
<section class="section section--soft">
  <div class="section__inner--narrow">
    <h2>標題</h2>
    <p>說明文字。</p>
    <div style="display:flex; gap:var(--space-4); margin-top:var(--space-6)">
      <a class="btn btn--primary btn--md">主要行動</a>
      <a class="btn btn--outline btn--md">次要</a>
    </div>
  </div>
</section>
```

## 字體

system font stack（PingFang TC / Microsoft JhengHei …），無 web font、字重 600、標題 700。已內建，勿覆蓋。

## 品牌資產（Logo / QR）

完整資產與規範見 `ds-bundle/BRAND-ASSETS.md`。常用：

- 主標誌（純 M 圖標）：`/ds/logo/logo-mark-light.png`（淺底）、`/ds/logo/logo-mark-dark.png`（深底）
- 完整標誌（含公司名+標語）：`/ds/logo/logo-full-light.png`、`/ds/logo/logo-full-dark.png`
- 官網 QR：`/ds/logo/qr-website-light.png`（白底）、`/ds/logo/qr-website-dark.png`（深底）

base URL：`https://www.megapower.asia`。淺底用 light 版、深底用 dark 版；勿變形/改色。

## 三種角色

- **消費（套用品牌）**：引用上面的 URL 即可。
- **維護（改品牌）**：改 `megaweb/src/styles/*.css` → 重產 `public/ds/megapower.css` → push `master` → Cloudflare 自動部署。需 GitHub `aiken884/megaweb` 協作權限；建議集中少數人改，避免品牌分歧。
- **設計（Claude Design）**：使用「群兆視覺設計系統」專案，生成 UI 自動套群兆品牌。
