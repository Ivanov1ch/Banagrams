let gameDataJSON, dictionary, scrollUpInterval, scrollDownInterval, scrollLeftInterval, scrollRightInterval;
let tileScrollUpInterval, tileScrollDownInterval, tileScrollLeftInterval, tileScrollRightInterval;
let paused = true;
const canvasWidth = 900, canvasHeight = 900, tileWidth = 50, tileHeight = 50, gridMargin = 5, numRows = 50,
    numCols = 50, scrollLoopDelay = 125;
const grid = new Grid(canvasWidth, canvasHeight, tileWidth, tileHeight, gridMargin, numRows, numCols);

const bunch = new Bunch(window.localStorage.getItem('bunchSeed'));
// How many players are in the game, and the order in which the player draws (1 = draws first, numPlayers = draws last)
const numPlayers = window.localStorage.getItem('numPlayers'), playerOrder = window.localStorage.getItem('playerOrder');

const socket = io.connect('http://localhost:8000');
let isHost = null; // Will be set (to true/false) by interactions.js upon its completion of player data validation

function preload() {
    let currentURL = getURL();
    let URLStem = currentURL.slice(0, currentURL.lastIndexOf('/') + 1);
    let jsonURL = URLStem + 'data/game_data.json';
    let dictionaryURL = URLStem + 'data/Dictionary.txt';
    gameDataJSON = loadJSON(jsonURL);

    let request = new XMLHttpRequest();
    request.open('GET', dictionaryURL, true);
    request.send(null);
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            let type = request.getResponseHeader('Content-Type');
            if (type.indexOf("text") !== 1) {
                dictionary = request.responseText.trim().split("\n");
                for (let i = 0; i < dictionary.length; i++)
                    dictionary[i] = dictionary[i].replace(/\W/g, '');

                paused = false;
            }
        }
    }
}


function setup() {
    createCanvas(canvasWidth, canvasHeight)
    bunch.setupTiles(gameDataJSON.letters);
}


function draw() {
    background(0);
    grid.show();
}

let processingKey = false;

function keyPressed() {
    if (!processingKey && !paused) {
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
    if (!paused)
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

    // Lay out the startingTiles into rows of 5 near the bottom of the initial Grid view
    let leftMargin = 2;
    let numRows = Math.floor(canvasHeight / tileHeight), numCols = Math.floor(canvasWidth / tileWidth);

    let startingRow = numRows + Math.abs(grid.translateX / grid.tileWidth) - Math.floor(numRows / 2);
    let startingCol = leftMargin + Math.abs(grid.translateY / grid.tileHeight);

    let tileIndex = 0;
    for (let row = startingRow; row < startingRow + numRows; row += 2)
        for (let col = startingCol; col < startingCol + numCols - leftMargin - 1; col += 2) {
            if (tileIndex === startingTiles.length)
                break;

            grid.tiles[col][row].setTile(startingTiles[tileIndex]);
            tileIndex++;
        }

    $('#dump-btn button').attr('disabled', false);
    paused = false;
}

function validateBoard() {
    paused = true;
    if (dictionary !== undefined) {
        let words = findAllWords(grid);

        if (words == null) {
            paused = false;
            return false;
        }

        // Binary search each word's text in the array
        for (let i = 0; i < words.length; i++) {
            let word = words[i], wordText = word.text;

            if (binarySearch(wordText) === -1) {
                paused = false;
                return false;
            }
        }

        paused = false;
        return true;
    }

    paused = false;
    return false;
}

// Returns the index of the word in the Dictionary if it is in the dictionary, otherwise returns -1
function binarySearch(word) {
    let low = 0, high = dictionary.length - 1, mid = Math.floor((high + low) / 2);

    while (dictionary[mid] !== word && low < high) {
        let comparison = word.localeCompare(dictionary[mid]);

        if (comparison < 0)
            high = mid - 1;
        else
            low = mid + 1;

        mid = Math.floor((high + low) / 2);
    }

    return (dictionary[mid] === word) ? mid : -1;
}

function dump() {
    console.log("Dump");
}

function peel() {
    paused = true;
    let tiles = bunch.drawTilesAsGroup(1, playerOrder, numPlayers);

    if (tiles == null) {
        console.log("No more peeling");
        return;
    }

    grid.addTile(tiles[0]);
    peelCheck();
    paused = false;
}

// Checks if the grid is in a state that would allow peeling (valid crossword shape), and enables the button if so
function peelCheck() {
    paused = true;
    if (isValidShape(grid.tiles))
        $('#peel-btn button').attr('disabled', false);
    else
        $('#peel-btn button').attr('disabled', true);
    paused = false;
}