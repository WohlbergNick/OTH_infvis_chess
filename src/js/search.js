let gamesData = [];

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

async function loadGames(path) {
  const res = await fetch(path);
  gamesData = await res.json();
  console.log(`${gamesData.length} Partien geladen`);
}

function getAllResults() {
  if (gamesData.length === 0) return null;
  const results = { w: 0, b: 0, d: 0 };
  for (const game of gamesData) {
    results[game.result] = (results[game.result] || 0) + 1;
  }
  return { heatmap: null, topOpenings: [], results, total: gamesData.length };
}

function searchByFen(fen) {
  if (fen === START_FEN && gamesData.length === 0) return null;
  if (fen === START_FEN) {
    // Normale Suche für Startstellung — Starteintrag ist jetzt in fens[0]
  } else if (gamesData.length === 0) {
    return null;
  }

  const followUpCounts = {};
  const openingCounts  = {};
  const results        = { w: 0, b: 0, d: 0 };
  let total = 0;

  for (const game of gamesData) {
    for (let i = 0; i < game.fens.length; i++) {
      const entry = game.fens[i];
      if (entry.fen !== fen) continue;
      if (!entry.from || !entry.to) continue;

      // Index 0 = erster Zug (Weiß), Index 1 = zweiter Zug (Schwarz), etc.
      const movingColor = i % 2 === 0 ? "w" : "b";
      const won = game.result === movingColor;

      const toKey = entry.to;
      if (!followUpCounts[toKey]) followUpCounts[toKey] = { count: 0, wins: 0, froms: {} };
      followUpCounts[toKey].count++;
      if (won) followUpCounts[toKey].wins++;
      followUpCounts[toKey].froms[entry.from] = (followUpCounts[toKey].froms[entry.from] || 0) + 1;

      const openingKey = `${game.opening_eco} ${game.opening_name}`;
      openingCounts[openingKey] = (openingCounts[openingKey] || 0) + 1;
      results[game.result] = (results[game.result] || 0) + 1;
      total++;
    }
  }

  if (total === 0) return null;

  const maxCount = Math.max(...Object.values(followUpCounts).map(v => v.count), 1);
  const heatmap  = {};
  for (const [sq, data] of Object.entries(followUpCounts)) {
    const topFrom = Object.entries(data.froms).sort((a, b) => b[1] - a[1])[0][0];
    heatmap[sq] = {
      count:   data.count,
      norm:    data.count / maxCount,
      winRate: data.count > 0 ? data.wins / data.count : 0,
      from:    topFrom,
      froms:   data.froms,
    };
  }

  const topOpenings = Object.entries(openingCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return { heatmap, topOpenings, results, total };
}