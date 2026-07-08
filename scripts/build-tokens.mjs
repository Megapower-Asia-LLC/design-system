#!/usr/bin/env node
/**
 * build-tokens.mjs — 從 ds-bundle/tokens/tokens.css 生成 tokens.js（消滅 CSS/JS 兩份副本陷阱）
 *
 * tokens.js 自此為生成物、勿手改。改品牌 → 改 megaweb SoT → 同步本 repo → 跑本腳本。
 * 設計（v0.3 roadmap Phase 2）：
 *   - tokens.js 只保證「可序列化 primitive 子集」——color-mix() 等執行期表達式不匯出，
 *     標記 derived-in-CSS-only（清單見下方 CSS_ONLY）。clamp() 是靜態字串、照樣匯出。
 *   - SPEC 映射表雙向防漏：CSS 缺 SPEC 要的 token → 報錯；CSS 多出 SPEC 未認領的 token
 *     → 警告（提醒收編或標 CSS-only），不靜默。
 *   - breakpoint 為模板常數（CSS 無此 token，media query 慣例值），與 CSS 的 768px 同步維護。
 *
 * 用法：
 *   node scripts/build-tokens.mjs           # 重生成 tokens.js
 *   node scripts/build-tokens.mjs --check   # CI 守門：生成結果與現存 tokens.js 不符則 exit 1
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const css = readFileSync(join(ROOT, 'ds-bundle/tokens/tokens.css'), 'utf8')
  .replace(/\r\n/g, '\n')
  .replace(/\/\*[\s\S]*?\*\//g, ''); // 剝註解——註解裡的舊宣告不得污染解析

// --- 解析 :root 內全部自訂屬性（含 media query 外層優先；@media 內的覆寫值忽略，匯出 desktop 基準值） ---
const rootBlock = css.split('@media')[0]; // tokens.css 結構：:root {...} 在前、@media 覆寫在後
const decls = {};
for (const m of rootBlock.matchAll(/--([\w-]+):\s*([^;]+);/g)) decls[m[1]] = m[2].trim().replace(/\s+/g, ' ');

/** 執行期表達式 token——JS 端不匯出，僅 CSS 可用（derived-in-CSS-only） */
const CSS_ONLY = ['color-primary-tint'];
/** back-compat 別名（var() 引用、tokens.css 標註 transitional）——不匯出 */
const ALIAS_SKIP = ['color-primary-dark', 'color-bg-alt', 'color-secondary', 'color-primary-light', 'font-size-base', 'spacing-container'];

const need = (name) => {
  if (!(name in decls)) { console.error(`✗ build-tokens：tokens.css 缺 --${name}（token 改名了？同步更新本腳本 SPEC）`); process.exit(1); }
  return decls[name];
};
const q = (s) => JSON.stringify(s);

// --- SPEC：JS export ↔ CSS token 映射 ---
const color = {
  bg: 'color-bg', bgSoft: 'color-bg-soft', text: 'color-text', textMuted: 'color-text-muted',
  border: 'color-border', primary: 'color-primary', primaryHover: 'color-primary-hover', primarySoftBg: 'color-primary-soft-bg',
};
const fontSize = { sm: 'text-sm', base: 'text-base', lg: 'text-lg', xl: 'text-xl', displayMd: 'text-display-md', displayLg: 'text-display-lg' };
const space = { 2: 'space-2', 4: 'space-4', 6: 'space-6', 8: 'space-8', 12: 'space-12' };
const maxWidth = { content: 'max-width-content', narrow: 'max-width-narrow' };
const radius = { sm: 'radius-sm', md: 'radius-md', lg: 'radius-lg', full: 'radius-full' };
const shadow = { sm: 'shadow-sm', md: 'shadow-md', lg: 'shadow-lg' };
const transition = { fast: 'transition-fast', base: 'transition-base' };

// statusColor：解析 --color-status-* 的 var() 引用，映射到 color.* 名稱
const statusEntries = {};
for (const [name, val] of Object.entries(decls)) {
  const sm = name.match(/^color-status-([\w-]+)$/);
  if (!sm) continue;
  const ref = val.match(/^var\(--([\w-]+)\)$/)?.[1];
  const jsKey = Object.entries(color).find(([, cssName]) => cssName === ref)?.[0];
  if (!jsKey) { console.error(`✗ build-tokens：--${name} 引用 --${ref}，不在 color SPEC 內（狀態色只能映射既有橘+灰）`); process.exit(1); }
  statusEntries[sm[1]] = jsKey;
}
if (!Object.keys(statusEntries).length) { console.error('✗ build-tokens：tokens.css 無 --color-status-*'); process.exit(1); }

// 防漏警告：CSS 有、但 SPEC/skip 清單都沒認領的 token
const claimed = new Set([
  ...Object.values(color), ...Object.values(fontSize), ...Object.values(space).map((v) => v),
  ...Object.values(maxWidth), ...Object.values(radius), ...Object.values(shadow), ...Object.values(transition),
  'font-sans', 'line-height-base', 'spacing-section',
  ...CSS_ONLY, ...ALIAS_SKIP, ...Object.keys(decls).filter((n) => n.startsWith('color-status-')),
]);
const unclaimed = Object.keys(decls).filter((n) => !claimed.has(n));
if (unclaimed.length) console.warn(`⚠ tokens.css 有 SPEC 未認領的 token（決定收編進 tokens.js 或加進 CSS_ONLY/ALIAS_SKIP）：${unclaimed.map((n) => '--' + n).join(', ')}`);

const obj = (spec, indent = '  ') =>
  Object.entries(spec).map(([k, cssName]) => `${indent}${/^\d/.test(k) ? q(k) : k}: ${q(need(cssName))},`).join('\n');

// --- 生成 ---
const out = `// 群兆視覺設計系統 design tokens（JS 匯出版）
// AUTO-GENERATED from ds-bundle/tokens/tokens.css by scripts/build-tokens.mjs — 勿手改此檔。
// 改品牌：改 megaweb SoT → 依 MAINTENANCE.md 同步本 repo → node scripts/build-tokens.mjs
// 用法：import { color, fontSans } from "@megapower/design-tokens";
//
// 不在此檔的 token（derived in CSS only，JS 端不可用）：
//   ${CSS_ONLY.map((n) => '--' + n).join(', ')}（color-mix() 執行期表達式）
// 語意色（success/warning/danger/info）刻意不匯出——opt-in CSS（tokens-app.css），門面 JS/CSS 一致只含橘+灰。

export const color = {
${obj(color)}
};

export const fontSans =
  ${q(need('font-sans'))};

export const fontSize = {
${obj(fontSize)}
};

export const lineHeight = { base: ${q(need('line-height-base'))} };

export const space = { ${Object.entries(space).map(([k, n]) => `${q(k)}: ${q(need(n))}`).join(', ')} };

// 桌面基準值；768px 以下 CSS 降為 3.5rem（media query 覆寫，JS 端僅匯出基準）
export const spacingSection = ${q(need('spacing-section'))};

export const maxWidth = { ${Object.entries(maxWidth).map(([k, n]) => `${k}: ${q(need(n))}`).join(', ')} };
export const radius = { ${Object.entries(radius).map(([k, n]) => `${k}: ${q(need(n))}`).join(', ')} };
export const shadow = {
${obj(shadow)}
};
export const transition = { ${Object.entries(transition).map(([k, n]) => `${k}: ${q(need(n))}`).join(', ')} };

// RWD 斷點慣例（CSS 無此 token——media query 用 768px，與此常數同步維護；lg 為新專案建議值）
export const breakpoint = { md: "768px", lg: "1024px" };

const BASE = "https://www.megapower.asia/ds/logo";
export const logo = {
  markLight: \`\${BASE}/logo-mark-light.png\`,
  markDark: \`\${BASE}/logo-mark-dark.png\`,
  fullLight: \`\${BASE}/logo-full-light.png\`,
  fullDark: \`\${BASE}/logo-full-dark.png\`,
  qrWebsiteLight: \`\${BASE}/qr-website-light.png\`,
  qrWebsiteDark: \`\${BASE}/qr-website-dark.png\`,
};

// 狀態語言（橘+灰映射；由 CSS --color-status-* 的 var() 引用自動解析）
export const statusColor = {
${Object.entries(statusEntries).map(([k, jsKey]) => `  ${k}: color.${jsKey},`).join('\n')}
};
`;

const target = join(ROOT, 'tokens.js');
const current = readFileSync(target, 'utf8').replace(/\r\n/g, '\n');
if (CHECK) {
  if (current !== out) {
    console.error('✗ tokens.js 與 tokens.css 生成結果不一致——跑 node scripts/build-tokens.mjs 重生成後 commit');
    const a = current.split('\n'), b = out.split('\n');
    for (let i = 0; i < Math.max(a.length, b.length); i++)
      if (a[i] !== b[i]) { console.error(`  首個差異在第 ${i + 1} 行：\n    現存：${a[i] ?? '(無)'}\n    應為：${b[i] ?? '(無)'}`); break; }
    process.exit(1);
  }
  console.log('✓ build-tokens --check：tokens.js 與 tokens.css 一致');
} else {
  writeFileSync(target, out);
  console.log(`✓ tokens.js 已由 tokens.css 生成（${Object.keys(decls).length} 個 CSS token → JS 匯出）`);
}
