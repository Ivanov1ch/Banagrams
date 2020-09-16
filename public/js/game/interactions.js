let tempNumPlayers, tempPlayerOrder, tempBunchSeed;
if (window.localStorage.getItem('playerID') === null)
    window.location.href = '/';
else {
    socket.emit('syncPlayerID', window.localStorage.getItem('playerID'), false, (successful) => {
        if (!successful)
            window.location.href = '/';
        else
            socket.emit('inLobby', (inLobby) => {
                if (!inLobby) {
                    alertAndRedirect('Sorry, but you are not in a lobby!', '/');
                } else {
                    socket.emit('lobbyHasStarted', (lobbyStarted) => {
                        if (!lobbyStarted) {
                            alertAndRedirect('Sorry, but this lobby has not started its game yet!', '/lobby')
                        } else {
                            socket.emit('gameHasStarted', (gameStarted) => {
                                if (gameStarted)
                                    alertAndRedirect('Sorry, but the game has already started!', '/')
                                else {
                                    // Enable the "Are you sure you want to leave?" box
                                    window.onbeforeunload = () => {
                                        return true
                                    };

                                    socket.emit('checkHost', (thisIsHost) => {
                                        isHost = thisIsHost;
                                        socket.emit('readyToPlay', (response) => {
                                            if (response !== 'done')
                                                alertAndRedirect('Sorry, something went wrong! Please try again!', '/');
                                        });
                                    });
                                }
                            });
                        }
                    });
                }
            });
    });

    socket.on('allReady', () => {
        if (isHost) {
            socket.emit('beginGameCountdown');
        }
    });

    socket.on('beginCountdown', () => {
        $('.overlay-title').first().hide();
        $('#countdown').html('5');
        $('#countdown').show();

        let timesLooped = 0;
        timerInterval = setInterval(() => {
            timesLooped++;
            if (timesLooped === 5) {
                clearInterval(timerInterval);
            } else
                $('#countdown').html(5 - timesLooped);
        }, 1000);
    });

    socket.on('startGame', () => {
        hideOverlay();
        startGame();
        $('canvas').show();
    });

    socket.on('mismatchFound', (playerName) => {
        window.onbeforeunload = null;
        alertAndRedirect(`Sorry, but ${playerName}'s bunch has been altered! The lobby is now closing...`, '/')
    });

    $(document).ready(() => {
        $('#countdown').hide();

        const canvasCheckInterval = setInterval(() => {
            let canvas = $('canvas');
            if (canvas.length !== 0) {
                clearInterval(canvasCheckInterval);
                $('#canvas-container').prepend(canvas);
                canvas.hide();
            }
        }, 100);

        // Wait for player_data_validation to complete
        const dataValidationInterval = setInterval(() => {
            if (isHost !== null) {
                clearInterval(dataValidationInterval);

                if (typeof isHost !== 'boolean') {
                    window.onbeforeunload = null;
                    alertAndRedirect('Sorry, something went wrong!', '/');
                }
            }
        }, 100);
    });

    socket.on('win', (winnerID, winnerName) => {
        window.onbeforeunload = null;
        alertAndRedirect(winnerID === window.localStorage.getItem('playerID') ? 'You won!' : `${winnerName} won!`, '/')
    })

    const hideOverlay = () => {
        $('#overlay').hide();
    }
}