const socket = io.connect('http://localhost:8000');

if (window.localStorage.getItem('playerID') === null)
    window.location.href = '/';
else
    socket.emit('syncPlayerID', window.localStorage.getItem('playerID'), true, (successful) => {
        if (!successful)
            window.location.href = '/';
    })

function submitForm() {
    let serialized = $('#lobby-creation-form').serialize()
    let size = serialized.split('size')[1].substring(1).split('&')[0];
    let name = $('#lobby_name').val();

    let sizeNum = parseInt(size);
    if (!isNaN(sizeNum) && sizeNum >= 2 && sizeNum <= 8) {
        socket.emit('createLobby', name, sizeNum, (response) => {
            if (response === 'done')
                window.location.href = '/name'
            // Log out reason for error, should be replaced with a more permanent solution later
            else
                console.log(response);
        });
    }
}