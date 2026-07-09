# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

群兆視覺設計系統（Megapower Design System）的**發布產物 repo**。純 CSS（CSS 變數 token + BEM class）+ JS token 匯出，零框架、零 build、零測試。

## 最重要的事：這個 repo 是下游，不是真相來源

**單一權威來源（SoT）是 `megaweb` repo 的 `src/styles/*.css`**（Mac 工作正本並列於 `~/Projects/_Megapower/megaweb`；雙 checkout 收斂見 MAINTENANCE）。本 repo 的 `megapower.css`、`ds-bundle/`、`CONVENTIONS.md` 全都是從 megaweb **產生／複製**而來。

- **不要手改** `megapower.css`、`ds-bundle/_ds_bundle.css`、`ds-bundle/tokens/tokens.css`、`CONVENTIONS.md`——它們是衍生檔，下次同步會被覆蓋。要改品牌，改 megaweb SoT 再依 `MAINTENANCE.md` 流程同步回來。
- 各專案應「引用」品牌（CDN link 或 npm 套件），絕不「複製」色碼。各專案寫死顏色＝品牌走鐘。

## 衍生檔與守門（原「兩份副本陷阱」已消滅）

`tokens.js` 自 Phase 2 起是**生成物**：`node scripts/build-tokens.mjs` 從 `ds-bundle/tokens/tokens.css` 生成，勿手改（CI 以 `--check` 驗證一致）。改色只改 megaweb SoT，同步後跑生成即可，不再有手動雙寫。

守門：`scripts/check-brand.mjs`（package 模式；SoT 在 megaweb/scripts/，此為同步副本）+ `scripts/build-tokens.mjs --check`，兩者接在 `.github/workflows/brand-check.yml`（PR 掛 `break-glass` label 可緊急跳過，留 audit warning）。megaweb 端另有部署前主 gate（Pages build 必經）。

## 三條發布管道（同一份 SoT，服務不同消費端）

| 管道 | 形式 | 對應檔 |
|---|---|---|
| CDN CSS | `<link href="https://www.megapower.asia/ds/megapower.css">` | `megapower.css`（自包含單檔） |
| npm 套件 | `npm install github:Megapower-Asia-LLC/design-system`（git 依賴，免 publish） | `package.json` / `index.js` / `tokens.js` |
| Claude Design | 「群兆視覺設計系統」專案上傳 `ds-bundle/` | `ds-bundle/`（含 `styles.css` 入口、元件 HTML + `*.prompt.md`） |

npm 匯出見 `package.json` 的 `exports`：`@megapower/design-tokens`（JS）、`/css`（megapower.css）、`/tokens.css`。

## 品牌不可妥協規則（誠信，勿擅自更動）

- **主色是 `#F06000`**（官方 logo 橘，2026-05-21 拍板），**不是** Tailwind 的 `#F97316`。megapower.css 內有註解說明此決策。
- **字體一律 system font stack**（PingFang TC / Microsoft JhengHei …），整體字重 600、標題 700。**不要加回 web font**——移除 web font 是 PSI 效能決策（原路線 ~6.5s render-blocking）。
- 顏色、間距、圓角、陰影一律用 `var(--…)` token，不寫死色碼。
- Logo / QR 勿變形、改色、旋轉、加陰影；淺底用 light 版、深底用 dark 版（規範見 `ds-bundle/BRAND-ASSETS.md`）。

## 樣式語彙（語意 BEM class，非 utility class）

生成 UI 時組合這些 class，版面細節（grid/flex/間距）用 token 補：

- 按鈕：`.btn` + `--primary｜secondary｜outline` + `--sm｜md｜lg`（`.section--dark` 內 secondary 自動轉淺）
- 區塊：`.section` + `--soft｜dark`；限寬 `.section__inner`(1200) / `.section__inner--narrow`(720)
- 卡片：`.card` + `--soft｜accent｜interactive`
- 狀態徽章：`.status` + `--received｜active｜done｜cancelled`（橘+灰+icon 狀態語言）
- utility：`.container`、`.skip-link`、`.sr-only`、`:focus-visible`（品牌橘外框）

精確 token 值讀 `ds-bundle/tokens/tokens.css`；元件實作讀 `ds-bundle/_ds_bundle.css`。

## 狀態語言、語意色分層與自託管 vendoring

- **狀態語言**：狀態進度用 `.status` 徽章（橘+灰+icon），狀態 token `--color-status-received/active/done/cancelled` 映射既有橘+灰。品牌橘對白只有 3.29:1（小字 fail AA），所以**橘只能當 icon/圓點色、不能當文字色**——文字一律深灰。
- **語意色分層**：success/warning/danger **不在**品牌門面 `megapower.css`、也不在 `tokens.js`，而在 opt-in 的 `tokens-app.css`（muted 版、過 WCAG AA），只給內部工具功能回饋（表單驗證/toast/危險確認）。引用：`@import "@megapower/design-tokens/tokens-app.css"`。門面維持純橘+灰。
- **自託管 vendoring**：含敏感資料/嚴格 CSP 的頁面（如客戶追蹤頁）不引用 CDN，改用 `scripts/vendor-brand.mjs` 從 npm 套件複製整份 CSS+logo 進 `public/assets/`、蓋版本章、寫 `vendor.lock.json`。這是官方「受控複製」，不違反「勿複製」——鐵則目的是防走鐘，vendoring 比手寫 inline 更不走鐘。SOP 見 `MAINTENANCE.md` §7。

## 維護流程

改品牌的完整 SOP 在 **`MAINTENANCE.md`**：改 megaweb SoT → megaweb 跑 `node scripts/sync-ds.mjs`（一鍵重產＋守門＋同步本 repo＋全套驗證）→ 部署 megaweb（Cloudflare Pages build 必經品牌 gate，紅燈不上 CDN）→ 本 repo 發版（semver：分支 → `npm version` → tag → PR → Release 附 CDN 內容指紋）→ npm 下游 `npm update`（`#semver` 釘版）／inline 專案 `sd` 批次。已納管專案清單與各自接入方式也在該檔。

git commit email 用 `191950007+aiken884@users.noreply.github.com`（帳號開了 email privacy，用真實 email 會被拒 push）。

## 文件分工

- `README.md`：給「用品牌」的人（如何引用）
- `CONVENTIONS.md`：給 design agent 的使用慣例（衍生自 megaweb，勿手改）
- `MAINTENANCE.md`：給「改品牌」的人（同步 SOP）
- `ds-bundle/BRAND-ASSETS.md`：logo / QR 規範
