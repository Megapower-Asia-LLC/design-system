#!/usr/bin/env node
/* ============================================================
   群兆設計系統 — 釘版 vendoring 腳本（官方範本）
   從 node_modules/@megapower/design-tokens 複製 megapower.css + logo
   到 public/assets/，蓋版本章、寫 vendor.lock.json。
   消費專案複製此檔到自己的 scripts/，依需要調整 OUT / LOGOS 後使用。
   為何 vendoring 而非引用 CDN：見 design-system/MAINTENANCE.md §7。
   ------------------------------------------------------------
   用法：
     node scripts/vendor-brand.mjs            複製 + 蓋章 + 寫 lock
     node scripts/vendor-brand.mjs --check    比對 vendored vs 套件，漂移則 exit 1（CI/SOP）
   ============================================================ */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT  = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PKG   = join(ROOT, "node_modules", "@megapower", "design-tokens");
const OUT   = join(ROOT, "public", "assets");
// 依專案需要增減；名稱對應 @megapower/design-tokens 的 ds-bundle/logo/ 下檔案
const LOGOS = ["logo-mark-light.png", "logo-mark-dark.png", "logo-full-light.png"];

const sha256  = (buf) => createHash("sha256").update(buf).digest("hex");
const version = JSON.parse(readFileSync(join(PKG, "package.json"), "utf8")).version;
const stamp   = new Date().toISOString().slice(0, 10);
const check   = process.argv.includes("--check");

const header =
`/* ============================================================
   AUTO-VENDORED — 請勿手改（下次 vendoring 會覆蓋）
   來源：@megapower/design-tokens@${version}
   產生：${stamp}  via scripts/vendor-brand.mjs
   改品牌請改 megaweb SoT → 重產 → npm update → 重跑本腳本
   ============================================================ */
`;

const srcCss = readFileSync(join(PKG, "megapower.css"), "utf8");

// lock 記「套件原文」hash（不含蓋章 header），供 --check 比對與「手改偵測」
const lock = { version, generated: stamp, files: {} };
lock.files["megapower.css"] = sha256(Buffer.from(srcCss));
for (const f of LOGOS) lock.files[`logos/${f}`] = sha256(readFileSync(join(PKG, "ds-bundle", "logo", f)));

if (check) {
  const prev  = JSON.parse(readFileSync(join(ROOT, "vendor.lock.json"), "utf8"));
  const drift = Object.keys(lock.files).filter((k) => prev.files[k] !== lock.files[k]);
  if (prev.version !== version || drift.length) {
    console.error(`✗ 品牌漂移：lock@${prev.version} vs pkg@${version}；變動：${drift.join(", ") || "(版本號)"}`);
    process.exit(1);
  }
  console.log(`✓ vendored 副本與 @megapower/design-tokens@${version} 一致`);
  process.exit(0);
}

mkdirSync(join(OUT, "logos"), { recursive: true });
writeFileSync(join(OUT, "megapower.css"), header + srcCss, "utf8");
for (const f of LOGOS) copyFileSync(join(PKG, "ds-bundle", "logo", f), join(OUT, "logos", f));
writeFileSync(join(ROOT, "vendor.lock.json"), JSON.stringify(lock, null, 2) + "\n", "utf8");
console.log(`✓ vendored @megapower/design-tokens@${version} → public/assets/（已寫 vendor.lock.json）`);
