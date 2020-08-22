let lettersJSON;
const bunch = new Bunch(654321), grid = new Grid(900, 900, 50, 50, 5);

function preload() {
    let currentURL = getURL();
    let jsonURL = currentURL.slice(0, currentURL.lastIndexOf('/') + 1) + 'letters.json';
    lettersJSON = loadJSON(jsonURL);
}

function setup() {
    createCanvas(900, 900);
    bunch.setupTiles(lettersJSON);
}

function draw() {
    background(0);
    grid.show();
    bunch.tiles[0].show();
}

function mousePressed() {
    bunch.tiles[0].checkPressed();
}

function mouseReleased() {
    bunch.tiles[0].released();
}