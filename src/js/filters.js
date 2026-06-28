const FROM    = 0;
const TO      = 1;
const ORIGIN  = 2;
const PIECE   = 3;
const COLOR   = 4;
const MOVE_NR = 5;

function filterMoves(moves, { color, piece, origin, moveNr } = {}) {
  return moves.filter(m => {
    // Zugnummer: Zug 1 = move_number 1 (weiß) und 2 (schwarz)
    // Zug N = move_number (2N-1) und (2N)
    if (moveNr) {
      const whiteMove = (moveNr * 2) - 1;
      const blackMove = (moveNr * 2);
      if (m[MOVE_NR] !== whiteMove && m[MOVE_NR] !== blackMove) return false;
    }

    // Farb-Filter: "w", "b", oder null = beide
    if (color && m[COLOR] !== color) return false;

    if (piece  && m[PIECE]  !== piece)  return false;
    if (origin && m[ORIGIN] !== origin) return false;
    return true;
  });
}

function aggregateMoves(moves) {
  const counts = {};
  for (const m of moves) {
    const sq = m[TO];
    if (!counts[sq]) counts[sq] = { count: 0, w: 0, b: 0 };
    counts[sq].count++;
    if (m[COLOR] === "w") counts[sq].w++;
    else counts[sq].b++;
  }
  const max = Math.max(...Object.values(counts).map(v => v.count), 1);
  const result = {};
  for (const [sq, data] of Object.entries(counts)) {
    const dominance = data.count > 0 ? (data.w - data.b) / data.count : 0; // -1=nur Schwarz, +1=nur Weiß
    result[sq] = { count: data.count, norm: data.count / max, dominance };
  }
  return result;
}