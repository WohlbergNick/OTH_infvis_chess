const ctx     = initBoard("chessboard");
initToggle();
drawLegend(0, 100);
const tooltip = initTooltip("tooltip");
const canvas  = document.getElementById("chessboard");

let allMoves     = [];
let currentData  = {};
let filters      = {};
let colorState   = 0;
let moveNr       = null;
let activeOrigin = null;
let showMoveHeatmap = false;
let showWinRate     = false;
let showDominance   = false;

// Modi: "stellung" oder "figur"
const MODES = ["stellung", "figur"];
let modeIndex = 0;

const moveNrInput = document.getElementById("movenr-display");
const originInput = document.getElementById("origin-value");

function currentMode() { return MODES[modeIndex]; }

function setMode(index) {
  modeIndex = ((index % MODES.length) + MODES.length) % MODES.length;
  const labels = { stellung: "Stellungsanalyse", figur: "Figurenanalyse" };
  document.getElementById("mode-label").textContent = labels[currentMode()];

  document.getElementById("figur-controls").classList.toggle("hidden", currentMode() !== "figur");
  document.getElementById("stellung-controls").classList.toggle("hidden", currentMode() !== "stellung");

  const isFigur = currentMode() === "figur";
  const activeTab = document.querySelector(".tab.active")?.dataset.tab || "2d";
  const show2d = activeTab === "2d" || activeTab === "both";

  document.getElementById("right-controls").classList.toggle("visible", isFigur);
  document.getElementById("captured-sidebar").classList.toggle("visible", !isFigur && show2d);
  document.getElementById("best-move").style.display = !isFigur ? "block" : "none";


  redrawAll();
}

document.getElementById("mode-prev").addEventListener("click", () => setMode(modeIndex - 1));
document.getElementById("mode-next").addEventListener("click", () => setMode(modeIndex + 1));

// ── Zeichnen ──────────────────────────────────────────────────────────────────
function hasActiveFilter() {
  return Object.values(filters).some(v => v !== null);
}

function clearStats() {
  document.getElementById("adv-white").style.width = "0%";
  document.getElementById("adv-draw").style.width  = "0%";
  document.getElementById("adv-black").style.width = "0%";
  document.getElementById("stats-white").textContent = "";
  document.getElementById("stats-total").textContent = "";
  document.getElementById("stats-black").textContent = "";
  document.getElementById("opening-display").textContent = "\u00a0";
}

function showStats(result, fen) {
  const { total, results = { w: 0, b: 0, d: 0 } } = result;
  const wp = Math.round((results.w || 0) / total * 100);
  const dp = Math.round((results.d || 0) / total * 100);
  const bp = Math.round((results.b || 0) / total * 100);
  document.getElementById("adv-white").style.width = `${wp}%`;
  document.getElementById("adv-draw").style.width  = `${dp}%`;
  document.getElementById("adv-black").style.width = `${bp}%`;
  document.getElementById("stats-white").textContent = `Weiß ${wp}%`;
  document.getElementById("stats-total").textContent = `${total} Partien`;
  document.getElementById("stats-black").textContent = `Schwarz ${bp}%`;
  document.getElementById("opening-display").textContent =
    fen === START_FEN
      ? "Grundstellung"
      : (result.topOpenings && result.topOpenings.length > 0) ? result.topOpenings[0][0] : "\u00a0";
}

function updateVizLegend() {
  const el = document.getElementById("viz-legend");
  if (!el) return;
  const activeTab = document.querySelector(".tab.active")?.dataset.tab || "2d";
  const is3D = activeTab === "3d" || activeTab === "both";
  const items = [];

  // Gewinnrate-Button nur in 3D klickbar
  const winrateBtn = document.getElementById("toggle-winrate");
  if (winrateBtn) {
    winrateBtn.style.opacity = is3D ? "1" : "0.35";
    winrateBtn.style.pointerEvents = is3D ? "auto" : "none";
    winrateBtn.title = is3D ? "" : "Nur in 3D verfügbar";
  }

  if (currentMode() === "figur") {
    if (is3D) {
      items.push({ swatch: "height",    label: "Höhe",    sub: "Häufigkeit (selten → flach, oft → hoch)" });
      items.push({ swatch: "dominance", label: "Farbe",   sub: "Farbdominanz (dunkel = Schwarz, hell = Weiß)" });
    } else if (showDominance) {
      items.push({ swatch: "dominance", label: "Farbe",   sub: "Farbdominanz (dunkel = Schwarz, hell = Weiß)" });
    } else {
      items.push({ swatch: "freq",      label: "Farbe",   sub: "Häufigkeit (kalt = selten, warm = oft)" });
    }
  } else {
    if (is3D) {
      items.push({ swatch: "freq",   label: "Farbe",  sub: "Häufigkeit (kalt = selten, warm = oft)" });
      if (showWinRate) {
        items.push({ swatch: "height", label: "Höhe", sub: "Gewinnrate (tief = verliert, hoch = gewinnt)" });
      } else {
        items.push({ swatch: "height", label: "Höhe", sub: "Gewinnrate — \"Gewinnrate\" aktivieren" });
      }
    } else {
      items.push({ swatch: "freq",   label: "Farbe",  sub: "Häufigkeit (kalt = selten, warm = oft)" });
    }
  }

  el.innerHTML = items.map(i =>
    `<div class="legend-item">
      <div class="legend-swatch ${i.swatch}"></div>
      <div class="legend-label">
        <span>${i.label}</span>
        <span class="legend-sublabel">${i.sub}</span>
      </div>
    </div>`
  ).join("");
}

function redrawAll() {
  drawBoard(ctx);

  if (currentMode() === "figur") {
    clearStats();
    const filtered = filterMoves(allMoves, filters);
    currentData    = aggregateMoves(filtered);
    drawHeatmap(ctx, currentData, hasActiveFilter(), showDominance);
    const counts = Object.values(currentData).map(d => d.count).filter(c => c > 0);
    if (counts.length > 0) drawLegend(Math.min(...counts), Math.max(...counts));
    if (activeOrigin) highlightOrigin(ctx, activeOrigin);

  } else {
    // Stellungsanalyse — erst Heatmap, dann Figuren drüber
    const fen    = positionToFen();
    const result = searchByFen(fen);
    currentData  = {};
    if (result && result.total > 0) {
      let heatmap = result.heatmap;

      if (showMoveHeatmap && heatmap) {
        if (selectedSquare) {
          const maxFiltered = Math.max(...Object.values(heatmap).map(d => d.froms?.[selectedSquare] || 0), 1);
          const filtered = Object.entries(heatmap)
            .filter(([, d]) => d.froms && d.froms[selectedSquare])
            .map(([sq, d]) => [sq, {
              ...d,
              from:  selectedSquare,
              count: d.froms[selectedSquare],
              norm:  d.froms[selectedSquare] / maxFiltered,
            }]);
          heatmap = Object.fromEntries(filtered);
        }
        currentData = heatmap;

        if (Object.keys(heatmap).length > 0) {
          drawSearchHeatmap(ctx, heatmap);
          if (selectedSquare) {
            const { col, row } = squareToColRow(selectedSquare);
            ctx.strokeStyle = "rgba(80, 200, 100, 0.85)";
            ctx.lineWidth = 3;
            ctx.strokeRect(col * CELL_SIZE + 1.5, row * CELL_SIZE + 1.5, CELL_SIZE - 3, CELL_SIZE - 3);
          }
          const counts = Object.values(heatmap).map(d => d.count).filter(c => c > 0);
          if (counts.length > 0) drawLegend(Math.min(...counts), Math.max(...counts));
        }
      }
      showStats(result, fen);
    } else {
      clearStats();
    }

    // Figuren zuletzt — immer über der Heatmap
    ctx.save(); ctx.globalAlpha = 1.0;
    drawPosition(ctx);
    ctx.restore();
  }

  ctx.save(); drawLabels(ctx); ctx.restore();
  bindTooltip(canvas, tooltip, currentData);
  sync3D();
  updateVizLegend();
}

function buildFilters() {
  const piece = document.getElementById("filter-piece").value;
  filters = {
    color:  colorState === -1 ? "b" : colorState === 1 ? "w" : null,
    piece:  piece        || null,
    origin: activeOrigin || null,
    moveNr: moveNr       || null,
  };

  // Aktive Filter visuell hervorheben
  document.getElementById("filter-piece").classList.toggle("active", !!piece);
  document.getElementById("origin-display").classList.toggle("active", !!activeOrigin);

  redrawAll();
}

// ── Farb-Hebel ────────────────────────────────────────────────────────────────
const toggleThumb = document.getElementById("toggle-thumb");

function setColorState(state) {
  colorState = state;
  toggleThumb.dataset.state = state;
  buildFilters();
}

document.getElementById("toggle-track").addEventListener("click", e => {
  const rect  = e.currentTarget.getBoundingClientRect();
  const y     = e.clientY - rect.top;
  const third = rect.height / 3;
  if (y < third)          setColorState(-1);
  else if (y < third * 2) setColorState(0);
  else                    setColorState(1);
});

// ── Zugnummer ─────────────────────────────────────────────────────────────────
function setMoveNr(n) {
  moveNr = (!n || n < 1) ? null : n;
  moveNrInput.value = moveNr || "";
  buildFilters();
}

document.getElementById("movenr-up").addEventListener("click",   () => setMoveNr((moveNr || 0) + 1));
document.getElementById("movenr-down").addEventListener("click", () => setMoveNr((moveNr || 1) - 1));
moveNrInput.addEventListener("input", () => setMoveNr(parseInt(moveNrInput.value)));

document.addEventListener("keydown", e => {
  if (document.activeElement === moveNrInput) return;
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    if (e.key === "ArrowUp")   setMoveNr((moveNr || 0) + 1);
    if (e.key === "ArrowDown") setMoveNr((moveNr || 1) - 1);
  }
});

// ── Startfeld (nur Figurenanalyse) ────────────────────────────────────────────
function setOrigin(square) {
  activeOrigin = square || null;
  originInput.value = square ? square.toUpperCase() : "";
  buildFilters();
}

// ── Drag & Drop (nur Stellungsanalyse) ────────────────────────────────────────
let selectedSquare = null;
let justDragged = false;

function getSquarePiece(square) {
  const { col, row } = squareToColRow(square);
  return currentPosition[row][col];
}

initDragDrop(canvas, () => {
  selectedSquare = null;
  justDragged = true;
  if (currentMode() === "stellung") redrawAll();
});

canvas.addEventListener("click", e => {
  console.log("click fired, justDragged:", justDragged, "mode:", currentMode());
  if (justDragged) { justDragged = false; return; }
  if (currentMode() === "stellung") {
    const square = getSquareFromMouse(canvas, e);
    if (!square) return;

    if (selectedSquare === square) {
      console.log("deselect", square);
      selectedSquare = null;
    } else if (getSquarePiece(square)) {
      console.log("select", square, "prev:", selectedSquare);
      selectedSquare = square;
    } else {
      selectedSquare = null;
    }
    redrawAll();
    return;
  }
  // Figurenanalyse
  if (currentMode() !== "figur") return;
  const square = getSquareFromMouse(canvas, e);
  if (!square) return;
  setOrigin(activeOrigin === square ? null : square);
});

originInput.addEventListener("input", () => {
  const val = originInput.value.trim().toLowerCase();
  activeOrigin = val.length === 2 ? val : null;
  buildFilters();
});

document.getElementById("clear-origin").addEventListener("click", () => setOrigin(null));
document.getElementById("toggle-dominance").addEventListener("click", e => {
  showDominance = !showDominance;
  e.currentTarget.textContent = showDominance ? "Häufigkeit" : "Farbdominanz";
  e.currentTarget.classList.toggle("active", showDominance);
  redrawAll();
});

document.getElementById("filter-piece").addEventListener("change", buildFilters);

document.getElementById("reset-position").addEventListener("click", () => {
  resetPosition();
  redrawAll();
});

document.getElementById("toggle-move-heatmap").addEventListener("click", e => {
  showMoveHeatmap = !showMoveHeatmap;
  e.currentTarget.classList.toggle("active", showMoveHeatmap);
  redrawAll();
});

document.getElementById("toggle-winrate").addEventListener("click", e => {
  showWinRate = !showWinRate;
  e.currentTarget.classList.toggle("active", showWinRate);
  sync3D();
  updateVizLegend();
});

document.getElementById("undo-move").addEventListener("click", () => {
  if (undoMove()) redrawAll();
});

document.getElementById("best-move").addEventListener("click", () => {
  const fen    = positionToFen();
  const result = searchByFen(fen);
  if (!result || !result.heatmap) return;

  // Häufigsten Zug finden
  const best = Object.entries(result.heatmap)
    .sort((a, b) => b[1].count - a[1].count)[0];
  if (!best) return;

  const [toSq, data] = best;
  if (!data.from) return;

  const from = squareToColRow(data.from);
  const to   = squareToColRow(toSq);

  pushHistory();
  applyMove(from.row, from.col, to.row, to.col);
  redrawAll();
});

// ── Tabs ──────────────────────────────────────────────────────────────────────
function sync3D() {
  if (!sceneInitialized) return;
  clearHighlights3D();
  if (currentMode() === "stellung") {
    const fen    = positionToFen();
    const result = searchByFen(fen);
    if (result && result.heatmap && (showMoveHeatmap || showWinRate)) {
      updateHeatmap3D(result.heatmap, showWinRate);
      if (showMoveHeatmap) drawSearchHeatmap3D(result.heatmap);
    } else {
      updateHeatmap3D({}, false);
    }
    updatePieces3D(currentPosition);
  } else {
    const filtered = filterMoves(allMoves, filters);
    updateHeatmap3D(aggregateMoves(filtered), false, true);
    if (activeOrigin) highlightOrigin3D(activeOrigin);
    updatePieces3D([]);
  }
}

function setTabLayout(tab) {
  const board2d   = document.getElementById("board-2d");
  const board3d   = document.getElementById("board-3d");
  const sceneEl   = document.getElementById("scene-container");
  const sidebar   = document.getElementById("captured-sidebar");
  const boardSize = CELL_SIZE * BOARD_SIZE;

  board2d.style.display = (tab === "2d" || tab === "both") ? "block" : "none";
  board3d.style.display = (tab === "3d" || tab === "both") ? "block" : "none";

  sceneEl.style.width  = boardSize + "px";
  sceneEl.style.height = boardSize + "px";

  if ((tab === "3d" || tab === "both") && sceneInitialized && renderer) {
    renderer.setSize(boardSize, boardSize);
    if (labelRenderer) labelRenderer.setSize(boardSize, boardSize);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }

  const show2d  = tab === "2d" || tab === "both";
  const isFigur = currentMode() === "figur";
  document.getElementById("right-controls").classList.toggle("visible", isFigur);
  document.getElementById("captured-sidebar").classList.toggle("visible", !isFigur && show2d);

  document.getElementById("main-area").style.flexWrap = tab === "both" ? "wrap" : "nowrap";
}

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    setTabLayout(tab);
    if (tab !== "2d") { initScene("scene-container"); sync3D(); }
    updateVizLegend();
  });
});

// ── Laden ─────────────────────────────────────────────────────────────────────
loadMoves("data/processed/moves.json").then(data => {
  allMoves = data;
  setTabLayout("2d");
  setMode(0);
});

loadGames("data/processed/games.json").then(() => {
  redrawAll();
});