/* =============================================================
   Interlake ICSC — motion & 3D
   - Scroll reveals (with hard failsafe)
   - Count-up stats
   - 3D tilt on cards
   - Three.js floating citizenship objects (hero centerpiece)
   All effects are opt-out under prefers-reduced-motion and degrade
   gracefully when WebGL / IntersectionObserver are unavailable.
   ============================================================= */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var REVEAL_SEL =
    ".section-title, .section-lead, .card, .steps li, .review, " +
    ".stats-band .stat, #signup .signup-form, #contact .contact-grid > *";

  /* ---------- 1. Scroll reveal ---------- */
  (function reveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll(REVEAL_SEL));
    if (!els.length) return;
    function showAll() { els.forEach(function (el) { el.classList.add("in"); }); }

    if (reduced || !("IntersectionObserver" in window)) { showAll(); return; }

    // stagger siblings so grids cascade in
    els.forEach(function (el) {
      var sibs = Array.prototype.slice.call(el.parentElement.children).filter(function (c) {
        return els.indexOf(c) !== -1;
      });
      var i = sibs.indexOf(el);
      el.style.transitionDelay = Math.min(i, 6) * 80 + "ms";
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });

    // absolute failsafe: never leave content hidden
    setTimeout(showAll, 4000);
  })();

  /* ---------- 2. Count-up stats ---------- */
  (function counters() {
    var nums = Array.prototype.slice.call(document.querySelectorAll(".stat-num [data-count]"));
    if (!nums.length) return;

    function run(el) {
      var target = +el.getAttribute("data-count"), dur = 1500, t0 = performance.now();
      (function step(t) {
        var p = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = Math.round(target * e);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }

    if (reduced || !("IntersectionObserver" in window)) {
      nums.forEach(function (n) { n.textContent = n.getAttribute("data-count"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { io.observe(n); });
  })();

  /* ---------- 3. 3D tilt on cards ---------- */
  (function tilt() {
    if (reduced) return;
    if (!window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    var els = document.querySelectorAll(".card, .review, .steps li");
    var MAX = 8;
    els.forEach(function (el) {
      el.addEventListener("mousemove", function (ev) {
        var r = el.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width - 0.5;
        var py = (ev.clientY - r.top) / r.height - 0.5;
        el.style.transition = "transform .08s linear";
        el.style.transform =
          "perspective(820px) rotateX(" + (-py * MAX).toFixed(2) + "deg) rotateY(" +
          (px * MAX).toFixed(2) + "deg) translateZ(6px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transition = "transform .5s cubic-bezier(.2,.7,.2,1)";
        el.style.transform = "";
      });
    });
  })();

  /* ---------- 4. Three.js floating citizenship objects ---------- */
  (function scene() {
    if (reduced) return;                        // fallback coverage card stays visible
    var THREE = window.THREE;
    var host = document.getElementById("hero3d");
    if (!THREE || !host) return;
    var canvas = host.querySelector(".hero-canvas");
    if (!canvas) return;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (err) { return; }                   // no WebGL -> fallback card stays

    var small = window.innerWidth < 700;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);

    host.classList.add("webgl-on");             // hide fallback, show canvas

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    scene.add(new THREE.AmbientLight(0xfff4d6, 0.75));
    var key = new THREE.DirectionalLight(0xffffff, 0.95); key.position.set(5, 6, 7); scene.add(key);
    var fill = new THREE.DirectionalLight(0x9db8ff, 0.4); fill.position.set(-6, -2, 4); scene.add(fill);

    var NAVY = 0x14306a, GOLD = 0xf5c542, PAPER = 0xfffef7, STONE = 0xf1f3f9;

    function starShape(outer, inner, points) {
      var s = new THREE.Shape(), step = Math.PI / points;
      for (var i = 0; i < 2 * points; i++) {
        var r = (i % 2) ? inner : outer, a = i * step - Math.PI / 2;
        var x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
      }
      s.closePath(); return s;
    }
    function goldMat() { return new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.45, roughness: 0.32 }); }

    function makeStar() {
      var geo = new THREE.ExtrudeGeometry(starShape(0.7, 0.3, 5),
        { depth: 0.28, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2 });
      geo.center();
      return new THREE.Mesh(geo, goldMat());
    }
    function makeBook() {
      var g = new THREE.Group();
      var page = new THREE.MeshStandardMaterial({ color: PAPER, roughness: 0.85 });
      var cover = new THREE.MeshStandardMaterial({ color: NAVY, roughness: 0.5, metalness: 0.12 });
      var lp = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.06, 1.35), page);
      var rp = lp.clone();
      lp.position.set(-0.56, 0, 0); lp.rotation.z = 0.20;
      rp.position.set(0.56, 0, 0); rp.rotation.z = -0.20;
      var lc = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.06, 1.5), cover);
      var rc = lc.clone();
      lc.position.set(-0.58, -0.10, 0); lc.rotation.z = 0.20;
      rc.position.set(0.58, -0.10, 0); rc.rotation.z = -0.20;
      g.add(lc, rc, lp, rp);
      return g;
    }
    function makePassport() {
      var g = new THREE.Group();
      var body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.35, 0.16),
        new THREE.MeshStandardMaterial({ color: 0x0f2350, roughness: 0.5, metalness: 0.2 }));
      g.add(body);
      var em = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(0.17, 0.075, 5),
        { depth: 0.05, bevelEnabled: false }), goldMat());
      em.position.set(0, 0.26, 0.09);
      g.add(em);
      var lineMat = goldMat();
      for (var i = 0; i < 2; i++) {
        var ln = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.055, 0.02), lineMat);
        ln.position.set(0, -0.22 - i * 0.2, 0.09);
        g.add(ln);
      }
      return g;
    }
    function makeDome() {
      var g = new THREE.Group();
      var stone = new THREE.MeshStandardMaterial({ color: STONE, roughness: 0.65 });
      var base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.34, 26), stone); base.position.y = -0.42;
      var drum = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.52, 0.36, 26), stone); drum.position.y = -0.1;
      var dome = new THREE.Mesh(new THREE.SphereGeometry(0.46, 26, 16, 0, Math.PI * 2, 0, Math.PI / 2), stone); dome.position.y = 0.08;
      var spire = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.26, 14), goldMat()); spire.position.y = 0.5;
      g.add(base, drum, dome, spire);
      // simple column ring
      var colMat = stone;
      for (var i = 0; i < 8; i++) {
        var a = (i / 8) * Math.PI * 2;
        var col = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), colMat);
        col.position.set(Math.cos(a) * 0.5, -0.1, Math.sin(a) * 0.5);
        g.add(col);
      }
      return g;
    }
    function makeSparkle() {
      return new THREE.Mesh(new THREE.TetrahedronGeometry(0.12), goldMat());
    }

    var group = new THREE.Group();
    scene.add(group);

    function place(obj, x, y, z, scale) {
      obj.position.set(x, y, z);
      if (scale) obj.scale.setScalar(scale);
      obj.userData = {
        baseY: y,
        rx: (Math.random() - 0.5) * 0.006,
        ry: 0.004 + Math.random() * 0.006,
        amp: 0.12 + Math.random() * 0.14,
        phase: Math.random() * Math.PI * 2,
        spd: 0.6 + Math.random() * 0.5
      };
      group.add(obj);
    }

    var star = makeStar();
    place(star, 0, 0.35, 0.2, 1.0);
    place(makeBook(), -1.55, -1.35, -0.2, 1.0);
    place(makePassport(), 1.55, -0.15, -0.5, 0.95);
    place(makeDome(), 0.15, 1.95, -0.9, 0.92);

    var sparkleCount = small ? 4 : 7;
    for (var i = 0; i < sparkleCount; i++) {
      var sp = makeSparkle();
      place(sp,
        (Math.random() - 0.5) * 4.6,
        (Math.random() - 0.5) * 4.6,
        (Math.random() - 0.5) * 1.5 - 0.3,
        0.6 + Math.random() * 0.8);
    }

    // pointer parallax
    var pointerX = 0, pointerY = 0, spinY = 0, extraY = 0, tiltX = 0;
    window.addEventListener("mousemove", function (e) {
      pointerX = (e.clientX / window.innerWidth) - 0.5;
      pointerY = (e.clientY / window.innerHeight) - 0.5;
    }, { passive: true });

    function resize() {
      var w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    // only render while visible
    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (ents) {
        visible = ents[0].isIntersecting;
        if (visible) tick();
      }, { threshold: 0.01 }).observe(host);
    }

    var clock = new THREE.Clock();
    var running = false;
    function tick() {
      if (running) return;
      running = true;
      (function loop() {
        if (!visible) { running = false; return; }
        var dt = Math.min(clock.getDelta(), 0.05);
        var t = clock.elapsedTime;
        group.children.forEach(function (o) {
          var u = o.userData;
          o.rotation.x += u.rx; o.rotation.y += u.ry;
          o.position.y = u.baseY + Math.sin(t * u.spd + u.phase) * u.amp;
        });
        spinY += dt * 0.16;
        extraY += ((pointerX * 0.5) - extraY) * 0.05;
        tiltX += ((pointerY * 0.45) - tiltX) * 0.05;
        group.rotation.y = spinY + extraY;
        group.rotation.x = tiltX;
        renderer.render(scene, camera);
        requestAnimationFrame(loop);
      })();
    }
    tick();
  })();
})();

/* =============================================================
   3D White House fly-in (replaces the flat video scrub)
   Camera dollies from far outside, between the columns, through
   the front door, into a warm interior as you scroll. Falls back
   to a static poster image when WebGL/desktop/motion isn't available.
   ============================================================= */
(function whiteHouseScrub() {
  "use strict";
  var THREE = window.THREE;
  var section = document.getElementById("scrub");
  if (!section) return;
  var sticky = section.querySelector(".scrub-sticky");
  var canvas = section.querySelector(".scrub-canvas");
  var beats  = Array.prototype.slice.call(section.querySelectorAll(".scrub-beat"));
  var cta    = section.querySelector(".scrub-cta");
  var bar    = section.querySelector(".scrub-progress span");
  var hint   = section.querySelector(".scrub-hint");
  var N = beats.length;

  var desktop = window.matchMedia("(min-width: 761px)");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function beatOpacity(i, p) {
    var c = (i + 0.5) / N, w = 0.62 / N;
    if (i === 0 && p <= c) return 1;
    if (i === N - 1 && p >= c) return 1;
    return Math.max(0, 1 - Math.abs(p - c) / w);
  }
  function paintCaptions(p) {
    for (var i = 0; i < N; i++) {
      var o = beatOpacity(i, p);
      beats[i].style.opacity = o.toFixed(3);
      beats[i].style.transform = "translate(-50%, calc(-50% + " + ((1 - o) * 18).toFixed(1) + "px))";
    }
    var last = beatOpacity(N - 1, p);
    if (cta) { cta.style.opacity = last.toFixed(3); cta.classList.toggle("is-on", last > 0.6); }
    if (bar) bar.style.width = (p * 100).toFixed(2) + "%";
    if (hint) hint.style.opacity = p > 0.03 ? "0" : "1";
  }
  function computeProgress() {
    var rect = section.getBoundingClientRect();
    var dist = rect.height - window.innerHeight;
    if (dist <= 0) return 0;
    return Math.min(1, Math.max(0, -rect.top / dist));
  }

  var canGL = (function () {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) { return false; }
  })();

  // Not eligible -> leave the static poster + first caption (no pin)
  if (!THREE || !canGL || !desktop.matches || reduced.matches) return;

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); }
  catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  section.classList.add("is-live");

  var SKY = 0xbfe0f5;
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, 16, 48);

  var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 220);

  scene.add(new THREE.AmbientLight(0xffffff, 0.62));
  var sun = new THREE.DirectionalLight(0xfff1d6, 1.05); sun.position.set(-8, 13, 10); scene.add(sun);
  var warm = new THREE.PointLight(0xffd39a, 1.3, 22); warm.position.set(0, 2, -3.5); scene.add(warm);

  var wallMat  = new THREE.MeshStandardMaterial({ color: 0xf4f2ea, roughness: 0.92 });
  var roofMat  = new THREE.MeshStandardMaterial({ color: 0xd9d6cc, roughness: 0.9 });
  var winMat   = new THREE.MeshStandardMaterial({ color: 0x24304d, roughness: 0.35, metalness: 0.25 });
  var goldMat  = new THREE.MeshStandardMaterial({ color: 0xf5c542, metalness: 0.4, roughness: 0.35 });
  var lawnMat  = new THREE.MeshStandardMaterial({ color: 0x6ea24a, roughness: 1 });
  var floorMat = new THREE.MeshStandardMaterial({ color: 0x8a5a34, roughness: 0.85, side: THREE.DoubleSide });
  var trimMat  = new THREE.MeshStandardMaterial({ color: 0x2b3550, roughness: 0.5 });
  // interior surfaces are double-sided so the room encloses the camera when it flies in
  var inMat    = new THREE.MeshStandardMaterial({ color: 0xece3d2, roughness: 0.9, side: THREE.DoubleSide });

  var house = new THREE.Group(); scene.add(house);
  function box(w, h, d, mat, x, y, z) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); house.add(m); return m;
  }

  // lawn
  var lawn = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), lawnMat);
  lawn.rotation.x = -Math.PI / 2; scene.add(lawn);

  // interior room (behind the front face, z < 0) — double-sided so it encloses the camera
  box(10, 3.4, 0.2, inMat, 0, 1.7, -6);       // back wall
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.02, -3); scene.add(floor);
  box(0.2, 3.4, 6, inMat, -5, 1.7, -3);       // left inner wall
  box(0.2, 3.4, 6, inMat, 5, 1.7, -3);        // right inner wall
  box(10, 0.2, 6, inMat, 0, 3.4, -3);          // ceiling

  // gold star emblem on interior back wall
  (function () {
    var s = new THREE.Shape(), pts = 5, step = Math.PI / pts;
    for (var i = 0; i < 2 * pts; i++) {
      var r = i % 2 ? 0.22 : 0.5, a = i * step - Math.PI / 2;
      var x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i) s.lineTo(x, y); else s.moveTo(x, y);
    }
    s.closePath();
    var em = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false }), goldMat);
    em.position.set(0, 1.95, -5.85); house.add(em);
  })();

  // front face in pieces, leaving a central doorway gap (x -1.15..1.15, y 0..2.2)
  box(3.8, 3.4, 0.3, wallMat, -3.05, 1.7, 0);
  box(3.8, 3.4, 0.3, wallMat,  3.05, 1.7, 0);
  box(2.3, 1.2, 0.3, wallMat,  0, 2.8, 0);     // lintel above door
  box(0.16, 2.2, 0.34, trimMat, -1.2, 1.1, 0); // left jamb
  box(0.16, 2.2, 0.34, trimMat,  1.2, 1.1, 0); // right jamb

  // side wings
  box(4, 2.2, 3, wallMat, -7.2, 1.1, -1.5);
  box(4, 2.2, 3, wallMat,  7.2, 1.1, -1.5);
  box(4.2, 0.25, 3.2, roofMat, -7.2, 2.32, -1.5);
  box(4.2, 0.25, 3.2, roofMat,  7.2, 2.32, -1.5);

  // main roof
  box(10.2, 0.3, 6.2, roofMat, 0, 3.55, -3);

  // portico columns (front, z = 1.4); center gap aligns with the door
  [-4, -2.4, -1.4, 1.4, 2.4, 4].forEach(function (x) {
    var c = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 3.0, 16), wallMat);
    c.position.set(x, 1.5, 1.4); house.add(c);
    box(0.72, 0.18, 0.72, wallMat, x, 3.05, 1.4); // capital
    box(0.72, 0.18, 0.72, wallMat, x, 0.05, 1.4); // base
  });
  box(9.2, 0.5, 0.9, wallMat, 0, 3.35, 1.4);       // entablature

  // pediment (triangle)
  (function () {
    var t = new THREE.Shape();
    t.moveTo(-4.6, 0); t.lineTo(4.6, 0); t.lineTo(0, 1.6); t.closePath();
    var ped = new THREE.Mesh(new THREE.ExtrudeGeometry(t, { depth: 0.9, bevelEnabled: false }), wallMat);
    ped.position.set(0, 3.6, 0.95); house.add(ped);
  })();

  box(9.5, 0.3, 2.4, roofMat, 0, -0.05, 2.0);      // steps / base platform

  // facade windows
  [-3.05, 3.05].forEach(function (px) {
    for (var r = 0; r < 2; r++) for (var c = 0; c < 3; c++) {
      box(0.55, 0.9, 0.08, winMat, px + (c - 1) * 1.0, 1.0 + r * 1.35, 0.17);
    }
  });
  [-7.2, 7.2].forEach(function (px) {
    for (var c = 0; c < 3; c++) box(0.5, 0.8, 0.08, winMat, px + (c - 1) * 1.0, 1.2, 0.03);
  });

  // flag
  var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.6, roughness: 0.3 }));
  pole.position.set(0, 4.95, -3); house.add(pole);
  var flag = box(0.95, 0.55, 0.03, new THREE.MeshStandardMaterial({ color: 0xb22234, roughness: 0.75 }), 0.5, 5.7, -3);

  // trees for parallax depth
  function tree(x, z) {
    var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 1.3, 8),
      new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 1 }));
    trunk.position.set(x, 0.65, z); scene.add(trunk);
    var leaves = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0x3f7d3a, roughness: 1 }));
    leaves.position.set(x, 1.9, z); scene.add(leaves);
  }
  tree(-10.5, 3); tree(-12.5, 6.5); tree(10.5, 3); tree(12.5, 6.5);

  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  var tmpLook = new THREE.Vector3();
  var pointerX = 0;
  window.addEventListener("mousemove", function (e) { pointerX = (e.clientX / window.innerWidth - 0.5); }, { passive: true });

  function updateCamera(p) {
    var e = ease(p);
    var camZ = lerp(24, -0.4, e);     // ends right at the doorway, peering into the warm interior
    var camY = lerp(2.7, 1.35, e);
    var lookZ = lerp(0, -6, e);
    var lookY = lerp(2.0, 1.2, e);
    var px = pointerX * lerp(1.3, 0.12, e);
    camera.position.set(px, camY, camZ);
    tmpLook.set(px * 0.3, lookY, lookZ);
    camera.lookAt(tmpLook);
    flag.rotation.y = Math.sin(performance.now() * 0.003) * 0.25;
  }

  function resize() {
    var w = sticky.clientWidth || section.clientWidth;
    var h = sticky.clientHeight || window.innerHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  var visible = true, running = false;
  function start() { if (running) return; running = true; loop(); }
  function loop() {
    if (!visible) { running = false; return; }
    var p = computeProgress();
    updateCamera(p);
    paintCaptions(p);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); },
      { threshold: 0.001 }).observe(section);
  }
  updateCamera(0);
  start();
})();
