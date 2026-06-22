// 群兆視覺設計系統 design tokens（JS 匯出版）
// 由 megaweb/src/styles/tokens.css 衍生；改品牌請改 megaweb 來源後同步，勿手改此檔。
// 用法：import { color, fontSans } from "@megapower/design-tokens";

export const color = {
  bg: "#FFFFFF",
  bgSoft: "#F8FAFC",
  text: "#1E293B",
  textMuted: "#64748B",
  border: "#E2E8F0",
  primary: "#F06000",        // 官方 logo 橘
  primaryHover: "#D45200",
  primarySoftBg: "#FFF7ED",
};

export const fontSans =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang TC", "Microsoft JhengHei", "Hiragino Sans", "Yu Gothic UI", "Noto Sans CJK TC", "Noto Sans CJK JP", Roboto, system-ui, sans-serif';

export const fontSize = {
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  displayMd: "clamp(1.5rem, 3vw, 2.25rem)",
  displayLg: "clamp(2rem, 4vw, 3.25rem)",
};

export const space = { 2: "0.5rem", 4: "1rem", 6: "1.5rem", 8: "2rem", 12: "3rem" };
export const maxWidth = { content: "1200px", narrow: "720px" };
export const radius = { sm: "4px", md: "8px", lg: "16px", full: "9999px" };
export const shadow = {
  sm: "0 1px 3px rgba(0,0,0,0.08)",
  md: "0 4px 12px rgba(0,0,0,0.10)",
  lg: "0 8px 24px rgba(0,0,0,0.12)",
};
export const transition = { fast: "0.15s ease", base: "0.25s ease" };

const BASE = "https://www.megapower.asia/ds/logo";
export const logo = {
  markLight: `${BASE}/logo-mark-light.png`,
  markDark: `${BASE}/logo-mark-dark.png`,
  fullLight: `${BASE}/logo-full-light.png`,
  fullDark: `${BASE}/logo-full-dark.png`,
  qrWebsiteLight: `${BASE}/qr-website-light.png`,
  qrWebsiteDark: `${BASE}/qr-website-dark.png`,
};
