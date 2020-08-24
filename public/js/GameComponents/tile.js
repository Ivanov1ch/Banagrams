class Tile {
    constructor(letter) {
        this.letter = letter;
        this.x = 0;
        this.y = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.width = 50;
        this.height = 50;

        this.isBeingDragged = false;
        this.isHovered = false;

        this.grid = null;

        // The GridTile that currently has this Tile as its containedTile
        this.gridTileLocation = null;
    }

    setCoordinates(x, y) {
        this.x = x;
        this.y = y;
    }

    show() {
        fill(245, 234, 204);
        noStroke();

        this.checkHover();
        this.updateCoords();

        if (this.isHovered) {
            stroke(255);
            strokeWeight(3);
        }


        rect(this.x, this.y, this.width, this.height);
        fill(0);
        textSize(this.height * 2 / 3 + 2);
        textStyle(BOLD);
        textAlign(CENTER, CENTER);

        // Funky positioning, but it is what makes each letter look as close to centered as possible within the tile
        text(this.letter, this.x + this.width / 3.75, this.y + this.height / 5, this.width * 2 / 3, this.height * 2 / 3);
    }

    // Checks if the mouse is over the object and updates the fields accordingly
    checkHover() {
        this.isHovered = false;

        // These calculations have to include the current translation of the grid because mouse coordinates do not change
        // as the coordinate system is transformed, but the coordinates of items on that system (such as this tile) do.

        // Is the X inside the box?
        if (mouseX - this.grid.translateX > this.x && mouseX - this.grid.translateX < this.x + this.width)
            // Is the Y inside the box?
            if (mouseY - this.grid.translateY > this.y && mouseY - this.grid.translateY < this.y + this.height)
                this.isHovered = true;
    }

    updateCoords() {
        if (this.isBeingDragged) {
            this.x = mouseX + this.offsetX;
            this.y = mouseY + this.offsetY;

            // Don't let items be dragged out of bounds
            let rightBoundaryX = 900 - this.grid.translateX, leftBoundaryX = -this.grid.translateX;
            let upperBoundaryY = -this.grid.translateY, lowerBoundaryY = 900 - this.grid.translateY;

            if (this.x > rightBoundaryX - this.width)
                this.x = rightBoundaryX - this.width;
            else if (this.x < leftBoundaryX)
                this.x = leftBoundaryX;


            if (this.y > lowerBoundaryY - this.height)
                this.y = lowerBoundaryY - this.height;
            else if (this.y < upperBoundaryY)
                this.y = upperBoundaryY;

            let centerX = this.x + this.width / 2, centerY = this.y + this.height / 2;

            this.grid.boldTile(centerX, centerY);
        }
    }

    checkPressed() {
        this.checkHover();

        if (this.isHovered) {
            this.isBeingDragged = true;
            // Keep track of relative location of the click to the corner of rectangle
            this.offsetX = this.x - mouseX;
            this.offsetY = this.y - mouseY;

            // Make sure the parent tile knows its child is moving
            this.gridTileLocation.containedTileIsBeingMoved = true;
        }
    }

    released() {
        this.isBeingDragged = false;
        this.gridTileLocation.containedTileIsBeingMoved = false;

        this.grid.dropTile(this);
    }
}
