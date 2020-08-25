class Grid {
    constructor(canvasWidth, canvasHeight, width, height, margin, numRows, numCols) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.tileWidth = width;
        this.tileHeight = height;
        this.margin = margin;

        this.tiles = [];
        this.occupiedTiles = [];

        this.translateX = 0;
        this.translateY = 0;

        this.numRows = numRows;
        this.numCols = numCols;

        this.processingScroll = false;

        this.initialize();
    }

    initialize() {
        for (let row = 0; row < this.numRows; row++) {
            let rowTiles = []
            for (let col = 0; col < this.numCols; col++)
                rowTiles.push(new GridTile(row, col, this.tileWidth, this.tileHeight, this.margin, this));

            this.tiles.push(rowTiles);
        }

        // Calculate translateX and translateY to start in the center of the board
        this.translateX -= (Math.ceil(this.numRows / 2) - Math.floor((this.width / this.tileWidth) / 2)) * this.tileWidth;
        this.translateY -= (Math.floor(this.numCols / 2) - Math.floor((this.height / this.tileHeight) / 2)) * this.tileHeight;
    }

    show() {
        translate(this.translateX, this.translateY);
        let filledTiles = [];

        for (let row = 0; row < this.tiles.length; row++)
            for (let col = 0; col < this.tiles[row].length; col++) {
                let tile = this.tiles[row][col];

                if (tile.occupied)
                    // The occupied tiles should be rendered last so they render on top of the empty tiles
                    // This avoids a "see-through" effect on the text within the tiles
                    filledTiles.push(tile);
                else
                    tile.show();
            }

        this.occupiedTiles = filledTiles;

        for (let tile = 0; tile < this.occupiedTiles.length; tile++)
            this.occupiedTiles[tile].show();

    }

    getTileContainingPoint(x, y) {
        let row = Math.ceil(x / this.tileWidth) - 1, col = Math.ceil(y / this.tileHeight) - 1;

        // Stops user from placing a tile off the left bound of the screen
        if (row * this.tileWidth < -this.translateX)
            row++;

        // Stops user from placing a tile off the upper bound of the screen
        if (col * this.tileHeight < -this.translateY)
            col++;
        return this.tiles[row][col];
    }

    // Given the coordinates of the center of a Tile, this sets the GridTile.bolded property of the GridTile to true
    boldTile(centerX, centerY) {

        let tile = this.getTileContainingPoint(centerX, centerY);
        tile.bolded = true;

        // All other tiles must have their bolds removed

        for (let r = 0; r < this.tiles.length; r++)
            for (let c = 0; c < this.tiles[r].length; c++)
                if (r !== tile.row || c !== tile.col)
                    this.tiles[r][c].bolded = false;
    }

    // Sets a Tile as the containedTile of the GridTile containing the point (centerX, centerY) (the center point of the given Tile)
    // If the GridTile at that point is occupied, the operation is canceled
    dropTile(tile) {
        let centerX = tile.x + tile.width / 2, centerY = tile.y + tile.height / 2;
        let gridTile = this.getTileContainingPoint(centerX, centerY);

        if (!gridTile.occupied) {
            tile.gridTileLocation.clearTile();
            gridTile.setTile(tile, true);
        }
    }

    // All scrolling functions return true if they scrolled and false if they did not
    scrollRight() {
        if (!this.processingScroll) {
            this.processingScroll = true;

            // Can we scroll further?
            let maxX = this.tiles.length * this.tileWidth; // The furthest x coordinate that has a GridTile on it
            let currentX = 900 - this.translateX;

            if (currentX < maxX) {
                this.translateX -= this.tileWidth;
                this.processingScroll = false;
                return true;
            }

            this.processingScroll = false;
            return false;
        }
    }

    scrollLeft() {
        if (!this.processingScroll) {
            this.processingScroll = true;

            // Can we scroll further?
            if (this.translateX < 0) {
                this.translateX += this.tileWidth;
                this.processingScroll = false;
                return true;
            }

            this.processingScroll = false;
            return false;
        }
    }

    scrollDown() {
        if (!this.processingScroll) {
            this.processingScroll = true;

            // Can we scroll further?
            let maxY = this.tiles[0].length * this.tileHeight; // The furthest y coordinate that has a GridTile on it
            let currentY = 900 - this.translateY;

            if (currentY < maxY) {
                this.translateY -= this.tileHeight;
                this.processingScroll = false;
                return true;
            }

            this.processingScroll = false;
            return false;
        }
    }

    scrollUp() {
        if (!this.processingScroll) {
            this.processingScroll = true;

            // Can we scroll further?
            if (this.translateY < 0) {
                this.translateY += this.tileHeight;
                this.processingScroll = false;
                return true;
            }

            this.processingScroll = false;
            return false;
        }
    }

    scrollTilesLeft() {
        if (!this.processingScroll) {
            this.processingScroll = true;
            let tempTiles = [...this.occupiedTiles]; // Copy array, don't make reference to it (otherwise it keeps growing)

            // Sort by increasing row: if we don't do this, adjacent tiles will destroy each other
            tempTiles.sort((a, b) => a.row - b.row);

            // Can we scroll left in the first place?
            if (tempTiles[0].row === 0) {
                this.processingScroll = false;
                return false; // This is the smallest row in the array. If this is not === 0, nothing else will be
            }

            for (let i = 0; i < tempTiles.length; i++) {
                let gridTile = tempTiles[i];
                let containedTile = gridTile.containedTile;

                gridTile.clearTile();
                this.tiles[gridTile.row - 1][gridTile.col].setTile(containedTile);
            }

            this.processingScroll = false;
            this.processingScroll = false;
            return true;
        }
    }

    scrollTilesRight() {
        if (!this.processingScroll) {
            this.processingScroll = true;
            let tempTiles = [...this.occupiedTiles]; // Copy array, don't make reference to it (otherwise it keeps growing)

            // Sort by decreasing row: if we don't do this, adjacent tiles will destroy each other
            tempTiles.sort((a, b) => b.row - a.row);

            // Can we scroll right in the first place?
            if (tempTiles[0].row === this.numRows - 1) {
                this.processingScroll = false;
                return false; // This is the largest row in the array. If this is not === numRows - 1, nothing else will be
            }

            for (let i = 0; i < tempTiles.length; i++) {
                let gridTile = tempTiles[i];
                let containedTile = gridTile.containedTile;

                gridTile.clearTile();
                this.tiles[gridTile.row + 1][gridTile.col].setTile(containedTile);
            }

            this.processingScroll = false;
            return true;
        }
    }

    scrollTilesUp() {
        if (!this.processingScroll) {
            this.processingScroll = true;
            let tempTiles = [...this.occupiedTiles]; // Copy array, don't make reference to it (otherwise it keeps growing)

            // Sort by increasing column: if we don't do this, adjacent tiles will destroy each other
            tempTiles.sort((a, b) => a.col - b.col);

            // Can we scroll up in the first place?
            if (tempTiles[0].col === 0) {
                this.processingScroll = false;
                return false; // This is the smallest column in the array. If this is not === 0, nothing else will be
            }

            for (let i = 0; i < tempTiles.length; i++) {
                let gridTile = tempTiles[i];
                let containedTile = gridTile.containedTile;

                gridTile.clearTile();
                this.tiles[gridTile.row][gridTile.col - 1].setTile(containedTile);
            }

            this.processingScroll = false;
            return true;
        }
    }

    scrollTilesDown() {
        if (!this.processingScroll) {
            this.processingScroll = true;
            let tempTiles = [...this.occupiedTiles]; // Copy array, don't make reference to it (otherwise it keeps growing)

            // Sort by decreasing column: if we don't do this, adjacent tiles will destroy each other
            tempTiles.sort((a, b) => b.col - a.col);

            // Can we scroll up in the first place?
            if (tempTiles[0].col === this.numCols - 1) {
                this.processingScroll = false;
                return false; // This is the largest column in the array. If this is not === numCols - 1, nothing else will be
            }

            for (let i = 0; i < tempTiles.length; i++) {
                let gridTile = tempTiles[i];
                let containedTile = gridTile.containedTile;

                gridTile.clearTile();
                this.tiles[gridTile.row][gridTile.col + 1].setTile(containedTile);
            }

            this.processingScroll = false;
            return true;
        }
    }

    checkPressed() {
        for (let i = 0; i < this.occupiedTiles.length; i++)
            if (this.occupiedTiles[i].containedTile != null)
                this.occupiedTiles[i].containedTile.checkPressed();
    }

    released() {
        for (let i = 0; i < this.occupiedTiles.length; i++)
            if (this.occupiedTiles[i].containedTile != null)
                this.occupiedTiles[i].containedTile.released();

    }

    // Places a tile in the first open space it can find that has at least one blank space between it and all other tiles
    addTile(tile) {
        let tempTiles = [...this.occupiedTiles];

        // Sort tempTiles so that tiles that are currently visible are searched around first, with those currently
        // roughly in the middle of the screen taking highest priority
        let smallestRowVisible = (-this.translateX / this.tileWidth) - 1;
        let largestRowVisible = (this.width / this.tileWidth) + smallestRowVisible;
        let smallestColVisible = (-this.translateY / this.tileHeight) - 1;
        let largestColVisible = (this.height / this.tileHeight) + smallestColVisible;

        tempTiles.sort((a, b) => {
            if (b.row >= smallestRowVisible && b.row <= largestRowVisible) {
                if (a.row >= smallestRowVisible && a.row <= largestRowVisible) {
                    if (b.col >= smallestColVisible && b.col <= largestColVisible) {
                        if (a.col >= smallestColVisible && a.col <= largestColVisible) {
                            // Both are fully visible, break the tie by seeing which is closer to the center vertically, then horizontally
                            let middleCol = Math.floor((smallestColVisible + largestColVisible) / 2);
                            let diffA = Math.abs(a.col - middleCol), diffB = Math.abs(b.col - middleCol);

                            if (diffA === diffB) {
                                // Settle the tie horizontally
                                let middleRow = Math.floor((smallestRowVisible + largestRowVisible) / 2);
                                diffA = Math.abs(a.row - middleRow);
                                diffB = Math.abs(b.row - middleRow);

                                return diffA - diffB;
                            } else {
                                return diffA - diffB;
                            }
                        } else {
                            return -1;
                        }
                    } else {
                        // B's col is out of range
                        if (a.col >= smallestColVisible && a.col <= largestColVisible) {
                            return 1;
                        } else {
                            // Both cols out of range, just subtract them at this point
                            return a.col - b.col;
                        }
                    }
                } else {
                    return -1;
                }
            } else {
                // B's row is out of range
                if (a.row >= smallestRowVisible && a.row <= largestRowVisible) {
                    return 1;
                } else {
                    // Both rows out of range, just subtract them at this point
                    return a.row - b.row;
                }
            }
        });

        let visited = [];

        for (let i = 0; i < tempTiles.length; i++)
            visited.push(false);

        let finalLocation = null;

        for (let i = 0; i < tempTiles.length; i++) {
            let thisTile = tempTiles[i], row = thisTile.row, col = thisTile.col;

            // Check all locations 2 tiles away from this tile
            for (let r = row - 2; r <= row + 2; r += 2) {
                for (let c = col - 2; c <= col + 2; c += 2) {
                    let potentialLocation = this.tiles[r][c];
                    let validLocation = true;
                    // Check if there is a 1-block empty circle around potentialLocation
                    for (let r2 = r - 1; r2 <= r + 1; r2++) {
                        for (let c2 = c - 1; c2 <= c + 1; c2++) {
                            if (this.tiles[r2][c2].occupied)
                                validLocation = false;
                        }
                    }

                    if (validLocation) {
                        finalLocation = potentialLocation;
                        break;
                    }
                }

                if (finalLocation != null)
                    break;
            }


        }

        // setTile() and make sure the new tile is visible by adjusting the boundaries
        if (finalLocation != null) {
            finalLocation.setTile(tile);
            let row = finalLocation.row, col = finalLocation.col;
            if (row < smallestRowVisible) {
                this.translateX = -row * this.tileWidth;
            } else if (row > largestRowVisible) {
                this.translateX = -((row + 1) * this.tileWidth - this.width);
            }

            if (col < smallestColVisible) {
                this.translateY = -col * this.tileHeight;
            } else if (col > largestColVisible) {
                console.log("Yo");
                this.translateY = -((col + 1) * this.tileHeight - this.height);
            }
        }
    }

}

class GridTile {
    constructor(row, col, width, height, margin, grid) {
        this.row = row;
        this.col = col;
        this.width = width;
        this.height = height;
        this.margin = margin;
        this.grid = grid;

        this.containedTile = null;
        this.containedTileIsBeingMoved = false;
        this.occupied = false;
        this.bolded = false;

        this.debug = false;
    }

    setTile(tile, checkForPeel = false) {
        if (tile != null) {
            this.occupied = true;
            this.containedTile = tile;
            this.bolded = false;
            this.grid.occupiedTiles.push(this);

            tile.grid = this.grid;
            tile.gridTileLocation = this;

            if (checkForPeel)
                peelCheck();
        }
    }

    clearTile() {
        this.occupied = false;

        if (this.containedTile != null) {
            this.containedTile.gridTileLocation = null;
            this.containedTile = null;
        }
    }

    show() {
        stroke(255);
        strokeWeight(1);
        noFill();

        if (this.bolded)
            strokeWeight(3);

        if (this.containedTileIsBeingMoved)
            stroke(245, 234, 204)

        dashedRect(this.row * this.width + this.margin, this.col * this.height + this.margin, this.width - 2 * this.margin, this.height - 2 * this.margin, 5, 5);

        if (this.debug) {
            fill(255)
            textSize(10);
            text(`(${this.row}, ${this.col})`, this.row * this.width + this.margin, this.col * this.height + this.margin, (this.row + 1) * this.width - this.margin, (this.col + 1) * this.height - this.margin);
        }

        if (this.occupied) {
            this.containedTile.x = this.row * this.width;
            this.containedTile.y = this.col * this.height;
            this.containedTile.show();
        }
    }
}