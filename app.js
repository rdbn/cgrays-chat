#!/usr/bin/env node
var app = require('http').createServer(function (request, response) {
    response.writeHead(200);
    response.end();
});
var open = require('amqplib').connect('amqp://cgrays:cgrays@localhost');
var io = require('socket.io')(app);

app.listen('8080', 'localhost');

var
    redis = require('redis'),
    client = redis.createClient();

client.on("error", function (error) {
    console.log("Error: " + error);
});

/**
 * Socket for send message user
 * */
io.of('/chat')
    .on('connection', function (socket) {
        socket.on('message', function (data) {
            try {
                client.lpush('chat', JSON.stringify(data));
                socket.emit('message', data);
            } catch (e) {
                console.log(e)
            }
        });

        socket.on('disconnect', function () {
            console.log('User disconnect');
        })
    });

io.of('/isOnline')
    .on('connection', function (socket) {
        socket.on('isOnline', function (data) {
            try {
                socket.username = data.username;
                data.is_online = true;

                open.then(function(conn) {
                    var ok = conn.createChannel();
                    ok = ok.then(function(ch) {
                        ch.assertQueue('is_online_user');
                        ch.sendToQueue('is_online_user', new Buffer(JSON.stringify(data)));
                    });

                    return ok;
                }).then(null, console.warn);
            } catch (e) {
                console.log(e)
            }
        });

        socket.on('disconnect', function () {
            console.log('User disconnect');
            try {
                var data = {
                    username: socket.username,
                    is_online: false
                };

                open.then(function(conn) {
                    var ok = conn.createChannel();
                    ok = ok.then(function(ch) {
                        ch.assertQueue('is_online_user');
                        ch.sendToQueue('is_online_user', new Buffer(JSON.stringify(data)));
                    });

                    return ok;
                }).then(null, console.warn);
            } catch (e) {
                console.log(e)
            }
        })
    });
