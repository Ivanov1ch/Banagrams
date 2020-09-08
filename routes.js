function applyRoutes(app) {
    let basicRoutes = [['/', '/index.html'], ['/create', '/create.html'], ['/browse', '/browse.html'],
        ['/game', '/game.html'], ['/error', '/error.html'], ['/lobby', '/lobby.html'], ['/name', '/name.html']];

    basicRoutes.forEach((routeData) => {
        app.get(routeData[0], (req, res) => {
            res.sendFile(__dirname + '/html' + routeData[1]);
        });
    });
}

module.exports = applyRoutes;