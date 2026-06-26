# 群兆視覺設計系統 (Megapower Design System)

群兆資訊官方視覺設計系統。純 CSS（CSS 變數 token + BEM class），零框架依賴。用它生成的 UI 即為群兆品牌風格。

> 權威來源：`megaweb/src/styles/*.css`。本包由該來源產生，請勿手改 `_ds_bundle.css`/`tokens.css`。

## 套用方式

載入單一入口 `styles.css`（已 `@import` `tokens/tokens.css` 與 `_ds_bundle.css`），即取得全部 token 與元件 class。字體為 system font stack、字重 600、標題 700。品牌主色 `var(--color-primary)` = `#F06000`。

詳見使用慣例（`.design-sync/conventions.md`）：含完整 class 語彙、token 清單與慣用範例。

## 元件清單

| 群組 | 元件 | class |
|------|------|-------|
| Foundations | Colors | design token 色票（primary / text / bg / border …） |
| Foundations | Typography | 字級階層 display-lg/md、xl/lg/base/sm，字重 600/700 |
| Actions | Button | `.btn` + `--primary/secondary/outline` + `--sm/md/lg` |
| Layout | Section | `.section` + `--soft/dark`、`.section__inner(--narrow)` |
| Surfaces | Card | `.card` + `--soft/accent/interactive` |
| Feedback | Status | `.status` + `--received/active/done/cancelled`（橘+灰+icon 狀態語言） |

## 公開引用（SoT）

各專案要套用同一套品牌，引用自包含單檔即可：

```html
<link rel="stylesheet" href="https://www.megapower.asia/ds/megapower.css">
```

更新 megaweb 來源並重新部署後，所有引用此 URL 的專案自動同步，無須各自複製。

## 應用層語意色（opt-in，非品牌門面）

品牌門面 `megapower.css` 只有橘+灰，**不含** success/warning/danger。內部工具（後台／表單）需要功能回饋語意色時，另外引入 `tokens/tokens-app.css`（muted 版、過 WCAG AA）：

```css
@import "@megapower/design-tokens/tokens-app.css";  /* 才取得 --color-success/-warning/-danger */
```

僅限功能回饋（表單驗證、操作 toast、危險確認）；狀態進度一律用上表 `.status`（橘+灰），勿用語意色表示狀態。
