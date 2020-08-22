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
            let row = []
            for (let col = 0; col < numCols; col++)
                row.push(new GridTile(row, col));

            this.tiles.push(row);
        }

        console.log(this.tiles);
    }

    show() {
        stroke(255);
        strokeWeight(1);
        for (let row = 0; row < this.tiles.length; row++)
            for (let col = 0; col < this.tiles[row].length; col++) {
                dashedRect(row * this.tileWidth + this.margin, col * this.tileHeight + this.margin, this.tileWidth - 2 * this.margin, this.tileHeight - 2 * this.margin, 5, 5);
            }
    }
}

class GridTile {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.occupied = false;
        this.containedTile = null;
    }
}