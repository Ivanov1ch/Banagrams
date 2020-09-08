class BananagramsConfig {
    constructor(port) {
        this.port = port;
    }
}

module.exports = {config: new BananagramsConfig(8000)};
