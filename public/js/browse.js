const socket = io.connect('http://localhost:8000');

if (window.localStorage.getItem('playerID') === null)
    window.location.href = '/';
else
    socket.emit('syncPlayerID', window.localStorage.getItem('playerID'), true, (successful) => {
        if (!successful)
            window.location.href = '/';
    })

$(document).ready(() => {
    socket.emit('joinWaitingList', () => {
        populateLobbies();

        socket.on('refreshLobbyList', refreshLobbies);
    });
});

function populateLobbies() {
    socket.emit('getLobbyList', (lobbies) => {
        refreshLobbies(lobbies);
    });
}

function refreshLobbies(lobbies) {
    const list = $('#game-list');
    list.empty();

    if (lobbies.length === 0)
        list.append('<li>No open games found! Why not <a href="/create">make one</a>?</li>')

    for (let index in lobbies) {
        if (lobbies.hasOwnProperty(index)) {
            let lobbyData = lobbies[index];
            list.append(`<li><a href="javascript:void(0)" onclick="joinGame('${lobbyData.id}')">${lobbyData.name}</a>, ${lobbyData.players}/${lobbyData.size} players</li>`)
        }
    }
}

function joinGame(lobbyID) {
    socket.emit('joinLobby', lobbyID, (response) => {
        if (response === 'done') {
            window.location.href = '/name';
        } else
            console.log(response);
    });
}