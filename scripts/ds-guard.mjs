#!/usr/bin/env node
/**
 * ds-guard.mjs — 下游專案品牌守門（零依賴單檔；Phase 5）
 *
 * 在「消費群兆設計系統」的下游專案裡跑，掃原始碼抓走鐘：把 CONVENTIONS.md 的禁止清單
 * 從文件變成可執行檢查。錯誤 exit 1（可接 CI，亦可手動跑）。
 *
 * 用法（於下游專案根目錄）：
 *   node node_modules/@megapower/design-tokens/scripts/ds-guard.mjs          # npm 依賴型
 *   npx ds-guard                                                            # 裝了套件後（bin）
 *   node scripts/ds-guard.mjs --mode=inline                                 # vendored/inline 專案（複製本檔）
 *
 * 模式：
 *   --mode=linked（預設）：引用型專案（CDN link / npm import）——寫死品牌色也算違規（該用 var(--…)）
 *   --mode=inline         ：vendored / inline 專案（PrismSGA、MegaQuotr 類）——允許 #F06000/#D45200
 *                           字面值（由 sd 批次/vendor 管理），其他規則照抓
 * 其他參數：--root=<dir> 掃描起點（預設 cwd）；--exclude=<glob 逗號清單> 追加排除。
 *
 * 規則（R1–R8）：
 *   R1 禁用色碼：Tailwind 橘 #F97316、走鐘前科 #16a34a/#10B981；linked 模式再加 #F06000/#D45200
 *   R2 自造狀態態：.status--<非 canonical 四態>（業務態應走映射規約）；.btn--success/.btn--info
 *   R3 web font：@font-face、fonts.googleapis、@fontsource（PSI 效能鐵則）
 *   R4 覆蓋 DS 核心：CSS 重新宣告 .btn{ /.status{ /.card{ /.section{（基底，非 modifier）
 *   R5 橘做文字色：color: #F06000/var(--color-primary)（icon selector 例外同 check-brand）
 *   R6 --color-text 當背景：dark 三態下 text 反轉為淺色，背景會隱形——深色強調區改 var(--color-surface-inverse)
 *   R7 本地 dark hack：自寫 @media prefers-color-scheme / [data-theme="dark"] 樣式塊——dark 由 DS 三態
 *      提供；僅「DS token 三塊同構覆寫」屬合法（該行加 ds-guard-allow: R7 豁免）
 *   R8 只覆寫 light：重宣告 --color-* token 但檔內無 dark 同構訊號——@layer 下該覆寫在 dark 模式也生效，
 *      會造成「消費端淺底＋DS 淺字」隱形；三塊同構給 dark 值、或頁面釘 <html data-theme="light">
 *
 * 豁免：該行（或宣告行）尾註 ds-guard-allow: R<n>（逗號可列多條；審慎使用、留下理由）
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const argv = process.argv.slice(2);
const getArg = (name, dflt) => {
  const i = argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (i === -1) return dflt;
  return argv[i].includes('=') ? argv[i].split('=').slice(1).join('=') : argv[i + 1];
};
const MODE = getArg('mode', 'linked');
if (!['linked', 'inline'].includes(MODE)) { console.error(`✗ ds-guard：未知 --mode "${MODE}"（linked|inline）`); process.exit(1); }
const ROOT = getArg('root', process.cwd());

/** 掃描的副檔名（樣式 + 模板 + 元件 + 產生樣式字串的程式碼） */
const EXTS = new Set(['.css', '.scss', '.html', '.htm', '.astro', '.vue', '.svelte', '.jsx', '.tsx', '.js', '.ts', '.py']);
/** 目錄排除（官方檔與產物不掃） */
const DIR_EXCLUDE = new Set(['node_modules', '.git', 'dist', 'build', '.venv', 'venv', '.astro', '.next', 'coverage', '__pycache__', 'ds-bundle']); // ds-bundle=官方發布包（含刻意的色票展示 hex）
/** 檔名排除：官方/vendored 品牌檔（它們本來就含品牌字面值） */
const FILE_EXCLUDE = /^(megapower(\.[0-9a-f]{12})?\.css|tokens(-app)?\.css|components-app\.css|_ds_bundle\.css|tokens\.js|ds-guard\.mjs|vendor-brand\.mjs|check-brand\.mjs|build-tokens\.mjs)$/;
const extraExclude = (getArg('exclude', '') || '').split(',').filter(Boolean);

const problems = [];
const report = (file, line, rule, msg) => problems.push({ file: relative(ROOT, file), line, rule, msg });

const CANONICAL_STATUS = ['received', 'active', 'done', 'cancelled'];

const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (DIR_EXCLUDE.has(e.name) || e.name.startsWith('.')) continue;
      if (extraExclude.some((x) => p.includes(x))) continue;
      walk(p);
      continue;
    }
    const dot = e.name.lastIndexOf('.');
    if (dot === -1 || !EXTS.has(e.name.slice(dot))) continue;
    if (FILE_EXCLUDE.test(basename(p))) continue;
    if (extraExclude.some((x) => p.includes(x))) continue;
    scan(p);
  }
};

const scan = (file) => {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { return; }
  const lines = text.split('\n');
  const isCss = /\.(css|scss)$/.test(file);
  let inBlockComment = false; // 塊註解狀態機（行號保持正確；註解內容不檢查——「收編註解」等說明文字不誤報）
  // R8 檔案級狀態：token 覆寫行 vs dark 同構訊號（prefers-color-scheme / data-theme dark 塊 / 釘 light）
  const tokenOverrideLines = [];
  let hasDarkSignal = /prefers-color-scheme|data-theme=["']?(dark|light)/.test(text);
  lines.forEach((raw, idx) => {
    const n = idx + 1;
    // 字面 \n 轉義的內嵌 CSS 字串（如 Python assets.py 單行大字串）：拆虛擬子行逐段掃，行號報實體行
    if (raw.includes('\\n') && raw.length > 200) {
      for (const sub of raw.split('\\n')) scanLine(sub, n);
      return;
    }
    scanLine(raw, n);
  });

  // R8 檔案級判定：有 DS token 覆寫、卻無任何 dark 同構訊號（掃描完整檔後才知道）
  if (tokenOverrideLines.length && !hasDarkSignal)
    report(file, tokenOverrideLines[0], 'R8',
      `重宣告 DS token（--color-*）但檔內無 dark 同構——@layer 下此覆寫於 dark 模式仍生效，會成「你的淺底＋DS 淺字」隱形。三選一：三塊同構補 dark 值／頁面釘 <html data-theme="light">／移除覆寫（共 ${tokenOverrideLines.length} 行宣告）`);

  function scanLine(line, n) {
    if (inBlockComment) { if (line.includes('*/')) inBlockComment = false; return; }
    const allow = new Set([...line.matchAll(/ds-guard-allow:\s*((?:R\d+|all)(?:\s*,\s*(?:R\d+|all))*)/gi)]
      .flatMap((m) => m[1].split(',').map((s) => s.trim().toUpperCase())));
    const allowed = (rule) => allow.has(rule) || allow.has('ALL');
    const trimmed = line.trim();
    if (trimmed.startsWith('/*') && trimmed.includes('*/')) return;          // 單行完整塊註解
    if (line.includes('/*') && !line.includes('*/')) inBlockComment = true;  // 開多行塊註解（本行仍檢查註解前的程式碼——保守）
    if (/^(\/\/|\*)/.test(trimmed)) return;                                   // js 行註解 / 塊註解中段
    if (trimmed.startsWith('#') && !/^#[0-9a-fA-F]{3,8}\b/.test(trimmed)) return; // py 註解（# 開頭但非色碼）
    /** 本行是否為 CSS 規則語境（含 JS/PY 字串內嵌 CSS——fork 檔轉字串仍要抓） */
    const cssCtx = isCss || /^\s*["'`]?\s*\.[\w-]+[^;=]*\{/.test(line);

    // R1 禁用色碼
    if (/#F97316/i.test(line)) report(file, n, 'R1', 'Tailwind 橘 #F97316——品牌主色是 #F06000，且應走 var(--color-primary)');
    if (/#16a34a/i.test(line)) report(file, n, 'R1', '走鐘前科色 #16a34a（飽和綠，對白 3.3:1 fail AA）——語意回饋走 tokens-app.css');
    if (/#10B981/i.test(line)) report(file, n, 'R1', '走鐘前科色 #10B981——語意回饋走 tokens-app.css');
    if (MODE === 'linked' && /#(F06000|D45200)/i.test(line))
      report(file, n, 'R1', '寫死品牌色——引用型專案應用 var(--color-primary/-hover)（inline/vendored 專案改跑 --mode=inline）');

    // R2 自造狀態態 / 禁用按鈕——只抓「使用語境」（class 屬性內或 CSS selector），說明文案不算
    const usageContexts = [
      ...[...line.matchAll(/class(?:Name)?\s*=\s*["'`]([^"'`]*)["'`]/g)].map((m) => m[1]),
      ...(cssCtx ? [line] : []),
    ];
    for (const ctx of usageContexts) {
      for (const m of ctx.matchAll(/(?:^|[\s."'`])status--([\w-]+)/g))
        if (!CANONICAL_STATUS.includes(m[1]))
          report(file, n, 'R2', `.status--${m[1]}——業務態不加新 class，映射 canonical 四態（見 CONVENTIONS 映射規約）`);
      if (cssCtx ? /\.btn--(success|info)\s*[,{:]/.test(ctx) : /(?:^|\s)btn--(success|info)(?:\s|$)/.test(ctx))
        report(file, n, 'R2', '.btn--success/.btn--info 已封殺——成功走 toast 回饋、資訊類動作用 secondary/ghost');
    }

    // R3 web font
    if (/@font-face|fonts\.googleapis|@fontsource/i.test(line))
      report(file, n, 'R3', 'web font 禁止加回（PSI 效能鐵則）——system font stack 已內建');

    // R4 覆蓋 DS 核心（基底 selector 而非 modifier/後代；含 JS/PY 字串內嵌 CSS）
    if (/^\s*["'`]?\s*\.(btn|status|card|section)\s*[,{]/.test(line))
      report(file, n, 'R4', `重新宣告 DS 核心 .${line.match(/\.(btn|status|card|section)/)[1]} 基底——下游不 fork 門面元件；要改品牌提 PR 到 design-system`);

    // R5 橘做文字色（icon 例外：本行或上兩實體行含 __icon——多行格式不誤報）
    const nearIcon = /__icon/.test(line) || /__icon/.test(lines[n - 2] ?? '') || /__icon/.test(lines[n - 3] ?? '');
    if (/(?<![-\w])color\s*:\s*(var\(--color-primary(-hover)?\)|#(F06000|D45200))/i.test(line) && !nearIcon)
      report(file, n, 'R5', '品牌橘不做文字色（對白 3.29:1 fail AA）——文字走深灰，橘只進 icon/邊框/底色（≥24px 粗體大標 3:1 過關屬合法，人工複核）');

    // R6 --color-text 當背景（0.5.0 dark 三態下 text 反轉為淺色，背景隱形——fixreq footer 事故 pattern）
    if (/background(?:-color)?\s*:\s*var\(--color-text\)/i.test(line) && !allowed('R6'))
      report(file, n, 'R6', '不得以 var(--color-text) 當背景——dark 模式下 text 反轉為淺色即隱形；深色強調區改 var(--color-surface-inverse)');

    // R7 本地 dark hack（dark 由 DS 三態提供；純 DS token 三塊同構覆寫屬合法→行尾 ds-guard-allow: R7）
    if ((/@media[^{]*prefers-color-scheme/i.test(line) || (cssCtx && /\[data-theme=["']dark["']\]/.test(line))) && !allowed('R7'))
      report(file, n, 'R7', '自寫 dark 樣式塊——dark 已由 DS 三態機制提供，本地 hack 會與三態衝突；若此塊僅為 DS token 三塊同構覆寫，行尾加 ds-guard-allow: R7 並留理由');

    // R8 素材收集：重宣告 DS 命名空間 token（--color-*: 宣告，非 var() 引用）
    if (/--color-[\w-]+\s*:/.test(line) && (cssCtx || /:root/.test(line)) && !allowed('R8'))
      tokenOverrideLines.push(n);
  }
};

if (!existsSync(ROOT) || !statSync(ROOT).isDirectory()) { console.error(`✗ ds-guard：掃描起點不存在（${ROOT}）`); process.exit(1); }
walk(ROOT);

if (problems.length) {
  console.error(`✗ ds-guard（${MODE} 模式）發現 ${problems.length} 處走鐘：\n`);
  for (const p of problems) console.error(`  ${p.file}:${p.line} [${p.rule}] ${p.msg}`);
  console.error('\n規範全文：CONVENTIONS.md（npm 套件內附）或 https://github.com/Megapower-Asia-LLC/design-system');
  process.exit(1);
}
console.log(`✓ ds-guard（${MODE} 模式）通過——未發現品牌走鐘`);
