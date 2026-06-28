function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  
  function colorScale(norm) {
    const cold = { r: 235, g: 245, b: 251 };
    const hot  = { r: 214, g: 48,  b: 49  };
  
    return {
      r: Math.round(lerp(cold.r, hot.r, norm)),
      g: Math.round(lerp(cold.g, hot.g, norm)),
      b: Math.round(lerp(cold.b, hot.b, norm)),
    };
  }
  
  function colorScaleCSS(norm) {
    const { r, g, b } = colorScale(norm);
    return `rgb(${r}, ${g}, ${b})`;
  }
