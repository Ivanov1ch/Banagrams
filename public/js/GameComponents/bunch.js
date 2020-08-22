class Bunch {
    constructor(seed) {
        this.tiles = [];
        this.rng = new Math.seedrandom(seed);
    }

    setupTiles(lettersJSON) {
        for (let letter in lettersJSON) {
            if (lettersJSON.hasOwnProperty(letter))
                // Add the right number of Tiles
                for (let counter = 1; counter <= lettersJSON[letter]; counter++) {
                    let tile = new Tile(letter);
                    this.tiles.push(tile);
                }
        }

        this.shuffle();
    }

    shuffle() {
        // Swap 2 random tiles, 5000 times
        for (let shuffleCount = 1; shuffleCount <= 5000; shuffleCount++) {
            let tile1 = this.pickRandomTile(), tile2 = this.pickRandomTile();
            let temp = this.tiles[tile1];

            this.tiles[tile1] = this.tiles[tile2];
            this.tiles[tile2] = temp;
        }
    }

    pickRandomTile() {
        return Math.floor(this.rng() * this.tiles.length); // Generates a random index in the array
    }

}