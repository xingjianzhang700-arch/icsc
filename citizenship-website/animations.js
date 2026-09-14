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
