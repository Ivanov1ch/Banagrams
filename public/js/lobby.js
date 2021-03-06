const socket = io.connect('http://localhost:8000');
let isHost = false, timerInterval;

if (window.localStorage.getItem('playerID') === null)
    window.location.href = '/';
else {
    const fillPlayerList = (playerData, readyToStart) => {
        const list = $('#player-list');
        list.empty();

        for (let index = 0; index < playerData.length; index++) {
            let isMe = window.localStorage.getItem('playerID') === playerData[index][0];
            if (index === 0) {
                list.append(`<li class="${playerData[index][2] ? '' : 'loading-ellipsis'} ${isMe ? 'me' : ''}"><span id="host-icon" title="Lobby Host"><i class="fas fa-crown"></i></span>${playerData[index][1]}</li>`);

                // Are we the host?
                if (isMe) {
                    isHost = true;
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
                list.append(`<li class="${playerData[index][2] ? '' : 'loading-ellipsis'} ${isMe ? 'me' : ''}">${playerData[index][1]}</li>`);
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
                    socket.emit('getLobbyData', (playerNameData, lobbyName) => {
                        $('#lobby-title').html(lobbyName);
                        fillPlayerList(playerNameData[0], playerNameData[1]);
                    });
                }
            });
    });


    socket.on('refreshNameList', (returnData) => {
        fillPlayerList(returnData[0], returnData[1]);
    });

    socket.on('beginCountdown', () => {
        startCountdown();
    });

    socket.on('countdownCanceled', () => {
        clearInterval(timerInterval);
        $('#countdown-timer').hide();
    });

    socket.on('countdownFinished', () => {
        // Extract game data for this player and save it in localStorage
        socket.emit('getGameData', (returnData) => {
            window.onbeforeunload = null;

            if (typeof returnData === 'object') {
                let numPlayers = returnData.numPlayers;
                let playerOrder = returnData.playerOrder;
                let bunchSeed = returnData.bunchSeed;

                window.localStorage.setItem('numPlayers', numPlayers);
                window.localStorage.setItem('playerOrder', playerOrder);
                window.localStorage.setItem('bunchSeed', bunchSeed);

                window.location.href = '/game';
            } else {
                if (returnData === 'notStarted') {
                    // Game has not started, do nothing
                } else if (returnData === 'notInLobby')
                    alertAndRedirect('Sorry, but you are not in a lobby! Why not join one?', '/join')
                else {
                    window.localStorage.clear();
                    alertAndRedirect('Sorry, but there was a problem with your player ID!', '/')
                }
            }

        });

    })
}

const startGame = () => {
    socket.emit('checkIfReadyToStart', window.localStorage.getItem('playerID'), (response) => {
        if (response === 'ready') {
            socket.emit('startCountdown', (response2) => {
                if (response2 === 'done')
                    startCountdown();
            })

        } else if (response === 'thisID') {
            alert('Sorry, but your playerID has been modified and is now invalid! Please rejoin the game.');
            // Disable the "Are you sure you want to leave?" box
            window.onbeforeunload = null;
            window.localStorage.clear();
            window.location.href = '/';
        }
    });
}

const startCountdown = () => {
    $('#countdown-timer p span').html(5);
    $('#countdown-timer').show();
    $('#countdown-timer button').hide();
    $('#start-button').hide();

    if (isHost) {
        function cancelCountdown() {
            clearInterval(timerInterval);
            $('#countdown-timer').hide();
            $('#start-button').show();

            socket.emit('cancelCountdown', (response) => {
                console.log(response);
            });
        }

        $('#countdown-timer button').show();
        $('#countdown-timer button').bind('click', cancelCountdown);
    }
    let timesLooped = 0;
    timerInterval = setInterval(() => {
        timesLooped++;
        if (timesLooped > 5) {
            clearInterval(timerInterval);

            socket.emit('reportCountdownCompletion', (response) => {
                console.log(response);
            });

        } else
            $('#countdown-timer p span').html(5 - timesLooped);
    }, 1000);
}


