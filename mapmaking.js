console.log("loaded mapmaking")

MAP_COLOURS = ["#dddddd", "#dd8888", "#88dd88", "#8888dd"];

/***********/
/* helpers */
/***********/

function isNatural (a) {
  return (a == Math.floor(a)) && (a > 0);
}

function headingToVector (h) {
  return vnormalize(vrotate([1, 0], -h));
}

function hexToList (h) {
  return [h.slice(1, 3), h.slice(3, 5), h.slice(5, 7)].map(c => parseInt(c, 16));
}

/********************/
/* table map making */
/********************/

function newMap () {
  let mapWidth = document.getElementById("map-width").value;
  let mapHeight = document.getElementById("map-height").value;
  if (!(isNatural(mapWidth) && isNatural(mapHeight))) {
    alert("Ensure map dimensions are positive integers");
    return;
  }

  let map = document.getElementById("map");
  while (map.firstChild)
    map.removeChild(map.lastChild);

  for (let ri = 0; ri < mapHeight; ri++) {
    let row = document.createElement("tr");
    for (let ci = 0; ci < mapWidth; ci++) {
      let cell = document.createElement("td");
      cell.innerHTML = "0";
      cell.style.backgroundColor = MAP_COLOURS[0];
      cell.addEventListener("click", function (e) {
        this.innerHTML = (Number(this.innerHTML) + 1) % 4;
        this.style.backgroundColor = MAP_COLOURS[Number(this.innerHTML)];
      });
      row.appendChild(cell);
    }
    map.appendChild(row);
  }
}

/*********************/
/* rendering wrapper */
/*********************/

function readMap () {
  return Array.from(document.getElementById("map").childNodes)
              .map(row => Array.from(row.childNodes)
                               .map(cell => Number(cell.innerHTML)));
}

function readCamera () {
  return {
    pos: [Number(document.getElementById("camera-x").value), Number(document.getElementById("camera-y").value)],
    dir: headingToVector(Number(document.getElementById("camera-heading").value)),
    fov: Number(document.getElementById("fov").value)
  }
}

function readCanvas () {
  let screen = document.getElementById("screen");
  screen.width = Number(document.getElementById("render-width").value);
  screen.height = Number(document.getElementById("render-height").value);
  return screen;
}

function readOptions () {
  let findColour = (a => hexToList(document.getElementById(a).value));
  return {
    viewDist: Number(document.getElementById("view-dist").value),
    light: headingToVector(Number(document.getElementById("light-heading").value)),
    darkest: Number(document.getElementById("ambient-light").value) / 100,
    wallColours: ["wall-1", "wall-2", "wall-3"].map(findColour),
    floorColours: ["floor-1", "floor-2"].map(findColour),
    zeroColour: findColour("void"),
    cyclindrical: document.getElementById("cyclindrical").checked,
    perpDist: !document.getElementById("fisheye").checked,
    dithering: document.getElementById("dither").checked
  }
}

function renderScene () {
  render(readMap(), readCamera(), readCanvas(), readOptions());
}

/**********/
/* onload */
/**********/

window.onload = function () {
  newMap()
  renderScene()
}

