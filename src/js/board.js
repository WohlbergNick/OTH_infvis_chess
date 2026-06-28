const BOARD_SIZE = 8;
const FILES = ["a","b","c","d","e","f","g","h"];
const RANKS = ["8","7","6","5","4","3","2","1"];

// Responsiv: maximal 80px pro Feld, aber passt sich ans Gerät an
const maxBoard = Math.min(document.documentElement.clientWidth, document.documentElement.clientHeight, 640);
const CELL_SIZE = Math.floor(maxBoard * 0.95 / BOARD_SIZE);

document.documentElement.style.setProperty('--board-size', `${CELL_SIZE * BOARD_SIZE}px`);

function initBoard(canvasId) {
  const canvas = document.getElementById(canvasId);
  canvas.width  = CELL_SIZE * BOARD_SIZE;
  canvas.height = CELL_SIZE * BOARD_SIZE;
  return canvas.getContext("2d");
}

function drawBoard(ctx) {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const isLight = (row + col) % 2 === 0;
      ctx.fillStyle = isLight ? "#f0d9b5" : "#b58863";
      ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }
}

function drawLabels(ctx) {
  ctx.textBaseline = "alphabetic";
  ctx.textAlign    = "left";
  ctx.fillStyle    = "#333";
  ctx.font         = "12px sans-serif";

  for (let i = 0; i < BOARD_SIZE; i++) {
    ctx.fillText(RANKS[i], 4, i * CELL_SIZE + CELL_SIZE / 2);
    ctx.textAlign = "center";
    ctx.fillText(FILES[i], i * CELL_SIZE + CELL_SIZE / 2, BOARD_SIZE * CELL_SIZE - 6);
    ctx.textAlign = "left";
  }
}

function squareToColRow(squareName) {
  const file = squareName.charCodeAt(0) - 97;
  const rank = 8 - parseInt(squareName[1]);
  return { col: file, row: rank };
}

function highlightOrigin(ctx, square) {
  const { col, row } = squareToColRow(square);
  const x = col * CELL_SIZE;
  const y = row * CELL_SIZE;

  ctx.fillStyle = "rgba(80, 200, 100, 0.2)";
  ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

  ctx.strokeStyle = "rgba(80, 200, 100, 0.45)";
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 1.5, y + 1.5, CELL_SIZE - 3, CELL_SIZE - 3);
}

function drawLegend(minCount, maxCount) {
  const canvas = document.getElementById("legend");
  const W = CELL_SIZE * BOARD_SIZE;
  const H = 32;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const steps = W;
  for (let i = 0; i < steps; i++) {
    ctx.fillStyle = colorScaleCSS(i / (steps - 1));
    ctx.fillRect(i, 0, 1, H - 14);
  }

  ctx.fillStyle = "#f0d9b5";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(minCount.toLocaleString(), 0, H);
  ctx.textAlign = "right";
  ctx.fillText(maxCount.toLocaleString(), W, H);
}

function drawArrow(ctx, fromSquare, toSquare) {
  const f = squareToColRow(fromSquare);
  const t = squareToColRow(toSquare);

  const x1 = f.col * CELL_SIZE + CELL_SIZE / 2;
  const y1 = f.row * CELL_SIZE + CELL_SIZE / 2;
  const x2 = t.col * CELL_SIZE + CELL_SIZE / 2;
  const y2 = t.row * CELL_SIZE + CELL_SIZE / 2;

  const angle  = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 14;
  const shorten = CELL_SIZE * 0.3;

  const ex = x2 - Math.cos(angle) * shorten;
  const ey = y2 - Math.sin(angle) * shorten;
  const sx = x1 + Math.cos(angle) * shorten;
  const sy = y1 + Math.sin(angle) * shorten;

  ctx.strokeStyle = "rgba(255, 220, 50, 0.85)";
  ctx.fillStyle   = "rgba(255, 220, 50, 0.85)";
  ctx.lineWidth   = 3;

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  // Pfeilspitze
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - headLen * Math.cos(angle - Math.PI / 6), ey - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(ex - headLen * Math.cos(angle + Math.PI / 6), ey - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function drawSearchHeatmap(ctx, heatmap) {
  const fromSquares = new Set(Object.values(heatmap).map(d => d.from).filter(Boolean));

  // from-Felder nur leicht umrahmen
  for (const sq of fromSquares) {
    const { col, row } = squareToColRow(sq);
    ctx.strokeStyle = "rgba(80, 200, 100, 0.55)";
    ctx.lineWidth = 2;
    ctx.strokeRect(col * CELL_SIZE + 1, row * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  }

  for (const [toSq, data] of Object.entries(heatmap)) {
    const { col, row } = squareToColRow(toSq);

    ctx.fillStyle   = colorScaleCSS(data.norm);
    ctx.globalAlpha = 0.75;
    ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.globalAlpha = 1.0;

    if (data.from) drawArrow(ctx, data.from, toSq);
  }
}

function initToggle() {
  const boardH = CELL_SIZE * BOARD_SIZE;
  const thumb  = document.getElementById("toggle-thumb");
  const track  = document.getElementById("toggle-track");
  const ticks  = document.querySelectorAll(".tick");
  const pad    = 4;
  const thumbH = 20;

  track.style.height = `${boardH}px`;

  const positions = {
    "-1": pad,
    "0":  (boardH - thumbH) / 2,
    "1":  boardH - thumbH - pad,
  };

  // CSS variablen für die drei States setzen
  const style = document.createElement("style");
  style.textContent = `
    #toggle-thumb[data-state="1"]  { top: ${positions["1"]}px; }
    #toggle-thumb[data-state="0"]  { top: ${positions["0"]}px; }
    #toggle-thumb[data-state="-1"] { top: ${positions["-1"]}px; }
  `;
  document.head.appendChild(style);

  // Tick-Positionen
  const tickPositions = [pad + thumbH / 2, boardH / 2, boardH - pad - thumbH / 2];
  ticks.forEach((tick, i) => {
    tick.style.top = `${tickPositions[i]}px`;
  });

  // Startzustand
  thumb.dataset.state = "0";
}