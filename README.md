# AOKI YUWA — Portfolio

青木優和のポートフォリオサイト。対馬から福岡への旅をドット景観で表現したインタラクティブなWebサイト。

## 構成

```
portfolio/
├── index.html          # メインHTML
├── css/style.css       # スタイル
├── js/main.js          # Three.js + アニメーション
└── assets/
    └── works/          # ← 制作物の画像・スクリーンショットをここに入れる
```

## 制作物の追加方法

1. `assets/works/` に画像ファイルを入れる（例: `flyer01.jpg`, `web01.png`）
2. `index.html` の `#works` セクション内 `.works-grid` に以下を追加：

```html
<div class="work-card">
  <div class="work-img">
    <img src="assets/works/ファイル名.jpg" alt="作品名" />
  </div>
  <div class="work-info">
    <h3 class="work-title">作品タイトル</h3>
    <p class="work-desc">説明文</p>
    <div class="work-tags">
      <span class="tag">HTML</span>
      <span class="tag">CSS</span>
    </div>
  </div>
</div>
```

## 技術スタック

- HTML / CSS / JavaScript
- Three.js（ドット景観アニメーション）
- GSAP + ScrollTrigger（スクロールアニメーション）
