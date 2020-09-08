const socket = io.connect('http://localhost:8000');

if (window.localStorage.getItem('playerID') === null)
    window.location.href = '/';
else {
    function fillPlayerList(playerData, readyToStart) {
        const list = $('#player-list');
        list.empty();

        for (let index = 0; index < playerData.length; index++) {
            if (index === 0) {
                list.append(`<li class="${playerData[index][2] ? '' : 'waiting'}"><span id="host-icon"><i class="fas fa-crown"></i></span>${playerData[index][1]} (Host)</li>`);

                // Are we the host?
                if (window.localStorage.getItem('playerID') === playerData[index][0]) {
                    let startButton = $('#start-button'), reasonForDisable = $('#reason-for-disable');
                    startButton.show();

                    // Are we ready to start?
                    startButton.prop('disabled', !readyToStart);

                    if (!readyToStart) {
                        reasonForDisable.show();
                        if (playerData.length >= 2 && playerData.length <= 8)
                            reasonForDisable.html('Please wait for all players to enter their names');
                        else
                            reasonForDisable.html('The game can only be played with 2-8 players!');
                    } else
                        reasonForDisable.hide();
                }
            } else
                list.append(`<li class="${playerData[index][2] ? '' : 'waiting'}">${playerData[index][1]}</li>`);
        }
    }

    socket.emit('syncPlayerID', window.localStorage.getItem('playerID'), false, (successful) => {
        if (!successful)
            window.location.href = '/';
        else
            socket.emit('inLobby', (inLobby) => {
                if (!inLobby) {
                    alert('Sorry, but you are not in a lobby!');
                    window.location.href = '/';
                } else {
                    // Enable the "Are you sure you want to leave?" box
                    window.onbeforeunload = () => {
                        return true
                    };

                    // Populate player names
                    socket.emit('getLobbyPlayers', (returnData) => {
                        fillPlayerList(returnData[0], returnData[1]);
                    });
                }
            });
    });


    socket.on('refreshNameList', (returnData) => {
        fillPlayerList(returnData[0], returnData[1]);
    });
}

const startGame = function () {
    socket.emit('startGame', window.localStorage.getItem('playerID'), (response) => {
        console.log(response);

        if(response === 'thisID') {
            alert('Sorry, but your playerID has been modified and is now invalid! Please rejoin the game.');
            // Disable the "Are you sure you want to leave?" box
            window.onbeforeunload = null;
            window.localStorage.clear();
            window.location.href = '/';
        }
    });
}