console.log("loaded raycaster")

function svtimes (scalar, vector) {
  return vector.map(a => scalar * a);
}

function vvplus (vector1, vector2) {
  return vector1.map((a, i) => (a + vector2[i]));
}

function vdot (vector1, vector2) {
  return vector1.map((a, i) => (a * vector2[i])).reduce((acc, val) => (acc + val), 0);
}

function vmagnitude (vector) {
  return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1])
}

function vnormalize (vector) {
  return svtimes(1/vmagnitude(vector), vector);
}

function vrotate (vector, angle) {
  angle = Math.PI * -angle / 180;
  return [vector[0] * Math.cos(angle) - vector[1] * Math.sin(angle)
         ,vector[0] * Math.sin(angle) + vector[1] * Math.cos(angle)];
}

function mapHas (map, idx) {
  return 0 <= idx[1] && idx[1] < map.length
      && 0 <= idx[0] && idx[0] < map[map.length - 1 - idx[1]].length;
}

function mapAt (map, idx) {
  return map[map.length - 1 - idx[1]][idx[0]];
}

function clamp (val, bottom, top) {
  return Math.max(Math.min(val, top), bottom);
}

function colourToString (colour) {
  return "rgb(" + clamp(colour[0], 0, 255) + ", " + clamp(colour[1], 0, 255) + ", " + clamp(colour[2], 0, 255) + ")";
}

function putPixel (ctx, x, y, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, 1, 1);
}

// digital differential analysis
// returns [distance to collision or Infinity, direction of wall collided]
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
  let direction = [0, 0];

  while (true) {
    if (!mapHas(map, currentSquare)) {
      return [Infinity, [0, 0]];
    }

    if (mapAt(map, currentSquare)) {
      return [vmagnitude(ray) * distance, direction];
    }

    if (nextX < nextY) {
      distance = nextX;
      nextX += stepX;
      direction = ray[0] < 0 ? [1, 0] : [-1, 0];
      currentSquare[0] += ray[0] < 0 ? -1 : 1;
    } else {
      distance = nextY;
      nextY += stepY;
      direction = ray[1] < 0 ? [0, 1] : [0, -1];
      currentSquare[1] += ray[1] < 0 ? -1 : 1;
    }
  }
}

function darkenByDist (colour, dist, options) {
  return svtimes(clamp(1 - dist / options.viewDist, 0, 1), colour);
}

function renderCol (ctx, col, map, camera, screen, options) {
  let cameraX = 2 * col / (screen.width - 1) - 1; // in [-1, 1]

  let ray;
  let perpDistScale;
  if (options.cyclindrical) {
    let offset = cameraX * camera.fov / 2;
    ray = vrotate(camera.dir, offset);
    perpDistScale = Math.cos(Math.PI * Math.abs(offset) / 180);
  } else {
    let cameraPlane = svtimes(Math.tan(Math.PI * camera.fov / 360), vrotate(camera.dir, 90));
    ray = vnormalize(vvplus(camera.dir, svtimes(cameraX, cameraPlane)));
    perpDistScale = vdot(ray, camera.dir) / vmagnitude(camera.dir);
  }

  let collision = dda(map, camera.pos, ray);

  let wallHeight = screen.height / (collision[0] * (options.perpDist ? perpDistScale : 1));

  for (let row = 0; row < screen.height; row++) {
    let colour;
    let yoffset = Math.abs(row - (screen.height - 1) / 2);

    if (yoffset < wallHeight / 2) {
      colour = svtimes((1 + options.darkest) / 2 + (1 - options.darkest) / 2 * vdot(collision[1], options.light), 
                       options.wallColour);
      colour = darkenByDist(colour, collision[0], options);
    } else {
      let imaginaryWallHeight = yoffset * 2;
      let dist = screen.height / (imaginaryWallHeight * (options.perpDist ? perpDistScale : 1));

      if (options.roomTiling) {
        let targetSquare = vvplus(svtimes(dist, ray), camera.pos).map(Math.floor); 
        colour = svtimes((targetSquare[0] + targetSquare[1]) % 2 == 1 ? 1 : 0.75, options.roomColour);
      } else {
        colour = options.roomColour;
      }

      colour = darkenByDist(colour, dist, options);
    }

    putPixel(ctx, col, row, colourToString(colour));
  }
}

// camera has pos: vector, dir: vector, and fov: angle
function render (map, camera, screen, options) {
  const ctx = screen.getContext("2d");

  for (let col = 0; col < screen.width; col++) {
    renderCol(ctx, col, map, camera, screen, options);
  }
}

window.onload = function () {
  render(
   [[1, 0, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1]],
   {
     pos: [1.2, 1.5],
     dir: vnormalize([2, 3]),
     fov: 90
   },
   document.getElementById("screen"),
   {
     viewDist: 8, // distance till stop of light
     light: vnormalize([1, -2]), // the vector towards the light source
     darkest: 0.5, 
     wallColour: [200, 150, 55],
     roomColour: [100, 100, 100],
     roomTiling: true,
     cyclindrical: false,
     perpDist: true
   });
}
