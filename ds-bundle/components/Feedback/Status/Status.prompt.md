# Status

狀態徽章。基底 `.status` + 狀態修飾子，icon + 文字並存（不單靠顏色，WCAG 1.4.1）。

- `.status--received`（○ 灰）：已收到、待確認
- `.status--active`（● 橘）：處理中，唯一活躍色
- `.status--done`（✓ 深灰）：已結案，終態
- `.status--cancelled`（✕ 灰 + 虛線框）：取消，與已結案明確區隔

品牌橘對白僅 3.29:1，橘只用於 `.status__icon`（圖形 3:1 門檻），文字走深灰。狀態進度一律用這套橘+灰，**勿用語意色**（如 success 綠）表示「已結案」。

**業務態擴充規約（門面不新增 class）**：業務狀態一律映射 canonical 四態、差異用「文字 + icon 字元」表達。歸類法：待確認→`--received`（○）、進行中→`--active`（●）、正常終態→`--done`（✓）、異常終態→`--cancelled`（✕ 或 ⊘）。例：報價單 draft→received、sent→active、accepted→done、rejected→cancelled(✕)、expired→cancelled(⊘)。禁止自造新態 class 或引入新色。

```html
<span class="status status--active">
  <span class="status__icon" aria-hidden="true">●</span>處理中
</span>
```
