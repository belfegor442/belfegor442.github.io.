// ============================================================
//  WEIRD STUFF - script.js
// ============================================================

// ============================================================
//  DOT FIELD BACKGROUND (vanilla JS port of React DotField)
// ============================================================
(function() {
  const container = document.getElementById('dotfield');
  if (!container) return;

  const TWO_PI = Math.PI * 2;
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d', { alpha: true });

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
  container.appendChild(svg);

  const glowId = 'dot-field-glow-' + Math.random().toString(36).slice(2, 9);
  svg.innerHTML = `<defs><radialGradient id="${glowId}"><stop offset="0%" stop-color="#120F17"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs><circle cx="-9999" cy="-9999" r="160" fill="url(#${glowId})" style="opacity:0;will-change:opacity;"/>`;
  const glowEl = svg.querySelector('circle');

  const opts = {
    dotRadius: 1.5,
    dotSpacing: 14,
    cursorRadius: 500,
    bulgeStrength: 67,
    glowRadius: 160,
    sparkle: false,
    waveAmplitude: 0,
    gradientFrom: 'rgba(168, 85, 247, 0.35)',
    gradientTo: 'rgba(180, 151, 207, 0.25)',
  };

  let dots = [];
  let mouse = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
  let size = { w: 0, h: 0, offsetX: 0, offsetY: 0 };
  let glowOpacity = 0;
  let engagement = 0;
  let frameCount = 0;
  let raf;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    size = { w, h, offsetX: 0, offsetY: 0 };
    buildDots(w, h);
  }

  function buildDots(w, h) {
    const step = opts.dotRadius + opts.dotSpacing;
    const cols = Math.floor(w / step);
    const rows = Math.floor(h / step);
    const padX = (w % step) / 2;
    const padY = (h % step) / 2;
    dots = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const ax = padX + col * step + step / 2;
        const ay = padY + row * step + step / 2;
        dots.push({ ax, ay, sx: ax, sy: ay, vx: 0, vy: 0 });
      }
    }
  }

  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }

  setInterval(() => {
    const dx = mouse.prevX - mouse.x;
    const dy = mouse.prevY - mouse.y;
    mouse.speed += (Math.sqrt(dx * dx + dy * dy) - mouse.speed) * 0.5;
    if (mouse.speed < 0.001) mouse.speed = 0;
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
  }, 20);

  function tick() {
    frameCount++;
    const { w, h } = size;
    const t = frameCount * 0.02;
    const len = dots.length;

    const targetEng = Math.min(mouse.speed / 5, 1);
    engagement += (targetEng - engagement) * 0.06;
    if (engagement < 0.001) engagement = 0;

    glowOpacity += (engagement - glowOpacity) * 0.08;

    glowEl.setAttribute('cx', mouse.x);
    glowEl.setAttribute('cy', mouse.y);
    glowEl.style.opacity = glowOpacity;

    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, opts.gradientFrom);
    grad.addColorStop(1, opts.gradientTo);
    ctx.fillStyle = grad;

    const crSq = opts.cursorRadius * opts.cursorRadius;
    const rad = opts.dotRadius / 2;

    ctx.beginPath();
    for (let i = 0; i < len; i++) {
      const d = dots[i];
      const dx = mouse.x - d.ax;
      const dy = mouse.y - d.ay;
      const distSq = dx * dx + dy * dy;

      if (distSq < crSq && engagement > 0.01) {
        const dist = Math.sqrt(distSq);
        const t2 = 1 - dist / opts.cursorRadius;
        const push = t2 * t2 * opts.bulgeStrength * engagement;
        const angle = Math.atan2(dy, dx);
        d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
        d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
      } else {
        d.sx += (d.ax - d.sx) * 0.1;
        d.sy += (d.ay - d.sy) * 0.1;
      }

      let drawX = d.sx;
      let drawY = d.sy;
      if (opts.waveAmplitude > 0) {
        drawY += Math.sin(d.ax * 0.03 + t) * opts.waveAmplitude;
        drawX += Math.cos(d.ay * 0.03 + t * 0.7) * opts.waveAmplitude * 0.5;
      }

      if (opts.sparkle) {
        const hash = ((i * 2654435761) ^ (frameCount >> 3)) >>> 0;
        const r = (hash % 100) < 3 ? rad * 1.8 : rad;
        ctx.moveTo(drawX + r, drawY);
        ctx.arc(drawX, drawY, r, 0, TWO_PI);
      } else {
        ctx.moveTo(drawX + rad, drawY);
        ctx.arc(drawX, drawY, rad, 0, TWO_PI);
      }
    }
    ctx.fill();

    raf = requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  resize();
  raf = requestAnimationFrame(tick);
})();

// --- CURSOR ---
const cur = document.getElementById('cursor');
const trail = document.getElementById('cursor-trail');
let mx = 0, my = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;
  cur.style.left = mx + 'px';
  cur.style.top = my + 'px';
});

setInterval(() => {
  trail.style.left = mx + 'px';
  trail.style.top = my + 'px';
}, 80);

document.querySelectorAll('a, .btn, .team-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cur.classList.add('hovering');
    trail.classList.add('hovering');
  });
  el.addEventListener('mouseleave', () => {
    cur.classList.remove('hovering');
    trail.classList.remove('hovering');
  });
});

// ============================================================
//  HERO VARIABLE PROXIMITY (vanilla JS port of React Bits VariableProximity)
// ============================================================
(function() {
  const container = document.getElementById('hero-proximity');
  if (!container) return;

  const text = "We got bored and we decided to make these things.";
  const fromSettings = "'wght' 400, 'opsz' 9";
  const toSettings = "'wght' 1000, 'opsz' 40";
  const radius = 120;
  const falloff = 'exponential';

  const parseSettings = str => new Map(
    str.split(',').map(s => s.trim()).map(s => {
      const [name, value] = s.split(' ');
      return [name.replace(/['"]/g, ''), parseFloat(value)];
    })
  );

  const fromMap = parseSettings(fromSettings);
  const toMap = parseSettings(toSettings);
  const axes = Array.from(fromMap.entries()).map(([axis, fromValue]) => ({
    axis, fromValue, toValue: toMap.get(axis) ?? fromValue
  }));

  const calcFalloff = distance => {
    const norm = Math.min(Math.max(1 - distance / radius, 0), 1);
    switch (falloff) {
      case 'exponential': return norm ** 2;
      case 'gaussian': return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
      default: return norm;
    }
  };

  const words = text.split(' ');
  const letterRefs = [];
  let idx = 0;

  words.forEach((word, wi) => {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'proximity-word';

    word.split('').forEach(letter => {
      const span = document.createElement('span');
      span.className = 'proximity-letter';
      span.textContent = letter;
      span.setAttribute('aria-hidden', 'true');
      letterRefs[idx++] = span;
      wordSpan.appendChild(span);
    });

    container.appendChild(wordSpan);
    if (wi < words.length - 1) {
      const space = document.createElement('span');
      space.className = 'proximity-word';
      space.innerHTML = '&nbsp;';
      container.appendChild(space);
    }
  });

  const srOnly = document.createElement('span');
  srOnly.className = 'proximity-sr-only';
  srOnly.textContent = text;
  container.appendChild(srOnly);

  let mouseX = 0, mouseY = 0;

  container.addEventListener('mousemove', e => {
    const rect = container.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  container.addEventListener('mouseleave', () => {
    letterRefs.forEach(el => {
      if (el) el.style.fontVariationSettings = fromSettings;
    });
  });

  function tick() {
    const containerRect = container.getBoundingClientRect();

    letterRefs.forEach(el => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2 - containerRect.left;
      const cy = rect.top + rect.height / 2 - containerRect.top;
      const dist = Math.sqrt((mouseX - cx) ** 2 + (mouseY - cy) ** 2);

      if (dist >= radius) {
        el.style.fontVariationSettings = fromSettings;
        return;
      }

      const f = calcFalloff(dist);
      const settings = axes.map(({ axis, fromValue, toValue }) => {
        const v = fromValue + (toValue - fromValue) * f;
        return `'${axis}' ${v}`;
      }).join(', ');
      el.style.fontVariationSettings = settings;
    });

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();

// ============================================================
//  SCROLL REVEAL
// ============================================================
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });

document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));

// ============================================================
//  STRETCH BUTTONS
// ============================================================
document.querySelectorAll('.btn-stretch').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const dx = (x - cx) / cx;
    const dy = (y - cy) / cy;

    const scaleX = 1 + Math.abs(dx) * 0.35;
    const scaleY = 1 - Math.abs(dy) * 0.15;
    const skewX = dx * 4;

    btn.style.transform = `scaleX(${scaleX}) scaleY(${scaleY}) skewX(${skewX}deg)`;
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});

// Project ripple
document.querySelectorAll('.project').forEach(proj => {
  proj.addEventListener('mouseenter', () => {
    const r = document.createElement('div');
    r.style.cssText = 'position:absolute;top:50%;left:50%;width:0;height:0;border-radius:50%;background:rgba(168,85,247,0.1);transform:translate(-50%,-50%);pointer-events:none;transition:width .6s,height .6s,opacity .6s';
    proj.appendChild(r);
    requestAnimationFrame(() => { r.style.width='300px'; r.style.height='300px'; r.style.opacity='0'; });
    setTimeout(() => r.remove(), 700);
  });
});

// ============================================================
//  ELECTRIC BORDER (vanilla JS port of React Bits ElectricBorder)
// ============================================================
(function() {
  const random = x => (Math.sin(x * 12.9898) * 43758.5453) % 1;

  function noise2D(x, y) {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;
    const a = random(i + j * 57);
    const b = random(i + 1 + j * 57);
    const c = random(i + (j + 1) * 57);
    const d = random(i + 1 + (j + 1) * 57);
    const ux = fx * fx * (3.0 - 2.0 * fx);
    const uy = fy * fy * (3.0 - 2.0 * fy);
    return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
  }

  function octavedNoise(x, octaves, lacunarity, gain, baseAmplitude, baseFrequency, time, seed, baseFlatness) {
    let y = 0;
    let amplitude = baseAmplitude;
    let frequency = baseFrequency;
    for (let i = 0; i < octaves; i++) {
      let octaveAmplitude = amplitude;
      if (i === 0) octaveAmplitude *= baseFlatness;
      y += octaveAmplitude * noise2D(frequency * x + seed * 100, time * frequency * 0.3);
      frequency *= lacunarity;
      amplitude *= gain;
    }
    return y;
  }

  function getCornerPoint(cx, cy, radius, startAngle, arcLength, progress) {
    const angle = startAngle + progress * arcLength;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  }

  function getRoundedRectPoint(t, left, top, width, height, radius) {
    const straightWidth = width - 2 * radius;
    const straightHeight = height - 2 * radius;
    const cornerArc = (Math.PI * radius) / 2;
    const totalPerimeter = 2 * straightWidth + 2 * straightHeight + 4 * cornerArc;
    const distance = t * totalPerimeter;
    let accumulated = 0;

    if (distance <= accumulated + straightWidth) {
      const p = (distance - accumulated) / straightWidth;
      return { x: left + radius + p * straightWidth, y: top };
    }
    accumulated += straightWidth;

    if (distance <= accumulated + cornerArc) {
      const p = (distance - accumulated) / cornerArc;
      return getCornerPoint(left + width - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, p);
    }
    accumulated += cornerArc;

    if (distance <= accumulated + straightHeight) {
      const p = (distance - accumulated) / straightHeight;
      return { x: left + width, y: top + radius + p * straightHeight };
    }
    accumulated += straightHeight;

    if (distance <= accumulated + cornerArc) {
      const p = (distance - accumulated) / cornerArc;
      return getCornerPoint(left + width - radius, top + height - radius, radius, 0, Math.PI / 2, p);
    }
    accumulated += cornerArc;

    if (distance <= accumulated + straightWidth) {
      const p = (distance - accumulated) / straightWidth;
      return { x: left + width - radius - p * straightWidth, y: top + height };
    }
    accumulated += straightWidth;

    if (distance <= accumulated + cornerArc) {
      const p = (distance - accumulated) / cornerArc;
      return getCornerPoint(left + radius, top + height - radius, radius, Math.PI / 2, Math.PI / 2, p);
    }
    accumulated += cornerArc;

    if (distance <= accumulated + straightHeight) {
      const p = (distance - accumulated) / straightHeight;
      return { x: left, y: top + height - radius - p * straightHeight };
    }
    accumulated += straightHeight;

    const p = (distance - accumulated) / cornerArc;
    return getCornerPoint(left + radius, top + radius, radius, Math.PI, Math.PI / 2, p);
  }

  document.querySelectorAll('.electric-border').forEach(container => {
    const canvas = container.querySelector('.eb-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const color = container.dataset.color || '#5227FF';
    const speed = parseFloat(container.dataset.speed) || 1;
    const chaos = parseFloat(container.dataset.chaos) || 0.12;
    const borderRadius = parseInt(container.dataset.borderRadius) || 24;

    container.style.setProperty('--electric-border-color', color);

    const octaves = 10;
    const lacunarity = 1.6;
    const gain = 0.7;
    const frequency = 10;
    const baseFlatness = 0;
    const displacement = 60;
    const borderOffset = 60;

    let time = 0;
    let lastFrameTime = 0;
    let animId = null;
    let width, height;

    function updateSize() {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width + borderOffset * 2;
      height = rect.height + borderOffset * 2;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(currentTime) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const deltaTime = (currentTime - lastFrameTime) / 1000;
      time += deltaTime * speed;
      lastFrameTime = currentTime;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const left = borderOffset;
      const top = borderOffset;
      const borderWidth = width - 2 * borderOffset;
      const borderHeight = height - 2 * borderOffset;
      const maxRadius = Math.min(borderWidth, borderHeight) / 2;
      const radius = Math.min(borderRadius, maxRadius);

      const approximatePerimeter = 2 * (borderWidth + borderHeight) + 2 * Math.PI * radius;
      const sampleCount = Math.floor(approximatePerimeter / 2);

      ctx.beginPath();

      for (let i = 0; i <= sampleCount; i++) {
        const progress = i / sampleCount;
        const point = getRoundedRectPoint(progress, left, top, borderWidth, borderHeight, radius);

        const xNoise = octavedNoise(
          progress * 8, octaves, lacunarity, gain, chaos, frequency, time, 0, baseFlatness
        );
        const yNoise = octavedNoise(
          progress * 8, octaves, lacunarity, gain, chaos, frequency, time, 1, baseFlatness
        );

        const dx = point.x + xNoise * displacement;
        const dy = point.y + yNoise * displacement;

        if (i === 0) ctx.moveTo(dx, dy);
        else ctx.lineTo(dx, dy);
      }

      ctx.closePath();
      ctx.stroke();

      animId = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(() => updateSize());
    ro.observe(container);

    updateSize();
    animId = requestAnimationFrame(draw);

    container._ebCleanup = () => {
      if (animId) cancelAnimationFrame(animId);
      ro.disconnect();
    };
  });
})();

// ============================================================
//  GRADUAL BLUR (vanilla JS port of React Bits GradualBlur)
// ============================================================
(function() {
  const CURVE = {
    linear: p => p,
    bezier: p => p * p * (3 - 2 * p),
    'ease-in': p => p * p,
    'ease-out': p => 1 - Math.pow(1 - p, 2),
  };

  function createGradualBlur(el, opts) {
    const position = opts.position || 'bottom';
    const strength = opts.strength || 2;
    const height = opts.height || '6rem';
    const divCount = opts.divCount || 5;
    const exponential = opts.exponential || false;
    const curveFunc = CURVE[opts.curve] || CURVE.linear;
    const opacity = opts.opacity || 1;

    el.style.height = height;
    el.innerHTML = '';

    const inner = document.createElement('div');
    inner.className = 'gradual-blur-inner';
    inner.style.cssText = 'position:relative;width:100%;height:100%;';

    const increment = 100 / divCount;
    const directions = { top: 'to top', bottom: 'to bottom', left: 'to left', right: 'to right' };
    const dir = directions[position] || 'to bottom';

    for (let i = 1; i <= divCount; i++) {
      let progress = curveFunc(i / divCount);

      let blurValue;
      if (exponential) {
        blurValue = Math.pow(2, progress * 4) * 0.0625 * strength;
      } else {
        blurValue = 0.0625 * (progress * divCount + 1) * strength;
      }

      const p1 = Math.round((increment * i - increment) * 10) / 10;
      const p2 = Math.round(increment * i * 10) / 10;
      const p3 = Math.round((increment * i + increment) * 10) / 10;
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      const div = document.createElement('div');
      div.style.cssText = `
        position: absolute; inset: 0;
        mask-image: linear-gradient(${dir}, ${gradient});
        -webkit-mask-image: linear-gradient(${dir}, ${gradient});
        backdrop-filter: blur(${blurValue.toFixed(3)}rem);
        -webkit-backdrop-filter: blur(${blurValue.toFixed(3)}rem);
        opacity: ${opacity};
      `;
      inner.appendChild(div);
    }

    el.appendChild(inner);

    setTimeout(() => el.classList.add('visible'), 100);
  }

  createGradualBlur(document.getElementById('blur-bottom'), {
    position: 'bottom', strength: 2, height: '8rem', divCount: 5, curve: 'bezier', exponential: true, opacity: 1
  });
})();
