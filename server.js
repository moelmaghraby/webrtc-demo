var express = require('express');
const uuidv1 = require('uuid/v1');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var PORT = 3000;
app.use(express.static(__dirname + '/public'));

var chatRoom = uuidv1();
var signalRoom = uuidv1();

http.listen(PORT);

io.on('connection',socket =>{
    socket.on('ready', function(req) {
        var room = io.sockets.adapter.rooms[chatRoom];
        if(room && room.length > 1){
            chatRoom = uuidv1();
            signalRoom = uuidv1();
        }
        socket.join(chatRoom);
        socket.join(signalRoom);
        io.in(signalRoom).emit('set-rooms',{chatRoom,signalRoom});
    }) 
    
    socket.on('send', function(req) {
        socket.to(req.room).broadcast.send( {
            message: req.message
        });
    })
    
    socket.on('signal', function(req) {
        socket.to(req.room).emit('signaling_message', {
            type: req.type,
            message: req.message
        });
    })
})




