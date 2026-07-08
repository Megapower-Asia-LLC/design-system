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
npm run gen:ds       # = node scripts/gen-ds.mjs
npm run check:brand  # = node scripts/check-brand.mjs（守門，見下）
```
`gen-ds.mjs` 會產生：`ds-bundle/tokens/*.css`、`ds-bundle/_ds_bundle.css`、`ds-bundle/CONVENTIONS.md`（複製 `.design-sync/conventions.md` 讓上傳包自包含）、`public/ds/megapower.css`（含 content sha256 指紋 header）、`public/ds/megapower.<hash12>.css`（**旁路 hash 檔**：SRI 鎖版/鑑識/緊急 pin 用，舊檔累積保留、勿刪、不同步到 design-system）。冪等——內容沒變重跑零 diff。tokens-app.css 為 opt-in 語意色，刻意不串進門面（維持純橘+灰）。

### Step 3 — 部署 megaweb（會過品牌 gate）
```bash
git add src/styles public/ds ds-bundle
git commit -m "chore(brand): 更新品牌 token"
git push        # Cloudflare Pages 自動部署
```
→ **部署必經品牌 gate**：Pages build command 是 `npm run build`，其中前置 `check-brand.mjs`——衍生檔不一致、WCAG 不達標、走鐘色、ds-bundle 損毀都會讓 build 失敗、**不更新 CDN**（PR/push 另有 GitHub Actions `brand-check` 先行提示）。gate 綠、部署完成後，純靜態頁 / 任何 link CDN 的即生效。

### Step 4 — 同步 npm 套件（本 `design-system` repo）
```bash
cd ../design-system          # 與 megaweb 並列（工作正本一律在 ~/Projects/_Megapower/ 下）
cp ../megaweb/public/ds/megapower.css megapower.css
rm -rf ds-bundle && cp -r ../megaweb/ds-bundle ds-bundle
cp ../megaweb/.design-sync/conventions.md CONVENTIONS.md
cp ../megaweb/scripts/check-brand.mjs scripts/check-brand.mjs   # 守門腳本 SoT 在 megaweb，此為同步副本勿分岔手改
node scripts/check-brand.mjs   # package 模式驗證同步結果，紅燈就是漏了上面某步
```
（旁路 hash 檔 `megapower.<hash12>.css` 留在 megaweb，不同步過來。）
**`tokens.js` 由腳本生成，勿手改**（兩份副本陷阱已於 Phase 2 消滅）：
```bash
node scripts/build-tokens.mjs   # tokens.css → tokens.js（CI 會用 --check 驗證一致）
```
語意色（tokens-app.css）刻意不進 `tokens.js`（保持 opt-in、CSS-only，與門面一致）。`package.json` 的 `exports` 為一次性設定，新增子路徑時才動。

**接著發版（semver，勿跳過）**——下游靠 tag 釘版與回滾：
```bash
git add -A && git commit -m "chore(brand): sync tokens"
npm version patch   # token 微調用 patch；改色/新元件/視覺變更用 minor（自動 bump + commit + 打 v0.x.y tag）
git push --follow-tags
gh pr create … && gh pr merge --admin …   # repo 強制 PR
HASH=$(sed -n '1s/.*content sha256:\([0-9a-f]*\).*/\1/p' megapower.css)
gh release create "v$(node -p "require('./package.json').version")" --generate-notes --notes "CDN 內容指紋：content sha256:${HASH}（對應 www.megapower.asia/ds/megapower.css 檔頭與旁路檔 megapower.${HASH}.css）"
```
→ 各 node 前端跑 `npm update @megapower/design-tokens` + 重 build → 跟上；緊急回滾＝下游把依賴改成 `#semver:0.x.y` 釘舊版。

**下游 npm 消費專案治理範本（一次性設定，寫進各專案）**：
- npm 專案依賴字串用 semver range：`"@megapower/design-tokens": "github:Megapower-Asia-LLC/design-system#semver:^0.2"`（`npm update` 只升相容版，不再直接吃 main HEAD）
- **bun 專案（如 AidRadar）不支援 `#semver:` 協定**（實測 404）——改嚴格 tag 釘版 `github:Megapower-Asia-LLC/design-system#v0.2.0`，升級時手動改 tag
- **lockfile 必須 commit**、CI/部署一律 `npm ci`（bun 用 `bun install --frozen-lockfile`），否則釘版治理破功
- 現況：MegaQ frontend/backend＝`#semver:^0.2`；AidRadar＝`#v0.2.0`（bun）

### Step 5 — inline 專案半自動跟上
PrismSGA、MegaQuotr（原 quotr-py）、報價單模板（PDF/DOCX 無法引用外部），用批次替換（`sd`）：
```bash
fd -e html -e css -e py . ~/Projects/PrismSGA -E .venv -x sd '#F06000' '#新色'
fd -e html -e css -e py . ~/Projects/MegaQuotr -E .venv -x sd '#F06000' '#新色'   # inline fork：web/static/brand.css + src/megaquotr/static/*.css
fd -e html -e ts . ~/Projects/megaq/backend -E node_modules -x sd 'F06000' '新色'   # 含 XLSX ARGB
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
| megaweb | 來源本身 | `Megapower-Asia-LLC/megaweb` (master) |
| AidRadar | npm 套件 | `aiken884/aidradar` (main) |
| MegaQ 前端 | npm 套件 | `aiken884/MegaQ` (master) |
| MegaQ 後端模板 / XLSX | inline（`sd` 批次） | 同上 |
| PrismSGA | inline（`sd` 批次）→ 待升級 vendoring `--inline` | `aiken884/PrismSGA` (main) |
| MegaQuotr（原 quotr-py，2026-06 改 Python/Flask port） | inline（`sd` 批次，自維 brand.css fork；待 Phase 3 收編改引用） | `aiken884/MegaQuotr` (main) |
| servicejdc-fixreq | 引用官網 CDN（Aiken 2026-06-26 拍板：megapower.asia 為自家官網、token 走 fragment 已保證安全，自託管理由弱化） | `Megapower-Asia-LLC/servicejdc-fixreq` |

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
- **產生/守門**：`megaweb/scripts/gen-ds.mjs`（產發布物+指紋+旁路檔）、`megaweb/scripts/check-brand.mjs`（品牌 gate；Pages build 與 GitHub Actions 皆跑；本 repo `scripts/check-brand.mjs` 為同步副本）
- **發布**：`megaweb/public/ds/megapower.css`（含指紋 header）+ `megapower.<hash12>.css`（旁路）+ `/logo/`
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
