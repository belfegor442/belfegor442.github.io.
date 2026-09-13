(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const clock = $("#clock");
  const platformReadout = $("#platformReadout");
  const canvas = $("#signalCanvas");
  const promptForm = $("#promptForm");
  const promptInput = $("#promptInput");
  const consoleOutput = $("#consoleOutput");

  if (!clock || !platformReadout || !canvas || !promptForm || !promptInput || !consoleOutput) {
    console.warn("[TELENET] Required UI nodes are missing.");
    return;
  }

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    console.error("[TELENET] Canvas 2D context is unavailable.");
    return;
  }

  const teletextPalette = [
    "#000000", "#ffffff", "#ff0000", "#00ff00",
    "#ffff00", "#0000ff", "#ff00ff", "#00ffff",
  ];

  const state = {
    frame: 0,
    lastDraw: 0,
    animationId: 0,
    clockInterval: 0,
    width: 0,
    height: 0,
    reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    visible: !document.hidden,
  };

  function updateClock() {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });
    clock.dateTime = now.toISOString();
  }

  function detectPlatform() {
    const ua = navigator.userAgent.toLowerCase();
    const platform = (navigator.userAgentData?.platform || navigator.platform || "").toLowerCase();
    if (platform.includes("win") || ua.includes("windows")) return "WINDOWS";
    if (platform.includes("mac") || ua.includes("mac os")) return "MACOS";
    if (platform.includes("linux") || ua.includes("linux")) return "LINUX";
    if (ua.includes("android")) return "ANDROID";
    if (/iphone|ipad|ipod/.test(ua)) return "IOS";
    return "DESKTOP";
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    state.width = Math.max(1, Math.floor(rect.width || window.innerWidth));
    state.height = Math.max(1, Math.floor(rect.height || window.innerHeight));
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(state.width * pixelRatio);
    canvas.height = Math.floor(state.height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    drawSignalFrame(state.frame);
  }

  function drawSignalFrame(frame) {
    const { width, height } = state;
    const cell = 24;
    const rows = Math.ceil(height / cell);
    const cols = Math.ceil(width / cell);

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const wave = (x * 7 + y * 11 + frame) % 37;
        if (wave !== 0 && wave !== 7 && wave !== 19) continue;
        const colorIndex = (x + y + Math.floor(frame / 6)) % teletextPalette.length;
        ctx.fillStyle = teletextPalette[colorIndex];
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    ctx.fillStyle = "#0000ff";
    ctx.fillRect(0, 0, width, 42);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Courier New, monospace";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("TELENET 100  AI TELETEXT SERVICE", 18, 27);

    ctx.fillStyle = "#ffff00";
    ctx.fillText("PAGE 100", Math.max(18, width - 118), 27);

    const cursorRange = Math.max(80, width - 160);
    const cursorX = 20 + ((frame * 3) % cursorRange);
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(Math.min(cursorX, Math.max(0, width - 18)), Math.max(42, height - 54), 18, 28);
  }

  function animateSignal(timestamp) {
    if (!state.visible) {
      state.animationId = 0;
      return;
    }
    if (timestamp - state.lastDraw >= 90) {
      state.frame += 1;
      drawSignalFrame(state.frame);
      state.lastDraw = timestamp;
    }
    state.animationId = window.requestAnimationFrame(animateSignal);
  }

  function startAnimation() {
    if (state.reducedMotion || state.animationId || !state.visible) {
      drawSignalFrame(state.frame);
      return;
    }
    state.lastDraw = performance.now();
    state.animationId = window.requestAnimationFrame(animateSignal);
  }

  function stopAnimation() {
    if (!state.animationId) return;
    window.cancelAnimationFrame(state.animationId);
    state.animationId = 0;
  }

  function formatPromptResponse(prompt) {
    const cleanPrompt = prompt.trim().replace(/\s+/g, " ").slice(0, 240).toUpperCase();
    const safePrompt = cleanPrompt || "WHAT CAN TELENET DO?";
    const pageId = String(200 + (safePrompt.length % 70)).padStart(3, "0");
    return [
      `TELENET PAGE ${pageId}`,
      "AI CHANNEL RESPONSE", "", "QUERY:", safePrompt, "",
      "RESULTS:",
      "101  FAST SUMMARY READY",
      "202  RELATED SIGNALS FOUND",
      "303  SAVE THIS PAGE TO YOUR STACK",
      "",
      "STATUS:",
      "CLEAR SIGNAL / LOW NOISE / RETRO MODE ACTIVE",
    ].join("\n");
  }

  function handlePromptSubmit(event) {
    event.preventDefault();
    consoleOutput.textContent = formatPromptResponse(promptInput.value);
    promptInput.value = "";
    promptInput.focus();
  }

  function handleVisibilityChange() {
    state.visible = !document.hidden;
    state.visible ? startAnimation() : stopAnimation();
  }

  function handleReducedMotionChange(event) {
    state.reducedMotion = event.matches;
    if (state.reducedMotion) {
      stopAnimation();
      drawSignalFrame(state.frame);
    } else {
      startAnimation();
    }
  }

  promptForm.addEventListener("submit", handlePromptSubmit);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("resize", resizeCanvas, { passive: true });

  const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  motionQuery?.addEventListener?.("change", handleReducedMotionChange);

  updateClock();
  state.clockInterval = window.setInterval(updateClock, 1000);
  platformReadout.textContent = detectPlatform();
  resizeCanvas();
  startAnimation();

  window.addEventListener("pagehide", () => {
    stopAnimation();
    window.clearInterval(state.clockInterval);
    motionQuery?.removeEventListener?.("change", handleReducedMotionChange);
  }, { once: true });
})();
