#!/usr/bin/env node
/**
 * check-brand.mjs — 群兆設計系統品牌守門（單一腳本，零依賴）
 *
 * 兩種模式（自動偵測，`--mode=megaweb|package` 或 `--mode megaweb|package` 可覆寫）：
 *   megaweb  模式：在 megaweb repo（SoT）跑——Cloudflare Pages build 前的主 gate。
 *   package  模式：在 design-system repo（配銷層）跑——同步後的事後驗證/CI。
 *
 * 檢查項：
 *   [1] 衍生檔一致性：ds-bundle 與 src/styles 一致（megaweb）；門面 = 指紋 header + tokens + bundle、
 *       header 內 content sha256 與主體實算相符、產物健全（無 @import、大括號平衡）（兩模式）
 *   [2] WCAG 對比三分類：門面文字 ≥4.5、語意色 ≥4.5、tint 底用 -hover ≥4.5、primary 圖形下限 ≥3.0（不設上限）
 *       例外以 selector 為單位列於 EXCEPTIONS（目前僅 .btn--primary 族）
 *   [3] 「橘不做文字色」guard：component 層禁止 color: 取品牌橘——含 token 別名鏈解析
 *       （--color-status-active 等解析到橘的別名一併禁）；.status__icon 行為鐵則明文允許的 icon 例外
 *   [4] 寫死色碼白名單：hex 與全部函數色（rgb/hsl/hwb/lab/lch/oklab/oklch/color）僅允許 HARDCODED_ALLOWED；
 *       色彩屬性上的 CSS 命名色（white/orangered…）一律禁止
 *   [5] ds-bundle 上傳包完整性：必要檔案、@dsCard marker、斷連參照、info 色、class 覆蓋（含單橫線 typo）
 *
 * 失敗 exit 1（擋 build）。SoT 在 megaweb/scripts/，design-system 的副本由同步流程帶過去，勿分岔手改。
 * 所有讀檔一律正規化行尾（\r\n→\n），Windows checkout 不誤攔。
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const errors = [];
const fail = (tag, msg) => errors.push(`[${tag}] ${msg}`);

// --- 參數解析：--mode=x 與 --mode x 皆可；未知值直接報錯（不靜默退回自動偵測） ---
let MODE = null;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--mode') MODE = argv[++i];
  else if (argv[i].startsWith('--mode=')) MODE = argv[i].split('=')[1];
}
if (MODE && !['megaweb', 'package'].includes(MODE)) {
  console.error(`✗ 未知 --mode "${MODE}"（只接受 megaweb|package）`); process.exit(1);
}
MODE ??= existsSync(join(ROOT, 'src/styles/tokens.css')) ? 'megaweb' : 'package';

// ============ 設定（例外一律在此明列，不散落程式邏輯） ============

/** WCAG selector 級已知例外（v0.3 §4 決策記錄；以 selector 為單位、防擴散） */
const EXCEPTIONS = [
  { selector: '.btn--primary / .btn--outline:hover / .skip-link', pair: ['#FFFFFF', 'primary'], floor: 3.0,
    note: '白字壓品牌橘 3.29:1 — 大型互動目標、品牌識別優先（v0.3 已知且接受）；仍須守圖形級 ≥3.0' },
];

/** 門面層允許的寫死色字面值（normalize 後比對）；新增字面值＝CI 紅燈，逼迫走 token */
const FACADE_ALLOWED = new Set([
  '#fff',                       // 按鈕白字/深底白字/skip-link（壓在橘/深灰底上，token 化無意義）
  '#f1f5f9',                    // .section--dark .btn--secondary/--ghost 淺字
  'rgba(255,255,255,0.35)',     // 深底 secondary/ghost 邊框
  'rgba(255,255,255,0.08)',     // 深底 secondary/ghost hover 底
  'rgba(255,255,255,0.16)',     // 深底 ghost hover 底（比 secondary 深一階，微白語言）
  'rgba(255,255,255,0.65)',     // 深底 secondary/ghost hover 邊框
]);
/** 語意元件層（components-app.css）額外允許：var() 的 fallback 常值（漏引 tokens-app 的 degrade 保護；
    與 tokens-app 現值的一致性由下方 fallback 斷言把關） */
const APP_ALLOWED = new Set([
  ...FACADE_ALLOWED,
  '#b42318',                    // danger fallback
  '#97180f',                    // danger-hover fallback
  'rgba(180,35,24,0.12)',       // danger-tint fallback（12% 疊白等價）
]);

/** CSS 命名色全集（色彩屬性上的裸識別字命中即紅燈；transparent/currentColor 等關鍵字不在此列故放行） */
const NAMED_COLORS = new Set('aliceblue,antiquewhite,aqua,aquamarine,azure,beige,bisque,black,blanchedalmond,blue,blueviolet,brown,burlywood,cadetblue,chartreuse,chocolate,coral,cornflowerblue,cornsilk,crimson,cyan,darkblue,darkcyan,darkgoldenrod,darkgray,darkgreen,darkgrey,darkkhaki,darkmagenta,darkolivegreen,darkorange,darkorchid,darkred,darksalmon,darkseagreen,darkslateblue,darkslategray,darkslategrey,darkturquoise,darkviolet,deeppink,deepskyblue,dimgray,dimgrey,dodgerblue,firebrick,floralwhite,forestgreen,fuchsia,gainsboro,ghostwhite,gold,goldenrod,gray,green,greenyellow,grey,honeydew,hotpink,indianred,indigo,ivory,khaki,lavender,lavenderblush,lawngreen,lemonchiffon,lightblue,lightcoral,lightcyan,lightgoldenrodyellow,lightgray,lightgreen,lightgrey,lightpink,lightsalmon,lightseagreen,lightskyblue,lightslategray,lightslategrey,lightsteelblue,lightyellow,lime,limegreen,linen,magenta,maroon,mediumaquamarine,mediumblue,mediumorchid,mediumpurple,mediumseagreen,mediumslateblue,mediumspringgreen,mediumturquoise,mediumvioletred,midnightblue,mintcream,mistyrose,moccasin,navajowhite,navy,oldlace,olive,olivedrab,orange,orangered,orchid,palegoldenrod,palegreen,paleturquoise,palevioletred,papayawhip,peachpuff,peru,pink,plum,powderblue,purple,rebeccapurple,red,rosybrown,royalblue,saddlebrown,salmon,sandybrown,seagreen,seashell,sienna,silver,skyblue,slateblue,slategray,slategrey,snow,springgreen,steelblue,tan,teal,thistle,tomato,turquoise,violet,wheat,white,whitesmoke,yellow,yellowgreen'.split(','));

/** ds-bundle 必要檔案（相對 ds-bundle/） */
const BUNDLE_REQUIRED = [
  'styles.css', '_ds_bundle.css', 'README.md', 'BRAND-ASSETS.md', 'CONVENTIONS.md',
  'components-app.css',
  'tokens/tokens.css', 'tokens/tokens-app.css',
  'logo/logo-mark-light.png', 'logo/logo-mark-dark.png',
  'logo/logo-full-light.png', 'logo/logo-full-dark.png',
  'logo/qr-website-light.png', 'logo/qr-website-dark.png',
];

/** DS 元件 class 家族（覆蓋檢查；含單橫線 typo 如 .btn-primary 也納入檢查而非放行） */
const DS_CLASS_RE = /^(btn|section|card|status|form|container|skip-link|sr-only)([-_].*)?$/;

// ============ [1] 衍生檔一致性 ============

const bundleDir = join(ROOT, 'ds-bundle');
const facadePath = MODE === 'megaweb' ? join(ROOT, 'public/ds/megapower.css') : join(ROOT, 'megapower.css');

if (MODE === 'megaweb') {
  for (const [a, b] of [
    ['src/styles/tokens.css', 'ds-bundle/tokens/tokens.css'],
    ['src/styles/tokens-app.css', 'ds-bundle/tokens/tokens-app.css'],
    ['src/styles/components-app.css', 'ds-bundle/components-app.css'],
    ['src/styles/tokens-app.css', 'public/ds/tokens-app.css'],
    ['src/styles/components-app.css', 'public/ds/components-app.css'],
    ['.design-sync/conventions.md', 'ds-bundle/CONVENTIONS.md'],
  ]) {
    if (!existsSync(join(ROOT, b))) fail('derive', `${b} 不存在（跑 scripts/gen-ds.mjs）`);
    else if (read(join(ROOT, a)) !== read(join(ROOT, b))) fail('derive', `${b} 與 ${a} 不一致（跑 scripts/gen-ds.mjs 重產後 commit）`);
  }
  // _ds_bundle.css 必須等於由 src 重新串接的結果（錨點切割，與 gen-ds 同配方）
  const globalLines = read(join(ROOT, 'src/styles/global.css')).split('\n');
  // @import 白名單（與 gen-ds 同步）：防語意元件層被接進門面/全站、防檔尾 append 位移錨點
  const imports = globalLines.filter((l) => /^\s*@import\b/.test(l)).map((l) => l.match(/@import\s+'([^']+)'/)?.[1] ?? l.trim());
  const IMPORT_WHITELIST = ['./tokens.css', './base.css', './components.css'];
  if (JSON.stringify(imports) !== JSON.stringify(IMPORT_WHITELIST))
    fail('derive', `global.css @import 清單 ≠ 白名單 [${IMPORT_WHITELIST.join(', ')}]（實際：[${imports.join(', ')}]）——opt-in 層不得接進門面/全站`);
  let lastImport = -1;
  globalLines.forEach((l, i) => { if (/^\s*@import\b/.test(l)) lastImport = i; });
  if (lastImport === -1) fail('derive', 'global.css 找不到 @import 錨點——尾段切割配方失效');
  const globalTail = globalLines.slice(lastImport + 1).join('\n').replace(/^\n+/, '');
  for (const sentinel of ['.skip-link', '.sr-only', ':focus-visible', '@media print'])
    if (!globalTail.includes(sentinel)) fail('derive', `global.css 尾段缺哨兵「${sentinel}」——utilities 被切掉`);
  const expectBundle =
    '/* Megapower Design System — base + component styles (generated) */\n\n' +
    read(join(ROOT, 'src/styles/base.css')) + '\n' +
    read(join(ROOT, 'src/styles/components.css')) + '\n' +
    '/* === Utilities (from global.css) === */\n' + globalTail;
  if (read(join(bundleDir, '_ds_bundle.css')) !== expectBundle)
    fail('derive', '_ds_bundle.css 與 src/styles 串接結果不一致（跑 scripts/gen-ds.mjs）');
}

if (MODE === 'package') {
  // 同步完整性：design-system 根目錄 CONVENTIONS.md 與 ds-bundle/CONVENTIONS.md 必須同源
  // （MAINTENANCE Step 4 有兩條 cp——漏其中一條時此處紅燈；SoT 比對只能在 megaweb 模式做）
  if (!existsSync(join(ROOT, 'CONVENTIONS.md')))
    fail('derive', 'CONVENTIONS.md 缺失（Step 4 同步不完整）');
  else if (existsSync(join(bundleDir, 'CONVENTIONS.md')) && read(join(ROOT, 'CONVENTIONS.md')) !== read(join(bundleDir, 'CONVENTIONS.md')))
    fail('derive', 'CONVENTIONS.md 與 ds-bundle/CONVENTIONS.md 不一致——Step 4 兩條 cp 漏了一條');
}

// 門面 = 指紋 header（第一行，含 content sha256）+ tokens + '\n' + bundle
let facade = '';
if (!existsSync(facadePath)) fail('facade', `${relative(ROOT, facadePath)} 不存在`);
else {
  facade = read(facadePath);
  const nl = facade.indexOf('\n');
  const headerLine = nl === -1 ? facade : facade.slice(0, nl);
  const body = facade.slice(nl + 1);
  const bodyHash = createHash('sha256').update(body).digest('hex').slice(0, 12);
  const hm = headerLine.match(/^\/\* Megapower Design System — content sha256:([0-9a-f]{12}) — generated .+ \*\/$/);
  if (!hm)
    fail('facade', '門面第一行缺指紋 header（content sha256:… — generated …）——用 scripts/gen-ds.mjs 產生，勿手改');
  else if (hm[1] !== bodyHash)
    fail('facade', `門面指紋 ${hm[1]} ≠ 主體實算 ${bodyHash}——內容被手改過，跑 scripts/gen-ds.mjs 重產`);
  const expectBody = read(join(bundleDir, 'tokens/tokens.css')) + '\n' + read(join(bundleDir, '_ds_bundle.css'));
  if (body !== expectBody)
    fail('facade', '門面內容 ≠ tokens.css + _ds_bundle.css 串接（drift！跑 scripts/gen-ds.mjs 重產）');
  // 產物健全性：損毀 CSS 不得出門
  if (/@import\b/.test(body)) fail('facade', '門面主體含 @import——產生配方錯位');
  const braces = (body.match(/{/g) || []).length - (body.match(/}/g) || []).length;
  if (braces !== 0) fail('facade', `門面主體大括號不平衡（差 ${braces}）——CSS 損毀，禁止發布`);
  // 語意色隔離鐵則：門面不得出現 success/warning/danger/info token
  if (/--color-(success|warning|danger|info)\b/.test(facade))
    fail('facade', '門面 megapower.css 含語意色 token——違反「語意色隔離 opt-in」鐵則');
  // 旁路 hash 檔（僅 megaweb 模式；design-system repo 不帶 bypass 檔）
  if (MODE === 'megaweb' && !existsSync(join(ROOT, 'public/ds', `megapower.${bodyHash}.css`)))
    fail('bypass', `缺旁路 hash 檔 megapower.${bodyHash}.css（跑 scripts/gen-ds.mjs；舊 hash 檔保留勿刪）`);
}

// ============ [2] WCAG 對比三分類 ============

const tokensCss = read(join(bundleDir, 'tokens/tokens.css'));
const tokensAppCss = read(join(bundleDir, 'tokens/tokens-app.css'));
// 剝除註解再解析——否則「舊值以宣告原樣註解備查」會覆蓋真值、壞色全綠（審查 confirmed HIGH）
const tokensSource = stripComments(tokensCss + '\n' + tokensAppCss);
const hexTokens = {};
for (const m of tokensSource.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g))
  hexTokens[m[1]] = m[2];

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
const tint12 = (hex) => '#' + [1, 3, 5]
  .map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.12 + 255 * 0.88).toString(16).padStart(2, '0')).join('');
const WHITE = '#FFFFFF';
const assertRatio = (tag, fg, bg, min, label) => {
  if (!fg || !bg) return fail(tag, `${label}：token 缺失無法計算`);
  const r = ratio(fg, bg);
  if (r < min) fail(tag, `${label}：${fg} 對 ${bg} = ${r.toFixed(2)}:1 < ${min}`);
};

// 門面層：文字一律 ≥4.5（例外只在 EXCEPTIONS）
assertRatio('wcag', hexTokens['text'], WHITE, 4.5, '--color-text 對白');
assertRatio('wcag', hexTokens['text-muted'], WHITE, 4.5, '--color-text-muted 對白');
assertRatio('wcag', WHITE, hexTokens['text'], 4.5, '深底（.section--dark）白字對 --color-text');
// 品牌橘：圖形級下限 ≥3.0，刻意不設上限（改色若過 4.5 是升級不是錯）
assertRatio('wcag', hexTokens['primary'], WHITE, 3.0, '--color-primary 對白（icon/圖形下限）');
// opt-in 語意層：文字色對白 ≥4.5；tint 淺底上須用 -hover 深化版 ≥4.5
for (const k of ['success', 'warning', 'danger', 'info']) {
  assertRatio('wcag', hexTokens[k], WHITE, 4.5, `--color-${k} 對白`);
  assertRatio('wcag', hexTokens[`${k}-hover`], tint12(hexTokens[k] ?? WHITE), 4.5, `--color-${k}-hover 對 ${k} 12% tint 底`);
}
// selector 級例外：仍須守各自 floor
for (const ex of EXCEPTIONS) {
  const bg = ex.pair[1] === 'primary' ? hexTokens['primary'] : ex.pair[1];
  assertRatio('wcag-exception', ex.pair[0], bg, ex.floor, `${ex.selector}（${ex.note}）`);
}

// ============ [3]+[4] component 層原始碼掃描 ============

// 橘 token 別名閉包：--color-status-active: var(--color-primary) 之類的別名鏈全數視同品牌橘
// （審查 confirmed HIGH：別名繞道）。以 {primary, primary-hover} 為種子做傳遞閉包。
const orangeTokens = new Set(['primary', 'primary-hover']);
const aliasPairs = [...tokensSource.matchAll(/--color-([\w-]+):\s*var\(--color-([\w-]+)\)/g)];
let grew = true;
while (grew) {
  grew = false;
  for (const [, alias, target] of aliasPairs)
    if (orangeTokens.has(target) && !orangeTokens.has(alias)) { orangeTokens.add(alias); grew = true; }
}
const orangeVarRe = new RegExp(`var\\(--color-(?:${[...orangeTokens].join('|')})\\)`);

// [檔案路徑, 該檔的寫死色白名單]
const scanFiles = MODE === 'megaweb'
  ? [
      ...['src/styles/base.css', 'src/styles/components.css', 'src/styles/global.css'].map((f) => [join(ROOT, f), FACADE_ALLOWED]),
      [join(ROOT, 'src/styles/components-app.css'), APP_ALLOWED],
    ]
  : [
      [join(bundleDir, '_ds_bundle.css'), FACADE_ALLOWED],
      [join(bundleDir, 'components-app.css'), APP_ALLOWED],
    ];

const COLOR_PROPS_RE = /(?<![-\w])(color|background(?:-color)?|border(?:-(?:top|right|bottom|left))?-color|outline-color|text-decoration-color|caret-color|accent-color|fill|stroke)\s*:\s*([^;]+);/g;

for (const [f, allowed] of scanFiles) {
  if (!existsSync(f)) { fail('derive', `${relative(ROOT, f)} 不存在`); continue; }
  const css = stripComments(read(f)); // 剝除註解——說明文字裡的色碼不算寫死
  const rel = relative(ROOT, f);
  // [3] 橘不做文字色：`color:` 宣告（排除 border-color 等）不得取品牌橘（含別名鏈）
  //     唯一例外：鐵則明文允許「橘進 icon」——.status__icon 的宣告行放行
  for (const m of css.matchAll(/(?<![-\w])color\s*:\s*([^;]+);/g)) {
    const v = m[1].trim();
    if (orangeVarRe.test(v) || /#(F06000|D45200)/i.test(v)) {
      const lineStart = css.lastIndexOf('\n', m.index) + 1;
      const line = css.slice(lineStart, css.indexOf('\n', m.index) === -1 ? undefined : css.indexOf('\n', m.index));
      if (/\.status__icon\b/.test(line)) continue; // icon 例外（WCAG 1.4.1 圖形 3:1 過關）
      fail('orange-text', `${rel}：\`color: ${v}\` — 品牌橘不做文字色（鐵則，含別名 ${[...orangeTokens].join('/')}）；橘只進 icon/邊框/底色`);
    }
  }
  // [4a] 寫死色白名單：hex 與全部函數色（rgb/hsl/hwb/lab/lch/oklab/oklch/color）
  for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^)]*\)/g)) {
    const norm = m[0].toLowerCase().replace(/\s+/g, '');
    if (!allowed.has(norm))
      fail('hardcoded', `${rel}：寫死色字面值 \`${m[0]}\` 不在白名單——改用 var(--…) token（或有意例外則加進白名單並附理由）`);
  }
  // [4b] CSS 命名色：色彩屬性值裡的裸識別字命中命名色即紅燈（white/orangered…）
  for (const m of css.matchAll(COLOR_PROPS_RE)) {
    const bare = m[2].replace(/[a-z-]+\([^)]*\)/gi, ''); // 去掉函數呼叫（var/rgb/url…）後看剩餘裸字
    for (const tok of bare.split(/[\s,\/]+/))
      if (NAMED_COLORS.has(tok.toLowerCase()))
        fail('hardcoded', `${rel}：\`${m[1]}: …${tok}…\` 用了 CSS 命名色——改用 var(--…) token`);
  }
}

// ============ [4c] components-app fallback 一致性 ============
// var(--color-X, <fallback>) 的 fallback 必須等於 tokens-app 的 --color-X 現值——
// 改語意色時漏改 fallback，漏引 tokens-app 的消費端會 degrade 成「舊色」而走鐘。
const appCssPath = MODE === 'megaweb' ? join(ROOT, 'src/styles/components-app.css') : join(bundleDir, 'components-app.css');
if (existsSync(appCssPath)) {
  const appCss = stripComments(read(appCssPath));
  // fallback 可含一層括號（rgba(...)）——(?:[^()]|\([^()]*\))+ 而非 [^)]+
  for (const m of appCss.matchAll(/var\(--color-([\w-]+)\s*,\s*((?:[^()]|\([^()]*\))+)\)/g)) {
    const [, name, fbRaw] = m;
    const fb = fbRaw.trim().toLowerCase().replace(/\s+/g, '');
    if (/^#[0-9a-f]{6}$/.test(fb)) {
      if (fb !== (hexTokens[name] ?? '').toLowerCase())
        fail('fallback', `components-app：var(--color-${name}, ${fbRaw.trim()}) 的 fallback ≠ tokens-app 現值 ${hexTokens[name] ?? '(token 不存在)'}——兩處同步`);
    } else if (name.endsWith('-tint')) {
      const base = hexTokens[name.replace(/-tint$/, '')];
      const rm = fb.match(/^rgba\((\d+),(\d+),(\d+),0?\.12\)$/);
      const rgb = base ? [1, 3, 5].map((i) => parseInt(base.slice(i, i + 2), 16)) : null;
      if (!rm || !rgb || +rm[1] !== rgb[0] || +rm[2] !== rgb[1] || +rm[3] !== rgb[2])
        fail('fallback', `components-app：var(--color-${name}, ${fbRaw.trim()}) 的 tint fallback 與 base 色 ${base ?? '(缺)'} 的 12% 不符`);
    } else {
      fail('fallback', `components-app：var(--color-${name}, ${fbRaw.trim()}) fallback 格式無法驗證——用 6 位 hex 或 rgba(r,g,b,0.12)`);
    }
  }
}

// ============ [5] ds-bundle 上傳包完整性 ============

for (const f of BUNDLE_REQUIRED)
  if (!existsSync(join(bundleDir, f))) fail('bundle', `ds-bundle/${f} 缺失`);

const compDir = join(bundleDir, 'components');
const htmls = [];
if (existsSync(compDir)) {
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.html') && htmls.push(join(d, e.name)); };
  walk(compDir);
}
if (htmls.length < 6) fail('bundle', `components/ 元件 HTML 僅 ${htmls.length} 個（預期 ≥6）`);
// class 查表用的 CSS 先剝註解——否則註解裡出現的 class 名會被誤判為「有定義」。
// 查表範圍 = 門面 + 語意元件層（demo 卡可展示 opt-in class，如 .btn--danger）。
const bundleCss = ['_ds_bundle.css', 'components-app.css']
  .map((f) => join(bundleDir, f))
  .filter(existsSync)
  .map((p) => stripComments(read(p)))
  .join('\n');
for (const h of htmls) {
  const rel = relative(ROOT, h);
  const html = read(h);
  const firstLine = html.split('\n', 1)[0];
  if (!/^<!-- @dsCard group="[^"]+" -->/.test(firstLine))
    fail('bundle', `${rel} 首行 marker 非 \`<!-- @dsCard group="…" -->\`（實際：${firstLine.slice(0, 60)}）——上傳流程靠 marker 識別，會被跳過`);
  if (!existsSync(h.replace(/\.html$/, '.prompt.md'))) fail('bundle', `${rel} 缺對應 .prompt.md`);
  // class 覆蓋：demo 用到的 DS 家族 class（含 .btn-primary 這類單橫線 typo）必須在 _ds_bundle.css 有定義
  for (const cm of html.matchAll(/class="([^"]+)"/g))
    for (const cls of cm[1].split(/\s+/).filter((c) => DS_CLASS_RE.test(c)))
      if (!new RegExp(`\\.${cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`).test(bundleCss))
        fail('bundle', `${rel} 用到 .${cls} 但 _ds_bundle.css 無定義（typo 或元件缺漏）`);
}

const bundleReadme = existsSync(join(bundleDir, 'README.md')) ? read(join(bundleDir, 'README.md')) : '';
if (bundleReadme.includes('.design-sync/'))
  fail('bundle', 'ds-bundle/README.md 參照 .design-sync/（bundle 外路徑，上傳後斷連）——改指 bundle 內 CONVENTIONS.md');
if (!/-info\b/.test(bundleReadme))
  fail('bundle', 'ds-bundle/README.md 語意色段落漏列 info（tokens-app.css 有 --color-info）');

// ============ 結果 ============

if (errors.length) {
  console.error(`✗ check-brand（${MODE} 模式）發現 ${errors.length} 個問題：\n`);
  for (const e of errors) console.error('  ' + e);
  console.error('\n修正後重跑 node scripts/check-brand.mjs；衍生檔問題先跑 scripts/gen-ds.mjs。');
  process.exit(1);
}
console.log(`✓ check-brand（${MODE} 模式）全數通過 — 衍生檔一致、WCAG 達標、無走鐘色、ds-bundle 完整`);
