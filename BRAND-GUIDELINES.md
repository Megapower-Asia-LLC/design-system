# 群兆品牌指引（Brand Guidelines）

> 給「做視覺決策」的人與 agent：一頁看懂品牌不可妥協處與常見誤用。元件語彙見 `CONVENTIONS.md`、logo 檔案規範見 `ds-bundle/BRAND-ASSETS.md`、活樣式表 https://www.megapower.asia/ds/ 。

## 色彩

- 主色 `#F06000`（官方 logo 橘，2026-05-21 拍板）。**不是** Tailwind 的 `#F97316`。
- **橘不做文字色**：對白僅 3.29:1（小字 fail WCAG AA）。橘只進 icon／圓點／底色／邊框（圖形 3:1 門檻）；文字一律深灰 `#1E293B`／`#64748B`。selector 級例外清單（CI 明列、防擴散）：`.btn--primary`／`.btn--outline:hover`／`.skip-link`——皆為白字壓橘底（品牌識別優先，守圖形級 ≥3.0）。
- 門面永遠純橘+灰。success/warning/danger/info 是 opt-in（`tokens-app.css`），僅限內部工具功能回饋；tint 淺底上文字用 `-hover` 深化版或深灰。
- 一律 `var(--…)` token，不寫死色碼（下游可跑 `ds-guard` 自檢）。

## 字體

- system font stack（PingFang TC／Microsoft JhengHei…），整體字重 600、標題 700、strong 700。
- **勿加 web font**——PSI 效能決策（原 web font 路線 ~6.5s render-blocking）。

## Logo / QR

- 淺底用 light 版、深底用 dark 版；**勿變形、改色、旋轉、加陰影、重繪**。
- 留白 ≥ M 字高 50%；主標誌（mark）最小 24px、完整標誌（full）最小 120px 寬。
- 公開 URL：`https://www.megapower.asia/ds/logo/`（六檔清單見 BRAND-ASSETS.md）。
- 向量原檔：OneDrive `行銷相關/Logo/`（repo 備援 `brand-source/`）。
- 常見誤用：橘 logo 壓橘底、logo 當按鈕、擷取 M 圖形重新上色、拉伸成非等比。

## Icon 決策（記錄，2026-07-09）

- **不引入 icon font／SVG icon 系統（含 Lucide）**——目前唯一的 icon 需求是 `.status__icon` 的字元集（○ ● ✓ ✕ ⊘ ◐ ⏸），純文字字元零依賴、零請求，夠用即止。未來出現「≥2 個下游重複需要圖形 icon」再依收編準則重議。
- 狀態 icon 顏色走 `--color-status-*` token；icon 是「橘可出現」的合法位置。

## 深色與列印

- **Dark mode 非設計目標**：深色只允許 `.section--dark` 區塊級用法；生成 UI 不得自加 `prefers-color-scheme`。
- 列印已內建最小 `@media print`（深色區塊轉白、卡片陰影轉框、按鈕不噴墨底）。

## 一切的真相位置

SoT = megaweb `src/styles/*.css`；本 repo 為配銷層（semver 發版）。改品牌走 `MAINTENANCE.md` SOP，勿在下游手改。
