console.log("loaded raycaster")

function svtimes (scalar, vector) {
  return vector.map(a => scalar * a);
}

function vvplus (vector1, vector2) {
  return vector1.map((a, i) => (a + vector2[i]));
}

function putPixel (ctx, x, y, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, 1, 1);
}

function renderCol (ctx, col, map, camera, screen) {
  cameraX = 2 * col / (screen.width - 1) - 1;
  ray = vvplus(camera.dir, svtimes(cameraX, camera.plane));
  for (let row = 0; row < screen.height; row++) {
    putPixel(ctx, col, row, "blue");
  }
}

// map is a 2d array of integers: 0 is nothing, 1 is wall
function render (map, camera, screen) {
  const ctx = screen.getContext("2d");

  for (let col = 0; col < screen.width; col++) {
    renderCol(ctx, col, map, camera, screen)
  }
}

window.onload = function () {
  render([[1, 1, 1, 1, 1, 1, 1, 1],
          [1, 0, 0, 0, 0, 0, 0, 1],
          [1, 0, 0, 0, 0, 0, 0, 1],
          [1, 0, 0, 0, 0, 0, 0, 1],
          [1, 0, 1, 1, 0, 0, 0, 1],
          [1, 0, 0, 1, 0, 0, 0, 1],
          [1, 0, 0, 0, 0, 0, 0, 1],
          [1, 1, 1, 1, 1, 1, 1, 1]]
        ,{pos: [1.5, 1.5],
          dir: [1, 2],
          plane: [2, -1]}
        ,document.getElementById("screen"))
}
