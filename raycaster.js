console.log("loaded raycaster")

function svtimes (scalar, vector) {
  return vector.map(a => scalar * a);
}

function vvplus (vector1, vector2) {
  return vector1.map((a, i) => (a + vector2[i]));
}

function vmagnitude (vector) {
  return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1])
}

function mapHas (map, idx) {
  return 0 <= idx[1] && idx[1] < map.length
      && 0 <= idx[0] && idx[0] < map[map.length - 1 - idx[1]].length;
}

function mapAt (map, idx) {
  return map[map.length - 1 - idx[1]][idx[0]];
}

function colourToString (colour) {
  return "rgb(" + colour[0] + ", " + colour[1] + ", " + colour[2] + ")";
}

function putPixel (ctx, x, y, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, 1, 1);
}

// digital differential analysis
// returns distance to collision or Infinity
function dda (map, pos, ray) {
  let currentSquare = [Math.floor(pos[0]), Math.floor(pos[1])];

  // all of the following are using units of rays
  // need to multiply by the length of the ray at the end to get length
  let nextX = ray[0] < 0
            ? (pos[0] - currentSquare[0]) / (- ray[0])
            : (currentSquare[0] + 1 - pos[0]) / (ray[0]);
  let nextY = ray[1] < 0
            ? (pos[1] - currentSquare[1]) / (- ray[1])
            : (currentSquare[1] + 1 - pos[1]) / (ray[1]);
  let stepX = 1 / Math.abs(ray[0]);
  let stepY = 1 / Math.abs(ray[1]);

  let distance = 0;

  while (true) {
    if (!mapHas(map, currentSquare)) {
      return Infinity;
    }

    if (mapAt(map, currentSquare)) {
      return vmagnitude(ray) * distance;
    }

    if (nextX < nextY) {
      distance = nextX;
      nextX += stepX;
      currentSquare[0] += ray[0] < 0 ? -1 : 1;
    } else {
      distance = nextY;
      nextY += stepY;
      currentSquare[1] += ray[1] < 0 ? -1 : 1;
    }
  }
}

function renderCol (ctx, col, map, camera, screen, options) {
  let cameraX = 2 * col / (screen.width - 1) - 1;
  let ray = vvplus(camera.dir, svtimes(cameraX, camera.plane));
  let collision = dda(map, camera.pos, ray);
  let wallHeight = screen.height / collision;
  for (let row = 0; row < screen.height; row++) {
    let colour = [0, 0, 0];
    if (Math.abs(row - (screen.height - 1) / 2) < wallHeight / 2) {
      colour = [0, 0, 255 - options.fade * collision];
    }
    putPixel(ctx, col, row, colourToString(colour));
  }
}

function render (map, camera, screen, options) {
  const ctx = screen.getContext("2d");

  for (let col = 0; col < screen.width; col++) {
    renderCol(ctx, col, map, camera, screen, options);
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
        ,document.getElementById("screen")
        ,{fade: 20});
}
