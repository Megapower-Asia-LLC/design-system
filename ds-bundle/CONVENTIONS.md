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
- 門面樣式：`.btn--primary`（實心橘）｜`.btn--secondary`（白底灰框）｜`.btn--outline`（橘框深灰字）｜`.btn--ghost`（低調輔助：淡橘底深灰字）
- opt-in 樣式（需另引 `components-app.css`）：`.btn--danger`（危險操作，磚紅底白字）
- 尺寸：`.btn--sm`｜`.btn--md`｜`.btn--lg`
- 在 `.section--dark` 內，`.btn--secondary` 會自動轉淺色描邊。
- **按鈕只有以上五種樣式——不提供、也不得自造 `.btn--success`／`.btn--info`**（語意色當按鈕底色是走鐘前科：飽和綠 #16a34a 對白 3.3:1 fail AA）。操作成功用 toast／訊息回饋，不用綠色按鈕。

### 區塊 `.section`
- 變體：`.section--soft`（淺灰底）｜`.section--dark`（深底，內文自動轉淺）
- 限寬容器：`.section__inner`（max 1200px）｜`.section__inner--narrow`（max 720px，長文）

### 卡片 `.card`
- 變體：`.card--soft`（淺灰底）｜`.card--accent`（左側品牌橘邊條）｜`.card--interactive`（hover 上浮 + 橘框）

### 狀態徽章 `.status`
- 四態：`.status--received`（○ 灰，已收到）｜`.status--active`（● 橘，處理中）｜`.status--done`（✓ 深灰，已結案）｜`.status--cancelled`（✕ 灰虛線框，取消）
- 內含 `.status__icon`（icon slot）；WCAG 1.4.1：icon 形狀 + 文字並存、不單靠顏色。
- **品牌橘對白僅 3.29:1（小字 fail AA）**，故橘只進 `.status__icon`（圖形 3:1 門檻），文字一律深灰。狀態進度一律用此橘+灰套，勿用語意色（如 success 綠）表狀態。
- **業務態擴充規約（門面不新增 class）**：業務狀態映射 canonical 四態、差異用「文字 + icon 字元」表達（icon 從 ○ ● ✓ ✕ ⊘ ◐ ⏸ 選不重複者）。歸類：待確認→received、進行中→active、正常終態→done、異常終態→cancelled。例（報價單）：draft→received(○)、sent→active(●)、accepted→done(✓)、rejected→cancelled(✕)、expired→cancelled(⊘)。禁止自造新態 class（如 `.status--draft`）或引入新色。

### 表單 `.form-*`（Phase 4 收編）
- 結構（門面）：`.form-group` ＞ `.form-label` + `.form-input`｜`.form-select`｜`.form-textarea`｜`.form-checkbox` + `.form-hint`；並排 `.form-row`（640px 收合單欄）
- 錯誤態（opt-in，見下方語意元件）：控件加 `--error` modifier + `.form-error-text`
- focus 已內建（品牌橘框 + 12% tint 光暈，全域 `:focus-visible` 的唯一豁免款）勿覆蓋；控件字級 `--text-base`（16px）勿改小（iOS Safari 聚焦縮放）
- a11y：`label[for]`、錯誤訊息 `aria-describedby` + `role="alert"`、必填 `aria-required`

### 其他 utility
`.container`（限寬置中）、`.skip-link`、`.sr-only`、`:focus-visible`（品牌橘外框）。

## 核心 token（節錄，完整見 `tokens/tokens.css`）

- 顏色：`--color-primary` #F06000、`--color-primary-hover` #D45200、`--color-primary-soft-bg` #FFF7ED、`--color-text` #1E293B、`--color-text-muted` #64748B、`--color-bg` #FFFFFF、`--color-bg-soft` #F8FAFC、`--color-border` #E2E8F0
- 字級：`--text-sm/base/lg/xl`、`--text-display-md/lg`（responsive `clamp`）
- 間距：`--space-2/4/6/8/12`、`--spacing-section`、`--spacing-container`、`--max-width-content/narrow`
- 圓角：`--radius-sm/md/lg/full`；陰影：`--shadow-sm/md/lg`；過場：`--transition-fast/base`
- 狀態：`--color-status-received/active/done/cancelled`（映射 muted／primary／text／muted，狀態語言用）

## 應用層語意色與語意元件（opt-in，非品牌門面）

品牌門面只有橘+灰，**不含** success/warning/danger/info。內部工具（後台／表單）需功能回饋時，另引兩檔（順序在門面之後）：

- **語意色 token** `tokens/tokens-app.css`：muted 版 `--color-success` #2E7D55／`--color-warning` #9A6700／`--color-danger` #B42318／`--color-info` #2C5282（皆過白底 WCAG AA、各附 `-hover`/`-tint`）
- **語意元件** `components-app.css`（依賴上檔）：`.btn--danger`、`.form-input--error`（select/textarea 同型）、`.form-error-text`——內建 fallback，漏引 token 檔 degrade 不爆版

引用方式：CDN `<link href="https://www.megapower.asia/ds/tokens-app.css">` + `…/ds/components-app.css`；npm `@import "@megapower/design-tokens/tokens-app.css"` + `"@megapower/design-tokens/components-app.css"`。

- ✅ 僅限功能回饋：表單驗證錯誤、操作 toast、危險動作確認。
- ❌ 禁用於品牌敘事，與狀態進度（狀態一律用 `.status` 橘+灰）。
- ⚠ 三色皆不過深底；深底（toast／`.section--dark`）改白字 + 彩色 icon。tint 淺底上文字用 `-hover` 深化版或深灰。

## 分層邊界（寫死，生成 UI 時遵守）

| 層 | 檔案 | 內容 | 誰引 |
|---|---|---|---|
| 門面 token | `tokens/tokens.css` | 橘+灰品牌 token、狀態 token | 所有人（含在 megapower.css） |
| 門面元件 | `_ds_bundle.css` | 結構性元件（btn/section/card/status/form 結構） | 所有人（含在 megapower.css） |
| 語意 token（opt-in） | `tokens/tokens-app.css` | success/warning/danger/info | 內部工具另引 |
| 語意元件（opt-in） | `components-app.css` | 帶語意色的元件變體（`.btn--danger`、`.form-input--error`…） | 內部工具另引，**必須先引 tokens-app.css** |

- 門面永遠純橘+灰；語意色與其元件變體只活在 opt-in 兩檔。
- `components-app.css` 依賴 `tokens-app.css`（載入順序：megapower.css → tokens-app.css → components-app.css）；其內部一律 `var(--color-danger, #B42318)` 帶 fallback，漏引 tokens-app 也不會壞版。
- **dark mode 非設計目標**：深色只允許 `.section--dark` 區塊級用法，生成 UI 時不得自加 `prefers-color-scheme` 樣式。

## 元件收編準則（給維護者與 agent 的決策規則）

- **收編條件（兩者皆滿足才收）**：≥2 個下游重複自造，且涉及品牌面（色彩／字體／焦點／狀態語言）。
- **不收編清單（佈局屬專案層，統一成本高於各自維護）**：navbar、app-shell/app-layout、modal、pagination、empty-state、utility spacing class（用 `--space-*` token 排版，不提供 `.mt-2` 類 utility）。
- **候選觀察區（已見自造訊號、未達門檻）**：`.table`（MegaQ `.table` vs MegaQuotr `.data-table`，命名未收斂）、`.toast`（僅 MegaQuotr 一家成形）。第二個下游出現成形實作時再收。

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
      <a href="#" class="btn btn--primary btn--md">主要行動</a>
      <a href="#" class="btn btn--outline btn--md">次要</a>
    </div>
  </div>
</section>
```
