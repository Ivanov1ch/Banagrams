const socket = io.connect('http://localhost:8000');

socket.emit('getPlayerID', window.localStorage.getItem('playerID'), (id) => {
    window.localStorage.setItem('playerID', id);
});

let lobbyLeaveInterval = setInterval(() => {
    if (window.localStorage.getItem('playerID') !== null) {
        socket.emit('syncPlayerID', window.localStorage.getItem('playerID'), true, () => {
        });
        clearInterval(lobbyLeaveInterval);
    }
}, 50);
