const FIELD_SIZE = 1;
const BOARD_DIM  = 8;

let scene, camera, renderer, labelRenderer, orbitControls;
let fieldMeshes = {};
let sceneInitialized = false;

function initScene(containerId) {
  if (sceneInitialized) return;
  sceneInitialized = true;

  const container = document.getElementById(containerId);
  const W = container.clientWidth;
  const H = container.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x12130f);

  camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(0, 10, 8);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  labelRenderer = new THREE.CSS2DRenderer();
  labelRenderer.setSize(W, H);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0";
  labelRenderer.domElement.style.pointerEvents = "none";
  container.style.position = "relative";
  container.appendChild(labelRenderer.domElement);

  orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.08;
  orbitControls.minPolarAngle = 0.1;
  orbitControls.maxPolarAngle = Math.PI / 2;

  buildBoard();
  setupLights();
  addBoardLabels();
  animate();

  window.addEventListener("resize", () => {
    const W = container.clientWidth;
    const H = container.clientHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
    labelRenderer.setSize(W, H);
  });
}

// Stellungsanalyse: variable Höhe basierend auf Gewinnrate
const MIN_HEIGHT  = 0.1;
const MAX_HEIGHT  = 0.5;
const BASE_HEIGHT = (MIN_HEIGHT + MAX_HEIGHT) / 2;

// Figurenanalyse: feste Grunddicke
const FIGUR_HEIGHT = 0.1;

function buildBoard() {
  const files = ["a","b","c","d","e","f","g","h"];
  const ranks = ["1","2","3","4","5","6","7","8"];

  for (let row = 0; row < BOARD_DIM; row++) {
    for (let col = 0; col < BOARD_DIM; col++) {
      const isLight = (row + col) % 2 === 0;
      const color   = isLight ? 0xf0d9b5 : 0xb58863;

      const geo  = new THREE.BoxGeometry(FIELD_SIZE * 0.98, FIGUR_HEIGHT, FIELD_SIZE * 0.98);
      const mat  = new THREE.MeshLambertMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);

      mesh.position.set(
        (col - 3.5) * FIELD_SIZE,
        FIGUR_HEIGHT / 2,
        (3.5 - row) * FIELD_SIZE
      );

      const squareName = files[col] + ranks[row];
      mesh.userData.square    = squareName;
      mesh.userData.baseColor = color;
      fieldMeshes[squareName] = mesh;
      scene.add(mesh);
    }
  }
}

function updateHeatmap3D(aggregatedData, showWinRate = false, useDominance = false) {
  const files = ["a","b","c","d","e","f","g","h"];
  const ranks = ["1","2","3","4","5","6","7","8"];

  for (let row = 0; row < BOARD_DIM; row++) {
    for (let col = 0; col < BOARD_DIM; col++) {
      const name = files[col] + ranks[row];
      const mesh = fieldMeshes[name];
      const data = aggregatedData[name];

      if (useDominance) {
        // Figurenanalyse: Höhe = Häufigkeit, Farbe = Dominanz oder Häufigkeit
        if (data && data.count > 0) {
          if (data.dominance !== undefined) {
            const t = (data.dominance + 1) / 2;
            const v = 0.15 + t * 0.7;
            mesh.material.color.setRGB(v, v, v);
          } else {
            const { r, g, b } = colorScale(data.norm);
            mesh.material.color.setRGB(r / 255, g / 255, b / 255);
          }
          const height = FIGUR_HEIGHT + (MAX_HEIGHT - FIGUR_HEIGHT) * data.norm;
          mesh.geometry.dispose();
          mesh.geometry = new THREE.BoxGeometry(FIELD_SIZE * 0.98, height, FIELD_SIZE * 0.98);
          mesh.position.y = height / 2;
        } else {
          mesh.material.color.setHex(mesh.userData.baseColor);
          mesh.geometry.dispose();
          mesh.geometry = new THREE.BoxGeometry(FIELD_SIZE * 0.98, FIGUR_HEIGHT, FIELD_SIZE * 0.98);
          mesh.position.y = FIGUR_HEIGHT / 2;
        }
      } else {
        // Stellungsanalyse: variable Höhe basierend auf Gewinnrate
        let height = BASE_HEIGHT;
        if (data && data.count > 0) {
          const { r, g, b } = colorScale(data.norm);
          mesh.material.color.setRGB(r / 255, g / 255, b / 255);
          if (showWinRate && data.winRate !== undefined) {
            height = MIN_HEIGHT + (MAX_HEIGHT - MIN_HEIGHT) * data.winRate;
          }
        } else {
          mesh.material.color.setHex(mesh.userData.baseColor);
        }
        mesh.geometry.dispose();
        mesh.geometry = new THREE.BoxGeometry(FIELD_SIZE * 0.98, height, FIELD_SIZE * 0.98);
        mesh.position.y = height / 2;
      }
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  orbitControls.update();
  renderer.render(scene, camera);
  if (labelRenderer) labelRenderer.render(scene, camera);
}

function addBoardLabels() {
  const files = ["a","b","c","d","e","f","g","h"];
  const ranks = ["1","2","3","4","5","6","7","8"];

  files.forEach((file, col) => {
    const div = document.createElement("div");
    div.textContent = file;
    div.style.cssText = "color:#f0d9b5;font-size:12px;font-family:sans-serif;pointer-events:none;opacity:0.7;";
    const label = new THREE.CSS2DObject(div);
    label.position.set((col - 3.5) * FIELD_SIZE, 0, 4.2);
    scene.add(label);
  });

  ranks.forEach((rank, row) => {
    const div = document.createElement("div");
    div.textContent = rank;
    div.style.cssText = "color:#f0d9b5;font-size:12px;font-family:sans-serif;pointer-events:none;opacity:0.7;";
    const label = new THREE.CSS2DObject(div);
    label.position.set(-4.2, 0, (3.5 - row) * FIELD_SIZE);
    scene.add(label);
  });
}

let pieceMeshes = [];
let lightSetup  = false;

function setupLights() {
  if (lightSetup) return;
  lightSetup = true;
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 10, 5);
  scene.add(dir);
}

function updatePieces3D(position) {
  pieceMeshes.forEach(m => scene.remove(m));
  pieceMeshes = [];
  if (!position || position.length === 0) return;
  setupLights();

  const files = ["a","b","c","d","e","f","g","h"];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = position[row][col];
      if (!piece) continue;

      const color  = piece[0];
      const type   = piece[1];
      const group  = createPiece(type, color);
      const file   = files[col];
      const rank   = 8 - row;
      const square = file + rank;
      const mesh   = fieldMeshes[square];

      if (mesh) {
        const fieldTop = mesh.position.y + mesh.geometry.parameters.height / 2;
        group.position.set(mesh.position.x, fieldTop, mesh.position.z);
        group.scale.set(0.4, 0.4, 0.4);
        scene.add(group);
        pieceMeshes.push(group);
      }
    }
  }
}

let highlightMeshes = [];
let arrowMeshes     = [];

function clearHighlights3D() {
  highlightMeshes.forEach(m => scene.remove(m));
  highlightMeshes = [];
  arrowMeshes.forEach(m => scene.remove(m));
  arrowMeshes = [];
}

function highlightOrigin3D(square) {
  const mesh = fieldMeshes[square];
  if (!mesh) return;
  const geo = new THREE.PlaneGeometry(FIELD_SIZE, FIELD_SIZE);
  const mat = new THREE.MeshBasicMaterial({ color: 0x50c864, transparent: true, opacity: 0.5 });
  const highlight = new THREE.Mesh(geo, mat);
  highlight.rotation.x = -Math.PI / 2;
  highlight.position.set(mesh.position.x, mesh.position.y + mesh.geometry.parameters.height / 2 + 0.01, mesh.position.z);
  scene.add(highlight);
  highlightMeshes.push(highlight);
}

function drawArrow3D(fromSquare, toSquare) {
  const from = fieldMeshes[fromSquare];
  const to   = fieldMeshes[toSquare];
  if (!from || !to) return;

  const sx = from.position.x, sz = from.position.z;
  const ex = to.position.x,   ez = to.position.z;
  const dx = ex - sx, dz = ez - sz;
  const length = Math.sqrt(dx * dx + dz * dz);
  const nx = dx / length, nz = dz / length;

  const color = 0xffdc32;
  const fromHeight = from.position.y + from.geometry.parameters.height / 2;
  const toHeight   = to.position.y   + to.geometry.parameters.height   / 2;
  const y = Math.max(fromHeight, toHeight) + 0.05;

  const shaftLen = length * 0.72;
  const shaft = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.04, shaftLen),
    new THREE.MeshBasicMaterial({ color })
  );
  shaft.position.set(sx + nx * shaftLen / 2, y, sz + nz * shaftLen / 2);
  shaft.rotation.y = Math.atan2(dx, dz);
  scene.add(shaft);
  arrowMeshes.push(shaft);

  const headLen = 0.28;
  const hx = sx + nx * (shaftLen + headLen * 0.5);
  const hz = sz + nz * (shaftLen + headLen * 0.5);
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, headLen, 8),
    new THREE.MeshBasicMaterial({ color })
  );
  head.position.set(hx, y, hz);
  head.rotation.order = "YXZ";
  head.rotation.y = Math.atan2(dx, dz);
  head.rotation.x = Math.PI / 2;
  scene.add(head);
  arrowMeshes.push(head);
}

function drawSearchHeatmap3D(heatmap) {
  clearHighlights3D();
  const files = ["a","b","c","d","e","f","g","h"];
  const ranks = ["1","2","3","4","5","6","7","8"];

  for (let row = 0; row < BOARD_DIM; row++) {
    for (let col = 0; col < BOARD_DIM; col++) {
      const name = files[col] + ranks[row];
      const data = heatmap[name];
      if (!data || !data.from) continue;
      highlightOrigin3D(data.from);
      drawArrow3D(data.from, name);
    }
  }
}