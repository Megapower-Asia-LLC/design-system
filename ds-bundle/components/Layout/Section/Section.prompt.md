# Section

頁面區塊與限寬容器。`.section` 提供區塊垂直留白，內層 `.section__inner` 限寬置中。

- 背景：`.section--soft`（淺灰）｜`.section--dark`（深底，內文自動轉淺色，常用於 CTA）
- 限寬：`.section__inner`（max 1200px）｜`.section__inner--narrow`（max 720px，長文閱讀）

```html
<section class="section section--dark">
  <div class="section__inner">
    <h2>標題</h2>
    <a class="btn btn--primary btn--md">行動呼籲</a>
  </div>
</section>
```
