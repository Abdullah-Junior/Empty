// --- Constants ---
const TILE = 16;
const MAP_W = 20;
const MAP_H = 12;

// Map Legend: 0=empty, 1=wall, 2=bug, 3=glitch-only wall, 4=goal tile
const LEVELS = [
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,2,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,0,0,1],
    [1,0,1,0,0,0,1,0,1,0,1,0,0,0,0,0,1,0,0,1],
    [1,0,1,0,1,1,1,0,1,0,3,3,3,3,3,0,1,1,0,1],
    [1,0,1,0,0,0,0,0,1,0,0,0,0,0,3,0,0,1,0,1],
    [1,0,1,1,1,0,1,1,1,1,1,1,0,0,3,1,0,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,1,0,0,3,0,0,1,0,1],
    [1,1,1,0,1,1,1,1,1,1,0,1,1,1,3,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1,1,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ]
];

// --- Game State ---
let levelIndex = 0;
let map = JSON.parse(JSON.stringify(LEVELS[levelIndex]));
let glitchPower = false;
let freezeEnemy = false;
let bugFixed = false;

let player = { x: 1, y: 1, color: "#3ff", alive: true };
let enemy = { x: 15, y: 9, dir: -1, color: "#e24", frozen: false };

// --- Helpers ---
function resetLevel() {
  map = JSON.parse(JSON.stringify(LEVELS[levelIndex]));
  player.x = 1; player.y = 1; player.alive = true;
  enemy.x = 15; enemy.y = 9; enemy.frozen = false; enemy.dir = -1;
  glitchPower = false;
  freezeEnemy = false;
  bugFixed = false;
  setStatus("Collect the bug (yellow)!");
}

function setStatus(msg) {
  document.getElementById('status').textContent = msg;
}

// --- Controls ---
let keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === 'g' || e.key === 'G') {
    glitchPower = !glitchPower;
    setStatus(glitchPower ? "Glitch Power: ON (walk through walls)" :
      "Glitch Power: OFF");
  }
  if (e.key === 'f' || e.key === 'F') {
    freezeEnemy = !freezeEnemy;
    enemy.frozen = freezeEnemy;
    setStatus(freezeEnemy ? "Enemy frozen!" : "Enemy unfrozen!");
  }
  if (e.key === 'r' || e.key === 'R') {
    resetLevel();
  }
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// --- Game Logic ---
function isWall(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return true;
  if (glitchPower) return (map[y][x] === 1); // Only hard walls block
  return (map[y][x] === 1 || map[y][x] === 3);
}

function movePlayer(dx, dy) {
  let nx = player.x + dx, ny = player.y + dy;
  if (!isWall(nx, ny)) {
    player.x = nx; player.y = ny;
  }
}

function updatePlayer() {
  if (!player.alive) return;
  if (keys['ArrowUp']) movePlayer(0, -1);
  if (keys['ArrowDown']) movePlayer(0, 1);
  if (keys['ArrowLeft']) movePlayer(-1, 0);
  if (keys['ArrowRight']) movePlayer(1, 0);

  // Collect bug
  if (map[player.y][player.x] === 2 && !bugFixed) {
    map[player.y][player.x] = 0;
    bugFixed = true;
    // Fixing the bug closes the glitch-only path (replace 3 with 1)
    for (let y = 0; y < MAP_H; ++y)
      for (let x = 0; x < MAP_W; ++x)
        if (map[y][x] === 3) map[y][x] = 1;
    setStatus("Bug fixed! Glitch path closed.");
  }
  // Collide with enemy
  if (player.x === enemy.x && player.y === enemy.y) {
    player.alive = false;
    setStatus("You were caught by a corrupted enemy! Press R to retry.");
  }
}

function updateEnemy() {
  if (enemy.frozen || !player.alive) return;
  // Move horizontally in corridor, turn at walls
  let nx = enemy.x + enemy.dir;
  if (nx < 0 || nx >= MAP_W || map[enemy.y][nx] === 1) {
    enemy.dir *= -1;
  } else {
    enemy.x = nx;
  }
}

// --- Rendering ---
const colors = {
  0: "#23203b",     // empty
  1: "#0a0a2a",     // wall
  2: "#ffe24a",     // bug
  3: "#8ff",        // glitch-only wall
  4: "#7cf"         // goal (not used in this demo)
};

function drawTile(ctx, x, y, code) {
  ctx.fillStyle = colors[code] || "#000";
  ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
  if (code === 2) { // bug
    ctx.fillStyle = "#fff";
    ctx.fillRect(x*TILE+4, y*TILE+4, 8, 8);
    ctx.fillStyle = "#ffe24a";
    ctx.fillRect(x*TILE+5, y*TILE+5, 6, 6);
  }
  if (code === 3) { // glitch wall shimmer
    ctx.fillStyle = "#7ff";
    ctx.fillRect(x*TILE+2, y*TILE+2, 12, 12);
  }
}

function render() {
  const ctx = document.getElementById('game').getContext('2d');
  // Map & tiles
  for (let y = 0; y < MAP_H; ++y)
    for (let x = 0; x < MAP_W; ++x)
      drawTile(ctx, x, y, map[y][x]);
  // Enemy
  ctx.fillStyle = enemy.frozen ? "#ccc" : enemy.color;
  ctx.fillRect(enemy.x * TILE + 2, enemy.y * TILE + 2, TILE - 4, TILE - 4);
  // Player
  if (player.alive) {
    ctx.fillStyle = glitchPower ? "#3ff" : "#3fa";
    ctx.fillRect(player.x * TILE + 3, player.y * TILE + 3, TILE - 6, TILE - 6);
    ctx.fillStyle = "#fff";
    ctx.fillRect(player.x * TILE + 6, player.y * TILE + 6, 4, 4);
  } else {
    ctx.fillStyle = "#444";
    ctx.fillRect(player.x * TILE + 3, player.y * TILE + 3, TILE - 6, TILE - 6);
  }
}

// --- Main Loop ---
function tick() {
  updatePlayer();
  updateEnemy();
  render();
  requestAnimationFrame(tick);
}

resetLevel();
tick();