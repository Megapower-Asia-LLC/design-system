#!/usr/bin/env node
/**
 * build-tokens.mjs — 從 ds-bundle/tokens/tokens.css 生成 tokens.js（消滅 CSS/JS 兩份副本陷阱）
 *
 * tokens.js 自此為生成物、勿手改。改品牌 → 改 megaweb SoT → 同步本 repo → 跑本腳本。
 * 設計（v0.3 roadmap Phase 2；含對抗審查修正；0.5.0 dark mode 升級）：
 *   - 先剝 @layer 外殼（0.5.0 起 tokens.css 全檔包 @layer mp-tokens）再解析。
 *   - 只解析 :root 區塊的宣告——@media 全數剝除（含 dark media 塊）、THEME_SELECTORS
 *     白名單內的主題覆寫塊（:root[data-theme="dark"]）跳過不收；其餘 :root 以外的 selector
 *     若含 custom property 宣告直接報錯（主題/局部覆寫屬 CSS 層；刻意設計請擴充本腳本 SPEC）。
 *   - tokens.js 匯出一律為 light 基準值（dark 值僅 CSS 層提供）；值為 var() 別名者
 *     解析到最終字面值再匯出（JS 端拿 var() 字串無意義）。
 *   - tokens.js 只保證「可序列化 primitive 子集」——color-mix() 等執行期表達式不匯出（CSS_ONLY）。
 *   - 防漏全部升級為硬錯誤：SPEC 缺 token、SPEC 未認領的新 token、CSS_ONLY/ALIAS_SKIP 清單
 *     指到不存在的 token、疑似掉分號的值污染——一律 exit 1，不靠沒人讀的警告。
 *   - breakpoint.md 由 tokens.css 的 @media (max-width: …px) 實際解析（防常數漂移）；lg 為慣例常數。
 *
 * 用法：
 *   node scripts/build-tokens.mjs           # 重生成 tokens.js
 *   node scripts/build-tokens.mjs --check   # CI 守門：生成結果與現存 tokens.js 不符則 exit 1
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const die = (msg) => { console.error(`✗ build-tokens：${msg}`); process.exit(1); };

const rawCss = readFileSync(join(ROOT, 'ds-bundle/tokens/tokens.css'), 'utf8').replace(/\r\n/g, '\n');
const noComments = rawCss.replace(/\/\*[\s\S]*?\*\//g, ''); // 剝註解——註解裡的舊宣告不得污染解析

// --- 剝 @layer 外殼（保留內容）；層序宣告式（@layer a, b;）直接移除 ---
const stripLayerShell = (s) => {
  let out = s.replace(/@layer\s+[\w-]+(?:\s*,\s*[\w-]+)*\s*;/g, '');
  let idx;
  while ((idx = out.search(/@layer\s+[\w-]+\s*\{/)) !== -1) {
    const open = out.indexOf('{', idx);
    let depth = 1, i = open + 1;
    while (i < out.length && depth > 0) {
      if (out[i] === '{') depth++;
      else if (out[i] === '}') depth--;
      i++;
    }
    if (depth !== 0) die('@layer 大括號不配對——tokens.css 結構異常');
    out = out.slice(0, idx) + out.slice(open + 1, i - 1) + out.slice(i);
  }
  return out;
};
const css = stripLayerShell(noComments);

// --- breakpoint.md：從 @media (max-width: …px) 實際解析（與 CSS 機械同步，防漂移） ---
const mqWidths = [...css.matchAll(/@media[^{]*\(max-width:\s*(\d+)px\)/g)].map((m) => m[1]);
if (!mqWidths.length) die('tokens.css 找不到 @media (max-width: …px)——breakpoint 解析錨點失效');
if (new Set(mqWidths).size > 1) die(`tokens.css 有多個不同 max-width 斷點（${[...new Set(mqWidths)].join(', ')}）——請擴充 SPEC 決定 breakpoint 匯出`);
const bpMd = `${mqWidths[0]}px`;

// --- 只收 :root 區塊的宣告；@media 區塊剝除；其他 selector 含 -- 宣告即報錯 ---
const noMedia = css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
/** 主題覆寫塊——CSS 層專屬（dark 三態），tokens.js 只收 light 基準；出現在此清單即跳過不報錯 */
const THEME_SELECTORS = new Set([':root[data-theme="dark"]']);
const decls = {};
for (const m of noMedia.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const selector = m[1].trim();
  const body = m[2];
  if (!/--[\w-]+\s*:/.test(body)) continue;
  if (THEME_SELECTORS.has(selector)) continue;
  if (selector !== ':root')
    die(`selector「${selector}」內含 custom property 宣告——tokens.js 只收 :root 基準值；主題/局部覆寫請留在 CSS 層（刻意設計請擴充本腳本）`);
  for (const d of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) decls[d[1]] = d[2].trim().replace(/\s+/g, ' ');
}
if (!Object.keys(decls).length) die('tokens.css 解析不到任何 :root 宣告');

// 掉分號防護：合法值不會內含「--foo:」宣告型樣（var(--x) 引用無冒號、不誤殺）
for (const [n, v] of Object.entries(decls))
  if (/--[\w-]+\s*:/.test(v)) die(`--${n} 的值疑似吞掉下一條宣告（SoT 掉分號？）：${v.slice(0, 80)}…`);

/** 執行期表達式 token——JS 端不匯出，僅 CSS 可用（derived in CSS only）
 *  color-focus-ring：light 值為 tint 別名（color-mix 執行期表達式），dark 值僅 CSS 層 */
const CSS_ONLY = ['color-primary-tint', 'color-focus-ring'];
/** back-compat 別名（var() 引用、tokens.css 標註 transitional）——不匯出 */
const ALIAS_SKIP = ['color-primary-dark', 'color-bg-alt', 'color-secondary', 'color-primary-light', 'font-size-base', 'spacing-container'];
// 反向存在性驗證：清單指到的 token 必須真的存在（防「被吞/被刪而靜默消失」）
for (const n of [...CSS_ONLY, ...ALIAS_SKIP])
  if (!(n in decls)) die(`CSS_ONLY/ALIAS_SKIP 清單的 --${n} 不存在於 tokens.css（被移除或被掉分號吞掉？同步更新清單）`);

// var() 別名解析到最終字面值（0.5.0 新 token 的 light 值多為既有 token 別名；
// JS 端匯出 var() 字串無意義，比照 statusColor 先例解析引用——但 statusColor 自身仍讀原始 decls）
const resolveVar = (name, seen = new Set()) => {
  if (!(name in decls)) die(`tokens.css 缺 --${name}（token 改名了？同步更新本腳本 SPEC）`);
  if (seen.has(name)) die(`--${name} 的 var() 引用出現循環`);
  seen.add(name);
  const ref = decls[name].match(/^var\(--([\w-]+)\)$/)?.[1];
  return ref ? resolveVar(ref, seen) : decls[name];
};
const need = (name) => resolveVar(name);
const q = (s) => JSON.stringify(String(s));

// --- SPEC：JS export ↔ CSS token 映射 ---
const color = {
  bg: 'color-bg', bgSoft: 'color-bg-soft', text: 'color-text', textMuted: 'color-text-muted',
  border: 'color-border', primary: 'color-primary', primaryHover: 'color-primary-hover', primarySoftBg: 'color-primary-soft-bg',
  // 0.5.0 dark mode 新 token（匯出 light 基準值；var() 別名解析為最終字面值）
  surfaceInverse: 'color-surface-inverse', bgHover: 'color-bg-hover',
  inputBg: 'color-input-bg', borderInput: 'color-border-input',
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
  if (!jsKey) die(`--${name} 引用 --${ref}，不在 color SPEC 內（狀態色只能映射既有橘+灰）`);
  statusEntries[sm[1]] = jsKey;
}
if (!Object.keys(statusEntries).length) die('tokens.css 無 --color-status-*');

// 防漏（硬錯誤，不是警告）：CSS 有、但 SPEC/skip 清單都沒認領的 token
const claimed = new Set([
  ...Object.values(color), ...Object.values(fontSize), ...Object.values(space),
  ...Object.values(maxWidth), ...Object.values(radius), ...Object.values(shadow), ...Object.values(transition),
  'font-sans', 'line-height-base', 'spacing-section',
  ...CSS_ONLY, ...ALIAS_SKIP, ...Object.keys(decls).filter((n) => n.startsWith('color-status-')),
]);
const unclaimed = Object.keys(decls).filter((n) => !claimed.has(n));
if (unclaimed.length)
  die(`tokens.css 有 SPEC 未認領的 token：${unclaimed.map((n) => '--' + n).join(', ')}——決定收編進 tokens.js（擴充 SPEC）或明列 CSS_ONLY/ALIAS_SKIP，不允許靜默缺席 JS 端`);

const obj = (spec, indent = '  ') =>
  Object.entries(spec).map(([k, cssName]) => `${indent}${q(k)}: ${q(need(cssName))},`).join('\n');

// --- 生成 ---
const out = `// 群兆視覺設計系統 design tokens（JS 匯出版）
// AUTO-GENERATED from ds-bundle/tokens/tokens.css by scripts/build-tokens.mjs — 勿手改此檔。
// 改品牌：改 megaweb SoT → 依 MAINTENANCE.md 同步本 repo → node scripts/build-tokens.mjs
// 用法：import { color, fontSans } from "@megapower/design-tokens";
//
// 不在此檔的 token（derived in CSS only，JS 端不可用）：
//   ${CSS_ONLY.map((n) => '--' + n).join(', ')}（color-mix() 執行期表達式）
// 語意色（success/warning/danger/info）刻意不匯出——opt-in CSS（tokens-app.css），門面 JS/CSS 一致只含橘+灰。
// 0.5.0 起：匯出值一律為 light 基準值；dark 值僅 CSS 層提供（tokens.css @layer mp-tokens 內
// 兩塊 dark 覆蓋，三態切換見 CONVENTIONS.md dark 章）。JS 端取值於 dark 頁面仍是 light 色。

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

// 桌面基準值；${bpMd} 以下 CSS 降為 3.5rem（media query 覆寫，JS 端僅匯出基準）
export const spacingSection = ${q(need('spacing-section'))};

export const maxWidth = { ${Object.entries(maxWidth).map(([k, n]) => `${k}: ${q(need(n))}`).join(', ')} };
export const radius = { ${Object.entries(radius).map(([k, n]) => `${k}: ${q(need(n))}`).join(', ')} };
export const shadow = {
${obj(shadow)}
};
export const transition = { ${Object.entries(transition).map(([k, n]) => `${k}: ${q(need(n))}`).join(', ')} };

// RWD 斷點：md 由 tokens.css 的 @media (max-width) 機械解析（防漂移）；lg 為新專案慣例值
export const breakpoint = { md: ${q(bpMd)}, lg: "1024px" };

const BASE = "https://www.megapower.asia/ds/logo";
export const logo = {
  markLight: \`\${BASE}/logo-mark-light.png\`,
  markDark: \`\${BASE}/logo-mark-dark.png\`,
  fullLight: \`\${BASE}/logo-full-light.png\`,
  fullDark: \`\${BASE}/logo-full-dark.png\`,
  qrWebsiteLight: \`\${BASE}/qr-website-light.png\`,
  qrWebsiteDark: \`\${BASE}/qr-website-dark.png\`,
};

// 狀態語言（橘+灰映射；由 CSS --color-status-* 的 var() 引用自動解析；key 引號化容納連字號業務態）
export const statusColor = {
${Object.entries(statusEntries).map(([k, jsKey]) => `  ${q(k)}: color.${jsKey},`).join('\n')}
};
`;

const target = join(ROOT, 'tokens.js');
if (CHECK) {
  if (!existsSync(target)) die('tokens.js 不存在——先跑 node scripts/build-tokens.mjs 生成');
  const current = readFileSync(target, 'utf8').replace(/\r\n/g, '\n');
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
  console.log(`✓ tokens.js 已由 tokens.css 生成（${Object.keys(decls).length} 個 :root token；breakpoint.md=${bpMd} 由 @media 解析）`);
}
