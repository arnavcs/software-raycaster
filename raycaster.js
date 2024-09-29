console.log("loaded raycaster")

const HEIGHT_SCALE = 100;

function svtimes (scalar, vector) {
  return vector.map(a => scalar * a);
}

function vvplus (vector1, vector2) {
  return vector1.map((a, i) => (a + vector2[i]));
}

function colourToString (colour) {
  return "rgb(" + colour[0] + ", " + colour[1] + ", " + colour[2] + ")"
}

function putPixel (ctx, x, y, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, 1, 1);
}

// digital differential analysis
// returns distance to collision or Infinity
function dda (map, pos, ray) {
  return 1;
}

function renderCol (ctx, col, map, camera, screen) {
  let cameraX = 2 * col / (screen.width - 1) - 1;
  let ray = vvplus(camera.dir, svtimes(cameraX, camera.plane));
  let collision = dda(map, camera.pos, ray);
  let wallHeight = HEIGHT_SCALE / collision;
  for (let row = 0; row < screen.height; row++) {
    let colour = [0, 0, 0];
    if (Math.abs(row - (screen.height - 1) / 2) < wallHeight / 2) {
      colour = [0, 0, 255];
    }
    putPixel(ctx, col, row, colourToString(colour));
  }
}

function render (map, camera, screen) {
  const ctx = screen.getContext("2d");

  for (let col = 0; col < screen.width; col++) {
    renderCol(ctx, col, map, camera, screen);
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
        ,document.getElementById("screen"));
}
