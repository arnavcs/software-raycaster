console.log("loaded raycaster")

function clamp (val, bottom, top) {
  return Math.max(Math.min(val, top), bottom);
}

/*********************/
/* vector operations */
/*********************/

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

/******************/
/* map operations */
/******************/

function mapHas (map, idx) {
  return 0 <= idx[1] && idx[1] < map.length
      && 0 <= idx[0] && idx[0] < map[map.length - 1 - idx[1]].length;
}

function mapAt (map, idx) {
  if (!mapHas(map, idx)) return 0;
  return map[map.length - 1 - idx[1]][idx[0]];
}

/*********************/
/* colour operations */
/*********************/

function resetAlpha (colour) {
  return [colour[0], colour[1], colour[2], 255];
}

function colourToString (colour, options) {
  let alpha = clamp(colour[3] / 255, 0, 1);
  colour = vvplus(svtimes(1 - alpha, options.zeroColour), svtimes(alpha, colour))
  return "rgb(" + clamp(colour[0], 0, 255) + ", " + clamp(colour[1], 0, 255) + ", " + clamp(colour[2], 0, 255) + ")";
}

function ditherAlpha (xr, yr, alpha) {
  let thresholdMat = [[ 0,  8,  2, 10],
                      [12,  4, 14,  6],
                      [ 3, 11,  1,  9],
                      [15,  7, 13,  5]].map(a => a.map(b => (b - 15 / 2) / 16));
  return (thresholdMat[yr][xr] + alpha / 255 > 0.5) ? 1 : 0;
}

function darkenBy (scale, colour) {
  colour[3] *= scale;
  return colour;
}

function darkenByDist (dist, colour, options) {
  return darkenBy(clamp(1 - dist / options.viewDist, 0, 1), colour);
}

/******************/
/* canvas drawing */
/******************/

function putPixel (ctx, x, y, colour, options) {
  if (options.dithering) {
    colour = ditherAlpha(x % 4, y % 4, colour[3]) ? resetAlpha(colour) : resetAlpha(options.zeroColour);
  }
  ctx.fillStyle = colourToString(colour, options);
  ctx.fillRect(x, y, 1, 1);
}

/**************/
/* raycasting */
/**************/

// digital differential analysis
// returns [distance to collision or Infinity, direction of wall collided, collision wall type]
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
      return [Infinity, [0, 0], 0];
    }

    if (mapAt(map, currentSquare) > 0) {
      return [vmagnitude(ray) * distance, direction, mapAt(map, currentSquare)];
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
    perpDistScale = vdot(ray, camera.dir);
  }
  perpDistScale = Math.abs(perpDistScale);

  let collision = dda(map, camera.pos, ray);
  let wallHeight = screen.height / (collision[0] * (options.perpDist ? perpDistScale : 1));

  for (let row = 0; row < screen.height; row++) {
    let colour;
    let yoffset = Math.abs(row - (screen.height - 1) / 2);

    if (yoffset < wallHeight / 2) {
      // calculate wall colour
      colour = darkenBy((1 + options.darkest) / 2 + (1 - options.darkest) / 2 * vdot(collision[1], options.light), 
                        resetAlpha(options.wallColours[-1 + collision[2]]));
      colour = darkenByDist(collision[0], colour, options);
    } else {
      // calculate floor colour based off if there was an imaginary wall at that location
      let imaginaryWallHeight = yoffset * 2;
      let dist = screen.height / (imaginaryWallHeight * (options.perpDist ? perpDistScale : 1));

      let targetSquare = vvplus(svtimes(dist, ray), camera.pos).map(Math.floor); 
      let squareParity = (targetSquare[0] + targetSquare[1]) % options.floorColours.length;
      // squareParity is NaN if targetSquare[0] + targetSquare[1] is not finite
      colour = resetAlpha(options.floorColours[!isNaN(squareParity) ? squareParity : 0]);
      colour = darkenByDist(dist, colour, options);
    }

    putPixel(ctx, col, row, colour, options);
  }
}

// camera has pos: vector, dir: vector, and fov: angle
function render (map, camera, screen, options) {
  const ctx = screen.getContext("2d");

  for (let col = 0; col < screen.width; col++) {
    renderCol(ctx, col, map, camera, screen, options);
  }
}

