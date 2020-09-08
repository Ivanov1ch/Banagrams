$(document).ready(() => {
    let canvasCheckInterval = setInterval(() => {
        let canvas = $('canvas');
        if(canvas.length !== 0) {
            clearInterval(canvasCheckInterval);
            $('#canvas-container').prepend(canvas);
            startGame();
        }

    }, 100);
});