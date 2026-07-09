# Button

群兆按鈕。基底 `.btn` + 樣式修飾 + 尺寸修飾。

- 門面樣式：`.btn--primary`（實心品牌橘，主要行動）｜`.btn--secondary`（白底灰框，次要）｜`.btn--outline`（橘框深灰字，第三層）｜`.btn--ghost`（淡橘底深灰字，軟性輔助動作）
- opt-in 樣式：`.btn--danger`（磚紅底白字，僅限刪除/不可逆操作的確認鈕）——需另引 `tokens-app.css` + `components-app.css`
- 尺寸：`.btn--sm` / `.btn--md` / `.btn--lg`；停用直接用 `disabled` 屬性（基底內建 0.6 透明度）
- 在深底區塊 `.section--dark` 內，`.btn--secondary` 自動轉淺色描邊。
- **禁止自造 `.btn--success` / `.btn--info`**：操作成功走訊息/toast 回饋，不用綠色按鈕；資訊類動作用 `.btn--secondary` 或 `.btn--ghost`。

```html
<a href="/analyze" class="btn btn--primary btn--lg">開始分析</a>
<a href="/import" class="btn btn--ghost btn--md">匯入 CSV</a>
<button type="button" class="btn btn--danger btn--md">確認刪除</button>
```
