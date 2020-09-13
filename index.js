const config = require('./config');
const Lobby = require('./lobby');
const applyRoutes = require('./routes');
const express = require('express');
const socket = require('socket.io');
const {v1: uuid} = require('uuid');

const app = express();
const port = config.config.port;

app.use(express.static(__dirname + '/public'));
applyRoutes(app);

const server = app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
});

const io = socket(server);
const lobbies = {}; // Will be used to store all the game lobbies and their related information
const players = {}; // Will be used to associate a socket to each player ID

let waitingToJoin = [] // A list of the IDs of each player currently on the /browse page

function joinLobby(socket, lobby) {
    lobby.playerIDs.push(socket.playerID);
    socket.rooms = {};
    socket.join(lobby.id, () => {
        players[socket.playerID].lobbyID = lobby.id;
        socket.to(lobby.id).emit('refreshNameList', getLobbyPlayers(lobby.id));
        // Cancel countdown
        io.to(players[socket.playerID].lobbyID).emit('countdownCanceled');
        io.to('Waiting Room').emit('refreshLobbyList', getLobbyList());
    });
}

function leaveLobby(socket) {
    let toDelete = [];

    for (let id in lobbies) {
        let lobby = lobbies[id];
        let playerID = socket.playerID;

        if (lobby.playerIDs.includes(playerID)) {
            lobby.playerIDs = lobby.playerIDs.filter((item) => item !== playerID);
            socket.to(id).emit('refreshNameList', getLobbyPlayers(id));
            socket.leave(id);
            players[playerID].lobbyID = undefined;
            players[playerID].name = undefined;

            if (lobby.gameHasStarted) {
                // TODO: Inform other players when an opponent leaves, disbanding if needed
            }
        }

        // Should this lobby be deleted (is it empty?)
        if (lobby.playerIDs.length === 0) {
            toDelete.push(id);
        }
    }

    toDelete.forEach((lobbyID) => {
        delete lobbies[lobbyID];
    });

    io.to('Waiting Room').emit('refreshLobbyList', getLobbyList());
}

function leaveLobbyAfterDisconnect(socket) {
    let toDelete = [];

    for (let id in lobbies) {
        let lobby = lobbies[id];
        let playerID = socket.playerID;

        if (lobby.playerIDs.includes(playerID)) {
            socket.leave(id);
            // Remove socket from lobby's array after a delay (so if they are simply switching pages it can be stopped)
            players[playerID].leaveLobbyTimeout = setTimeout(() => {
                lobby.playerIDs = lobby.playerIDs.filter((item) => item !== playerID);
                io.to(id).emit('refreshNameList', getLobbyPlayers(id));
                io.to('Waiting Room').emit('refreshLobbyList', getLobbyList());
                players[playerID].name = undefined;
            }, 5000);
        }

        // Should this lobby be deleted (is it empty?)
        if (lobby.playerIDs.length === 0)
            toDelete.push(id);
    }

    for (let lobbyID in toDelete)
        delete lobbies[lobbyID];
}

function inLobby(socket) {
    for (let id in lobbies) {
        let lobby = lobbies[id];

        if (lobby.playerIDs.includes(socket.playerID))
            return true;
    }

    return false;
}

function lobbyExists(name) {
    for (let id in lobbies) {
        let lobby = lobbies[id];
        if (lobby.name.toUpperCase() === name.toUpperCase())
            return true;
    }

    return false;
}

function getLobbyList() {
    let returnData = [];

    for (let id in lobbies) {
        let lobby = lobbies[id];

        let lobbyData = {
            id: lobby.id,
            name: lobby.name,
            players: lobby.playerIDs.length,
            size: lobby.size
        };

        // Don't show full lobbies, empty lobbies, or lobbies that have already started
        if (!lobby.lobbyHasStarted && lobbyData.players !== lobbyData.size && lobbyData.players > 0)
            returnData.push(lobbyData);
    }

    return returnData;
}

function joinWaitingList(socket) {
    if (!waitingToJoin.includes(socket.playerID))
        waitingToJoin.push(socket.playerID);

    socket.rooms = {};
    socket.join('Waiting Room');
}

function leaveWaitingList(socket) {
    socket.rooms = {};
    waitingToJoin = waitingToJoin.filter((item) => item !== socket.playerID);
}

function deletePlayerIDAfterDisconnect(socket) {
    players[socket.playerID].playerRemovalTimeout = setTimeout(() => {
        delete players[socket.playerID];
    }, 7500);
}

// Return format: [[[player ID, player name, playerHasChosenName], [player ID, player name, playerHasChosenName], etc.], readyToStart]
function getLobbyPlayers(lobbyID) {
    let data = [], lobby = lobbies[lobbyID];
    // Ready to start when all players have named themselves and the right number of players are in the lobby

    if (lobby === undefined)
        return;

    let readyToStart = lobby.playerIDs.length >= 2 && lobby.playerIDs.length <= 8;

    for (let index = 0; index < lobby.playerIDs.length; index++) {
        let playerData = [lobby.playerIDs[index]];
        let player = players[lobby.playerIDs[index]];

        if (player !== undefined)
            if (player.name !== undefined) {
                playerData.push(player.name);
                playerData.push(true);
            } else {
                playerData.push(`Player ${index + 1}`);
                playerData.push(false);
                readyToStart = false;
            }

        data.push(playerData);
    }

    return [data, readyToStart];
}

function isValidPlayerID(playerID) {
    return players.hasOwnProperty(playerID);
}

function isHost(playerID) {
    let lobby = lobbies[players[playerID].lobbyID];

    return lobby.playerIDs.indexOf(playerID) === 0;
}

function getHost(socket) {
    let lobby = lobbies[players[socket.playerID].lobbyID];

    return lobby.playerIDs[0];
}

function lobbyIsReady(lobby) {
    let numPlayers = lobby.playerIDs.length;

    if (numPlayers >= 2 && numPlayers <= 8) {
        for (let index = 0; index < numPlayers; index++)
            if (players[lobby.playerIDs[index]] === undefined || players[lobby.playerIDs[index]].name === undefined)
                return false;

        return true;
    }

    return false;
}

io.sockets.on('connection', (socket) => {
    socket.on('createLobby', (name, size, callback) => {
        if (inLobby(socket))
            callback('in');
        else if (typeof name !== 'string' || name.length === 0 || name.length > 64)
            callback('name');
        else if (typeof size !== "number" || size < 2 || size > 8)
            callback('size');
        else if (lobbyExists(name))
            callback('exists')
        else {
            let lobby = new Lobby(name, size);
            lobbies[lobby.id] = lobby;
            leaveWaitingList(socket);
            joinLobby(socket, lobby);
            io.to('Waiting Room').emit('refreshLobbyList', getLobbyList());
            callback('done');
        }
    });

    socket.on('joinLobby', (lobbyID, callback) => {
        let lobby = lobbies[lobbyID];

        if (lobby === undefined)
            callback('ID');
        else if (lobby.playerIDs.length >= lobby.size)
            callback('full')
        else {
            leaveWaitingList(socket);
            joinLobby(socket, lobby);
            callback('done');
        }
    });

    socket.on('getLobbyList', (callback) => {
        callback(getLobbyList());
    });

    socket.on('syncPlayerID', (playerID, hasLeftLobby, callback) => {
        if (playerID in players) {
            players[playerID].socket = socket;
            socket.playerID = playerID;

            // Check for any lobbies
            if (players[playerID].lobbyID !== undefined) {
                if (hasLeftLobby) {
                    leaveLobby(socket)
                } else {
                    socket.join(players[playerID].lobbyID);

                    if (players[playerID].leaveLobbyTimeout !== undefined)
                        clearTimeout(players[playerID].leaveLobbyTimeout);

                }
            }

            // Check if there is a timeout to delete the player from players
            if (players[playerID].playerRemovalTimeout !== undefined)
                clearTimeout(players[playerID].playerRemovalTimeout);

            callback(true);
        } else
            callback(false);
    })

    socket.on('getPlayerID', (currentID, callback) => {
        if (currentID in players) {
            players[currentID].socket = socket;
            socket.playerID = currentID;
            callback(currentID);
        } else {
            let playerID = uuid();
            players[playerID] = {'socket': socket};
            socket.playerID = playerID;
            callback(playerID);
        }
    });

    socket.on('inLobby', (callback) => {
        callback(inLobby(socket));
    });

    socket.on('joinWaitingList', (callback) => {
        joinWaitingList(socket);
        callback();
    });

    socket.on('setName', (name, callback) => {
        if (!inLobby(socket)) {
            callback('lobby')
        } else {
            if (name.replace(/\s+/g, '').length === 0)
                callback('tooShort')
            else if (socket.playerID !== undefined) {
                if (socket.playerID !== null) {
                    // Check if somebody else already has that name
                    let nameTaken = false;
                    lobbies[players[socket.playerID].lobbyID].playerIDs.forEach((playerID) => {
                        if (!nameTaken && playerID !== socket.playerID && players[playerID].name !== undefined) {
                            if (players[playerID].name.toUpperCase() === name.toUpperCase())
                                nameTaken = true;
                        }
                    });

                    if (nameTaken)
                        callback('taken')
                    else {
                        players[socket.playerID].name = name;
                        socket.to(players[socket.playerID].lobbyID).emit('refreshNameList', getLobbyPlayers(players[socket.playerID].lobbyID));
                        callback('done');
                    }
                } else {
                    callback('null')
                }
            } else {
                callback('undefined');
            }
        }
    });

    socket.on('causeLobbyRefresh', () => {
        if (players[socket.playerID].lobbyID !== undefined) {
            players[socket.playerID].name = undefined;
            socket.to(players[socket.playerID].lobbyID).emit('refreshNameList', getLobbyPlayers(players[socket.playerID].lobbyID));
        }
    });

    socket.on('checkIfReadyToStart', (startingPlayerID, callback) => {
        if (isValidPlayerID(startingPlayerID) && players[startingPlayerID].socket.id === socket.id) {
            if (inLobby(socket))
                if (isHost(startingPlayerID))
                    if (lobbyIsReady(lobbies[players[startingPlayerID].lobbyID]))
                        callback('ready');
                    else
                        callback('notReady');
                else
                    callback('notHost')
            else
                callback('notInLobby')
        } else
            callback('thisID')
    });

    socket.on('startCountdown', (callback) => {
        // Is this person the host and in a lobby
        if (inLobby(socket))
            if (isHost(socket.playerID))
                if (lobbyIsReady(lobbies[players[socket.playerID].lobbyID])) {
                    socket.to(players[socket.playerID].lobbyID).emit('beginCountdown');
                    callback('done');
                } else
                    callback('notReady');
            else
                callback('notHost');
        else
            callback('notInLobby');
    });

    socket.on('cancelCountdown', (callback) => {
        // Is this person the host and in a lobby?
        if (inLobby(socket))
            if (isHost(socket.playerID)) {
                socket.to(players[socket.playerID].lobbyID).emit('countdownCanceled');
                callback('done');
            } else
                callback('notHost');
        else
            callback('notInLobby');
    });

    socket.on('reportCountdownCompletion', (callback) => {
        // Is this person the host and in a lobby?
        if (inLobby(socket))
            if (isHost(socket.playerID)) {
                lobbies[players[socket.playerID].lobbyID].lobbyHasStarted = true;
                io.to('Waiting Room').emit('refreshLobbyList', getLobbyList());
                io.to(players[socket.playerID].lobbyID).emit('countdownFinished');
                callback('done');
            } else
                callback('notHost');
        else
            callback('notInLobby');
    });

    socket.on('getLobbyPlayers', (callback) => {
        callback(getLobbyPlayers(players[socket.playerID].lobbyID));
    });

    socket.on('lobbyHasStarted', (callback) => {
        if (isValidPlayerID(socket.playerID))
            if (inLobby(socket))
                callback(lobbies[players[socket.playerID].lobbyID].lobbyHasStarted);

        callback(false);
    });

    socket.on('gameHasStarted', (callback) => {
        if (isValidPlayerID(socket.playerID))
            if (inLobby(socket))
                callback(lobbies[players[socket.playerID].lobbyID].gameHasStarted);

        callback(false);
    });

    socket.on('checkHost', (callback) => {
        if (isValidPlayerID(socket.playerID))
            if (inLobby(socket))
                if (isHost(socket.playerID))
                    callback(true);

        callback(false);
    });

    socket.on('getGameData', (callback) => {
        if (isValidPlayerID(socket.playerID))
            if (inLobby(socket)) {
                let lobby = lobbies[players[socket.playerID].lobbyID];
                if (lobby.lobbyHasStarted) {
                    let gameData = {
                        'bunchSeed': lobby.bunchSeed,
                        'numPlayers': lobby.playerIDs.length,
                        'playerOrder': lobby.playerIDs.indexOf(socket.playerID) + 1
                    };

                    callback(gameData);
                } else
                    callback('notStarted');
            } else
                callback('notInLobby');
        else
            callback('thisID');
    });

    socket.on('readyToPlay', (callback) => {
        if (isValidPlayerID(socket.playerID))
            if (inLobby(socket)) {
                let lobby = lobbies[players[socket.playerID].lobbyID];
                if (lobby.lobbyHasStarted && !lobby.readyToPlay.includes(socket.playerID)) {
                    lobby.readyToPlay.push(socket.playerID);

                    if (lobby.readyToPlay.length === lobby.playerIDs.length) {
                        // Everyone is ready, inform the host client
                        let hostID = getHost(socket);
                        io.to(players[hostID].socket.id).emit('allReady');
                    }
                    callback('done');
                } else
                    callback('notStarted');
            } else
                callback('notInLobby');
        else
            callback('thisID');

    });

    socket.on('beginGameCountdown', () => {
        if (isValidPlayerID(socket.playerID))
            if (inLobby(socket))
                if (isHost(socket.playerID)) {
                    let lobby = lobbies[players[socket.playerID].lobbyID];

                    // 5 second countdown timer will begin, update the variable in slightly more than 5 seconds to account for ping
                    setTimeout(() => {
                        lobby.gameHasStarted = true;
                        io.to(lobby.id).emit('startGame');
                    }, 5250);

                    io.to(lobby.id).emit('beginCountdown');
                }
    });

    socket.on('disconnect', () => {
        if (socket.playerID !== undefined) {
            deletePlayerIDAfterDisconnect(socket);
            if (players[socket.playerID].lobbyID !== undefined)
                leaveLobbyAfterDisconnect(socket);
        }
        leaveWaitingList(socket);
    });
});
