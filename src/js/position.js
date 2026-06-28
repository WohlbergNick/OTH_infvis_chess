const PIECES = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

const START_POSITION = [
  ["bR","bN","bB","bQ","bK","bB","bN","bR"],
  ["bP","bP","bP","bP","bP","bP","bP","bP"],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ["wP","wP","wP","wP","wP","wP","wP","wP"],
  ["wR","wN","wB","wQ","wK","wB","wN","wR"],
];

let currentPosition = START_POSITION.map(row => [...row]);
let moveHistory     = [];
let capturedPieces  = { w: [], b: [] }; // geschlagene Figuren

function pushHistory() {
  moveHistory.push({
    position: currentPosition.map(row => [...row]),
    captured: { w: [...capturedPieces.w], b: [...capturedPieces.b] },
  });
}

function undoMove() {
  if (moveHistory.length === 0) return false;
  const prev      = moveHistory.pop();
  currentPosition = prev.position;
  capturedPieces  = prev.captured;
  updateCapturedUI();
  return true;
}

// Drag state
let dragPiece    = null;
let dragFrom     = null;  // { row, col } oder { fromSidebar: true, color }
let dragX        = 0;
let dragY        = 0;
let dragMoved    = false;

function drawPosition(ctx) {
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign    = "center";

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = currentPosition[row][col];
      if (!piece) continue;
      if (dragFrom && !dragFrom.fromSidebar && dragFrom.row === row && dragFrom.col === col) continue;
      drawPiece(ctx, piece, col * CELL_SIZE + CELL_SIZE / 2, row * CELL_SIZE + CELL_SIZE / 2);
    }
  }

  if (dragPiece) drawPiece(ctx, dragPiece, dragX, dragY);
  ctx.restore();
}

function drawPiece(ctx, piece, x, y) {
  const isWhite = piece.startsWith("w");
  ctx.font      = `${CELL_SIZE * 0.7}px serif`;
  ctx.fillStyle = isWhite ? "#fff" : "#1a1a2e";
  ctx.fillText(PIECES[piece], x, y);
  ctx.strokeStyle = isWhite ? "#888" : "#fff";
  ctx.lineWidth   = 0.5;
  ctx.strokeText(PIECES[piece], x, y);
}

function positionToFen() {
  let fen = "";
  for (let row = 0; row < 8; row++) {
    let empty = 0;
    for (let col = 0; col < 8; col++) {
      const piece = currentPosition[row][col];
      if (!piece) {
        empty++;
      } else {
        if (empty > 0) { fen += empty; empty = 0; }
        const type = piece[1];
        fen += piece.startsWith("w") ? type.toUpperCase() : type.toLowerCase();
      }
    }
    if (empty > 0) fen += empty;
    if (row < 7) fen += "/";
  }
  return fen;
}

function getColRow(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  const col  = Math.floor((e.clientX - rect.left) / CELL_SIZE);
  const row  = Math.floor((e.clientY - rect.top)  / CELL_SIZE);
  if (col < 0 || col > 7 || row < 0 || row > 7) return null;
  return { col, row };
}

// ── Captured UI ───────────────────────────────────────────────────────────────
function updateCapturedUI() {
  ["w", "b"].forEach(color => {
    const el = document.getElementById(`captured-${color}`);
    if (!el) return;
    el.innerHTML = "";
    capturedPieces[color].forEach((piece, i) => {
      const span = document.createElement("span");
      span.textContent = PIECES[piece];
      span.dataset.piece = piece;
      span.dataset.index = i;
      span.className = "captured-piece";
      el.appendChild(span);
    });
  });
}

// ── Drag & Drop ───────────────────────────────────────────────────────────────
function initDragDrop(canvas, onFenChange) {

  // Touch → Mouse Hilfsfunktion
  function touchToMouse(e) {
    const t = e.touches[0] || e.changedTouches[0];
    return { clientX: t.clientX, clientY: t.clientY };
  }

  function addDual(el, type, handler) {
    el.addEventListener(type, handler);
    if (type === "mousedown")  el.addEventListener("touchstart",  e => { e.preventDefault(); handler(touchToMouse(e)); }, { passive: false });
    if (type === "mousemove")  el.addEventListener("touchmove",   e => { e.preventDefault(); handler(touchToMouse(e)); }, { passive: false });
    if (type === "mouseup")    el.addEventListener("touchend",    e => { e.preventDefault(); handler(touchToMouse(e)); }, { passive: false });
  }

  // Drag vom Brett
  addDual(canvas, "mousedown", e => {
    if (currentMode() !== "stellung") return;
    const pos = getColRow(canvas, e);
    if (!pos) return;
    const piece = currentPosition[pos.row][pos.col];
    if (!piece) return;

    dragPiece = piece;
    dragFrom  = pos;
    dragMoved = false;
    const rect = canvas.getBoundingClientRect();
    dragX = e.clientX - rect.left;
    dragY = e.clientY - rect.top;
  });

  // Drag von Sidebar
  document.addEventListener("mousedown", e => {
    if (currentMode() !== "stellung") return;
    const span = e.target.closest(".captured-piece");
    if (!span) return;
    const piece = span.dataset.piece;
    const idx   = parseInt(span.dataset.index);
    const color = piece[0];
    dragPiece = piece;
    dragFrom  = { fromSidebar: true, color, idx };
    dragMoved = false;
    dragX = e.clientX;
    dragY = e.clientY;
    span.style.opacity = "0.3";
  });

  document.addEventListener("touchstart", e => {
    if (currentMode() !== "stellung") return;
    const span = e.target.closest(".captured-piece");
    if (!span) return;
    e.preventDefault();
    const t = e.touches[0];
    const piece = span.dataset.piece;
    const idx   = parseInt(span.dataset.index);
    const color = piece[0];
    dragPiece = piece;
    dragFrom  = { fromSidebar: true, color, idx };
    dragMoved = false;
    dragX = t.clientX;
    dragY = t.clientY;
    span.style.opacity = "0.3";
  }, { passive: false });

  addDual(canvas, "mousemove", e => {
    if (!dragPiece || dragFrom?.fromSidebar) return;
    const rect = canvas.getBoundingClientRect();
    const newX = e.clientX - rect.left;
    const newY = e.clientY - rect.top;
    const dist = Math.hypot(newX - dragX, newY - dragY);
    if (dist > 5) dragMoved = true;
    dragX = newX;
    dragY = newY;
    if (dragMoved) onFenChange();
  });

  document.addEventListener("mousemove", e => {
    if (!dragPiece || !dragFrom?.fromSidebar) return;
    dragMoved = true;
    dragX = e.clientX;
    dragY = e.clientY;
    let ghost = document.getElementById("drag-ghost");
    if (!ghost) {
      ghost = document.createElement("div");
      ghost.id = "drag-ghost";
      ghost.style.cssText = "position:fixed;pointer-events:none;font-size:48px;z-index:1000;transform:translate(-50%,-50%);";
      document.body.appendChild(ghost);
    }
    ghost.textContent = PIECES[dragPiece];
    ghost.style.left  = `${e.clientX}px`;
    ghost.style.top   = `${e.clientY}px`;
  });

  document.addEventListener("touchmove", e => {
    if (!dragPiece || !dragFrom?.fromSidebar) return;
    e.preventDefault();
    const t = e.touches[0];
    dragMoved = true;
    dragX = t.clientX;
    dragY = t.clientY;
    let ghost = document.getElementById("drag-ghost");
    if (!ghost) {
      ghost = document.createElement("div");
      ghost.id = "drag-ghost";
      ghost.style.cssText = "position:fixed;pointer-events:none;font-size:48px;z-index:1000;transform:translate(-50%,-50%);";
      document.body.appendChild(ghost);
    }
    ghost.textContent = PIECES[dragPiece];
    ghost.style.left  = `${t.clientX}px`;
    ghost.style.top   = `${t.clientY}px`;
  }, { passive: false });

  addDual(canvas, "mouseup", e => {
    if (!dragPiece || dragFrom?.fromSidebar) return;
    const ghost = document.getElementById("drag-ghost");
    if (ghost) ghost.remove();

    const pos        = getColRow(canvas, e);
    const wasMoved   = dragMoved && pos && !(pos.row === dragFrom.row && pos.col === dragFrom.col);
    const fromPos    = dragFrom;
    const piece      = dragPiece;

    dragPiece = null;
    dragFrom  = null;
    dragMoved = false;

    if (wasMoved) {
      pushHistory();
      applyMove(fromPos.row, fromPos.col, pos.row, pos.col);
      onFenChange();
    }
  });

  function handleSidebarDrop(clientX, clientY) {
    const ghost = document.getElementById("drag-ghost");
    if (ghost) ghost.remove();

    const rect  = canvas.getBoundingClientRect();
    const col   = Math.floor((clientX - rect.left) / CELL_SIZE);
    const row   = Math.floor((clientY - rect.top)  / CELL_SIZE);
    const piece = dragPiece;
    const from  = dragFrom;

    dragPiece = null;
    dragFrom  = null;
    dragMoved = false;

    if (col >= 0 && col < 8 && row >= 0 && row < 8) {
      pushHistory();
      const existing = currentPosition[row][col];
      if (existing) capturedPieces[existing[0]].push(existing);
      currentPosition[row][col] = piece;
      capturedPieces[from.color].splice(from.idx, 1);
      updateCapturedUI();
      onFenChange();
    } else {
      updateCapturedUI();
    }
  }

  document.addEventListener("mouseup", e => {
    if (!dragPiece || !dragFrom?.fromSidebar) return;
    handleSidebarDrop(e.clientX, e.clientY);
  });

  document.addEventListener("touchend", e => {
    if (!dragPiece || !dragFrom?.fromSidebar) return;
    e.preventDefault();
    const t = e.changedTouches[0];
    handleSidebarDrop(t.clientX, t.clientY);
  }, { passive: false });

}

function applyMove(fromRow, fromCol, toRow, toCol) {
  const piece = currentPosition[fromRow][fromCol];
  const existing = currentPosition[toRow][toCol];

  if (existing) {
    capturedPieces[existing[0]].push(existing);
    updateCapturedUI();
  }

  currentPosition[toRow][toCol]     = piece;
  currentPosition[fromRow][fromCol] = null;

  // Rochade
  if ((piece === "wK" || piece === "bK") && Math.abs(toCol - fromCol) === 2) {
    if (toCol === 6) {
      currentPosition[fromRow][5] = currentPosition[fromRow][7];
      currentPosition[fromRow][7] = null;
    } else if (toCol === 2) {
      currentPosition[fromRow][3] = currentPosition[fromRow][0];
      currentPosition[fromRow][0] = null;
    }
  }
}

function resetPosition() {
  currentPosition = START_POSITION.map(row => [...row]);
  moveHistory     = [];
  capturedPieces  = { w: [], b: [] };
  dragPiece = null;
  dragFrom  = null;
  updateCapturedUI();
}