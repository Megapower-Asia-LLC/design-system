# Megapower Design System — 使用慣例（群兆視覺設計系統）

這是群兆資訊（Megapower）的官方視覺設計系統。用它生成的所有 UI 都應套用以下 token 與元件 class，產出即為群兆品牌風格。權威來源：`megaweb/src/styles/*.css`。

## 套用方式（必讀）

所有樣式來自單一入口 `styles.css`（它 `@import` 了 `tokens/tokens.css` 與 `_ds_bundle.css`）。頁面只要載入 `styles.css`，即取得全部 design token 與元件 class。

- 不需要任何 JS 框架或 provider —— 這是純 CSS（CSS 變數 + BEM class）的設計系統。
- 字體已在 `html`/`body` 設定為 system font stack（PingFang TC / Microsoft JhengHei …），整體字重 600、標題 700。不要自行改字體。
- 顏色、間距、圓角、陰影一律用 token（`var(--…)`），不要寫死色碼。品牌主色是 `var(--color-primary)` = `#F06000`（官方 logo 橘）。

## 樣式語彙（BEM class + token）

這套系統用「語意 class」而非 utility class。生成 UI 時優先組合下列 class；版面細節（grid/flex、間距）用 token 變數自行補。

### 按鈕 `.btn`
- 樣式：`.btn--primary`（實心橘）｜`.btn--secondary`（白底灰框）｜`.btn--outline`（橘框）
- 尺寸：`.btn--sm`｜`.btn--md`｜`.btn--lg`
- 在 `.section--dark` 內，`.btn--secondary` 會自動轉淺色描邊。

### 區塊 `.section`
- 變體：`.section--soft`（淺灰底）｜`.section--dark`（深底，內文自動轉淺）
- 限寬容器：`.section__inner`（max 1200px）｜`.section__inner--narrow`（max 720px，長文）

### 卡片 `.card`
- 變體：`.card--soft`（淺灰底）｜`.card--accent`（左側品牌橘邊條）｜`.card--interactive`（hover 上浮 + 橘框）

### 其他 utility
`.container`（限寬置中）、`.skip-link`、`.sr-only`、`:focus-visible`（品牌橘外框）。

## 核心 token（節錄，完整見 `tokens/tokens.css`）

- 顏色：`--color-primary` #F06000、`--color-primary-hover` #D45200、`--color-primary-soft-bg` #FFF7ED、`--color-text` #1E293B、`--color-text-muted` #64748B、`--color-bg` #FFFFFF、`--color-bg-soft` #F8FAFC、`--color-border` #E2E8F0
- 字級：`--text-sm/base/lg/xl`、`--text-display-md/lg`（responsive `clamp`）
- 間距：`--space-2/4/6/8/12`、`--spacing-section`、`--spacing-container`、`--max-width-content/narrow`
- 圓角：`--radius-sm/md/lg/full`；陰影：`--shadow-sm/md/lg`；過場：`--transition-fast/base`

## 真相位置

需要精確值時讀這些檔（綁定副本）：`styles.css`（入口）、`tokens/tokens.css`（所有 token）、`_ds_bundle.css`（base/typography 與元件 class 實作）。

## 品牌 Logo

群兆 logo 託管於公開 URL，依背景選版（淺底用 light、深底用 dark），勿變形或改色：

- 主標誌（純 M，UI/favicon/小尺寸）：`https://www.megapower.asia/ds/logo/logo-mark-light.png`、`…/logo-mark-dark.png`
- 完整標誌（M+公司名+標語）：`…/ds/logo/logo-full-light.png`、`…/logo-full-dark.png`
- 官網 QR：`…/ds/logo/qr-website-light.png`、`…/qr-website-dark.png`

## 慣用範例

```html
<link rel="stylesheet" href="styles.css">
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
