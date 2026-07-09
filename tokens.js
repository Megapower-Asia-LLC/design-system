// 群兆視覺設計系統 design tokens（JS 匯出版）
// AUTO-GENERATED from ds-bundle/tokens/tokens.css by scripts/build-tokens.mjs — 勿手改此檔。
// 改品牌：改 megaweb SoT → 依 MAINTENANCE.md 同步本 repo → node scripts/build-tokens.mjs
// 用法：import { color, fontSans } from "@megapower/design-tokens";
//
// 不在此檔的 token（derived in CSS only，JS 端不可用）：
//   --color-primary-tint（color-mix() 執行期表達式）
// 語意色（success/warning/danger/info）刻意不匯出——opt-in CSS（tokens-app.css），門面 JS/CSS 一致只含橘+灰。

export const color = {
  "bg": "#FFFFFF",
  "bgSoft": "#F8FAFC",
  "text": "#1E293B",
  "textMuted": "#64748B",
  "border": "#E2E8F0",
  "primary": "#F06000",
  "primaryHover": "#D45200",
  "primarySoftBg": "#FFF7ED",
};

export const fontSans =
  "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang TC\", \"Microsoft JhengHei\", \"Hiragino Sans\", \"Yu Gothic UI\", \"Noto Sans CJK TC\", \"Noto Sans CJK JP\", Roboto, system-ui, sans-serif";

export const fontSize = {
  "sm": "0.875rem",
  "base": "1rem",
  "lg": "1.125rem",
  "xl": "1.25rem",
  "displayMd": "clamp(1.5rem, 3vw, 2.25rem)",
  "displayLg": "clamp(2rem, 4vw, 3.25rem)",
};

export const lineHeight = { base: "1.6" };

export const space = { "2": "0.5rem", "4": "1rem", "6": "1.5rem", "8": "2rem", "12": "3rem" };

// 桌面基準值；768px 以下 CSS 降為 3.5rem（media query 覆寫，JS 端僅匯出基準）
export const spacingSection = "5rem";

export const maxWidth = { content: "1200px", narrow: "720px" };
export const radius = { sm: "4px", md: "8px", lg: "16px", full: "9999px" };
export const shadow = {
  "sm": "0 1px 3px rgba(0, 0, 0, 0.08)",
  "md": "0 4px 12px rgba(0, 0, 0, 0.10)",
  "lg": "0 8px 24px rgba(0, 0, 0, 0.12)",
};
export const transition = { fast: "0.15s ease", base: "0.25s ease" };

// RWD 斷點：md 由 tokens.css 的 @media (max-width) 機械解析（防漂移）；lg 為新專案慣例值
export const breakpoint = { md: "768px", lg: "1024px" };

const BASE = "https://www.megapower.asia/ds/logo";
export const logo = {
  markLight: `${BASE}/logo-mark-light.png`,
  markDark: `${BASE}/logo-mark-dark.png`,
  fullLight: `${BASE}/logo-full-light.png`,
  fullDark: `${BASE}/logo-full-dark.png`,
  qrWebsiteLight: `${BASE}/qr-website-light.png`,
  qrWebsiteDark: `${BASE}/qr-website-dark.png`,
};

// 狀態語言（橘+灰映射；由 CSS --color-status-* 的 var() 引用自動解析；key 引號化容納連字號業務態）
export const statusColor = {
  "received": color.textMuted,
  "active": color.primary,
  "done": color.text,
  "cancelled": color.textMuted,
};
