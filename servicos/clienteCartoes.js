var restify = require('restify-clients');

function cartoesClient() {
    this._cliente = restify.createJsonClient({
        url: 'http://localhost:3001'
    });
}

cartoesClient.prototype.autoriza = function(cartao, callback) {
    this._cliente.post('/cartoes/autoriza', cartao, callback);
}

module.exports = function() {
    return cartoesClient;
}
