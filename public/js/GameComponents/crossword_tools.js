// An implementation of a Queue to avoid the large amounts of memory required by recursion (would lag browsers)
class Queue {
    #elements;

    constructor() {
        this.#elements = [];
    }

    enqueue(element) {
        this.#elements.push(element);
    }

    dequeue() {
        return this.#elements.shift();
    }

    peek() {
        return !this.isEmpty() ? this.#elements[0] : null;
    }

    isEmpty() {
        return this.#elements.length === 0;
    }

    size() {
        return this.#elements.length;
    }
}

// gridTiles is the Grid's 2D array of GridTiles
function isValidShape(gridTiles) {
    let visited = [];

    for (let i = 0; i < gridTiles.length; i++) {
        let arr = [];
        for (let j = 0; j < gridTiles[i].length; j++)
            arr.push(false);

        visited.push(arr);
    }

    // Count how many blobs there are in the grid. There should only be 1 in a valid crossword.
    let checkQueue = new Queue(), blobCount = 0;

    for (let i = 0; i < gridTiles.length; i++) {
        for (let j = 0; j < gridTiles[i].length; j++) {
            if (gridTiles[i][j].occupied && !visited[i][j]) {
                checkQueue.enqueue(gridTiles[i][j]);
                blobCount++;

                while (!checkQueue.isEmpty()) {
                    let tile = checkQueue.dequeue();

                    if (!visited[tile.row][tile.col]) {
                        visited[tile.row][tile.col] = true;

                        if (tile.occupied) {
                            checkQueue.enqueue(gridTiles[tile.row - 1][tile.col]);
                            checkQueue.enqueue(gridTiles[tile.row + 1][tile.col]);
                            checkQueue.enqueue(gridTiles[tile.row][tile.col - 1]);
                            checkQueue.enqueue(gridTiles[tile.row][tile.col + 1]);
                        }
                    }
                }
            } else
                visited[i][j] = true;
        }
    }

    return blobCount === 1;
}

// Finds all the words in the crossword, if it is valid. Returns them as a list of strings.
function findAllWords(grid) {
    if (!isValidShape(grid.tiles))
        return null;

    let tiles = [...grid.occupiedTiles]; // Make a copy of occupiedTiles

    let words = [];

    // First, find all VERTICAL words

    // Sort from top to bottom, then left to right
    tiles.sort((a, b) => {
        let colDiff = a.col - b.col;

        return colDiff !== 0 ? colDiff : a.row - b.row;
    });

    let checkQueue = new Queue(), visited = [];

    for (let i = 0; i < tiles.length; i++)
        visited.push(false);

    // For every tile, check all tiles below it and form a Word if there is one (letters >= 2)
    for (let i = 0; i < tiles.length; i++) {
        if (!visited[i]) {
            checkQueue.enqueue(tiles[i]);
            let word = [];

            while (!checkQueue.isEmpty()) {
                let tile = checkQueue.dequeue(), tileIndex = tiles.indexOf(tile);

                if (!visited[tileIndex]) {
                    word.push(tile);
                    visited[tileIndex] = true;

                    if (tile.col !== grid.numCols - 1)
                        if (grid.tiles[tile.row][tile.col + 1].occupied)
                            checkQueue.enqueue(grid.tiles[tile.row][tile.col + 1]);
                }
            }

            if (word.length >= 2)
                words.push(new Word(word));
        }
    }

    // Now check HORIZONTAL words and append them to the array as well

    // Sort from left to right, then top to bottom
    tiles.sort((a, b) => {
        let colDiff = a.row - b.row;

        return colDiff !== 0 ? colDiff : a.col - b.col;
    });

    // Reset visited array
    for (let i = 0; i < visited.length; i++)
        visited[i] = false;

    // For every tile, check all tiles to the right of it and form a Word if there is one (letters >= 2)
    for (let i = 0; i < tiles.length; i++) {
        if (!visited[i]) {
            checkQueue.enqueue(tiles[i]);
            let word = [];

            while (!checkQueue.isEmpty()) {
                let tile = checkQueue.dequeue(), tileIndex = tiles.indexOf(tile);

                if (!visited[tileIndex]) {
                    word.push(tile);
                    visited[tileIndex] = true;

                    if (tile.row !== grid.numRows - 1)
                        if (grid.tiles[tile.row + 1][tile.col].occupied)
                            checkQueue.enqueue(grid.tiles[tile.row + 1][tile.col]);
                }
            }

            if (word.length >= 2)
                words.push(new Word(word));
        }
    }

    return words;
}

class Word {
    constructor(gridTiles) {
        this.text = '';
        this.gridTiles = gridTiles;

        this.constructText();
    }

    constructText() {
        let word = '';

        this.gridTiles.forEach((tile) => {
            word += tile.containedTile.letter;
        });

        this.text = word;
    }
}