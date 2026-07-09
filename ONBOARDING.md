# ONBOARDING / 緊急程序（bus factor 處方）

> 給「Aiken 不在時要接手品牌系統」的人（oupaul 或未來維護者）。日常改品牌 SOP 見 `MAINTENANCE.md`；本檔只講**權限、緊急處置、回滾**。

## 系統一覽（兩個 repo、一條鏈）

```
megaweb（SoT，src/styles/*.css）
  └─ node scripts/sync-ds.mjs（一鍵重產+守門+同步）
       ├─ push master → Cloudflare Pages build（必經 check-brand gate）→ CDN www.megapower.asia/ds/
       └─ design-system repo（配銷層：npm 套件 + ds-bundle + 發版 semver）
            └─ 下游：MegaQ（npm ^0.x）、AidRadar（bun tag 釘版）、MegaQuotr/PrismSGA（inline）、servicejdc（CDN）
```

## 權限清單（接手前確認你有）

| 資源 | 位置 | 誰有權限 |
|---|---|---|
| GitHub org `Megapower-Asia-LLC` | megaweb、design-system、servicejdc-fixreq | Aiken（owner）＋ oupaul（Organization Manager，org 層級管理權限——可存取 org 下所有 repo、merge PR、改設定） |
| GitHub 個人 `aiken884` | MegaQ、aidradar、MegaQuotr、PrismSGA | Aiken（⚠ 個人帳號，oupaul 無 org 級權限；緊急需個別加協作者） |
| Cloudflare 帳號（Pages 專案 `megaweb`，網域 `megapower-website.pages.dev`） | account id `d6b65fd57859c2150d86f45f4269cc78` | Aiken（**刻意不交接**——CDN 檔案全在 megaweb repo git，緊急重建走下方「Cloudflare 帳號不可用」路徑，不需進入此帳號） |
| DNS（www.megapower.asia） | Azure DNS（公司政策，不在 Cloudflare） | Aiken |
| logo 向量原檔 | OneDrive 群兆 `行銷相關/Logo/`＋repo `brand-source/` 備援 | 公司 OneDrive 成員 |

## 緊急處置

**CDN 上出現壞品牌（改壞已部署）**
1. 最快回滾：Cloudflare Pages dashboard → megaweb 專案 → Deployments → 前一個成功部署 → Rollback（分鐘級、不動 git）。**需 Cloudflare 帳號存取（僅 Aiken）——oupaul 走第 2 條。**
2. 正規回滾（任何 org 成員可做）：megaweb `git revert <壞 commit>` → push master（Pages 自動重新部署、gate 再驗一次）。
3. 鑑識：CDN 檔第一行有 `content sha256:<hash>` 指紋；對應的 `megapower.<hash>.css` 旁路檔與 git 歷史可比對是哪一版。

**npm 下游拉到壞版**
- 下游把依賴改 `#semver:0.x.y`（npm）或 `#v0.x.y`（bun）釘回舊 tag → `npm ci`／`bun install`。
- design-system 端補發修正版（`MAINTENANCE.md` Step 4 發版 SOP）。

**CI 紅燈擋住緊急發版（design-system）**
- PR 掛 `break-glass` label → CI 跳過（留 audit warning）→ 事後必須補跑 `node scripts/check-brand.mjs && node scripts/build-tokens.mjs --check` 修復。

**Cloudflare 帳號不可用**
- CDN 檔案全在 megaweb repo `public/ds/`（git 即備份）：任何靜態託管（另一個 Pages 帳號、Netlify、GitHub Pages）掛上 `www.megapower.asia` 的 DNS（在 Azure，不受 Cloudflare 影響）即可重建，檔案零遺失。
- 下游 npm/vendored 專案完全不受影響（不依賴 CDN）。⚠ CDN 型下游（servicejdc-fixreq 與官網本身）在重建空窗期會失去樣式——重建順位排最前。

## 已知且接受的殘餘風險（勿驚訝）

- megaweb 私有 repo 無 branch protection：Actions 紅燈不強制擋 push，**唯一硬 gate 是 Pages build**（`npm run build` 前置 check-brand）。改 Pages build command 等於拆 gate——不要動它。
- design-system merge 慣例是 `gh pr merge --admin`（0 approval、單人自我 merge）；required check `check` 擋一般 merge，admin bypass 是明知之舉。
- `.btn--primary` 白字橘底 3.29:1 為 selector 級已知例外（品牌識別優先）。
- Cloudflare 帳號**刻意不交接**（僅 Aiken）：接受「dashboard 分鐘級 rollback」在 Aiken 不在時不可用；替代是 git revert 重部署（第 2 條，任何 org 成員可做）或整套重建（換靜態託管掛 DNS，CDN 檔案全在 git、零遺失）。DNS 在 Azure、不受此帳號影響。

## 守門腳本地圖（SoT 全在 megaweb/scripts/）

`gen-ds.mjs`（產發布物+指紋）｜`check-brand.mjs`（品牌 gate，design-system 有同步副本跑 package 模式）｜`sync-ds.mjs`（一鍵同步）｜design-system 自有：`build-tokens.mjs`（tokens.js 生成）、`ds-guard.mjs`（下游走鐘掃描）、`vendor-brand.mjs`（vendoring）。
