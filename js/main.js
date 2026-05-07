/* ===== Custom Cursor ===== */
const cursor = document.querySelector('.cursor');
const cursorDot = document.querySelector('.cursor-dot');

document.addEventListener('mousemove', (e) => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
  cursorDot.style.left = e.clientX + 'px';
  cursorDot.style.top = e.clientY + 'px';
});

document.querySelectorAll('a, button, .skill-card, .work-card, .contact-card').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.style.transform = 'translate(-50%,-50%) scale(1.8)');
  el.addEventListener('mouseleave', () => cursor.style.transform = 'translate(-50%,-50%) scale(1)');
});

/* ===== Intro Screen ===== */
(function() {
  const intro = document.getElementById('intro');
  if (!intro) return;
  document.body.style.overflow = 'hidden';

  // バーのアニメーション(2.3s)が終わったらフェードアウト
  setTimeout(() => {
    intro.classList.add('intro-out');
    setTimeout(() => {
      intro.style.display = 'none';
      document.body.style.overflow = '';
    }, 720);
  }, 2600);
})();

/* ===== Progress Bar ===== */
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  document.getElementById('progress-bar').style.width = (scrolled * 100) + '%';
});

/* ===== 時間帯グラデーション（smoothstep クロスフェード） ===== */
(function initSkyLayers() {
  function jstHour() {
    const now = new Date();
    const jst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60000);
    return jst.getHours() + jst.getMinutes() / 60;
  }

  function smoothstep(a, b, x) {
    if (x <= a) return 0;
    if (x >= b) return 1;
    const t = (x - a) / (b - a);
    return t * t * (3 - 2 * t);
  }

  function calcOpacities(h) {
    const T = 0.5; // ±30分の遷移ゾーン
    const dawnW   = smoothstep(5 - T, 5 + T, h)  * (1 - smoothstep(8  - T, 8  + T, h));
    const dayW    = smoothstep(8 - T, 8 + T, h)  * (1 - smoothstep(16 - T, 16 + T, h));
    const sunsetW = smoothstep(16 - T, 16 + T, h) * (1 - smoothstep(19 - T, 19 + T, h));
    const nightW  = Math.max(0, 1 - dawnW - dayW - sunsetW);
    return { night: nightW, dawn: dawnW, day: dayW, sunset: sunsetW };
  }

  function applyOpacities(op, withTransition) {
    ['night', 'dawn', 'day', 'sunset'].forEach(id => {
      const el = document.getElementById('sky-' + id);
      if (!el) return;
      if (!withTransition) el.style.transition = 'none';
      el.style.opacity = op[id];
      if (!withTransition) el.offsetHeight; // reflow
    });
    if (!withTransition) {
      // 次のフレームでトランジション有効化
      requestAnimationFrame(() => {
        ['night', 'dawn', 'day', 'sunset'].forEach(id => {
          const el = document.getElementById('sky-' + id);
          if (el) el.style.transition = '';
        });
      });
    }
  }

  // 初回は即時セット
  applyOpacities(calcOpacities(jstHour()), false);

  // 60秒ごとにゆっくり遷移
  setInterval(() => applyOpacities(calcOpacities(jstHour()), true), 60000);
})();

/* ===== Low-Poly 3D Landscape ===== */
(function initThree() {
  if (typeof THREE === 'undefined') return;

  try {
    const canvas = document.getElementById('bg-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const cvW = () => Math.max(Math.floor(window.innerWidth * 0.25), 280);
    renderer.setSize(cvW(), window.innerHeight);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(65, cvW() / window.innerHeight, 0.1, 250);

    /* ---- 時間帯判定 ---- */
    const tod = document.documentElement.getAttribute('data-tod') || 'night';

    /* ---- 時間帯別パラメータ ---- */
    const todCfg = {
      night:  { fog: 0x060c22, fogD: 0.012, amb: 0xffeedd, ambI: 0.6,  sun: 0xffd090, sunI: 1.5,  hsky: 0x88c8f0, hgnd: 0x2d7030, hI: 0.5,  city: 0xff8820, cityI: 2.5 },
      dawn:   { fog: 0x2a0d22, fogD: 0.010, amb: 0xffccaa, ambI: 0.7,  sun: 0xff9040, sunI: 1.2,  hsky: 0xffb080, hgnd: 0x3a2020, hI: 0.6,  city: 0xff6633, cityI: 1.5 },
      day:    { fog: 0x6090c0, fogD: 0.009, amb: 0xffffff, ambI: 1.0,  sun: 0xfff5e0, sunI: 2.2,  hsky: 0x99ccff, hgnd: 0x4a7a30, hI: 0.8,  city: 0xffa040, cityI: 0.6 },
      sunset: { fog: 0x301020, fogD: 0.011, amb: 0xffddaa, ambI: 0.75, sun: 0xff6020, sunI: 1.8,  hsky: 0xff8844, hgnd: 0x2a1818, hI: 0.65, city: 0xff5500, cityI: 2.0 },
    };
    const cfg = todCfg[tod];

    scene.fog = new THREE.FogExp2(cfg.fog, cfg.fogD);

    /* ---- ライティング ---- */
    scene.add(new THREE.AmbientLight(cfg.amb, cfg.ambI));

    const sun = new THREE.DirectionalLight(cfg.sun, cfg.sunI);
    sun.position.set(8, 20, 14);
    scene.add(sun);

    scene.add(new THREE.HemisphereLight(cfg.hsky, cfg.hgnd, cfg.hI));

    const cityLight = new THREE.PointLight(cfg.city, cfg.cityI, 70);
    cityLight.position.set(0, 12, -55);
    scene.add(cityLight);

    /* ---- マテリアルヘルパー ---- */
    function mat(color) {
      return new THREE.MeshPhongMaterial({ color, flatShading: true, shininess: 0 });
    }

    /* ================================================================
       星空 + 天の川（夜・朝焼け・夕日に表示、昼は非表示）
    ================================================================ */
    (function() {
      const showStars = (tod !== 'day');
      const starOpacity = tod === 'night' ? 0.92 : 0.45; // 朝夕は薄め

      // ── 一般星（白〜薄青）──
      const N = 1800;
      const sPos = new Float32Array(N * 3);
      const sCol = new Float32Array(N * 3);

      for (let i = 0; i < N; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(Math.random() * 1.7 - 0.7);
        const r     = 115 + Math.random() * 22;
        sPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
        sPos[i*3+1] = Math.max(-18, r * Math.cos(phi));
        sPos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);

        const br   = 0.68 + Math.random() * 0.32;
        const blue = Math.random() * 0.14;
        sCol[i*3]   = br - blue * 0.5;
        sCol[i*3+1] = br - blue * 0.2;
        sCol[i*3+2] = br + blue;
      }

      const sGeo = new THREE.BufferGeometry();
      sGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3));
      sGeo.setAttribute('color',    new THREE.Float32BufferAttribute(sCol, 3));
      const sMat = new THREE.PointsMaterial({ size: 0.42, vertexColors: true, transparent: true, opacity: starOpacity, sizeAttenuation: true, fog: false });
      const starField = new THREE.Points(sGeo, sMat);
      starField.visible = showStars;
      scene.add(starField);

      // ── 天の川（斜めのシアン帯）──
      const MW = 900;
      const mPos = new Float32Array(MW * 3);
      const mCol = new Float32Array(MW * 3);

      for (let i = 0; i < MW; i++) {
        const t      = (i / MW) * Math.PI * 1.5 - 0.2;
        const spread = (Math.random() - 0.5) * 0.44;
        const r      = 116 + Math.random() * 10;

        const ax = Math.cos(t + 0.6) * Math.cos(spread);
        const ay = Math.sin(t) * 0.55 + 0.45 + (Math.random() - 0.5) * 0.2;
        const az = Math.sin(spread) * 0.8;
        const len = Math.sqrt(ax*ax + ay*ay + az*az);

        mPos[i*3]   = (ax / len) * r;
        mPos[i*3+1] = Math.max(-10, (ay / len) * r);
        mPos[i*3+2] = (az / len) * r;

        const cx = Math.random();
        mCol[i*3]   = 0.10 + cx * 0.35;
        mCol[i*3+1] = 0.45 + cx * 0.40;
        mCol[i*3+2] = 0.85 + Math.random() * 0.15;
      }

      const mGeo = new THREE.BufferGeometry();
      mGeo.setAttribute('position', new THREE.Float32BufferAttribute(mPos, 3));
      mGeo.setAttribute('color',    new THREE.Float32BufferAttribute(mCol, 3));
      const mMat = new THREE.PointsMaterial({ size: 0.52, vertexColors: true, transparent: true, opacity: tod === 'night' ? 0.72 : 0.30, sizeAttenuation: true, fog: false });
      const milkyWay = new THREE.Points(mGeo, mMat);
      milkyWay.visible = (tod === 'night');
      scene.add(milkyWay);

      // ── 輝星（特に明るい星、数個）──
      const brightStars = [];
      [[30,80,-20],[-45,95,15],[60,70,-30],[-20,110,5],[15,65,-50]].forEach(([x,y,z]) => {
        const sg = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 4),
          new THREE.MeshBasicMaterial({ color: 0xddeeff, fog: false }));
        sg.position.set(x, y, z);
        sg.visible = showStars;
        scene.add(sg);
        brightStars.push(sg);
      });
    })();

    /* ---- 地形の高さ計算 ---- */
    function terrY(x, z) {
      if (z > 18) {
        const t = Math.min(1, (z - 18) / 45);
        return (Math.sin(x * 0.9 + z * 0.5) * 2.2
              + Math.cos(x * 0.5 - z * 0.7) * 1.6
              + Math.sin((x + z) * 0.3)) * t * t;
      }
      if (z > -18) return -1.1;
      return Math.abs(Math.sin(x * 2.0) * Math.cos(z * 1.5)) * 0.4
             * Math.min(1, (-z - 18) / 45);
    }

    /* ================================================================
       地形メッシュ
    ================================================================ */
    const terrGeo = new THREE.PlaneGeometry(42, 175, 50, 200);
    terrGeo.rotateX(-Math.PI / 2);

    const terrColors = [];
    const tPos = terrGeo.attributes.position;
    for (let i = 0; i < tPos.count; i++) {
      const x = tPos.getX(i);
      const z = tPos.getZ(i);
      const base = terrY(x, z);
      let y = base, r, g, b;

      if (z > 18) {
        const t = Math.min(1, (z - 18) / 45);
        y += (Math.random() - 0.5) * 0.5 * t;
        if (base > 1.8)      { r = 0.38; g = 0.66; b = 0.30; }
        else if (base > 0.6) { r = 0.22; g = 0.52; b = 0.22; }
        else                 { r = 0.14; g = 0.42; b = 0.34; }
      } else if (z > -18) {
        y = -1.1 + Math.sin(x * 0.35 + z * 0.55) * 0.08;
        r = 0.06; g = 0.28; b = 0.68;
      } else {
        // 道路が舗装されて見えるよう地面はほぼフラット
        y = (Math.random() - 0.5) * 0.02;
        r = z < -50 ? 0.28 : 0.34;
        g = z < -50 ? 0.28 : 0.32;
        b = z < -50 ? 0.30 : 0.34;
      }

      tPos.setY(i, y);
      terrColors.push(r, g, b);
    }

    terrGeo.setAttribute('color', new THREE.Float32BufferAttribute(terrColors, 3));
    terrGeo.computeVertexNormals();

    const terrMesh = new THREE.Mesh(
      terrGeo,
      new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 0 })
    );
    scene.add(terrMesh);

    /* ================================================================
       海（玄界灘） — 広い青い海面 + 波
    ================================================================ */
    const SEA_W = 58, SEA_L = 52, SEA_WS = 30, SEA_LS = 30;
    const seaGeo = new THREE.PlaneGeometry(SEA_W, SEA_L, SEA_WS, SEA_LS);
    seaGeo.rotateX(-Math.PI / 2);

    const seaColors = [];
    const sPos = seaGeo.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
      const z = sPos.getZ(i);
      const t = (z + SEA_L / 2) / SEA_L;
      seaColors.push(0.04 + t * 0.04, 0.28 + t * 0.12, 0.78 - t * 0.10);
    }
    seaGeo.setAttribute('color', new THREE.Float32BufferAttribute(seaColors, 3));
    seaGeo.computeVertexNormals();

    const sea = new THREE.Mesh(
      seaGeo,
      new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 30 })
    );
    sea.position.set(0, -1.1, 0);
    scene.add(sea);

    // 波のベース保存
    const seaBase = new Float32Array(sPos.array);

    /* ================================================================
       帆船（海の上）
    ================================================================ */
    function makeSailboat(bx, bz) {
      const g = new THREE.Group();

      // 船体（丸みのある底面）
      const hull = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.55, 1.1), mat(0xf4ede0));
      hull.position.y = 0.05;
      g.add(hull);

      // 船底カーブ
      const keel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.52, 2.4, 12, 1, false, 0, Math.PI),
        mat(0xe0d4c0)
      );
      keel.rotation.z = Math.PI / 2;
      keel.rotation.y = Math.PI / 2;
      keel.position.y = -0.22;
      g.add(keel);

      // 船首
      const bow = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.52, 1.1, 8), mat(0xe8dcd0));
      bow.rotation.z = Math.PI / 2;
      bow.position.set(1.45, 0.05, 0);
      g.add(bow);

      // マスト
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 3.4, 8), mat(0x7a4a1a));
      mast.position.y = 1.7;
      g.add(mast);

      // メインセール（前傾したパネル）
      const sail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.6, 1.9), mat(0xfaf6ee));
      sail.position.set(0.35, 1.35, 0);
      sail.rotation.x = 0.08;
      g.add(sail);

      // ジブセール（三角）
      const jib = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.6, 0.9), mat(0xf0ece4));
      jib.position.set(1.0, 1.0, 0);
      jib.rotation.z = -0.25;
      g.add(jib);

      g.position.set(bx, -0.15, bz);
      return g;
    }

    const boat1 = makeSailboat(-16, -2);
    const boat2 = makeSailboat(15,  10);
    boat1.rotation.y = -Math.PI / 2;
    boat2.rotation.y = -Math.PI / 2;
    scene.add(boat1);
    scene.add(boat2);

    /* ================================================================
       フェリー — ビートル型高速船（白×赤ストライプ）
    ================================================================ */
    (function() {
      const g = new THREE.Group();
      const RED  = mat(0xdd1122);
      const WHT  = mat(0xf8f8fa);
      const winM2 = new THREE.MeshPhongMaterial({ color: 0x3a7ec8, shininess: 100, emissive: 0x0a1e38, flatShading: true });

      // ── 船体 ──
      const hull = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.85, 3.0), WHT);
      hull.position.y = 0.0;
      g.add(hull);

      // 船首（先細りの三角錘）
      const bow = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 1.48, 2.4, 10), WHT);
      bow.rotation.z = Math.PI / 2;
      bow.position.set(5.6, 0.02, 0);
      g.add(bow);

      // 船体下部（濃い赤帯）
      [-1.52, 1.52].forEach(oz => {
        const s = new THREE.Mesh(new THREE.BoxGeometry(9.1, 0.28, 0.08), RED);
        s.position.set(-0.2, -0.12, oz);
        g.add(s);
      });

      // ── 第1デッキ ──
      const d1 = new THREE.Mesh(new THREE.BoxGeometry(8.0, 1.25, 2.85), WHT);
      d1.position.set(-0.4, 1.25, 0);
      g.add(d1);

      // 第1デッキ上下の赤ライン
      [-1.44, 1.44].forEach(oz => {
        [0.68, 1.80].forEach(py => {
          const s = new THREE.Mesh(new THREE.BoxGeometry(8.1, 0.20, 0.07), RED);
          s.position.set(-0.4, py, oz);
          g.add(s);
        });
      });

      // 第1デッキ窓（両側5個）
      for (let i = -2; i <= 2; i++) {
        [-1.46, 1.46].forEach(oz => {
          const w = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.55, 0.07), winM2);
          w.position.set(i * 1.28 - 0.4, 1.22, oz);
          g.add(w);
        });
      }

      // ── 第2デッキ ──
      const d2 = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.15, 2.70), WHT);
      d2.position.set(-0.6, 2.70, 0);
      g.add(d2);

      // 第2デッキ赤ライン
      [-1.37, 1.37].forEach(oz => {
        [2.17, 3.17].forEach(py => {
          const s = new THREE.Mesh(new THREE.BoxGeometry(7.1, 0.18, 0.07), RED);
          s.position.set(-0.6, py, oz);
          g.add(s);
        });
      });

      // 第2デッキ窓（両側4個）
      for (let i = -1; i <= 2; i++) {
        [-1.38, 1.38].forEach(oz => {
          const w = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.52, 0.07), winM2);
          w.position.set(i * 1.30 - 0.6, 2.68, oz);
          g.add(w);
        });
      }

      // ── ブリッジ（操舵室）──
      const br = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.05, 2.50), WHT);
      br.position.set(1.8, 4.10, 0);
      g.add(br);

      // ブリッジ前面窓（大型3枚）
      [-0.75, 0, 0.75].forEach(oz => {
        const w = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.08), winM2);
        w.position.set(3.22, 4.10, oz);
        g.add(w);
      });

      // ブリッジ天井赤帯
      const brTop = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.18, 2.6), RED);
      brTop.position.set(1.8, 4.68, 0);
      g.add(brTop);

      // ── 上部構造 ──
      const top = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.45, 2.0), WHT);
      top.position.set(0.2, 5.10, 0);
      g.add(top);

      // 上部の赤アクセント
      const topRed = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.36, 1.8), RED);
      topRed.position.set(1.4, 5.38, 0);
      g.add(topRed);

      // ── マスト（赤） ──
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 3.4, 8), RED);
      mast.position.set(0.2, 7.0, 0);
      g.add(mast);

      // レーダーアーム
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.07, 0.07), mat(0xcccccc));
      arm.position.set(0.2, 8.5, 0);
      g.add(arm);
      const radar = new THREE.Mesh(new THREE.SphereGeometry(0.19, 7, 5), mat(0xfafafa));
      radar.position.set(0.2, 8.72, 0);
      g.add(radar);

      // ── 水中翼（ハイドロフォイル）──
      [-3.6, 2.8].forEach(ox => {
        const strut = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.1, 0.12), mat(0xb0b8c4));
        strut.position.set(ox, -0.72, 0);
        g.add(strut);
        [-0.92, 0.92].forEach(oz => {
          const foil = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.88), mat(0xa8b0bc));
          foil.position.set(ox, -1.22, oz);
          g.add(foil);
        });
      });

      g.name = 'ferry';
      g.scale.setScalar(0.68);
      g.rotation.y = -Math.PI / 2;
      g.position.set(-2, -0.35, 4);
      scene.add(g);
      window._ferry = g;
    })();

    /* ================================================================
       灯台（対馬沖）
    ================================================================ */
    (function() {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.55, 3.5, 8), mat(0xf0ece4));
      body.position.y = 1.75;
      g.add(body);

      const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.40, 0.45, 8), mat(0xdd3322));
      stripe.position.y = 2.0;
      g.add(stripe);

      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.5, 8), mat(0xffee66));
      lamp.position.y = 3.75;
      g.add(lamp);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.6, 8), mat(0xcc2211));
      cap.position.y = 4.3;
      g.add(cap);

      g.position.set(5, -0.8, 12);
      scene.add(g);
    })();

    /* ================================================================
       福岡市街 — 高密度都市グリッド
    ================================================================ */
    (function() {

      /* ─── ヘルパー ─── */
      function ab(x, y, z, w, h, d, m) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
        mesh.position.set(x, y, z);
        scene.add(mesh);
      }

      // 位置ベース擬似乱数（決定論的）
      function cr(x, z, s) {
        const n = Math.sin(x * 12.9898 + z * 78.233 + (s || 0)) * 43758.5453;
        return n - Math.floor(n);
      }

      function lighten(hex, f) {
        const r = Math.min(255, ((hex >> 16) & 255) + f * 255);
        const g = Math.min(255, ((hex >>  8) & 255) + f * 255);
        const b = Math.min(255, ( hex        & 255) + f * 255);
        return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
      }

      /* ─── 道路マテリアル ─── */
      const rdM  = mat(0x18181f);
      const swM  = mat(0x383848);
      const lnM  = mat(0xd8d895);
      const mdM  = mat(0x1e3820);
      const winM = new THREE.MeshPhongMaterial({ color: 0x58a0d8, shininess: 95, emissive: 0x061828, flatShading: true });

      /* ─── 南北幹線 ─── */
      ab(0,    0.05, -56, 4.4,  0.10, 86, rdM);   // 大通り（6車線）
      ab(0,    0.09, -56, 0.55, 0.18, 86, mdM);   // 中央分離帯
      [-4.9,  4.9].forEach(x => ab(x, 0.05, -56, 2.4, 0.10, 86, rdM));  // サブ通り
      [-9.2,  9.2].forEach(x => ab(x, 0.05, -56, 1.6, 0.10, 86, rdM));  // 外周通り

      // 歩道
      [-3.35, 3.35, -6.25, 6.25, -10.15, 10.15].forEach(x => ab(x, 0.045, -56, 0.90, 0.09, 86, swM));

      /* ─── 東西クロス（4.5間隔）─── */
      for (let rz = -22; rz >= -89; rz -= 4.5) {
        ab(0, 0.05, rz, 28, 0.10, 2.5, rdM);
        // 横断歩道（3箇所）
        [-4.9, 0, 4.9].forEach(cx => {
          for (let s = -2; s <= 2; s++) ab(cx + s * 0.54, 0.057, rz, 0.36, 0.11, 2.0, lnM);
        });
      }

      /* ─── 車線破線 ─── */
      [[-1.15, 0.09], [1.15, 0.09], [-4.9, 0.09], [4.9, 0.09]].forEach(([lx, ly]) => {
        for (let dz = -23; dz >= -88; dz -= 3.4) {
          if (((dz + 1000) % 4.5) > 1.4) ab(lx, ly, dz, 0.09, 0.11, 1.4, lnM);
        }
      });

      /* ─── 中央分離帯ブロック（交差点間）─── */
      for (let tz = -24.25; tz >= -87; tz -= 4.5) {
        ab(0, 0.19, tz, 0.55, 0.10, 3.5, mat(0x1a4428));
      }

      /* ─── 街路樹 ─── */
      function sTree(x, z, h, r, c) {
        const g = new THREE.Group();
        const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, h * 0.38, 7), mat(0x4a3010));
        tr.position.y = h * 0.19;
        const lv = new THREE.Mesh(new THREE.SphereGeometry(r, 9, 7),
          new THREE.MeshPhongMaterial({ color: c, flatShading: true, shininess: 0 }));
        lv.position.y = h * 0.38 + r * 0.65;
        g.add(tr); g.add(lv);
        g.position.set(x, 0.11, z);
        scene.add(g);
      }
      // 中央分離帯
      for (let tz = -24.25; tz >= -86; tz -= 4.5) sTree(0, tz, 2.9, 0.52, 0x2a7838);
      // 大通り歩道
      [-4.0, 4.0].forEach(sx => { for (let tz = -23; tz >= -87; tz -= 4.5) sTree(sx, tz, 2.4, 0.40, 0x287030); });
      // サブ通り歩道
      [-7.0, 7.0].forEach(sx => { for (let tz = -25; tz >= -87; tz -= 6.0) sTree(sx, tz, 2.1, 0.34, 0x246028); });

      /* ─── 街灯 ─── */
      function lamp(x, z) {
        const g = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 3.9, 7), mat(0x8898a8));
        pole.position.y = 1.95;
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.06, 0.06), mat(0x8898a8));
        arm.position.set(0.39, 3.95, 0);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.19, 0.19),
          new THREE.MeshPhongMaterial({ color: 0xfffce0, emissive: 0x554420, shininess: 70 }));
        head.position.set(0.79, 3.86, 0);
        g.add(pole); g.add(arm); g.add(head);
        g.position.set(x, 0, z);
        scene.add(g);
      }
      [-2.1, 2.1].forEach(lx => { for (let tz = -26; tz >= -85; tz -= 9.0) lamp(lx, tz); });
      [-6.0, 6.0].forEach(lx => { for (let tz = -28; tz >= -85; tz -= 9.5) lamp(lx, tz); });

      /* ─── ビル生成 ─── */
      function building(x, z, w, d, h, wc) {
        const g = new THREE.Group();
        const rc = lighten(wc, 0.13);

        const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(wc));
        wall.position.y = h / 2;
        g.add(wall);

        // 窓帯（フロアライン、最大10段）
        if (h >= 3.5) {
          const fh = h < 6 ? 2.0 : h < 10 ? 1.7 : 1.5;
          const floors = Math.min(Math.floor(h / fh), 10);
          for (let f = 1; f < floors; f++) {
            const py = f * fh;
            [d/2+0.015, -d/2-0.015].forEach(oz => {
              const win = new THREE.Mesh(new THREE.BoxGeometry(w - 0.08, 0.65, 0.06), winM);
              win.position.set(0, py, oz);
              g.add(win);
            });
            [w/2+0.015, -w/2-0.015].forEach(ox => {
              const win = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, d - 0.08), winM);
              win.position.set(ox, py, 0);
              g.add(win);
            });
          }
        }

        // 屋上スラブ
        const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, 0.24, d + 0.14), mat(rc));
        roof.position.y = h + 0.12;
        g.add(roof);

        // アンテナ（高層のみ）
        if (h > 9) {
          const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, h * 0.13, 6), mat(0x909090));
          ant.position.set(w * 0.2, h + 0.5, 0);
          g.add(ant);
        }
        g.position.set(x, 0, z);
        scene.add(g);
      }

      // ポジウム付き大型ビル（基壇＋タワー）
      function podium(x, z, pw, pd, ph, tw, td, th, wc) {
        const g = new THREE.Group();
        const wcd = lighten(wc, 0.08);
        const rc  = lighten(wc, 0.16);

        const pod = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, pd), mat(wcd));
        pod.position.y = ph / 2;
        g.add(pod);

        const tow = new THREE.Mesh(new THREE.BoxGeometry(tw, th, td), mat(wc));
        tow.position.y = ph + th / 2;
        g.add(tow);

        // タワー窓
        const fh = 1.55, floors = Math.min(Math.floor(th / fh), 12);
        for (let f = 1; f < floors; f++) {
          const py = ph + f * fh;
          [td/2+0.015, -td/2-0.015].forEach(oz => {
            const win = new THREE.Mesh(new THREE.BoxGeometry(tw - 0.08, 0.68, 0.06), winM);
            win.position.set(0, py, oz);
            g.add(win);
          });
          [tw/2+0.015, -tw/2-0.015].forEach(ox => {
            const win = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.68, td - 0.08), winM);
            win.position.set(ox, py, 0);
            g.add(win);
          });
        }

        const roof = new THREE.Mesh(new THREE.BoxGeometry(tw + 0.14, 0.24, td + 0.14), mat(rc));
        roof.position.y = ph + th + 0.12;
        g.add(roof);

        if (ph + th > 12) {
          const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, (ph+th)*0.12, 6), mat(0x909090));
          ant.position.set(0, ph + th + 0.5, 0);
          g.add(ant);
        }

        g.position.set(x, 0, z);
        scene.add(g);
      }

      /* ─── プロシージャル都市ブロック ─── */
      const PALETTE = [
        0x3a5070, 0x485868, 0x304858, 0x506070,
        0x283848, 0x3e5468, 0x526474, 0x405878,
        0x4a5c70, 0x5a6880, 0x384c60, 0x6a7888
      ];

      function cityH(x, z) {
        const dz = Math.abs(z + 50);
        const core = Math.max(0, 1 - dz / 28);
        return Math.max(2.0, 2.2 + core * 3.5 + cr(x, z, 3) * (1.0 + core * 2.8));
      }
      function cityC(x, z) { return PALETTE[Math.floor(cr(x, z, 7) * PALETTE.length)]; }

      const BLOCKS = [
        // [x,  w,    d,   heightMult]
        [-2.75, 1.38, 3.6, 1.00],
        [ 2.75, 1.38, 3.6, 1.00],
        [-5.10, 1.55, 3.6, 0.92],
        [ 5.10, 1.55, 3.6, 0.92],
        [-7.30, 1.42, 3.2, 0.62],
        [ 7.30, 1.42, 3.2, 0.62],
      ];

      const Z_START = -24.25, Z_END = -85.75, Z_STEP = 4.5;

      BLOCKS.forEach(([bx, bw, bd, hm]) => {
        for (let bz = Z_START; bz >= Z_END; bz -= Z_STEP) {
          const h  = cityH(bx, bz) * hm;
          const wc = cityC(bx, bz);
          const xOff = (cr(bx, bz, 1) - 0.5) * 0.14;
          building(bx + xOff, bz, bw, bd, h, wc);
        }
      });

      // ポジウムビル（ダウンタウン中心部、ドーム・タワーより低く）
      podium( 2.75, -46.75, 2.0, 3.6, 2.0, 1.4, 3.2,  7.5, 0x2a3d58);
      podium(-2.75, -51.25, 2.2, 3.6, 2.2, 1.5, 3.4,  8.5, 0x243050);
      podium( 5.10, -42.25, 2.4, 3.6, 1.8, 1.6, 3.2,  6.5, 0x344a68);
      podium(-5.10, -55.75, 2.2, 3.6, 1.6, 1.5, 3.2,  6.0, 0x2e4458);
      podium( 2.75, -60.25, 1.8, 3.6, 1.6, 1.3, 3.0,  5.5, 0x3a5070);
      podium(-2.75, -37.75, 2.0, 3.6, 1.8, 1.4, 3.2,  7.0, 0x283848);

      // 角地の低層商業ビル（交差点沿い）
      const corners = [
        [-2.75, -22.5, 1.4, 1.2, 3.0, 0x6a7080],
        [ 2.75, -22.5, 1.4, 1.2, 3.5, 0x607080],
        [-5.10, -22.5, 1.5, 1.2, 2.8, 0x6a7888],
        [ 5.10, -22.5, 1.5, 1.2, 3.2, 0x708090],
        [-2.75, -85.5, 1.4, 1.2, 2.5, 0x5a6878],
        [ 2.75, -85.5, 1.4, 1.2, 2.8, 0x607080],
      ];
      corners.forEach(([x, z, w, d, h, wc]) => building(x, z, w, d, h, wc));

      /* ─── 外周ブロック（左右サイドを充填）─── */
      const OUTER = [
        [-9.80,  1.52, 3.0, 0.60],
        [ 9.80,  1.52, 3.0, 0.60],
        [-12.20, 1.38, 2.8, 0.42],
        [ 12.20, 1.38, 2.8, 0.42],
        [-15.00, 1.10, 2.4, 0.30],
        [ 15.00, 1.10, 2.4, 0.30],
      ];

      OUTER.forEach(([bx, bw, bd, hm]) => {
        for (let bz = -29.5; bz >= -82; bz -= 4.5) {
          // ドーム(x=-13,z=-62)とタワー(x=13,z=-53)の直近は空ける
          const nearDome  = bx < -10 && bz < -54 && bz > -70;
          const nearTower = bx >  10 && bz < -46 && bz > -62;
          if (nearDome || nearTower) continue;
          const h = cityH(bx, bz) * hm;
          building(bx + (cr(bx, bz, 9) - 0.5) * 0.12, bz, bw, bd, h, cityC(bx, bz));
        }
      });

      /* ─── ホークスタウン（ドーム隣の商業施設）─── */
      // 大型ショッピングモール棟
      building(-9.5, -57.0, 3.6, 5.5, 2.8, 0x8090a0);
      building(-9.5, -62.5, 3.2, 4.0, 2.2, 0x7a8a9a);
      // モール側面の低層棟
      building(-12.5, -56.5, 2.2, 3.0, 3.5, 0x70808e);
      building(-12.5, -67.5, 2.0, 3.0, 3.0, 0x6a7888);
      // シーホークホテル（ドーム西隣）
      podium(-9.5, -68.5, 3.2, 4.5, 1.5, 2.0, 3.8, 6.5, 0x3a5068);

      /* ─── ももちエリア（タワー周辺のウォーターフロント）─── */
      podium(10.0, -58.5, 2.8, 4.2, 1.5, 1.8, 3.5, 6.0, 0x344860);
      podium(13.5, -62.0, 2.5, 3.8, 1.4, 1.6, 3.2, 5.0, 0x2e4458);
      building(10.5, -50.0, 2.4, 3.8, 4.5, 0x485c74);
      building(13.5, -47.5, 2.2, 3.2, 3.5, 0x3e5268);
      building(12.0, -68.5, 2.6, 3.5, 4.5, 0x405878);
      // 海浜公園沿いの低層商業
      building(10.0, -44.5, 2.8, 3.0, 3.0, 0x607888);
      building(14.5, -56.0, 2.0, 3.0, 3.5, 0x506878);

    })();

    /* 福岡タワー */
    (function() {
      const g = new THREE.Group();

      const base = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.7, 3.0), mat(0xb0b8c0));
      base.position.set(0, 0.35, 0);
      g.add(base);

      // タワー本体（白銀色 ＝ 福岡タワーの鏡面ガラスを表現）
      // タワー本体（セグメント16で滑らか）
      [[0.60, 0.42, 5.5,  2.75],
       [0.42, 0.26, 5.0,  8.25],
       [0.26, 0.08, 4.0, 13.5]].forEach(([r0, r1, h, py]) => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, 16),
          new THREE.MeshPhongMaterial({ color: 0xe8eef2, flatShading: false, shininess: 60 }));
        m.position.y = py;
        g.add(m);
      });

      // タワー水平リング
      [5.4, 10.8, 15.2].forEach(py => {
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.18, 16), mat(0xb0c8d8));
        ring.position.y = py;
        g.add(ring);
      });

      // 展望台（水色アクセント）
      [7.2, 11.5].forEach(py => {
        const obs = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.6, 12), mat(0x4af0c0));
        obs.position.y = py;
        g.add(obs);
      });

      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 4.2, 8), mat(0xffd060));
      spike.position.y = 17.8;
      g.add(spike);

      g.position.set(13, 0, -53);
      scene.add(g);
    })();

    /* ペイペイドーム */
    (function() {
      const g = new THREE.Group();

      // スタジアム外周壁
      const outerWall = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 6.6, 2.8, 32), mat(0xa8b0b8));
      outerWall.position.y = 1.4;
      g.add(outerWall);

      // 外壁の水平帯（構造スパン）
      [0.7, 1.5, 2.4].forEach(py => {
        const band = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, 0.2, 32), mat(0x888fa0));
        band.position.y = py;
        g.add(band);
      });

      // ドーム本体（高解像度・なめらか）
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(6.0, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.52),
        new THREE.MeshPhongMaterial({ color: 0xdde8ef, flatShading: false, shininess: 55, specular: 0x557799 })
      );
      dome.position.y = 2.8;
      g.add(dome);

      // 構造リブ（24本）
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5.2, 0.1), mat(0xb0bec8));
        rib.position.set(Math.cos(angle) * 4.8, 5.5, Math.sin(angle) * 4.8);
        rib.lookAt(0, 5.5, 0);
        g.add(rib);
      }

      // 水平リング（3段）
      [[5.6, 5.5], [4.0, 7.5], [1.8, 8.8]].forEach(([r, py]) => {
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.18, 32), mat(0xa0b0bc));
        ring.position.y = py;
        g.add(ring);
      });

      // 頂部キャップ
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.6, 1.2, 16), mat(0xc8d8e0));
      cap.position.y = 9.0;
      g.add(cap);

      g.position.set(-13, 0, -62);
      scene.add(g);
    })();

    /* ================================================================
       対馬エリア — 木 + 岩 + ヤマネコ看板
    ================================================================ */
    function makeTree(x, z, scale) {
      const g = new THREE.Group();

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.78, 5), mat(0x5c3d1a));
      trunk.position.y = 0.39;
      g.add(trunk);

      [[0x1a5c28, 0.68, 1.38, 1.25],
       [0x246e32, 0.50, 1.12, 1.92],
       [0x2e8040, 0.32, 0.84, 2.48]].forEach(([c, r, h, py]) => {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), mat(c));
        leaf.position.y = py;
        g.add(leaf);
      });

      g.scale.setScalar(scale);
      g.position.set(x, terrY(x, z) + 0.05, z);
      g.rotation.y = Math.random() * Math.PI * 2;
      return g;
    }

    [[-6,55,1.1],[-4,62,0.92],[-8.5,48,1.30],[5.5,58,1.05],
     [7.5,65,1.20],[3.0,45,0.85],[-5.5,70,1.02],[6.0,52,1.15],
     [-9.0,60,0.98],[4.5,72,1.08],[8.2,42,0.90],[-7.0,75,1.12],
     [-3.0,67,0.82],[9.0,68,1.18],[-10,50,1.00],[2.5,78,0.95],
    ].forEach(([x,z,s]) => scene.add(makeTree(x, z, s)));

    [[-7.5,72,1.2],[8.2,48,0.9],[-4,78,1.4],[6.5,76,0.85],[-9,42,1.1]].forEach(([x,z,s]) => {
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.44 * s, 0), mat(0x7a6a56));
      rock.position.set(x, terrY(x, z) + 0.15, z);
      rock.rotation.set(Math.random()*2, Math.random()*2, Math.random()*2);
      scene.add(rock);
    });

    /* ================================================================
       対馬の民家
    ================================================================ */
    function makeHouse(x, z, scale, ry) {
      const g = new THREE.Group();

      // 白壁
      const walls = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.9, 2.2), mat(0xe2d8c4));
      walls.position.y = 0.95;
      g.add(walls);

      // 縁側（木製デッキ）
      const engawa = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.18, 0.65), mat(0xb8884a));
      engawa.position.set(0, 0.09, 1.42);
      g.add(engawa);

      // 玄関ドア
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.0, 0.12), mat(0x6a4020));
      door.position.set(0, 0.5, 1.16);
      g.add(door);

      // 窓×2
      [-0.8, 0.8].forEach(wx => {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.1),
          new THREE.MeshPhongMaterial({ color: 0x88c0d8, flatShading: true, shininess: 40, emissive: 0x112233 }));
        win.position.set(wx, 1.2, 1.16);
        g.add(win);
      });

      // 屋根（四角錐 = 日本瓦ヒップルーフ）
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.95, 1.3, 4), mat(0x242030));
      roof.position.y = 2.55;
      roof.rotation.y = Math.PI / 4;
      g.add(roof);

      // 煙突
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.3), mat(0x5a5055));
      chimney.position.set(0.6, 3.1, 0.2);
      g.add(chimney);

      g.scale.setScalar(scale);
      g.position.set(x, terrY(x, z) + 0.04, z);
      g.rotation.y = ry;
      return g;
    }

    [
      [-11, 62, 1.00, 0.3],
      [ -6, 73, 0.90, 1.8],
      [  8, 56, 1.05, 2.5],
      [  5, 68, 0.85, 0.9],
      [-13, 50, 0.95, 3.2],
      [ 11, 75, 1.00, 1.4],
    ].forEach(([x, z, s, r]) => scene.add(makeHouse(x, z, s, r)));

    /* ================================================================
       夢のゴール — 図書館エンジニアカフェ（スクロール最後に出現）
    ================================================================ */
    (function makeDreamCafe() {
      const g = new THREE.Group();

      // ---- 敷地グラウンド ----
      const ground = new THREE.Mesh(new THREE.BoxGeometry(46, 0.15, 38), mat(0x607060));
      ground.position.set(0, -0.08, 0);
      g.add(ground);

      // アプローチ通路
      const path = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.12, 20), mat(0x909898));
      path.position.set(0, 0.06, 14);
      g.add(path);

      // ---- 図書館本棟 ----
      // 基礎
      const base = new THREE.Mesh(new THREE.BoxGeometry(20, 0.5, 10), mat(0xa0a8a0));
      base.position.set(-2, 0.25, -2);
      g.add(base);

      // 外壁（温かみのある木・石混合）
      const mainBody = new THREE.Mesh(new THREE.BoxGeometry(18, 5.5, 9), mat(0xc8b890));
      mainBody.position.set(-2, 3.25, -2);
      g.add(mainBody);

      // 本棚をイメージした横ストライプ
      for (let i = 0; i < 6; i++) {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(18.2, 0.18, 9.2), mat(0xa89870));
        shelf.position.set(-2, 0.9 + i * 0.85, -2);
        g.add(shelf);
      }

      // 正面の大きな窓（図書館らしい）
      for (let i = 0; i < 5; i++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.0, 0.12),
          new THREE.MeshPhongMaterial({ color: 0x70b0d8, flatShading: true, shininess: 60, emissive: 0x1a3a55, transparent: true, opacity: 0.85 }));
        win.position.set(-9 + i * 3.8, 2.5, 2.55);
        g.add(win);
      }

      // 屋根（フラット＋パラペット）
      const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(18.6, 0.45, 9.6), mat(0x888890));
      roofSlab.position.set(-2, 6.22, -2);
      g.add(roofSlab);

      // 屋上の緑化（芝生帯）
      const roofGarden = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 5), mat(0x3a7a42));
      roofGarden.position.set(-2, 6.5, -2);
      g.add(roofGarden);

      // ---- エンジニアカフェ棟（ガラス箱） ----
      const cafeBody = new THREE.Mesh(new THREE.BoxGeometry(8, 4.5, 9),
        new THREE.MeshPhongMaterial({ color: 0x5888b0, flatShading: true, shininess: 60, emissive: 0x102030, transparent: true, opacity: 0.80 }));
      cafeBody.position.set(11, 2.75, -2);
      g.add(cafeBody);

      const cafeRoof = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.35, 9.4), mat(0x607080));
      cafeRoof.position.set(11, 5.17, -2);
      g.add(cafeRoof);

      // カフェの暖かい内部光
      const cafeGlow = new THREE.PointLight(0xffd080, 4.0, 18);
      cafeGlow.position.set(11, 3.0, -2);
      g.add(cafeGlow);

      // ---- テラス（屋外席） ----
      const terrace = new THREE.Mesh(new THREE.BoxGeometry(10, 0.18, 7), mat(0xb0a888));
      terrace.position.set(11, 0.09, 6.5);
      g.add(terrace);

      // パラソル付きテーブル×4
      [[-1.5, 5.5], [1.5, 5.5], [-1.5, 8.0], [1.5, 8.0]].forEach(([tx, tz]) => {
        // テーブル
        const tbl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.1, 8), mat(0xc8a860));
        tbl.position.set(tx + 11, 0.75, tz);
        g.add(tbl);
        // 脚
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 5), mat(0x888070));
        leg.position.set(tx + 11, 0.38, tz);
        g.add(leg);
        // パラソル
        const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.6, 8), mat(0xe87040));
        umbrella.position.set(tx + 11, 1.8, tz);
        g.add(umbrella);
        const umPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 5), mat(0xa08060));
        umPole.position.set(tx + 11, 1.05, tz);
        g.add(umPole);
      });

      // ---- 庭の木（丸い葉、カフェらしい） ----
      [[-14, 4], [-10, 6], [-6, 5], [6, 7], [14, 6], [16, 3], [-14, -4], [14, -4]].forEach(([tx, tz]) => {
        const tg = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.4, 6), mat(0x6a4820));
        trunk.position.y = 0.7;
        const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.2, 7, 5),
          new THREE.MeshPhongMaterial({ color: 0x2e8240, flatShading: true, shininess: 0 }));
        leaves.position.y = 2.1;
        tg.add(trunk); tg.add(leaves);
        tg.position.set(tx, 0, tz);
        g.add(tg);
      });

      // ---- 看板 ----
      const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.0, 5), mat(0x5c3d1a));
      signPost.position.set(0, 2.0, 10.5);
      g.add(signPost);

      // 看板テクスチャ（canvasで「まなびより」を描画）
      const signCanvas = document.createElement('canvas');
      signCanvas.width = 512; signCanvas.height = 96;
      const sCtx = signCanvas.getContext('2d');
      sCtx.fillStyle = '#1a3a8a';
      sCtx.fillRect(0, 0, 512, 96);
      sCtx.fillStyle = '#4af0c0';
      sCtx.fillRect(0, 86, 512, 10);
      sCtx.fillStyle = '#ffffff';
      sCtx.font = 'bold 54px sans-serif';
      sCtx.textAlign = 'center';
      sCtx.textBaseline = 'middle';
      sCtx.fillText('まなびより', 256, 44);
      const signTex = new THREE.CanvasTexture(signCanvas);

      const signBoard = new THREE.Mesh(new THREE.BoxGeometry(9, 1.4, 0.18),
        new THREE.MeshPhongMaterial({ map: signTex, shininess: 20, emissive: 0x0a1a50, emissiveIntensity: 0.3 }));
      signBoard.position.set(0, 4.2, 10.5);
      g.add(signBoard);

      // 看板の装飾ライン
      const signLine = new THREE.Mesh(new THREE.BoxGeometry(9.1, 0.12, 0.2),
        new THREE.MeshPhongMaterial({ color: 0x4af0c0, flatShading: true, shininess: 30, emissive: 0x1a6050 }));
      signLine.position.set(0, 3.54, 10.5);
      g.add(signLine);

      // ---- 周辺のストリートライト ----
      [[-8, 12], [8, 12], [-8, -8], [8, -8]].forEach(([lx, lz]) => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.5, 5), mat(0x708090));
        pole.position.set(lx, 2.25, lz);
        g.add(pole);
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 4),
          new THREE.MeshPhongMaterial({ color: 0xfff0b0, emissive: 0xaa8820, shininess: 60 }));
        lamp.position.set(lx, 4.6, lz);
        g.add(lamp);
        const light = new THREE.PointLight(0xffd060, 1.5, 10);
        light.position.set(lx, 4.5, lz);
        g.add(light);
      });

      // 夢エリアの全体ライト
      const dreamLight = new THREE.PointLight(0xffeedd, 3.0, 55);
      dreamLight.position.set(0, 15, 0);
      g.add(dreamLight);

      g.position.set(0, 0, -108);
      scene.add(g);
    })();

    /* ヤマネコ看板 */
    (function() {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.8, 5), mat(0x5c3d1a));
      pole.position.y = 1.9;
      g.add(pole);
      const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 0.14), mat(0x2a7a5e));
      board.position.y = 3.55;
      g.add(board);
      [-0.55, 0.55].forEach(ex => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.5, 3), mat(0x3a9a72));
        ear.position.set(ex, 4.18, 0);
        g.add(ear);
      });
      g.position.set(-9, terrY(-9, 58) + 0.05, 58);
      scene.add(g);
    })();

    /* FIT看板 */
    (function() {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.2, 5), mat(0x5c3d1a));
      pole.position.y = 1.6;
      g.add(pole);
      const board = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.1, 0.14), mat(0x1a3a8a));
      board.position.y = 3.2;
      g.add(board);
      const accent = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.15, 0.16), mat(0x4af0c0));
      accent.position.y = 2.72;
      g.add(accent);
      g.position.set(-9, 0, -67);
      scene.add(g);
    })();

    /* ================================================================
       カメラ & スクロール
    ================================================================ */
    const CAM_Z_START = 74, CAM_Z_END = -74;
    const CAM_Y_START = 9.0, CAM_Y_END  = 6.0;

    let scrollFraction = 0;
    let targetCamZ = CAM_Z_START;
    let targetCamY = CAM_Y_START;

    const locTsushima = document.getElementById('loc-tsushima');
    const locFukuoka  = document.getElementById('loc-fukuoka');

    window.addEventListener('scroll', () => {
      scrollFraction = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      targetCamZ = CAM_Z_START + scrollFraction * (CAM_Z_END - CAM_Z_START);
      targetCamY = CAM_Y_START + scrollFraction * (CAM_Y_END - CAM_Y_START);

      if (scrollFraction > 0.55) {
        const t = (scrollFraction - 0.55) / 0.45;
        sun.color.setRGB(1.0, 0.82 + t * 0.06, 0.56 - t * 0.18);
        cityLight.intensity = 2.5 + t * 2.5;
      }

      if (locTsushima) {
        if      (scrollFraction < 0.22) locTsushima.style.opacity = String(Math.min(1, scrollFraction / 0.08));
        else if (scrollFraction < 0.34) locTsushima.style.opacity = String(Math.max(0, 1 - (scrollFraction - 0.22) / 0.12));
        else                             locTsushima.style.opacity = '0';
      }
      if (locFukuoka) {
        if      (scrollFraction > 0.85) locFukuoka.style.opacity = '1';
        else if (scrollFraction > 0.74) locFukuoka.style.opacity = String((scrollFraction - 0.74) / 0.11);
        else                             locFukuoka.style.opacity = '0';
      }
    });

    camera.position.set(0, CAM_Y_START, CAM_Z_START);

    /* ================================================================
       アニメーションループ
    ================================================================ */
    let time = 0;

    function animate() {
      requestAnimationFrame(animate);
      time += 0.007;

      // 海面の波
      for (let i = 0; i < sPos.count; i++) {
        const bx = seaBase[i * 3];
        const bz = seaBase[i * 3 + 2];
        const wave = Math.sin(bx * 0.45 + bz * 0.38 + time * 2.0) * 0.40
                   + Math.sin(bx * 0.28 - bz * 0.55 + time * 1.5) * 0.20;
        sPos.setY(i, seaBase[i * 3 + 1] + wave);
      }
      sPos.needsUpdate = true;
      seaGeo.computeVertexNormals();

      // 帆船のゆれ
      boat1.position.y = -0.15 + Math.sin(time * 1.1) * 0.15;
      boat1.rotation.z = Math.sin(time * 0.9) * 0.05;
      boat2.position.y = -0.15 + Math.sin(time * 0.85 + 1.2) * 0.15;
      boat2.rotation.z = Math.sin(time * 1.1 + 0.5) * 0.05;

      // フェリーのゆれ
      if (window._ferry) {
        window._ferry.position.y = -0.35 + Math.sin(time * 0.65) * 0.10;
        window._ferry.rotation.z = Math.sin(time * 0.55) * 0.015;
      }

      // カメラ追従
      camera.position.z += (targetCamZ - camera.position.z) * 0.05;
      camera.position.y += (targetCamY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, camera.position.z - 22);

      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
      camera.aspect = cvW() / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(cvW(), window.innerHeight);
    });

  } catch (e) {
    console.error('Three.js 初期化エラー:', e);
  }
})();

/* ===== GSAP ScrollTrigger Animations ===== */
gsap.registerPlugin(ScrollTrigger);

gsap.utils.toArray('.section').forEach((section) => {
  gsap.fromTo(section.querySelector('.section-title') || section,
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 1,
      scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none none' } }
  );
});

ScrollTrigger.create({
  trigger: '#journey', start: 'top 60%',
  onEnter: () => document.querySelectorAll('.map-point').forEach((p, i) =>
    setTimeout(() => p.classList.add('active'), i * 600))
});

ScrollTrigger.create({
  trigger: '#skills', start: 'top 60%',
  onEnter: () => document.querySelectorAll('.skill-fill').forEach(b => b.style.width = b.dataset.width + '%')
});

gsap.fromTo('.about-text p', { opacity: 0, x: -30 },
  { opacity: 1, x: 0, stagger: 0.15, duration: 0.8, scrollTrigger: { trigger: '#about', start: 'top 60%' } });

gsap.fromTo('.meta-item', { opacity: 0, x: 30 },
  { opacity: 1, x: 0, stagger: 0.1, duration: 0.6, scrollTrigger: { trigger: '#about', start: 'top 60%' } });

gsap.fromTo('.skill-card', { opacity: 0, y: 30 },
  { opacity: 1, y: 0, stagger: 0.08, duration: 0.6, scrollTrigger: { trigger: '#skills', start: 'top 65%' } });

gsap.fromTo('.work-card', { opacity: 0, y: 40 },
  { opacity: 1, y: 0, stagger: 0.12, duration: 0.7, scrollTrigger: { trigger: '#works', start: 'top 65%' } });

gsap.fromTo('.dream-icon', { opacity: 0, scale: 0.5, rotation: -10 },
  { opacity: 1, scale: 1, rotation: 0, duration: 1, scrollTrigger: { trigger: '#dream', start: 'top 65%' } });

gsap.fromTo('.dream-title, .dream-text', { opacity: 0, y: 20 },
  { opacity: 1, y: 0, stagger: 0.2, duration: 0.8, scrollTrigger: { trigger: '#dream', start: 'top 65%' } });

gsap.fromTo('.contact-card', { opacity: 0, y: 30 },
  { opacity: 1, y: 0, stagger: 0.15, duration: 0.7, scrollTrigger: { trigger: '#contact', start: 'top 70%' } });
