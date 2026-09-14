/* Interlake ICSC — interactive study models.
   No autoplay or scroll capture. Render only while a visible scene changes.
   Native sliders support keyboard/touch; WebGL failure leaves static artwork. */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var clamp = function (n, min, max) { return Math.max(min, Math.min(max, n)); };

  document.querySelectorAll(".subject-play").forEach(function (button) {
    button.hidden = false;
    button.addEventListener("click", function () {
      var on = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(on));
      button.closest(".subject-card").classList.toggle("is-active", on);
    });
  });

  // Brief, one-time entrance. No content is hidden if JS fails.
  if ("IntersectionObserver" in window) {
    var entrances = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entrances.unobserve(entry.target);
        if (!reduced.matches && entry.target.animate) {
          entry.target.animate([
            { opacity: 0.65, transform: "translateY(14px)" },
            { opacity: 1, transform: "translateY(0)" }
          ], { duration: 550, easing: "cubic-bezier(.2,.7,.2,1)" });
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".section-title, .subject-card, .steps li, .review").forEach(function (el) {
      entrances.observe(el);
    });
    reduced.addEventListener("change", function () {
      if (reduced.matches && document.getAnimations) {
        document.getAnimations().forEach(function (animation) { animation.finish(); });
      }
    });
  }

  var T = window.THREE;
  if (!T) return;
  var NAVY = 0x14306a, GOLD = 0xf5c542, PAPER = 0xfffdf6;

  function material(color, metalness) {
    return new T.MeshStandardMaterial({ color: new T.Color(color).convertSRGBToLinear(), roughness: metalness ? 0.35 : 0.68, metalness: metalness || 0 });
  }
  function mesh(group, geometry, mat, x, y, z) {
    var item = new T.Mesh(geometry, mat);
    item.position.set(x || 0, y || 0, z || 0);
    group.add(item);
    return item;
  }
  function box(group, w, h, d, mat, x, y, z) {
    return mesh(group, new T.BoxGeometry(w, h, d), mat, x, y, z);
  }
  function starGeometry(radius, depth) {
    var shape = new T.Shape();
    for (var i = 0; i < 10; i++) {
      var a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? radius * 0.44 : radius;
      if (!i) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    shape.closePath();
    var geo = new T.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.025, bevelSegments: 2 });
    geo.center();
    return geo;
  }
  function disc(group, radius, depth, mat, x, y, z) {
    return mesh(group, new T.CylinderGeometry(radius, radius, depth, 64), mat, x, y, z);
  }

  function studyModel(root) {
    var navy = material(NAVY), gold = material(GOLD, 0.45), paper = material(PAPER), blue = material(0x799bc6);
    var platform = disc(root, 2.8, 0.14, material(0xe9ddb8), 0, -1.5, 0);
    platform.scale.z = 0.8;
    disc(root, 2.35, 0.035, paper, 0, -1.405, 0).scale.z = 0.8;

    // A bound study book: raised cover, visible page edges and gold emblem.
    var book = new T.Group();
    book.position.set(-0.7, -0.3, 0.2);
    book.rotation.set(-0.08, 0.12, -0.13);
    root.add(book);
    box(book, 1.52, 2.02, 0.12, navy, 0, 0, -0.18);
    box(book, 1.4, 1.9, 0.3, paper, 0.035, 0, 0);
    box(book, 1.52, 2.02, 0.11, navy, 0, 0, 0.2);
    box(book, 0.13, 2.02, 0.42, navy, -0.7, 0, 0.015);
    for (var i = 0; i < 5; i++) {
      box(book, 0.015, 1.78, 0.008, material(0xd7ceb6), 0.74, 0, -0.105 + i * 0.055);
    }
    var rim = mesh(book, new T.TorusGeometry(0.42, 0.016, 8, 48), gold, 0, 0.2, 0.265);
    mesh(book, starGeometry(0.28, 0.035), gold, 0, 0.2, 0.3);
    box(book, 0.68, 0.033, 0.013, gold, 0, -0.48, 0.26);
    box(book, 0.4, 0.025, 0.013, gold, 0, -0.61, 0.26);
    box(book, 0.16, 0.4, 0.02, gold, 0.45, -1.01, -0.03);

    // Small globe on a brass stand, with latitude/longitude geometry.
    var globe = new T.Group();
    globe.position.set(1.22, 0.14, -0.2);
    globe.rotation.z = -0.22;
    root.add(globe);
    mesh(globe, new T.SphereGeometry(0.79, 40, 24), blue, 0, 0.25, 0);
    var ringMat = material(0xc8dded, 0.1);
    for (var j = 0; j < 4; j++) {
      var meridian = mesh(globe, new T.TorusGeometry(0.796, 0.008, 6, 64), ringMat, 0, 0.25, 0);
      meridian.rotation.y = j * Math.PI / 4;
    }
    [-0.45, 0, 0.45].forEach(function (latitude) {
      var lat = mesh(globe, new T.TorusGeometry(Math.sqrt(0.796 * 0.796 - latitude * latitude), 0.01, 6, 64), ringMat, 0, 0.25 + latitude, 0);
      lat.rotation.x = Math.PI / 2;
    });
    var arc = mesh(globe, new T.TorusGeometry(0.91, 0.035, 8, 64, Math.PI), gold, 0, 0.25, 0);
    arc.rotation.z = -Math.PI / 2;
    disc(root, 0.43, 0.1, gold, 1.22, -1.28, -0.2);
    mesh(root, new T.CylinderGeometry(0.035, 0.05, 0.62, 12), gold, 1.22, -0.97, -0.2);
    var seal = mesh(root, starGeometry(0.42, 0.15), gold, 0.08, 1.65, 0.25);
    seal.rotation.set(0, -0.25, 0.15);
    return { span: 6.4, lookY: 0.05, pitch: 0.15 };
  }

  function landmarkModel(root) {
    var stone = material(0xf6f1e2), trim = material(0xd8d6cf), navy = material(0x234263), gold = material(GOLD, 0.25);
    var base = disc(root, 6.7, 0.3, material(0x23446f), 0, -0.35, 0);
    base.scale.z = 0.63;
    disc(root, 6.35, 0.06, material(0x4d776f), 0, -0.16, 0).scale.z = 0.63;
    box(root, 5.9, 2.25, 2.9, stone, 0, 1.125, -0.45);
    box(root, 6.12, 0.16, 3.06, trim, 0, 2.34, -0.45);
    box(root, 6.24, 0.12, 3.15, stone, 0, 2.46, -0.45);
    [-1, 1].forEach(function (side) {
      box(root, 2.7, 1.3, 2.2, stone, side * 4.35, 0.65, -0.7);
      box(root, 2.9, 0.15, 2.4, trim, side * 4.35, 1.38, -0.7);
      for (var i = 0; i < 4; i++) {
        box(root, 0.28, 0.68, 0.025, navy, side * 4.35 + (i - 1.5) * 0.58, 0.75, 0.413);
      }
    });
    for (var row = 0; row < 2; row++) {
      [-2.55,-1.8,-1.05,1.05,1.8,2.55].forEach(function (x) {
        box(root, 0.42, 0.72, 0.05, trim, x, 0.68 + row * 1.0, 1.03);
        box(root, 0.32, 0.62, 0.06, navy, x, 0.68 + row * 1.0, 1.07);
        box(root, 0.024, 0.62, 0.015, stone, x, 0.68 + row * 1.0, 1.11);
        box(root, 0.32, 0.025, 0.015, stone, x, 0.68 + row * 1.0, 1.11);
      });
    }
    box(root, 0.55, 1.25, 0.08, navy, 0, 0.63, 1.06);
    for (var step = 0; step < 3; step++) {
      box(root, 3.7 - step * 0.2, 0.1, 1.6 - step * 0.25, trim, 0, step * 0.1, 1.6);
    }
    [-1.5,-0.9,0.9,1.5].forEach(function (x) {
      mesh(root, new T.CylinderGeometry(0.09, 0.12, 1.95, 16), stone, x, 1.23, 1.75);
      box(root, 0.3, 0.12, 0.3, trim, x, 2.2, 1.75);
      box(root, 0.3, 0.12, 0.3, trim, x, 0.31, 1.75);
    });
    box(root, 3.7, 0.2, 1.05, stone, 0, 2.34, 1.47);
    var shape = new T.Shape();
    shape.moveTo(-1.87, 0); shape.lineTo(1.87, 0); shape.lineTo(0, 0.72); shape.closePath();
    mesh(root, new T.ExtrudeGeometry(shape, { depth: 0.85, bevelEnabled: false }), stone, 0, 2.45, 1.05);
    mesh(root, new T.CylinderGeometry(0.018, 0.018, 1.2, 8), gold, 0, 3.06, -0.5);
    // Recognizable striped flag rather than a solid red rectangle.
    for (var stripe = 0; stripe < 7; stripe++) {
      box(root, 0.62, 0.05, 0.02, stripe % 2 ? stone : material(0xad3b49), 0.32, 3.56 - stripe * 0.05, -0.5);
    }
    box(root, 0.27, 0.18, 0.028, navy, 0.14, 3.495, -0.5);
    [-4.9, 4.9].forEach(function (x) {
      mesh(root, new T.CylinderGeometry(0.055, 0.08, 0.55, 8), material(0x9a8153), x, 0.18, 1.8);
      mesh(root, new T.SphereGeometry(0.47, 16, 12), material(0x739986), x, 0.68, 1.8);
    });
    box(root, 1.1, 0.025, 1.7, material(0xe4d7b1), 0, -0.105, 3.0);
    return { span: 14.9, lookY: 1.15, pitch: 0.1 };
  }

  function mount(host, builder) {
    var viewport = host.querySelector(".scene-viewport");
    var canvas = host.querySelector("canvas");
    var controls = host.querySelector(".scene-controls");
    var range = host.querySelector("[data-rotation]");
    var reset = host.querySelector("[data-reset]");
    var renderer, scene, camera, model, config;
    var frame = 0, visible = true, lost = false, disposed = false;
    var target = 0, angle = 0, pitch = 0, targetPitch = 0;
    var drag = null, last = 0;

    function showFallback() {
      host.classList.remove("scene-ready");
      controls.hidden = true;
    }
    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    }
    function wake() {
      if (!disposed && !lost && visible && !document.hidden && !frame) frame = requestAnimationFrame(paint);
    }
    function paint(time) {
      frame = 0;
      var dt = last ? Math.min((time - last) / 1000, 0.05) : 1 / 60;
      last = time;
      var blend = reduced.matches ? 1 : 1 - Math.exp(-12 * dt);
      angle += (target - angle) * blend;
      pitch += (targetPitch - pitch) * blend;
      model.rotation.y = angle;
      model.rotation.x = config.pitch + pitch;
      try { renderer.render(scene, camera); }
      catch (error) { lost = true; showFallback(); return; }
      if (Math.abs(target - angle) + Math.abs(targetPitch - pitch) > 0.0002) wake();
      else last = 0;
    }
    function resize() {
      var w = viewport.clientWidth, h = viewport.clientHeight;
      if (!w || !h || disposed) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 500 ? 1.5 : 2));
      renderer.setSize(w, h, false);
      var aspect = w / h;
      var height = Math.max(config.span / aspect, config.span * 0.64);
      camera.left = -height * aspect / 2; camera.right = height * aspect / 2;
      camera.top = height / 2; camera.bottom = -height / 2;
      camera.updateProjectionMatrix();
      wake();
    }

    try {
      renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "low-power" });
      renderer.outputEncoding = T.sRGBEncoding;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      scene = new T.Scene();
      scene.add(new T.HemisphereLight(0xfff7e6, 0x677d9b, 0.55));
      var key = new T.DirectionalLight(0xfff5df, 0.95); key.position.set(-3, 6, 8); scene.add(key);
      var fill = new T.DirectionalLight(0xc4ddff, 0.4); fill.position.set(5, 2, -3); scene.add(fill);
      model = new T.Group(); scene.add(model);
      config = builder(model);
      camera = new T.OrthographicCamera(-4, 4, 4, -4, 0.1, 100);
      camera.position.set(0, config.lookY + 3.3, 12);
      camera.lookAt(0, config.lookY, 0);
      model.rotation.x = config.pitch;
      resize();
      renderer.render(scene, camera);
      host.classList.add("scene-ready");
      controls.hidden = false;
    } catch (error) {
      stop();
      if (renderer) renderer.dispose();
      showFallback();
      return;
    }

    function setRotation(degrees) {
      range.value = String(clamp(degrees, -60, 60));
      target = Number(range.value) * Math.PI / 180;
      wake();
    }
    range.addEventListener("input", function () { setRotation(Number(range.value)); });
    reset.addEventListener("click", function () {
      targetPitch = 0;
      setRotation(0);
    });
    canvas.addEventListener("pointerdown", function (event) {
      if (event.button !== 0 || drag) return;
      drag = { id: event.pointerId, x: event.clientX, value: Number(range.value) };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", function (event) {
      if (drag && drag.id === event.pointerId) {
        setRotation(drag.value + (event.clientX - drag.x) * 0.3);
      } else if (finePointer.matches && !reduced.matches) {
        var rect = canvas.getBoundingClientRect();
        targetPitch = clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5) * 0.09;
        wake();
      }
    });
    function endDrag(event) {
      if (!drag || event.pointerId !== drag.id) return;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      drag = null;
      targetPitch = 0;
      wake();
    }
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    canvas.addEventListener("lostpointercapture", function () { drag = null; });
    canvas.addEventListener("pointerleave", function () { targetPitch = 0; wake(); });
    canvas.addEventListener("webglcontextlost", function (event) {
      event.preventDefault(); lost = true; stop(); showFallback();
    });
    canvas.addEventListener("webglcontextrestored", function () {
      lost = false;
      host.classList.add("scene-ready");
      controls.hidden = false;
      resize();
    });
    var observer;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) wake(); else stop();
      }, { threshold: 0.01 });
      observer.observe(host);
    }
    var sizing;
    if ("ResizeObserver" in window) {
      sizing = new ResizeObserver(resize); sizing.observe(viewport);
    } else window.addEventListener("resize", resize);
    function onVisibility() { if (document.hidden) stop(); else wake(); }
    function onMotion() {
      targetPitch = 0;
      // An explicit slider/drag still changes the static view, without tweening.
      if (reduced.matches) { angle = target; pitch = 0; }
      wake();
    }
    document.addEventListener("visibilitychange", onVisibility);
    reduced.addEventListener("change", onMotion);
    window.addEventListener("pagehide", function (event) {
      stop();
      if (event.persisted) return;
      disposed = true;
      if (observer) observer.disconnect();
      if (sizing) sizing.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onMotion);
      var geometries = new Set(), materials = new Set();
      scene.traverse(function (item) {
        if (item.geometry) geometries.add(item.geometry);
        if (item.material) materials.add(item.material);
      });
      geometries.forEach(function (item) { item.dispose(); });
      materials.forEach(function (item) { item.dispose(); });
      renderer.dispose();
    });
    window.addEventListener("pageshow", function (event) { if (event.persisted) { resize(); wake(); } });
  }

  // Delay creating GPU resources until each model is near the viewport.
  var hosts = [document.getElementById("hero3d"), document.getElementById("landmark3d")].filter(Boolean);
  function initialize(host) { mount(host, host.id === "hero3d" ? studyModel : landmarkModel); }
  if ("IntersectionObserver" in window) {
    var lazy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { lazy.unobserve(entry.target); initialize(entry.target); }
      });
    }, { rootMargin: "160px" });
    hosts.forEach(function (host) { lazy.observe(host); });
  } else hosts.forEach(initialize);
})();
