const { v1: uuid } = require('uuid');

class Lobby {
    constructor(name, size) {
        this.id = uuid(); // Generates a unique ID for the new lobby
        this.name = name;
        this.playerIDs = [];
        this.readyToPlay = []; // Will be populated with the playerIDs of everyone who has loaded /game 
        // Generate a random number between 10^5 and 10^8 to serve as the seed for all the seeded RNG generators that shuffle the bunches
        this.bunchSeed = Math.floor(Math.random() * (Math.pow(10, 8) - Math.pow(10, 5) + 1)) + Math.pow(10, 5);
        this.size = size;

        this.startingTiles = null; // How many tiles each player started the game with. Set upon game start using game_data.json
        this.numPeels = 0; // How many peels have been performed this game
        // When set, will have keys of player IDs and values how many dumps this player has performed
        this.numDumps = {};

        // What is the difference?
        // lobbyHasStarted = the start button has been pressed on /lobby and the countdown has ended -> players redirected to /game
        // gameHasStarted = the /game page has been loaded, all players are ready to play (and are in this.readyToPlay),
        // and startGame() has been called. From this point on all refreshes of the page and such will result in a kick from the lobby.
        this.lobbyHasStarted = false;
        this.gameHasStarted = false;
    }
}

module.exports = Lobby;
