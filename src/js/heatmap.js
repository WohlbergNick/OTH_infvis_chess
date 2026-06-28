function dominanceColor(dominance) {
  // dominance: -1 = nur Schwarz (dunkel), 0 = neutral (mittelgrau), +1 = nur Weiß (hell)
  const t = (dominance + 1) / 2; // 0..1
  const v = Math.round(40 + t * 180); // 40 (dunkel) bis 220 (hell)
  return `rgba(${v}, ${v}, ${v}, 0.8)`;
}

function drawHeatmap(ctx, aggregatedData, showEmpty, useDominance = false) {
  for (let sq = 0; sq < 64; sq++) {
    const name = squareIndexToName(sq);
    const { col, row } = squareToColRow(name);
    const data = aggregatedData[name];

    if (showEmpty && (!data || data.count === 0)) {
      drawEmpty(ctx, col, row);
    } else if (data && data.count > 0) {
      if (useDominance && data.dominance !== undefined) {
        ctx.fillStyle = dominanceColor(data.dominance);
      } else {
        ctx.fillStyle = colorScaleCSS(data.norm);
        ctx.globalAlpha = 0.75;
      }
      ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      ctx.globalAlpha = 1.0;
    }
  }
}

function drawEmpty(ctx, col, row) {
  const x = col * CELL_SIZE;
  const y = row * CELL_SIZE;
  const m = 10;

  ctx.fillStyle = "rgba(80, 80, 80, 0.85)";
  ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

  ctx.strokeStyle = "rgba(160, 160, 160, 0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + m, y + m);
  ctx.lineTo(x + CELL_SIZE - m, y + CELL_SIZE - m);
  ctx.moveTo(x + CELL_SIZE - m, y + m);
  ctx.lineTo(x + m, y + CELL_SIZE - m);
  ctx.stroke();
}

function squareIndexToName(sq) {
  const file = String.fromCharCode(97 + (sq % 8));
  const rank = Math.floor(sq / 8) + 1;
  return `${file}${rank}`;
}

async function loadMoves(path) {
  const res = await fetch(path);
  return await res.json();
}