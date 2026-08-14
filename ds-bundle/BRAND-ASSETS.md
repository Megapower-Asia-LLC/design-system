# 群兆品牌資產 (Brand Assets)

群兆官方 logo 與官網 QR Code。公開託管於 megaweb，可直接引用。
設計原檔在 OneDrive `行銷相關/Logo`；本目錄與 `public/ds/logo/` 為發布版。

## 資產與公開 URL

**主標誌（純 M 圖標 — 最常用：UI / favicon / 小尺寸）**
- 淺色背景：`logo-mark-light.png`（橘 M #F06000）— https://www.megapower.asia/ds/logo/logo-mark-light.png
- 深色背景：`logo-mark-dark.png`（淡橘 M）— https://www.megapower.asia/ds/logo/logo-mark-dark.png

**完整標誌（M + 群兆資訊有限公司 + 標語 — 正式文件 / 封面）**
- 淺色背景：`logo-full-light.png` — https://www.megapower.asia/ds/logo/logo-full-light.png
- 深色背景：`logo-full-dark.png` — https://www.megapower.asia/ds/logo/logo-full-dark.png

**官網 QR Code（中間嵌 M — 名片 / 海報 / 簡報）**
- 白底：`qr-website-light.png` — https://www.megapower.asia/ds/logo/qr-website-light.png
- 透明 / 深底：`qr-website-dark.png` — https://www.megapower.asia/ds/logo/qr-website-dark.png

## 使用規範

- **選版**：淺色背景用 light 版、深色背景用 dark 版；避免放在花色或低對比背景上。
- **留白**：logo 四周至少保留「M 高度的 50%」淨空，勿讓其他元素緊貼。
- **最小尺寸**：純圖標 mark ≥ 24px（UI）；完整標誌 ≥ 寬 120px（確保標語可讀）。
- **favicon / app icon**：用 logo-mark。
- **禁止**：拉伸變形、改色（品牌橘固定 `#F06000`）、旋轉、加陰影/外框、改變圖標與文字的相對排列。

## 網頁引用範例

```html
<img src="https://www.megapower.asia/ds/logo/logo-mark-light.png"
     alt="群兆資訊" width="40" height="40">
```

## 自託管 / vendoring 取用

含敏感資料或需嚴格 CSP `self-only` 的頁面（如客戶追蹤頁），**勿**引用上面的公開 URL——logo 亦隨 npm 套件發佈，可經 `@megapower/design-tokens/logo/<檔名>` 取得，用 vendoring 腳本複製進自家 `public/assets/logos/`（見 design-system MAINTENANCE §7），頁面以相對路徑引用：

```html
<img src="/assets/logos/logo-mark-light.png" alt="群兆資訊" width="40" height="40">
```
