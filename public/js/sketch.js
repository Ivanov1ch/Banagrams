let gameDataJSON, scrollUpInterval, scrollDownInterval, scrollLeftInterval, scrollRightInterval;
let tileScrollUpInterval, tileScrollDownInterval, tileScrollLeftInterval, tileScrollRightInterval;
const canvasWidth = 900, canvasHeight = 900, tileWidth = 50, tileHeight = 50, gridMargin = 5, numRows = 50,
    numCols = 50, scrollLoopDelay = 125;
const bunch = new Bunch(654321),
    grid = new Grid(canvasWidth, canvasHeight, tileWidth, tileHeight, gridMargin, numRows, numCols);

// How many players are in the game, and the order in which the player draws (1 = draws first, numPlayers = draws last)
const numPlayers = 4, playerOrder = 1;

function preload() {
    let currentURL = getURL();
    let jsonURL = currentURL.slice(0, currentURL.lastIndexOf('/') + 1) + 'game_data.json';
    gameDataJSON = loadJSON(jsonURL);
}

function setup() {
    createCanvas(canvasWidth, canvasHeight);
    bunch.setupTiles(gameDataJSON.letters);
}


function draw() {
    background(0);
    grid.show();
}

let processingKey = false;

function keyPressed() {
    if (!processingKey) {
        processingKey = true;
        if (key === 'w' && scrollUpInterval == null) {
            grid.scrollUp();
            scrollUpInterval = setInterval(() => grid.scrollUp(), scrollLoopDelay);
        } else if (key === 'a' && scrollLeftInterval == null) {
            grid.scrollLeft();
            scrollLeftInterval = setInterval(() => grid.scrollLeft(), scrollLoopDelay);
        } else if (key === 's' && scrollDownInterval == null) {
            grid.scrollDown();
            scrollDownInterval = setInterval(() => grid.scrollDown(), scrollLoopDelay);
        } else if (key === 'd' && scrollRightInterval == null) {
            grid.scrollRight();
            scrollRightInterval = setInterval(() => grid.scrollRight(), scrollLoopDelay);
        }

        // There needs to be tiles on the grid to move in the first place
        if (grid.occupiedTiles.length !== 0) {
            if (keyCode === LEFT_ARROW && tileScrollLeftInterval == null) {
                grid.scrollTilesLeft();
                tileScrollLeftInterval = setInterval(() => grid.scrollTilesLeft(), scrollLoopDelay);
            } else if (keyCode === RIGHT_ARROW && tileScrollRightInterval == null) {
                grid.scrollTilesRight();
                tileScrollRightInterval = setInterval(() => grid.scrollTilesRight(), scrollLoopDelay);
            } else if (keyCode === UP_ARROW) {
                grid.scrollTilesUp();
                tileScrollUpInterval = setInterval(() => grid.scrollTilesUp(), scrollLoopDelay);
            } else if (keyCode === DOWN_ARROW) {
                grid.scrollTilesDown();
                tileScrollDownInterval = setInterval(() => grid.scrollTilesDown(), scrollLoopDelay);
            }
        }

        processingKey = false;
    }
}


function keyReleased() {
    if (key === 'w') {
        clearInterval(scrollUpInterval);
        scrollUpInterval = null;
    } else if (key === 'a') {
        clearInterval(scrollLeftInterval);
        scrollLeftInterval = null;
    } else if (key === 's') {
        clearInterval(scrollDownInterval);
        scrollDownInterval = null;
    } else if (key === 'd') {
        clearInterval(scrollRightInterval);
        scrollRightInterval = null;
    }

    if (keyCode === LEFT_ARROW) {
        clearInterval(tileScrollLeftInterval);
        tileScrollLeftInterval = null;
    } else if (keyCode === RIGHT_ARROW) {
        clearInterval(tileScrollRightInterval);
        tileScrollRightInterval = null;
    } else if (keyCode === UP_ARROW) {
        clearInterval(tileScrollUpInterval);
        tileScrollUpInterval = null;
    } else if (keyCode === DOWN_ARROW) {
        clearInterval(tileScrollDownInterval);
        tileScrollDownInterval = null;
    }
}

function mousePressed() {
    grid.checkPressed();
}

function mouseReleased() {
    grid.released();
}

function startGame() {
    // Can't start the game if it's already been started
    if (grid.occupiedTiles.length !== 0)
        return;

    // Fetch how many tiles each player should start with for this player count from the JSON
    let numTilesToStartWith = gameDataJSON.starting_tiles[numPlayers.toString()];

    // Since the game is only just starting, there is guaranteed to be enough tiles for everyone to draw
    // Therefore we do not have to worry about startingTiles being null in this case
    let startingTiles = bunch.drawTilesAsGroup(numTilesToStartWith, playerOrder, numPlayers);

    // Lay out the startingTiles into 3 roughly-even rows in the bottom the 3 rows of the initial grid view
    let maxTilesPerRow = Math.ceil(startingTiles.length / 3);
    let leftMargin = Math.floor(((canvasWidth / tileWidth) - maxTilesPerRow) / 2);
    let numRows = Math.floor(canvasHeight / tileHeight);

    let startingRow = numRows + Math.abs(grid.translateX / grid.tileWidth) - 4;
    let startingCol = leftMargin + Math.abs(grid.translateY / grid.tileHeight);

    let tileIndex = 0;
    for (let row = startingRow; row < startingRow + 3; row++)
        for (let col = startingCol; col < startingCol + maxTilesPerRow; col++) {
            if (tileIndex === startingTiles.length)
                break;

            grid.tiles[col][row].setTile(startingTiles[tileIndex]);
            tileIndex++;
        }

}