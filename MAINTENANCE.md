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
**⚠ 重要：手動同步 `tokens.js` 的色值** — 它是 JS 匯出，跟 CSS 是**兩份**，改色要兩處都改（`tokens.js` 的 `color.primary` 等）。
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
| PrismSGA | inline（`sd` 批次） | `aiken884/PrismSGA` (main) |
| quotr-py | inline（`sd` 批次） | `aiken884/quotr-py` (main) |

## 5. 重要約定
- **誠信**：品牌主色 `#F06000` 是官方 logo 色（2026-05 拍板）。不是 Tailwind 的 `#F97316`。
- **字體**：system font stack，不要加回 web font（PSI 效能）。
- **PrismSGA 不 link 外部 CSS**：它是 PSI 評分產品，外部 request 會傷自己的分數，故維持 inline。
- **GitHub push**：commit email 用 `191950007+aiken884@users.noreply.github.com`（帳號開了 email privacy，用真實 email 會被拒 push）。
- **CSS 與 JS 是兩份**：改色記得同步 `megapower.css`（CSS）與 `tokens.js`（JS）。

## 6. 檔案地圖
- **來源**：`megaweb/src/styles/{tokens,base,components,global}.css`
- **發布**：`megaweb/public/ds/megapower.css` + `/logo/`
- **套件**：本 repo（`tokens.js` / `index.js` / `package.json` / `megapower.css` / `ds-bundle/`）
- **文件**：`CONVENTIONS.md`（給 design agent）、`ds-bundle/BRAND-ASSETS.md`（logo 規範）、`README.md`（使用指南）
