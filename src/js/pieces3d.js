const PIECE_COLORS = {
    w: { body: 0xf0d9b5, accent: 0xddbb88 },
    b: { body: 0x2a2a3e, accent: 0x444466 },
  };
  
  function createPiece(type, color) {
    const group  = new THREE.Group();
    const c      = PIECE_COLORS[color];
    const mat    = new THREE.MeshLambertMaterial({ color: c.body });
    const matAcc = new THREE.MeshLambertMaterial({ color: c.accent });
  
    switch (type) {
      case "P": makePawn(group, mat); break;
      case "R": makeRook(group, mat, matAcc); break;
      case "N": makeKnight(group, mat, matAcc); break;
      case "B": makeBishop(group, mat, matAcc); break;
      case "Q": makeQueen(group, mat, matAcc); break;
      case "K": makeKing(group, mat, matAcc); break;
    }
    return group;
  }
  
  function makePawn(g, mat) {
    g.add(cylinder(0.28, 0.22, 0.18, mat, 0.09));
    g.add(cylinder(0.14, 0.14, 0.28, mat, 0.32));
    g.add(sphere(0.2, mat, 0.62));
  }
  
  function makeRook(g, mat, acc) {
    g.add(cylinder(0.3, 0.24, 0.18, mat, 0.09));
    g.add(cylinder(0.16, 0.16, 0.36, mat, 0.36));
    g.add(cylinder(0.26, 0.26, 0.1, acc, 0.68));
    g.add(cylinder(0.26, 0.26, 0.08, mat, 0.78));
  }
  
  function makeKnight(g, mat, acc) {
    g.add(cylinder(0.3, 0.24, 0.18, mat, 0.09));
    g.add(cylinder(0.16, 0.16, 0.3, mat, 0.36));
    const head = cylinder(0.18, 0.14, 0.32, acc, 0.66);
    head.rotation.x = 0.4;
    head.position.z = 0.08;
    g.add(head);
  }
  
  function makeBishop(g, mat, acc) {
    g.add(cylinder(0.3, 0.24, 0.18, mat, 0.09));
    g.add(cylinder(0.15, 0.12, 0.4, mat, 0.36));
    g.add(sphere(0.16, acc, 0.82));
    g.add(cone(0.08, 0.18, mat, 0.98));
  }
  
  function makeQueen(g, mat, acc) {
    g.add(cylinder(0.32, 0.26, 0.18, mat, 0.09));
    g.add(cylinder(0.16, 0.14, 0.44, mat, 0.36));
    g.add(sphere(0.22, acc, 0.88));
    for (let i = 0; i < 6; i++) {
      const ball = sphere(0.06, mat, 1.1);
      const a = (i / 6) * Math.PI * 2;
      ball.position.x = Math.cos(a) * 0.18;
      ball.position.z = Math.sin(a) * 0.18;
      g.add(ball);
    }
  }
  
  function makeKing(g, mat, acc) {
    g.add(cylinder(0.32, 0.26, 0.18, mat, 0.09));
    g.add(cylinder(0.16, 0.14, 0.44, mat, 0.36));
    g.add(sphere(0.2, acc, 0.88));
    // kruz
    const vert = box(0.06, 0.28, 0.06, mat, 1.14);
    const horiz = box(0.2, 0.07, 0.06, mat, 1.2);
    g.add(vert);
    g.add(horiz);
  }
  
  function cylinder(rTop, rBot, h, mat, yOff = 0) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 16), mat);
    m.position.y = yOff + h / 2;
    return m;
  }
  
  function sphere(r, mat, yOff = 0) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat);
    m.position.y = yOff;
    return m;
  }
  
  function cone(r, h, mat, yOff = 0) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 12), mat);
    m.position.y = yOff + h / 2;
    return m;
  }
  
  function box(w, h, d, mat, yOff = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.y = yOff + h / 2;
    return m;
  }