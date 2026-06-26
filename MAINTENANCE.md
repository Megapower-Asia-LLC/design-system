# 群兆設計系統維護 SOP

> 這份給「**維護品牌**」的人。只想「用品牌」看 [README](README.md)；想懂設計慣例看 [CONVENTIONS](CONVENTIONS.md)。

## 1. 系統怎麼運作（先讀這個）

**單一權威來源（SoT）**：`megaweb` repo 的 `src/styles/*.css`。所有東西都從它衍生，三條管道服務不同專案：

| 管道 | 形式 | 給誰用 |
|---|---|---|
| CDN CSS | `https://www.megapower.asia/ds/megapower.css` | 純靜態頁、HTML 模板（一行 `<link>`） |
| npm 套件 | `@megapower/design-tokens`（本 repo，git 依賴） | React / Tailwind 等會 build 的前端 |
| Claude Design | 「群兆視覺設計系統」專案 | 用 AI 生成 UI 時 |

品牌資產（logo / QR）：`https://www.megapower.asia/ds/logo/`（規範見 [BRAND-ASSETS](ds-bundle/BRAND-ASSETS.md)）

**鐵則：改品牌只改 SoT，其他專案「引用」不「複製」。各專案自己寫死顏色＝必然走鐘。**

## 2. 改品牌色（或任何 token）— 核心流程

### Step 1 — 改來源
編輯 `megaweb/src/styles/tokens.css`（例如換 `--color-primary`）。
> 同源檔：`base.css`（reset/typography）、`components.css`（`.btn`/`.section`/`.card`）。改元件樣式才需動這兩個。

### Step 2 — 重新產生發布檔（在 `megaweb/` 根目錄）
```bash
cp src/styles/tokens.css ds-bundle/tokens/tokens.css
cp src/styles/tokens-app.css ds-bundle/tokens/tokens-app.css   # opt-in 語意色，獨立檔；刻意不 cat 進 megapower.css（門面維持純橘+灰）
{
  echo "/* Megapower Design System — base + component styles (generated) */"; echo
  cat src/styles/base.css; echo
  cat src/styles/components.css; echo
  echo "/* === Utilities (from global.css) === */"; tail -n +6 src/styles/global.css
} > ds-bundle/_ds_bundle.css
{ cat ds-bundle/tokens/tokens.css; echo; cat ds-bundle/_ds_bundle.css; } > public/ds/megapower.css
```

### Step 3 — 部署 megaweb
```bash
git add src/styles public/ds ds-bundle
git commit -m "chore(brand): 更新品牌 token"
git push        # Cloudflare Pages 自動部署
```
→ **純靜態頁 / 任何 link CDN 的，部署完即生效。**

### Step 4 — 同步 npm 套件（本 `design-system` repo）
```bash
cd ../design-system          # 與 megaweb 並列
cp ../megaweb/public/ds/megapower.css megapower.css
rm -rf ds-bundle && cp -r ../megaweb/ds-bundle ds-bundle
cp ../megaweb/.design-sync/conventions.md CONVENTIONS.md
```
**⚠ 重要：手動同步 `tokens.js`** — 它是 JS 匯出，跟 CSS 是**兩份**，改色要兩處都改（`color.primary` 等）；改了狀態色也要同步 `statusColor`。語意色（tokens-app.css）刻意不進 `tokens.js`（保持 opt-in、CSS-only，與門面一致）。`package.json` 的 `exports`（`./tokens-app.css`、`./logo/*`、`./ds-bundle/*`）為一次性設定，新增子路徑時才動。
```bash
git add -A && git commit -m "chore(brand): sync tokens" && git push
```
→ 各 node 前端跑 `npm update @megapower/design-tokens` + 重 build → 跟上。

### Step 5 — inline 專案半自動跟上
PrismSGA、quotr-py、報價單模板（PDF/DOCX 無法引用外部），用批次替換（`sd`）：
```bash
fd -e html -e css -e py . C:\Project\PrismSGA -E .venv -x sd '#F06000' '#新色'
fd -e css -e py . C:\Project\quotr-py -E .venv -x sd '#F06000' '#新色'
fd -e html -e ts . C:\Project\MegaQ\backend -E node_modules -x sd 'F06000' '新色'   # 含 XLSX ARGB
```
改完各自 commit + push（commit email 見 §5）。

### Step 6 — Claude Design（選用）
要讓 AI 生成的設計也用新色，重新上傳 `ds-bundle`（`/design-sync` 或 DesignSync 工具，專案 `f9256f87-2fed-42dc-98be-166f8606f34d`）。

## 3. 加新品牌資產（logo / 圖）
1. 放進 `megaweb/public/ds/logo/`（公開 URL）+ `ds-bundle/logo/`
2. 更新 `ds-bundle/BRAND-ASSETS.md` 規範
3. 在 `tokens.js` 的 `logo` 物件加 URL
4. push megaweb + 同步 design-system repo（Step 4）

## 4. 已納管專案

| 專案 | 接入方式 | repo（分支） |
|---|---|---|
| megaweb | 來源本身 | `aiken884/megaweb` (master) |
| AidRadar | npm 套件 | `aiken884/aidradar` (main) |
| MegaQ 前端 | npm 套件 | `aiken884/MegaQ` (master) |
| MegaQ 後端模板 / XLSX | inline（`sd` 批次） | 同上 |
| PrismSGA | inline（`sd` 批次）→ 待升級 vendoring `--inline` | `aiken884/PrismSGA` (main) |
| quotr-py | inline（`sd` 批次） | `aiken884/quotr-py` (main) |
| servicejdc-fixreq | 引用官網 CDN（Aiken 2026-06-26 拍板：megapower.asia 為自家官網、token 走 fragment 已保證安全，自託管理由弱化） | `aiken884/servicejdc-fixreq` |

> **§7 vendoring 適用對象**：真正不能連外者——PrismSGA（PSI 效能）、PDF/DOCX/XLSX（離線文件）。servicejdc 雖含敏感 token 但因 megapower.asia 屬自家網域、改採引用官網，非 vendoring 消費者。
>
> **待收編（語意色走鐘）**：MegaQ 前端自加 `#16a34a` 等飽和色（對白 3.3:1 fail AA）、MegaQuotr `brand.css` 為 933 行 inline fork（綠底 toast/紅錯誤框/舊 web font）。tokens-app.css 發布後排程改 `@import "@megapower/design-tokens/tokens-app.css"` 對齊。

## 5. 重要約定
- **誠信**：品牌主色 `#F06000` 是官方 logo 色（2026-05 拍板）。不是 Tailwind 的 `#F97316`。
- **字體**：system font stack，不要加回 web font（PSI 效能）。
- **PrismSGA 不 link 外部 CSS**：它是 PSI 評分產品，外部 request 會傷自己的分數，故維持 inline。
- **GitHub push**：commit email 用 `191950007+aiken884@users.noreply.github.com`（帳號開了 email privacy，用真實 email 會被拒 push）。
- **CSS 與 JS 是兩份**：改色記得同步 `megapower.css`（CSS）與 `tokens.js`（JS，含 `statusColor`）。
- **狀態語言**：狀態進度（處理中/已結案/取消）一律用 `.status` + `--color-status-*`（橘+灰+icon）；品牌橘對白 3.29:1（小字 fail AA），橘只進 icon，文字走深灰。
- **語意色 opt-in**：success/warning/danger 在獨立 `tokens-app.css`（muted 版），只給內部工具功能回饋，**不進品牌門面 megapower.css**，不進 `tokens.js`。

## 6. 檔案地圖
- **來源**：`megaweb/src/styles/{tokens,base,components,global,tokens-app}.css`（`tokens-app.css` = opt-in 語意色，獨立不串入門面）
- **發布**：`megaweb/public/ds/megapower.css` + `/logo/`
- **套件**：本 repo（`tokens.js` / `index.js` / `package.json` / `megapower.css` / `ds-bundle/` / `scripts/vendor-brand.mjs`）
- **文件**：`CONVENTIONS.md`（給 design agent）、`ds-bundle/BRAND-ASSETS.md`（logo 規範）、`README.md`（使用指南）

## 7. 自託管 Vendoring SOP（隱私頁 / 嚴格 CSP / 離線專案）

含敏感資料（如客戶追蹤頁 URL 帶 token）、需 CSP `self-only`、或不能連外的專案，**不引用** CDN，改「釘版 vendoring」——複製整份 megapower.css + logo 進自家 `public/assets/`，但受控：有版本戳、可一鍵更新、不走鐘。比舊 `sd` 只替換色碼安全（`sd` 會丟別名、留被廢字體）。

> **為何不算違反「勿複製」**：鐵則目的是**防走鐘**。vendoring 複製的是「整檔 + 版本鎖 + 一鍵更新」，比手寫 inline 更不走鐘。隱私自託管是「治理偏好讓位於個資保護」，做法是技術自託管 + 標註來源版本，非無視。

### 一次性接入
```bash
cd <消費專案>
npm install github:Megapower-Asia-LLC/design-system
cp <design-system>/scripts/vendor-brand.mjs scripts/   # 官方範本，依需要調 LOGOS 清單
node scripts/vendor-brand.mjs                            # 產 public/assets/megapower.css + logos/ + vendor.lock.json
git add public/assets vendor.lock.json scripts/vendor-brand.mjs && git commit -m "chore: vendor 群兆設計系統"
```
頁面以相對路徑引用 `/assets/megapower.css`、`/assets/logos/...`，CSP 維持 `self-only`。

### 品牌更新後同步
```bash
npm update @megapower/design-tokens && node scripts/vendor-brand.mjs   # 重新釘版
git commit -am "chore(brand): re-vendor 設計系統"
```

### 飄移檢查（Phase 2：第二個 vendored 專案、或首次改色後才接 CI）
```bash
node scripts/vendor-brand.mjs --check   # vendored 副本與套件不一致則 exit 1
```

注意：`@megapower/design-tokens` 是 git 依賴、會卡在某 commit，更新務必 `npm update` 才跟得上最新 push。
