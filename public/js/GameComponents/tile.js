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

        // Is the X inside the box?
        if (mouseX > this.x && mouseX < this.x + this.width)
            // Is the Y inside the box?
            if (mouseY > this.y && mouseY < this.y + this.height)
                this.isHovered = true;

    }

    updateCoords() {
        if(this.isBeingDragged) {
            this.x = mouseX + this.offsetX;
            this.y = mouseY + this.offsetY;

            // Don't let items be dragged out of Bounds
            if(this.x + this.width > 900)
                this.x = 900 - this.width;
            else if (this.x < 0)
                this.x = 0;

            if(this.y + this.height > 900)
                this.y = 900 - this.height;
            else if(this.y < 0)
                this.y = 0;
        }
    }

    checkPressed() {
        this.checkHover();

        if (this.isHovered) {
            this.isBeingDragged = true;
            // Keep track of relative location of the click to the corner of rectangle
            this.offsetX = this.x - mouseX;
            this.offsetY = this.y - mouseY;
        }
    }

    released() {
        this.isBeingDragged = false;
    }
}
