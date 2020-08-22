class Grid {
    constructor(canvasWidth, canvasHeight, width, height, margin) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.tileWidth = width;
        this.tileHeight = height;
        this.margin = margin;

        this.tiles = [];

        this.initialize();
    }

    initialize() {
        let numRows = Math.floor(this.height / this.tileHeight);
        let numCols = Math.floor(this.width / this.tileWidth);


        for (let row = 0; row < numRows; row++) {
            let rowTiles = []
            for (let col = 0; col < numCols; col++)
                rowTiles.push(new GridTile(row, col, this.tileWidth, this.tileHeight, 5, this));

            this.tiles.push(rowTiles);
        }
    }

    show() {
        let occupiedTiles = [];

        for (let row = 0; row < this.tiles.length; row++)
            for (let col = 0; col < this.tiles[row].length; col++) {
                let tile = this.tiles[row][col];

                if (tile.occupied)
                    // The occupied tiles should be rendered last so they render on top of the empty tiles
                    // This avoids a "see-through" effect on the text within the tiles
                    occupiedTiles.push(tile);
                else
                    tile.show();
            }

        for (let tile = 0; tile < occupiedTiles.length; tile++)
            occupiedTiles[tile].show();

    }

    getTileContainingPoint(x, y) {
        let row = Math.ceil(x / this.tileWidth) - 1, col = Math.ceil(y / this.tileHeight) - 1;
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
            gridTile.setTile(tile);
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
    }

    setTile(tile) {
        this.occupied = true;
        this.containedTile = tile;
        this.bolded = false;

        tile.grid = this.grid;
        tile.gridTileLocation = this;
    }

    clearTile() {
        this.occupied = false;
        this.containedTile = null;
    }

    show() {
        stroke(255);
        strokeWeight(1);
        noFill();

        if (this.bolded)
            strokeWeight(2);

        if (this.containedTileIsBeingMoved)
            stroke(245, 234, 204)

        dashedRect(this.row * this.width + this.margin, this.col * this.height + this.margin, this.width - 2 * this.margin, this.height - 2 * this.margin, 5, 5);

        if (this.occupied) {
            this.containedTile.x = this.row * this.width;
            this.containedTile.y = this.col * this.height;
            this.containedTile.show();
        }
    }
}