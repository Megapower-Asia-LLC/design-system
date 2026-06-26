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

### 狀態徽章 `.status`
- 四態：`.status--received`（○ 灰，已收到）｜`.status--active`（● 橘，處理中）｜`.status--done`（✓ 深灰，已結案）｜`.status--cancelled`（✕ 灰虛線框，取消）
- 內含 `.status__icon`（icon slot）；WCAG 1.4.1：icon 形狀 + 文字並存、不單靠顏色。
- **品牌橘對白僅 3.29:1（小字 fail AA）**，故橘只進 `.status__icon`（圖形 3:1 門檻），文字一律深灰。狀態進度一律用此橘+灰套，勿用語意色（如 success 綠）表狀態。

### 其他 utility
`.container`（限寬置中）、`.skip-link`、`.sr-only`、`:focus-visible`（品牌橘外框）。

## 核心 token（節錄，完整見 `tokens/tokens.css`）

- 顏色：`--color-primary` #F06000、`--color-primary-hover` #D45200、`--color-primary-soft-bg` #FFF7ED、`--color-text` #1E293B、`--color-text-muted` #64748B、`--color-bg` #FFFFFF、`--color-bg-soft` #F8FAFC、`--color-border` #E2E8F0
- 字級：`--text-sm/base/lg/xl`、`--text-display-md/lg`（responsive `clamp`）
- 間距：`--space-2/4/6/8/12`、`--spacing-section`、`--spacing-container`、`--max-width-content/narrow`
- 圓角：`--radius-sm/md/lg/full`；陰影：`--shadow-sm/md/lg`；過場：`--transition-fast/base`
- 狀態：`--color-status-received/active/done/cancelled`（映射 muted／primary／text／muted，狀態語言用）

## 應用層語意色（opt-in，非品牌門面）

品牌門面只有橘+灰，**不含** success/warning/danger。內部工具（後台／表單）需功能回饋色時，另引入 `tokens/tokens-app.css`（npm：`@import "@megapower/design-tokens/tokens-app.css"`），取得 muted 版 `--color-success` #2E7D55／`--color-warning` #9A6700／`--color-danger` #B42318（皆過白底 WCAG AA、各附 `-hover`/`-tint`）。

- ✅ 僅限功能回饋：表單驗證錯誤、操作 toast、危險動作確認。
- ❌ 禁用於品牌敘事，與狀態進度（狀態一律用 `.status` 橘+灰）。
- ⚠ 三色皆不過深底；深底（toast／`.section--dark`）改白字 + 彩色 icon。

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
