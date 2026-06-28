function initTooltip(tooltipId) {
    return document.getElementById(tooltipId);
  }
  
  function getSquareFromMouse(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
  
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
  
    const file = String.fromCharCode(97 + col);
    const rank = 8 - row;
    return `${file}${rank}`;
  }
  
  function bindTooltip(canvas, tooltip, heatmapData) {
    canvas.addEventListener("mousemove", (e) => {
      const square = getSquareFromMouse(canvas, e);
      if (!square || !heatmapData[square]) {
        tooltip.style.display = "none";
        return;
      }
  
      const { count, norm } = heatmapData[square];
      tooltip.textContent = `${square.toUpperCase()} — ${count.toLocaleString()} Züge`;
      tooltip.style.display = "block";
      tooltip.style.left = (e.clientX + 12) + "px";
      tooltip.style.top  = (e.clientY + 12) + "px";
    });
  
    canvas.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });
  }