/* Shivangi Shukla — IAM portfolio. Identity-graph background, hero change record, scroll scenes, skills filter. No dependencies. */
(function () {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Footer year */
  function chrome() {
    $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  /* Background: identities → roles → applications, with access flowing along the links.
     The pointer lights nearby access paths; a click provisions from the nearest identity. */
  function background() {
    const canvas = $(".bg");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const WINE = "100,29,43";
    let w = 0, h = 0, dpr = 1, nodes = [], edges = [], packets = [], pulses = [];
    const pointer = { x: -1e4, y: -1e4 };
    let raf = 0, last = 0, spawnAt = 0, running = false;

    function build() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const total = clamp(Math.round((w * h) / 30000), 16, 48);
      const kinds = [["id", 0.45], ["role", 0.25], ["app", 0.3]];
      nodes = [];
      kinds.forEach(([kind, share]) => {
        for (let i = 0; i < Math.round(total * share); i++) {
          nodes.push({ kind, hx: Math.random() * w, hy: Math.random() * h, x: 0, y: 0, ph: Math.random() * 6.28, glow: 0 });
        }
      });
      const near = (a, kind, n) => nodes.filter((b) => b.kind === kind)
        .sort((p, q) => Math.hypot(p.hx - a.hx, p.hy - a.hy) - Math.hypot(q.hx - a.hx, q.hy - a.hy)).slice(0, n);
      edges = [];
      nodes.forEach((a) => {
        if (a.kind === "id") near(a, "role", 1 + (Math.random() < 0.4)).forEach((b) => edges.push([a, b]));
        if (a.kind === "role") near(a, "app", 2).forEach((b) => edges.push([a, b]));
      });
      nodes.forEach((n) => { n.out = edges.filter((e) => e[0] === n).map((e) => e[1]); });
      packets = []; pulses = [];
      move(0);
    }

    function move(t) {
      nodes.forEach((n) => {
        n.x = n.hx + Math.sin(t / 4200 + n.ph) * 8;
        n.y = n.hy + Math.cos(t / 5200 + n.ph) * 8;
        const d = Math.hypot(n.x - pointer.x, n.y - pointer.y);
        n.glow += ((d < 180 ? 1 - d / 180 : 0) - n.glow) * 0.12;
      });
    }

    // A packet walks identity → role → application, then the application pulses
    function provision(from) {
      const role = from.out[Math.floor(Math.random() * from.out.length)];
      if (!role || !role.out.length) return;
      const app = role.out[Math.floor(Math.random() * role.out.length)];
      packets.push({ path: [from, role, app], seg: 0, k: 0 });
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      edges.forEach(([a, b]) => {
        const g = Math.max(a.glow, b.glow);
        ctx.strokeStyle = `rgba(${WINE},${0.05 + g * 0.3})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
      // Pointer reaches for the three nearest nodes
      if (pointer.x > -1e3) {
        nodes.slice().sort((p, q) => Math.hypot(p.x - pointer.x, p.y - pointer.y) - Math.hypot(q.x - pointer.x, q.y - pointer.y)).slice(0, 3)
          .forEach((n) => {
            const d = Math.hypot(n.x - pointer.x, n.y - pointer.y);
            if (d > 220) return;
            ctx.strokeStyle = `rgba(${WINE},${0.22 * (1 - d / 220)})`;
            ctx.setLineDash([3, 4]);
            ctx.beginPath(); ctx.moveTo(pointer.x, pointer.y); ctx.lineTo(n.x, n.y); ctx.stroke();
            ctx.setLineDash([]);
          });
      }
      nodes.forEach((n) => {
        const a = 0.18 + n.glow * 0.55;
        ctx.fillStyle = "rgba(255,253,250,1)";
        ctx.strokeStyle = `rgba(${WINE},${a})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        if (n.kind === "id") ctx.arc(n.x, n.y, 4, 0, 6.283);
        else if (n.kind === "role") { ctx.moveTo(n.x, n.y - 5.5); ctx.lineTo(n.x + 5.5, n.y); ctx.lineTo(n.x, n.y + 5.5); ctx.lineTo(n.x - 5.5, n.y); ctx.closePath(); }
        else ctx.rect(n.x - 4.5, n.y - 4.5, 9, 9);
        ctx.fill(); ctx.stroke();
      });
      packets.forEach((p) => {
        const a = p.path[p.seg], b = p.path[p.seg + 1];
        ctx.fillStyle = `rgba(${WINE},.6)`;
        ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * p.k, a.y + (b.y - a.y) * p.k, 2.4, 0, 6.283); ctx.fill();
      });
      pulses.forEach((u) => {
        ctx.strokeStyle = `rgba(${WINE},${0.35 * (1 - u.k)})`;
        ctx.beginPath(); ctx.arc(u.n.x, u.n.y, 6 + u.k * 16, 0, 6.283); ctx.stroke();
      });
    }

    function frame(t) {
      raf = 0;
      const dt = Math.min((t - (last || t)) / 1000, 0.05);
      last = t;
      move(t);
      if (t > spawnAt) {
        const ids = nodes.filter((n) => n.kind === "id");
        provision(ids[Math.floor(Math.random() * ids.length)]);
        spawnAt = t + 900 + Math.random() * 900;
      }
      packets.forEach((p) => {
        const a = p.path[p.seg], b = p.path[p.seg + 1];
        p.k += (110 * dt) / Math.max(Math.hypot(b.x - a.x, b.y - a.y), 1);
        if (p.k >= 1) { p.k = 0; p.seg++; }
        if (p.seg >= p.path.length - 1) { p.done = true; pulses.push({ n: p.path[p.path.length - 1], k: 0 }); }
      });
      packets = packets.filter((p) => !p.done);
      pulses.forEach((u) => { u.k += dt * 1.6; });
      pulses = pulses.filter((u) => u.k < 1);
      draw();
      if (running) raf = requestAnimationFrame(frame);
    }

    const start = () => { if (!running && !reduced) { running = true; last = 0; raf = requestAnimationFrame(frame); } };
    const stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };

    build();
    if (reduced) { draw(); addEventListener("resize", () => { build(); draw(); }); return; }
    addEventListener("resize", build);
    addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") { pointer.x = e.clientX; pointer.y = e.clientY; } }, { passive: true });
    document.addEventListener("pointerleave", () => { pointer.x = pointer.y = -1e4; });
    addEventListener("pointerdown", (e) => {
      const ids = nodes.filter((n) => n.kind === "id");
      const n = ids.sort((p, q) => Math.hypot(p.x - e.clientX, p.y - e.clientY) - Math.hypot(q.x - e.clientX, q.y - e.clientY))[0];
      if (n) for (let i = 0; i < 3; i++) provision(n);
    }, { passive: true });
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    start();
  }

  /* Hero: name rises, identity record attributes tick in, then the Active status appears */
  function hero() {
    const steps = $$(".record .step"), stamp = $(".state");
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add("ready")));
    if (reduced) {
      steps.forEach((s) => s.classList.add("done"));
      stamp?.classList.add("show");
      return;
    }
    let t = 750;
    steps.forEach((s) => {
      setTimeout(() => s.classList.add("run"), t);
      setTimeout(() => { s.classList.remove("run"); s.classList.add("done"); }, t + 280);
      t += 320;
    });
    setTimeout(() => stamp?.classList.add("show"), t + 80);
  }

  /* Scroll-linked: nav, migration wiring, lifecycle line */
  function scroll() {
    const nav = $("[data-nav]"), bar = $(".nav-progress");
    const links = $$(".nav-links a"), targets = links.map((a) => $(a.getAttribute("href")));
    const migRows = $$(".mig-row"), mig = $("[data-mig]");
    const jml = $("[data-jml]"), body = $(".jml-body"), stops = $$(".stop");
    let queued = false;

    // The lifecycle track runs from the centre of the first pin to the centre of the last
    function measure() {
      const pins = $$(".pin");
      if (!body || pins.length < 2) return;
      const br = body.getBoundingClientRect();
      const c = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2 - br.left, y: r.top + r.height / 2 - br.top }; };
      const a = c(pins[0]), z = c(pins[pins.length - 1]);
      body.style.setProperty("--x0", a.x.toFixed(1) + "px");
      body.style.setProperty("--pin-y", a.y.toFixed(1) + "px");
      body.style.setProperty("--tw", (z.x - a.x).toFixed(1) + "px");
      body.style.setProperty("--th", (z.y - a.y).toFixed(1) + "px");
    }

    function update() {
      queued = false;
      const vh = innerHeight, sy = scrollY;
      nav.classList.toggle("scrolled", sy > 8);
      bar.style.setProperty("--np", clamp(sy / (document.documentElement.scrollHeight - vh), 0, 1).toFixed(4));

      let active = -1;
      targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top <= vh * 0.4) active = i; });
      links.forEach((a, i) => a.classList.toggle("on", i === active));

      if (mig) {
        const r = mig.getBoundingClientRect();
        const p = reduced ? 1 : clamp((vh * 0.85 - r.top) / (r.height + vh * 0.15), 0, 1);
        const n = migRows.length;
        migRows.forEach((row, i) => {
          const w = clamp(p * (n + 0.5) - i, 0, 1);
          row.style.setProperty("--w", w.toFixed(3));
          row.classList.toggle("done", w >= 1);
        });
      }

      if (jml) {
        const r = jml.getBoundingClientRect();
        const p = reduced ? 1 : clamp((vh * 0.85 - r.top) / (vh * 0.45), 0, 1);
        body.style.setProperty("--p", p.toFixed(4));
        stops.forEach((s, i) => s.classList.toggle("on", p >= i / (stops.length - 1) - 0.02));
      }
    }

    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", () => { measure(); queue(); });
    measure();
    document.fonts?.ready.then(() => { measure(); queue(); });
    update();
  }

  /* Once in view: section rules draw, numbers count up */
  function reveal() {
    const els = [...$$(".head"), ...$$(".stat")];
    if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add("in");
      io.unobserve(el);
      const n = $("[data-count]", el);
      if (!n || reduced) return;
      const to = +n.dataset.count, t0 = performance.now(), dur = 1100;
      const tick = (t) => {
        const k = clamp((t - t0) / dur, 0, 1);
        n.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      };
      n.textContent = "0";
      requestAnimationFrame(tick);
    }), { threshold: 0.5 });
    els.forEach((el) => io.observe(el));
  }

  /* Skills: show where each skill was used */
  function filter() {
    const grid = $("[data-skills]"), chips = $$("[data-filter]"), items = $$("[data-skills] li");
    if (!grid) return;
    chips.forEach((chip) => chip.addEventListener("click", () => {
      const f = chip.dataset.filter;
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      grid.classList.toggle("filtered", f !== "all");
      items.forEach((li) => li.classList.toggle("match", f !== "all" && li.dataset.at.split(" ").includes(f)));
    }));
  }

  /* Copy the email address */
  function copy() {
    const toast = $(".toast");
    let timer;
    $$("[data-copy]").forEach((el) => el.addEventListener("click", () => {
      const v = el.dataset.copy;
      navigator.clipboard?.writeText(v).then(() => {
        toast.textContent = "Copied · " + v;
        toast.classList.add("show");
        clearTimeout(timer);
        timer = setTimeout(() => toast.classList.remove("show"), 1800);
      }).catch(() => {});
    }));
  }

  chrome();
  background();
  hero();
  scroll();
  reveal();
  filter();
  copy();
})();
