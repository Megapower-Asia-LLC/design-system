# 群兆設計系統使用指南 (Megapower Design System)

群兆官方視覺設計系統。一行引用，任何專案即套群兆品牌。
權威來源：`megaweb/src/styles/*.css`（請勿在各專案複製，改用引用，避免走鐘）。

> 維護品牌（改色 / 加資產 / 同步各專案）請見 **[MAINTENANCE.md](MAINTENANCE.md)**。

## 快速開始

HTML 加一行即可（零安裝、零 build，任何技術棧）：

```html
<link rel="stylesheet" href="https://www.megapower.asia/ds/megapower.css">
```

之後用語意 class + token，產出即群兆風格。megaweb 來源更新並部署後，所有引用者自動同步。

## Dark mode（0.5.0 起，三態）

> ⚠ **CDN 消費端行為變更（BREAKING-for-CDN）**：0.5.0 起「跟隨系統」深色**預設開啟**——系統設深色的訪客會自動看到深色版。頁面尚未驗收深色呈現者，請立即釘回亮色（下方逃生口），舊版 CSS 下該屬性是無害 no-op，可提前部署。

三態機制（純 CSS，無 JS 依賴）：

| 狀態 | 條件 | 行為 |
|------|------|------|
| 亮色（預設） | 無任何屬性 | 現有樣式，與 0.4 完全一致 |
| 跟隨系統 | 使用者系統偏好深色 | 自動套 dark token |
| 手動指定 | `<html data-theme="dark">` 或 `"light"` | 勝過系統偏好（雙向） |

**逃生口（釘回亮色）**：`<html data-theme="light">`——整站永遠亮色，不跟系統。

**手動切換 snippet**（防 FOUC 必須放 `<head>` 最頂、任何 CSS 之前、inline 不外連）：

```html
<meta name="color-scheme" content="light dark">
<script>
  try { var t = localStorage.getItem("theme");
        if (t) document.documentElement.setAttribute("data-theme", t); } catch (e) {}
</script>
```

切換按鈕：`setAttribute("data-theme", next)` + `localStorage.setItem("theme", next)`。

**覆寫 token 鐵則（@layer）**：0.5.0 起 DS token 包在 `@layer mp-tokens`，你在 layer 外的 `:root { --color-x: … }` 覆寫恆勝——**但 dark 模式下也勝**。因此覆寫任何 `--color-*` 必須「三塊同構」一併給 dark 值（light `:root`／`@media screen and (prefers-color-scheme: dark)` 內 `:root:not([data-theme="light"])`／`:root[data-theme="dark"]`），否則該頁必須釘 `data-theme="light"`。`npx ds-guard` 會抓違規（R8）。

**深色下 logo 用 dark 版。** 三態頁面勿用 `<picture media>`（只跟系統、不跟 `data-theme` 手動切換）；正確 pattern 是雙 img ＋ 與 token 同組選擇器的 CSS 顯隱：

```html
<img class="logo-on-light" src=".../logo-mark-light.png" alt="群兆資訊" width="40" height="40">
<img class="logo-on-dark"  src=".../logo-mark-dark.png"  alt="群兆資訊" width="40" height="40">
```

```css
.logo-on-dark { display: none; }
@media screen and (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .logo-on-light { display: none; }
  :root:not([data-theme="light"]) .logo-on-dark  { display: inline; }
}
:root[data-theme="dark"] .logo-on-light { display: none; }
:root[data-theme="dark"] .logo-on-dark  { display: inline; }
```

釘 `data-theme="light"` 的頁面照舊單張 light 版；永遠深底的區塊（`.section--dark`）一律 dark 版。

## 作為 npm 套件安裝（React / Tailwind 等需編譯的專案）

純靜態頁直接 link 上面的 CSS 即可；需要在 build 階段使用 token 的專案，可把本 repo 當套件安裝——**git 依賴 + semver tag 釘版，免 publish、免註冊 registry**：

```bash
npm install "github:Megapower-Asia-LLC/design-system#semver:^0.5"
```

之後 `npm update` 只會升到相容版（不會直接吃 main 最新 commit）；緊急回滾把依賴改成 `#semver:0.x.y` 釘指定版。**lockfile 必須 commit、CI 一律 `npm ci`**，semver 治理才有效。

```js
// 讀 token（顏色、字體、間距、logo URL）
import { color, fontSans, logo } from "@megapower/design-tokens";
// color.primary === "#F06000"
```

```css
/* 或直接引入 CSS 變數 */
@import "@megapower/design-tokens/css";
```

更新品牌：改 megaweb 來源 → 同步本 repo + 發版（見 MAINTENANCE）→ 各專案 `npm update @megapower/design-tokens`。

## 樣式語彙（BEM class）

| 類型 | class |
|------|-------|
| 按鈕 | `.btn` + `.btn--primary｜secondary｜outline` + `.btn--sm｜md｜lg` |
| 區塊 | `.section` + `.section--soft｜dark`；限寬 `.section__inner`(1200) / `.section__inner--narrow`(720) |
| 卡片 | `.card` + `.card--soft｜accent｜interactive` |
| 狀態徽章 | `.status` + `.status--received｜active｜done｜cancelled`（橘+灰+icon 狀態語言） |
| 其他 | `.container`、`.skip-link`、`.sr-only`、`:focus-visible`（品牌橘外框） |

## 核心 token（一律 `var(--…)`，勿寫死色碼）

> ※ 精確值以 `ds-bundle/tokens/tokens.css` 為準；下表僅為便覽副本，改色一律依 [MAINTENANCE.md](MAINTENANCE.md) 改 SoT，勿手改此表。

| 用途 | token | 值 |
|------|-------|----|
| 品牌主色 | `--color-primary` | `#F06000`（官方 logo 橘） |
| 主色 hover | `--color-primary-hover` | `#D45200` |
| 文字 / 次要 | `--color-text` / `--color-text-muted` | `#1E293B` / `#64748B` |
| 底色 / 柔底 | `--color-bg` / `--color-bg-soft` | `#FFFFFF` / `#F8FAFC` |
| 邊框（裝飾） | `--color-border` | `#E2E8F0` |
| 表單邊框 | `--color-border-input` | `#E2E8F0`（dark 下過 WCAG 1.4.11） |
| 深色強調區底 | `--color-surface-inverse` | `#1E293B`（`.section--dark` 用；**勿再拿 `--color-text` 當背景**） |
| surface hover | `--color-bg-hover` | `#F8FAFC`（dark 下亮化） |
| 表單控件底 | `--color-input-bg` | `#FFFFFF`（dark 下內凹） |

上表為 **light 基準值**；dark 值由三態機制自動切換（精確值見 `ds-bundle/tokens/tokens.css` 兩塊 dark 覆蓋）。`tokens.js`（JS 匯出）一律為 light 基準值。

字級 `--text-sm/base/lg/xl`、`--text-display-md/lg`；間距 `--space-2/4/6/8/12`；圓角 `--radius-sm/md/lg/full`；陰影 `--shadow-sm/md/lg`；過場 `--transition-fast/base`；表單 focus 光暈 `--color-focus-ring`（CSS 專用）。

## 複製即用範例

```html
<link rel="stylesheet" href="https://www.megapower.asia/ds/megapower.css">
<section class="section section--soft">
  <div class="section__inner--narrow">
    <h2>標題</h2>
    <p>說明文字。</p>
    <div style="display:flex; gap:var(--space-4); margin-top:var(--space-6)">
      <a href="#" class="btn btn--primary btn--md">主要行動</a>
      <a href="#" class="btn btn--outline btn--md">次要</a>
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
- **維護（改品牌）**：改 `megaweb/src/styles/*.css` → 重產 `public/ds/megapower.css` → push `master` → Cloudflare 自動部署。需 GitHub `Megapower-Asia-LLC/megaweb` 協作權限；建議集中少數人改，避免品牌分歧。
- **設計（Claude Design）**：使用「群兆視覺設計系統」專案，生成 UI 自動套群兆品牌。
