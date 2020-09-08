const socket = io.connect('http://localhost:8000');

if (window.localStorage.getItem('playerID') === null)
    window.location.href = '/';
else
    socket.emit('syncPlayerID', window.localStorage.getItem('playerID'), false, (successful) => {
        if (!successful)
            window.location.href = '/';
        else
            socket.emit('inLobby', (inLobby) => {
                if (!inLobby) {
                    alert('Sorry, but you must be in a lobby to set your name!');
                    window.location.href = '/';
                } else {
                    socket.emit('causeLobbyRefresh');
                }
            });
    })

function submitForm() {
    let name = $('#name').val();

    if (name.length > 0)
        socket.emit('setName', name, (response) => {
            if (response === 'done')
                window.location.href = '/lobby'
            // Log out reason for error, should be replaced with a more permanent solution later
            else
                console.log(response);
        });
}