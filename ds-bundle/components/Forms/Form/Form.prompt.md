# Form

群兆表單控件（Phase 4 收編：提煉自 MegaQ / MegaQuotr / servicejdc-fixreq 三方現成實作）。

- 結構（門面，純橘+灰）：`.form-group`（欄位容器）＞`.form-label` + `.form-input`｜`.form-select`｜`.form-textarea`｜`.form-checkbox` + `.form-hint`（輔助說明）；並排用 `.form-row`（640px 以下自動收合單欄）
- 錯誤態（opt-in，需另引 `tokens-app.css` + `components-app.css`）：控件加 `--error` modifier（如 `.form-input--error`）+ `.form-error-text` 錯誤訊息
- focus：控件聚焦為品牌橘框 + 12% tint 光暈（全域 `:focus-visible` 的唯一豁免款，已內建勿覆蓋）；錯誤態聚焦維持 danger 框不切回橘
- a11y 必守：`label[for]` 對應控件 id、錯誤訊息用 `aria-describedby` 關聯 + `role="alert"`、必填加 `aria-required`
- 控件字級為 `--text-base`（16px）——勿改小，低於 16px 觸發 iOS Safari 聚焦自動縮放

```html
<div class="form-group">
  <label class="form-label" for="email">Email</label>
  <input class="form-input" id="email" type="email">
  <p class="form-hint">我們不會公開您的信箱。</p>
</div>
```
