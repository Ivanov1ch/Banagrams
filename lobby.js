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
    }
}

module.exports = Lobby;
