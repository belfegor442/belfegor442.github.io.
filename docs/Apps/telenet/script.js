const clock = document.querySelector("#clock");
const platformReadout = document.querySelector("#platformReadout");
const canvas = document.querySelector("#signalCanvas");
const ctx = canvas.getContext("2d");
const promptForm = document.querySelector("#promptForm");
const promptInput = document.querySelector("#promptInput");
const consoleOutput = document.querySelector("#consoleOutput");

const teletextPalette = [
  "#000000",
  "#ffffff",
  "#ff0000",
  "#00ff00",
  "#ffff00",
  "#0000ff",
  "#ff00ff",
  "#00ffff",
];

function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString("en-GB", { hour12: false });
  clock.textContent = time;
  clock.dateTime = now.toISOString();
}

function detectPlatform() {
  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();

  if (platform.includes("win")) return "WINDOWS";
  if (platform.includes("linux") || userAgent.includes("linux")) return "LINUX";
  return "DESKTOP";
}

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * pixelRatio);
  canvas.height = Math.floor(window.innerHeight * pixelRatio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function drawSignalFrame(frame) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const cell = 24;
  const rows = Math.ceil(height / cell);
  const cols = Math.ceil(width / cell);

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const wave = (x * 7 + y * 11 + frame) % 37;
      if (wave === 0 || wave === 7 || wave === 19) {
        const colorIndex = (x + y + Math.floor(frame / 6)) % teletextPalette.length;
        ctx.fillStyle = teletextPalette[colorIndex];
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }

  ctx.fillStyle = "#0000ff";
  ctx.fillRect(0, 0, width, 42);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px Courier New, monospace";
  ctx.fillText("TELENET 100  AI TELETEXT SERVICE", 18, 27);

  ctx.fillStyle = "#ffff00";
  ctx.fillText("PAGE 100", width - 118, 27);

  const cursorX = 20 + ((frame * 3) % Math.max(80, width - 160));
  ctx.fillStyle = "#00ff00";
  ctx.fillRect(cursorX, height - 54, 18, 28);
}

let frame = 0;
let lastDraw = 0;

function animateSignal(timestamp) {
  if (timestamp - lastDraw > 90) {
    drawSignalFrame(frame);
    frame += 1;
    lastDraw = timestamp;
  }
  requestAnimationFrame(animateSignal);
}

function formatPromptResponse(prompt) {
  const cleanPrompt = prompt.trim().toUpperCase();
  const pageId = String(200 + (cleanPrompt.length % 70)).padStart(3, "0");

  return `TELENET PAGE ${pageId}
AI CHANNEL RESPONSE

QUERY:
${cleanPrompt}

RESULTS:
101  FAST SUMMARY READY
202  RELATED SIGNALS FOUND
303  SAVE THIS PAGE TO YOUR STACK

STATUS:
CLEAR SIGNAL / LOW NOISE / RETRO MODE ACTIVE`;
}

promptForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const prompt = promptInput.value || "WHAT CAN TELENET DO?";
  consoleOutput.textContent = formatPromptResponse(prompt);
  promptInput.value = "";
});

window.addEventListener("resize", () => {
  resizeCanvas();
  drawSignalFrame(frame);
});

updateClock();
setInterval(updateClock, 1000);
platformReadout.textContent = detectPlatform();
resizeCanvas();
requestAnimationFrame(animateSignal);
