const config = require('./config')
const express = require('express')
const app = express();
const port = config.config.port;

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
});