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

    /*
    // Draws tiles from the bunch in a rotating manner, determined by playerOrder (1-indexed). For example:
    // say there is a 4-player game, with the first 10 tiles in the bunch being [A, B, C, D, E, F, G, H, I, J].
    // If each player were to draw 2 tiles, they would be dealt from the front, with the first going to to the player with
    // playerOrder of 1, the second going to the player with playerOrder of 2, etc., and then the cycle would repeat.
    // Thus, player 1 would get tiles A and E, player 2 would get B and F, 3 would get C and G, and 4 would get D and H.
    // This example explains how the game's drawing system will work and the significance of each player's playerOrder.
    //
    // Although the tiles will be drawn in this manner, this method only draws for ONE player. The bunches are all shuffled
    // based off of a seeded RNG algorithm, meaning that every player in the game will end up having the same bunch. Thus,
    // this method returns a list of the tiles THIS player will receive, but still removes all the tiles the OTHER players
    // will have received from the draw. Using the example from the last paragraph, if the player with playerOrder 2 ran
    // this method to find which 2 tiles they would receive, they would receive [B, F] as a return value. However, after
    // the method has finished executing, the bunch will begin with [I, J, ...], as ALL of the first 8 tiles have been removed
    // by the 4 players, not only the 2 removed by THIS player. Thus, the bunches will all remain synchronized and less
    // networking must be done. Isn't that neat? :)
    //
    // Parameters:
    //      numberToDraw - how many tiles will be drawn in this fashion (in the given example this would be 2)
    //      playerOrder - the drawing player's drawing order (1-indexed)
    //      playerCount - the number of players in the game
    //
    // Returns:
    //      1) null, if there are not enough tiles left for each player in the game to draw numberToDraw tiles
    //      2) An array of Tiles that this player will draw. The first tile they will draw will be at index 0.
     */
    drawTilesAsGroup(numberToDraw, playerOrder, playerCount) {
        // The total number of tiles to be drawn from the bunch by the group
        let totalTilesToBeDrawn = numberToDraw * playerCount;

        if (totalTilesToBeDrawn > this.tiles.length)
            return null;

        let drawnTiles = [];

        // We extract Tiles from this.tiles and add only those that will be drawn by this player to drawnTiles
        // We always only work with the FIRST element of the array because otherwise shifting indices will mess things up
        for (let tileNum = 1; tileNum <= totalTilesToBeDrawn; tileNum++) {
            let tile = this.tiles.shift(); // Remove the first Tile from the Bunch
            // Will this Tile go to THIS player? (Modulo on right side to make the last player work)
            if(tileNum % playerCount === playerOrder % playerCount)
                drawnTiles.push(tile);
        }

        return drawnTiles;
    }
}