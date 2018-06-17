module.exports = function(app) {
    app.get('/pagamentos', function(req, res) {
        console.log('Recebido requisicao de teste na porta 3000.');
        var connection = app.persistencia.connectionFactory();

        connection.query('SELECT * from pagamentos', function(err, rows) {
          res.json(rows);
          console.log('Requisição recebida!');
        });

    });

    app.delete('/pagamentos/pagamento/:id', function(req, res) {
        var pagamento = {};
        var id = req.params.id;

        pagamento.id = id;
        pagamento.status = 'CANCELADO';

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.PagamentoDao(connection);

        pagamentoDao.atualiza(pagamento, function(error) {
            if (error) {
                res.status(500).send(error);
                return;
            }
            console.log('pagamento cancelado!');
            res.status(204).send(pagamento);
        });
    });

    app.put('/pagamentos/pagamento/:id', function(req, res) {
        var pagamento = {};
        var id = req.params.id;

        pagamento.id = id;
        pagamento.status = 'CONFIRMADO';

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.PagamentoDao(connection);

        pagamentoDao.atualiza(pagamento, function(error) {
            if (error) {
                res.status(500).send(error);
                return;
            }
            console.log('pagamento confirmado!');
            res.send(pagamento);
        });
    });

    app.post('/pagamentos/pagamento', function(req, res) {

        req.assert("pagamento.forma_de_pagamento", "Forma de pagamento é obrigatório").notEmpty();
        req.assert("pagamento.valor", "Valor obrigatório e deve ser um decimal").notEmpty().isFloat();

        var errors = req.validationErrors();
        if (errors) {
            console.log('Erros de validação encontrados!');
            res.status(400).send(errors);
            return;
        }

        var pagamento = req.body["pagamento"];
        console.log('processando uma requisicao de um novo pagamento');

        pagamento.status = 'CRIADO';
        pagamento.data = new Date;

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.PagamentoDao(connection);

        pagamentoDao.salva(pagamento, function(error, resultado) {
            if (error) {
                console.log('Erro ao inserir no banco: ' + error);
                res.status(500).send(error);
            } else {
                pagamento.id = resultado.insertId;
                console.log('pagamento criado');

                if (pagamento.forma_de_pagamento == 'cartao') {
                    var cartao = req.body["cartao"];
                    console.log(cartao);

                    var clienteCartoes = new app.servicos.clienteCartoes();
                    clienteCartoes.autoriza(cartao, function(exception, request, response, retorno) {
                        if(exception){
                          console.log(exception);
                          res.status(400).send(exception);
                          return;
                        }
                        console.log(retorno);

                        res.location('/pagamentos/pagamento/' + pagamento.id);

                        var response = {
                            dados_do_pagamento: pagamento,
                            cartao: retorno,
                            links: [{
                                    href: "http://localhost:3000/pagamentos/pagamento/" + pagamento.id,
                                    rel: "confirmar",
                                    method: "PUT"
                                },
                                {
                                    href: "http://localhost:3000/pagamentos/pagamento/" + pagamento.id,
                                    rel: "cancelar",
                                    method: "DELETE"
                                }
                            ]
                        }

                        res.status(201).json(response);
                        return;
                    });

                } else {
                    res.location('/pagamentos/pagamento/' + pagamento.id);

                    var response = {
                        dados_do_pagamento: pagamento,
                        links: [{
                                href: "http://localhost:3000/pagamentos/pagamento/" + pagamento.id,
                                rel: "confirmar",
                                method: "PUT"
                            },
                            {
                                href: "http://localhost:3000/pagamentos/pagamento/" + pagamento.id,
                                rel: "cancelar",
                                method: "DELETE"
                            }
                        ]
                    }
                    res.status(201).json(response);
                }
            }
        });
    });
}
