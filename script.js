/* ===========================================================
   DOSSIER 1708 — interactions & scroll choreography
   =========================================================== */

(function () {
  "use strict";

  /* ---------- Letter-by-letter cover title ---------- */
  function splitCoverTitle() {
    const targets = document.querySelectorAll("[data-split]");
    targets.forEach((el) => {
      const text = el.textContent;
      el.textContent = "";
      [...text].forEach((c) => {
        const wrap = document.createElement("span");
        wrap.className = "ch";
        const inner = document.createElement("span");
        inner.textContent = c === " " ? "\u00A0" : c;
        wrap.appendChild(inner);
        el.appendChild(wrap);
      });
    });
  }

  function animateCoverTitle() {
    const chars = document.querySelectorAll(".cover-title .ch");
    chars.forEach((c, i) => {
      setTimeout(() => c.classList.add("in"), 220 + i * 38);
    });
  }

  /* ---------- Cursor spotlight on cover (replaces scanline) ---------- */
  function setupScanline() {
    const cover = document.querySelector(".cover");
    if (!cover) return;
    cover.addEventListener("mousemove", (e) => {
      const r = cover.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      cover.style.setProperty("--mx", `${x}%`);
      cover.style.setProperty("--my", `${y}%`);
    });
  }

  /* ---------- Generic scroll reveal ---------- */
  function setupReveals() {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll(".reveal, .stamp-in, .metric").forEach((el) => io.observe(el));
  }

  /* ---------- Animated counters ---------- */
  function setupCounters() {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = parseFloat(el.dataset.count);
          const dec = parseInt(el.dataset.decimals || "0", 10);
          const dur = 1500;
          const t0 = performance.now();
          function step(t) {
            const p = Math.min((t - t0) / dur, 1);
            const e = 1 - Math.pow(1 - p, 3);
            el.textContent = (target * e).toFixed(dec);
            if (p < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
          io.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll("[data-count]").forEach((el) => io.observe(el));
  }

  /* ---------- HUD progress bar + percent ---------- */
  function setupHud() {
    const fill = document.querySelector(".hud-progress-fill");
    const pct = document.querySelector(".hud-pct");
    const section = document.querySelector("[data-hud-section]");
    const time = document.querySelector("[data-hud-time]");
    const sid = document.querySelector("[data-hud-sid]");

    // random session id
    if (sid) {
      const hex = "0123456789ABCDEF";
      let s = "";
      for (let i = 0; i < 6; i++) s += hex[Math.floor(Math.random() * 16)];
      sid.textContent = s;
    }

    function tick() {
      if (!time) return;
      const d = new Date();
      time.textContent = d.toUTCString().slice(17, 25) + " UTC";
    }
    tick();
    setInterval(tick, 1000);

    const sections = document.querySelectorAll("[data-exhibit-name]");

    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, window.scrollY / max));
      if (fill) fill.style.width = `${(p * 100).toFixed(1)}%`;
      if (pct) pct.textContent = `${(p * 100).toFixed(1).padStart(4, "0")}%`;

      // determine active section for label
      const mid = window.scrollY + window.innerHeight * 0.35;
      let name = "COVER";
      sections.forEach((s) => {
        if (s.offsetTop <= mid) name = s.dataset.exhibitName;
      });
      if (section) section.textContent = name;
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Horizontal pinned scroll: arsenal ---------- */
  function setupArsenal() {
    const section = document.querySelector(".arsenal-section");
    if (!section) return;
    const track = section.querySelector(".arsenal-track");
    const cards = section.querySelectorAll(".arsenal-card");
    const dots = section.querySelectorAll(".arsenal-dots .d");
    if (!track) return;

    function isMobile() { return window.matchMedia("(max-width: 820px)").matches; }

    function update() {
      if (isMobile()) {
        track.style.transform = "";
        cards.forEach((c) => c.classList.add("active"));
        dots.forEach((d) => d.classList.add("on"));
        return;
      }
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, -rect.top / total));
      const distance = track.scrollWidth - window.innerWidth + 80;
      track.style.transform = `translate3d(${-progress * distance}px, 0, 0)`;

      // Active card = the one whose center is closest to viewport center
      const vh = window.innerWidth / 2;
      let bestIdx = 0;
      let bestDist = Infinity;
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const center = r.left + r.width / 2;
        const d = Math.abs(center - vh);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      });
      cards.forEach((c, i) => c.classList.toggle("active", i === bestIdx));
      dots.forEach((d, i) => d.classList.toggle("on", i === bestIdx));
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Contact: copy + toast ---------- */
  function setupContact() {
    const toast = document.querySelector(".toast");
    document.querySelectorAll(".contact-link[data-copy]").forEach((link) => {
      link.addEventListener("click", (e) => {
        const txt = link.dataset.copy;
        if (link.dataset.copyOnly === "true") e.preventDefault();
        if (navigator.clipboard && txt) {
          navigator.clipboard.writeText(txt).then(() => {
            if (!toast) return;
            toast.textContent = `✓ copied · ${txt}`;
            toast.classList.add("show");
            clearTimeout(window.__toast_t);
            window.__toast_t = setTimeout(() => toast.classList.remove("show"), 2000);
          }).catch(() => {});
        }
      });
    });
  }

  /* ---------- Cover ridge pattern (procedural SVG fingerprint-ish curves) ---------- */
  function drawRidges() {
    const host = document.querySelector(".cover-bg-ridges");
    if (!host) return;
    const W = 800;
    const H = 1000;
    let paths = "";
    const cx = W * 0.55, cy = H * 0.45;
    for (let i = 0; i < 26; i++) {
      const rx = 80 + i * 22 + (i % 2 ? 6 : 0);
      const ry = 110 + i * 28 + (i % 3 ? 4 : 0);
      const rot = (i * 4) - 18;
      const dash = i % 4 === 0 ? `stroke-dasharray="3 8"` : "";
      paths += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="none" stroke="url(#g1)" stroke-width="1.1" ${dash}/>`;
    }
    // a few break lines
    for (let i = 0; i < 6; i++) {
      const y = 80 + i * 150;
      paths += `<line x1="${W * 0.1}" y1="${y}" x2="${W * 0.9}" y2="${y + 22}" stroke="url(#g2)" stroke-width="0.8" stroke-dasharray="1 6"/>`;
    }
    host.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="oklch(0.82 0.16 65)" stop-opacity="0.6"/>
            <stop offset="100%" stop-color="oklch(0.74 0.16 295)" stop-opacity="0.55"/>
          </linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="oklch(0.82 0.16 65)" stop-opacity="0"/>
            <stop offset="50%" stop-color="oklch(0.82 0.16 65)" stop-opacity="0.6"/>
            <stop offset="100%" stop-color="oklch(0.82 0.16 65)" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${paths}
      </svg>`;
  }

  /* ---------- Reticle SVG inside arsenal stage ---------- */
  function drawReticle() {
    const host = document.querySelector(".arsenal-reticle");
    if (!host) return;
    host.innerHTML = `
      <svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="rg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="oklch(0.82 0.16 65)" stop-opacity="0.18"/>
            <stop offset="60%" stop-color="oklch(0.82 0.16 65)" stop-opacity="0.04"/>
            <stop offset="100%" stop-color="oklch(0.82 0.16 65)" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="280" fill="url(#rg)"/>
        <circle cx="300" cy="300" r="280" fill="none" stroke="oklch(0.82 0.16 65)" stroke-width="0.8" stroke-dasharray="2 6" opacity="0.5"/>
        <circle cx="300" cy="300" r="220" fill="none" stroke="oklch(0.82 0.16 65)" stroke-width="0.8" opacity="0.4"/>
        <circle cx="300" cy="300" r="120" fill="none" stroke="oklch(0.82 0.16 65)" stroke-width="0.6" stroke-dasharray="1 5" opacity="0.6"/>
        <circle cx="300" cy="300" r="6" fill="oklch(0.82 0.16 65)"/>
        <line x1="300" y1="20" x2="300" y2="60" stroke="oklch(0.82 0.16 65)" stroke-width="1"/>
        <line x1="300" y1="540" x2="300" y2="580" stroke="oklch(0.82 0.16 65)" stroke-width="1"/>
        <line x1="20" y1="300" x2="60" y2="300" stroke="oklch(0.82 0.16 65)" stroke-width="1"/>
        <line x1="540" y1="300" x2="580" y2="300" stroke="oklch(0.82 0.16 65)" stroke-width="1"/>
        <g font-family="JetBrains Mono, monospace" font-size="9" fill="oklch(0.82 0.16 65)" opacity="0.6">
          <text x="300" y="12" text-anchor="middle">N</text>
          <text x="300" y="594" text-anchor="middle">S</text>
          <text x="10" y="304" text-anchor="start">W</text>
          <text x="590" y="304" text-anchor="end">E</text>
        </g>
      </svg>`;
  }

  /* ---------- Floating IAM tokens on cover ---------- */
  const TOKEN_TERMS = [
    { t: "SAML 2.0",   k: "amber" },
    { t: "OAuth 2.0",  k: ""      },
    { t: "SSO",        k: "iris"  },
    { t: "RBAC",       k: ""      },
    { t: "MFA",        k: "amber" },
    { t: "ZTNA",       k: "iris"  },
    { t: "JWT",        k: ""      },
    { t: "OIDC",       k: "amber" },
    { t: "LDAP",       k: ""      },
    { t: "TLS 1.3",    k: "iris"  },
    { t: "SCIM",       k: ""      },
    { t: "PIM/PAM",    k: "amber" },
    { t: "WebGate",    k: ""      },
    { t: "OIM 12c",    k: "iris"  }
  ];

  let _tokens = [];
  function setupTokens() {
    const host = document.querySelector(".cover-tokens");
    if (!host) return;
    host.innerHTML = "";
    _tokens.length = 0;

    // Seeded pseudo-random for stable positions across reloads
    let s = 1708;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

    const W = window.innerWidth;
    const H = window.innerHeight;
    const isWide = W > 960;
    const placements = [];

    function rectToVp(r) {
      if (!r) return null;
      // pad covers worst-case drift envelope (±sine amplitude + mouse parallax + token half-width)
      const pad = 56;
      return {
        x1: ((r.left - pad) / W) * 100,
        x2: ((r.right + pad) / W) * 100,
        y1: ((r.top - pad) / H) * 100,
        y2: ((r.bottom + pad) / H) * 100,
      };
    }

    function glyphUnionRect(selector) {
      const chs = document.querySelectorAll(selector);
      if (!chs.length) return null;
      let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
      chs.forEach((c) => {
        const rc = c.getBoundingClientRect();
        if (rc.width === 0 && rc.height === 0) return;
        if (rc.left < l) l = rc.left;
        if (rc.top < t) t = rc.top;
        if (rc.right > r) r = rc.right;
        if (rc.bottom > b) b = rc.bottom;
      });
      return { left: l, top: t, right: r, bottom: b };
    }

    // Use the GLYPH UNION rect (actual letter extents) — not the block rect,
    // which would cover the empty right-half of the title's row.
    const titleRect = rectToVp(glyphUnionRect(".cover-title .ch"));
    const panelEl = document.querySelector(".cover-panel");
    const panelRect = rectToVp(panelEl ? panelEl.getBoundingClientRect() : null);
    const eyebrowEl = document.querySelector(".cover .eyebrow");
    const eyebrowRect = rectToVp(eyebrowEl ? eyebrowEl.getBoundingClientRect() : null);
    const footEl = document.querySelector(".cover-foot");
    const footRect = rectToVp(footEl ? footEl.getBoundingClientRect() : null);
    const metaEl = document.querySelector(".cover-meta");
    const metaRect = rectToVp(metaEl ? metaEl.getBoundingClientRect() : null);

    function inRect(x, y, r) {
      if (!r) return false;
      return x >= r.x1 && x <= r.x2 && y >= r.y1 && y <= r.y2;
    }

    // Curated fallback positions in known-safe whitespace zones
    const fallbacks = [
      { x: 78, y: 24 }, { x: 86, y: 38 }, { x: 80, y: 52 },
      { x: 88, y: 70 }, { x: 11, y: 70 }, { x: 22, y: 78 },
      { x: 40, y: 80 }, { x: 60, y: 78 }, { x: 70, y: 28 },
      { x: 12, y: 22 }, { x: 26, y: 22 }, { x: 90, y: 24 },
      { x: 50, y: 18 }, { x: 30, y: 84 }
    ];

    for (let i = 0; i < TOKEN_TERMS.length; i++) {
      let x = 0, y = 0;
      let attempts = 0;
      let found = false;
      while (attempts < 80) {
        x = 6 + rnd() * 84;
        y = 14 + rnd() * 70;
        attempts++;
        const inLeftEdge = x < 7;
        const inRightEdge = x > 92;
        const collides = isWide && (
          inRect(x, y, titleRect) ||
          inRect(x, y, panelRect) ||
          inRect(x, y, eyebrowRect) ||
          inRect(x, y, footRect) ||
          inRect(x, y, metaRect)
        );
        if (!collides && !inLeftEdge && !inRightEdge) { found = true; break; }
      }
      if (!found) {
        // Fall back to a known-safe slot — cycle through to spread them out
        const fb = fallbacks[i % fallbacks.length];
        x = fb.x; y = fb.y;
      }
      placements.push({ x, y });
    }

    TOKEN_TERMS.forEach((term, i) => {
      const el = document.createElement("span");
      el.className = "tok" + (term.k ? " " + term.k : "");
      el.innerHTML = `<span class="dot">▸</span>${term.t}`;
      const p = placements[i];
      el.style.left = p.x + "vw";
      el.style.top = p.y + "vh";
      const alpha = 0.45 + rnd() * 0.4;
      el.style.setProperty("--tok-alpha", alpha.toFixed(2));
      // per-token drift parameters (kept small so seeded placements stay safe)
      const drift = {
        ax: (rnd() - 0.5) * 6,    // amplitude x (px)
        ay: (rnd() - 0.5) * 6,    // amplitude y
        sx: 0.0003 + rnd() * 0.0006,
        sy: 0.0003 + rnd() * 0.0006,
        ph: rnd() * Math.PI * 2,
        rot: (rnd() - 0.5) * 3,   // base rotation
        depth: 0.06 + rnd() * 0.18,  // parallax depth (gentler)
        x: p.x, y: p.y
      };
      host.appendChild(el);
      _tokens.push({ el, ...drift });
      // stagger reveal
      setTimeout(() => el.classList.add("in"), 900 + i * 75);
    });
  }

  /* ---------- Cover parallax: mouse + scroll, drives drift loop ---------- */
  let mouse = { x: 0.5, y: 0.5 };
  let scrollY = 0;

  function setupCoverParallax() {
    const cover = document.querySelector(".cover");
    if (!cover) return;
    const title = document.querySelector(".cover-title");
    const panel = document.querySelector(".cover-panel");
    const ridges = document.querySelector(".cover-bg-ridges");
    const orbits = document.querySelector(".cover-orbits");
    const aurora = document.querySelector(".cover-aurora");

    cover.addEventListener("mousemove", (e) => {
      const r = cover.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / r.width;
      mouse.y = (e.clientY - r.top) / r.height;
    });

    function onScroll() { scrollY = window.scrollY; }
    window.addEventListener("scroll", onScroll, { passive: true });

    function frame(t) {
      const time = t * 0.001;
      const mx = (mouse.x - 0.5);
      const my = (mouse.y - 0.5);
      const sp = Math.min(scrollY / window.innerHeight, 1.2);

      // Title floats faster, opposite mouse direction; rises with scroll
      if (title) {
        title.style.transform = `translate3d(${(-mx * 10).toFixed(2)}px, ${(-my * 8 - sp * 40).toFixed(2)}px, 0)`;
      }
      // Panel: subtle counter-parallax
      if (panel) {
        panel.style.transform = `translate3d(${(mx * 14).toFixed(2)}px, ${(my * 10 - sp * 20).toFixed(2)}px, 0)`;
      }
      // Ridges: strong parallax, slow drift
      if (ridges) {
        ridges.style.transform = `translate3d(${(mx * 36 + Math.sin(time * 0.3) * 6).toFixed(2)}px, ${(my * 26 - sp * 80).toFixed(2)}px, 0)`;
      }
      // Orbits: gentle drift, scroll fade
      if (orbits) {
        orbits.style.transform = `translate(-0%, -50%) translate3d(${(mx * 20).toFixed(2)}px, ${(my * 16).toFixed(2)}px, 0)`;
        orbits.style.opacity = Math.max(0, 0.42 - sp * 0.5).toFixed(2);
      }
      // Aurora: massive parallax, slow
      if (aurora) {
        aurora.style.transform = `translate3d(${(mx * 24).toFixed(2)}px, ${(my * 24 - sp * 30).toFixed(2)}px, 0)`;
      }

      // Token drift: float + mouse parallax
      for (let i = 0, n = _tokens.length; i < n; i++) {
        const tk = _tokens[i];
        const dx = Math.cos(time * 0.5 + tk.ph) * tk.ax + mx * 30 * tk.depth;
        const dy = Math.sin(time * 0.7 + tk.ph * 1.3) * tk.ay + my * 26 * tk.depth - sp * 80 * tk.depth;
        const rot = tk.rot + Math.sin(time * 0.4 + tk.ph) * 1.2;
        tk.el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)`;
        // Fade out as user scrolls past hero
        tk.el.style.opacity = (parseFloat(tk.el.style.getPropertyValue("--tok-alpha") || 0.7) * Math.max(0, 1 - sp * 1.2)).toFixed(2);
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Live identity-graph canvas behind cover ---------- */
  function setupGridCanvas() {
    const canvas = document.querySelector(".cover-grid-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, DPR;
    const NODES = 28;
    const pts = [];

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.parentElement.getBoundingClientRect();
      W = canvas.width = r.width * DPR;
      H = canvas.height = r.height * DPR;
      canvas.style.width = r.width + "px";
      canvas.style.height = r.height + "px";
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < NODES; i++) {
      pts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.18 * DPR,
        vy: (Math.random() - 0.5) * 0.18 * DPR,
        r: (0.8 + Math.random() * 1.2) * DPR,
        ph: Math.random() * Math.PI * 2
      });
    }
    const MAX = 180 * (window.devicePixelRatio || 1);
    let t = 0;

    function tick() {
      t += 0.01;
      ctx.clearRect(0, 0, W, H);

      // connecting lines
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX) {
            const alpha = (1 - d / MAX) * 0.16;
            // mix amber + iris by index
            const useIris = (i + j) % 5 === 0;
            ctx.strokeStyle = useIris
              ? `rgba(178, 152, 247, ${alpha})`
              : `rgba(245, 175, 100, ${alpha})`;
            ctx.lineWidth = 0.6 * DPR;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      // nodes
      pts.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        p.ph += 0.03;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        const glow = 0.55 + 0.45 * Math.sin(p.ph);
        const useIris = i % 6 === 0;
        ctx.fillStyle = useIris
          ? `rgba(178, 152, 247, ${0.45 * glow})`
          : `rgba(245, 175, 100, ${0.5 * glow})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 + 0.3 * glow), 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(tick);
    }
    tick();
  }

  /* ---------- Render orbit rings ---------- */
  function renderOrbits() {
    const host = document.querySelector(".cover-orbits");
    if (!host) return;
    host.innerHTML = `
      <div class="ring r1"><span class="marker"></span></div>
      <div class="ring r2"><span class="marker"></span></div>
      <div class="ring r3"><span class="marker"></span></div>
      <div class="ring r4"><span class="marker"></span></div>
    `;
  }

  /* ---------- Set issued date to TODAY ---------- */
  function setIssuedDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const monthsLong = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    const monthName = monthsLong[now.getMonth()];
    const monthFull = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"][now.getMonth()];
    const monthNum = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear());

    const isoShort = `${day} ${monthName} ${year}`;
    const dotted = `${day}·${monthNum}·${year}`;

    document.querySelectorAll("[data-issued-date]").forEach((el) => { el.textContent = isoShort; });
    document.querySelectorAll("[data-issued-strong]").forEach((el) => { el.textContent = dotted; });

    // Date flip-strip
    const flips = document.querySelectorAll(".cover-date-val .d-flip");
    if (flips.length >= 3) {
      flips[0].textContent = day;
      flips[0].setAttribute("data-day", day);
      flips[0].style.setProperty("--flip-delay", "1.5s");
      flips[1].textContent = monthName;
      flips[1].setAttribute("data-month", monthName);
      flips[1].style.setProperty("--flip-delay", "1.7s");
      flips[2].textContent = year;
      flips[2].setAttribute("data-year", year);
      flips[2].style.setProperty("--flip-delay", "1.9s");
    }

    // Patch the HUD edition label
    const edEl = document.querySelector("[data-hud-ed]");
    if (edEl) edEl.textContent = `ED. ${year}.${monthNum}`;
  }

  /* ---------- Cover panel 3D mouse-tilt ---------- */
  function setupPanelTilt() {
    const panel = document.querySelector(".cover-panel");
    const cover = document.querySelector(".cover");
    if (!panel || !cover) return;
    // Skip on touch / coarse pointers
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return;

    panel.classList.add("tilt-ready");
    let raf = 0;
    let targetX = 0, targetY = 0;
    let curX = 0, curY = 0;

    function loop() {
      curX += (targetX - curX) * 0.12;
      curY += (targetY - curY) * 0.12;
      panel.style.setProperty("--tilt-x", curX.toFixed(2) + "deg");
      panel.style.setProperty("--tilt-y", curY.toFixed(2) + "deg");
      if (Math.abs(targetX - curX) > 0.01 || Math.abs(targetY - curY) > 0.01) {
        raf = requestAnimationFrame(loop);
      } else { raf = 0; }
    }

    cover.addEventListener("mousemove", (e) => {
      const r = panel.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      // distance from panel center, normalized
      const dx = (e.clientX - cx) / (window.innerWidth / 2);
      const dy = (e.clientY - cy) / (window.innerHeight / 2);
      targetY = Math.max(-5, Math.min(5, dx * 4));
      targetX = Math.max(-5, Math.min(5, -dy * 4));
      if (!raf) raf = requestAnimationFrame(loop);
    });
    cover.addEventListener("mouseleave", () => {
      targetX = 0; targetY = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    });
  }

  /* ---------- Side-margin data-stream particles ---------- */
  function setupStreams() {
    const hosts = document.querySelectorAll(".cover-stream");
    hosts.forEach((host, hi) => {
      host.innerHTML = "";
      const N = 9;
      for (let i = 0; i < N; i++) {
        const b = document.createElement("span");
        const useIris = (i + hi) % 3 === 0;
        const small = i % 2 === 1;
        b.className = "blip" + (useIris ? " iris" : "") + (small ? " small" : "");
        const dur = (4 + Math.random() * 4.5).toFixed(2);
        const delay = (Math.random() * 5).toFixed(2);
        b.style.setProperty("--dur", dur + "s");
        b.style.setProperty("--delay", delay + "s");
        host.appendChild(b);
      }
    });
  }

  /* ---------- Duplicate ticker items for seamless loop ---------- */
  function setupTicker() {
    const track = document.querySelector(".hud-ticker-track");
    if (!track) return;
    track.innerHTML += track.innerHTML;
  }

  /* ---------- init ---------- */
  function init() {
    setIssuedDate();
    setupTicker();
    splitCoverTitle();
    animateCoverTitle();
    setupScanline();
    setupReveals();
    setupCounters();
    setupHud();
    drawRidges();
    drawReticle();
    renderOrbits();
    setupStreams();
    setupPanelTilt();
    // Poll the glyph union width until it has been stable across several
    // frames — this is the only reliable signal that the real italic
    // Instrument Serif has rendered at this size (document.fonts.load resolves
    // earlier than the actual paint at 200px, and ResizeObserver on the title
    // block never fires because the block width doesn't change when only the
    // inner .ch widths do). Once stable, place tokens; observe any .ch for
    // future font swaps / resizes.
    function placeTokensWhenStable() {
      let lastW = -1;
      let stableTicks = 0;
      let elapsed = 0;
      const POLL_MS = 80;
      const MAX_MS = 5000;  // hard cap — always place tokens eventually

      function measure() {
        const chs = document.querySelectorAll(".cover-title .ch");
        if (!chs.length) return -1;
        let l = Infinity, r = -Infinity;
        chs.forEach((c) => {
          const rc = c.getBoundingClientRect();
          if (rc.width === 0) return;
          if (rc.left < l) l = rc.left;
          if (rc.right > r) r = rc.right;
        });
        return (r > l) ? (r - l) : -1;
      }

      function placeAndObserve() {
        setupTokens();
        if (typeof ResizeObserver !== "undefined") {
          const chs = document.querySelectorAll(".cover-title .ch");
          if (chs.length) {
            const target = chs[chs.length - 1];
            let lw = target.getBoundingClientRect().width;
            const ro = new ResizeObserver(() => {
              const nw = target.getBoundingClientRect().width;
              if (Math.abs(nw - lw) > 0.5) { lw = nw; setupTokens(); }
            });
            ro.observe(target);
          }
        }
      }

      const iv = setInterval(() => {
        elapsed += POLL_MS;
        const w = measure();
        if (w > 0 && Math.abs(w - lastW) < 0.5) {
          stableTicks++;
          if (stableTicks >= 3) {
            clearInterval(iv);
            placeAndObserve();
            return;
          }
        } else {
          stableTicks = 0;
          lastW = w;
        }
        if (elapsed >= MAX_MS) {
          clearInterval(iv);
          placeAndObserve();
        }
      }, POLL_MS);

      // Prime the font loader (best-effort) — doesn't gate, just hints
      if (document.fonts && document.fonts.load) {
        document.fonts.load("400 200px 'Instrument Serif'").catch(() => {});
        document.fonts.load("italic 400 200px 'Instrument Serif'").catch(() => {});
      }
    }
    placeTokensWhenStable();
    setupGridCanvas();
    setupCoverParallax();
    setupArsenal();
    setupContact();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
