var express = require('express');
var app = express();
var socket = require('socket.io');
var port = process.env.PORT || 4000;

app.configure(function(){
  app.use(express.static(__dirname + '/'));
});

var server = app.listen(port);
var io = socket.listen(server);


io.sockets.on('connection', function (socket){

  socket.on('message', function (message,room) {
		socket.broadcast.to(room).emit('message', message); // should be room only
	});
	socket.on('initiator', function (initiator ,room){
		socket.broadcast.to(room).emit('initiator', initiator);
	});
	socket.on('Disconnect peer', function (room){
		socket.broadcast.to(room).emit('Disconnect peer',room, socket.id);
		console.log("peer "+socket.id+" Disconnect");
	});
	//socket.on('numClient', function (room, jumlahclient){
	//	socket.broadcast.to(room).emit('numClient', jumlahclient);
	//	console.log("cliet out. number of client "+jumlahclient+" and room "+room);
	//});
	
	
	socket.on('create or join', function (room) {
	
		var numClients = io.sockets.clients(room).length;

		if ( numClients == 0){
			console.log("initiator");
			socket.join(room);
			socket.emit('created', room, socket.id);
		} else { 
			io.sockets.in(room).emit('join', room, socket.id);
			socket.join(room);
			socket.emit('joined', room, socket.id);
		}
		console.log("Client "+socket.id+" request to join room "+room);
		var numClients = io.sockets.clients(room).length;
		console.log("Number of client room "+room+": "+ numClients);
		socket.broadcast.to(room).emit('totuser', numClients);
	});

return});



