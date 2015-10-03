var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var port = Number(process.env.PORT || 5000);

app.use(express.static(__dirname + "/"));

io.set('log level', 1); // reduce logging
io.on('connection', function (socket){

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
	
	

	io.configure(function () {  
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});


	
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

});


http.listen(port, function(){
  console.log('listening on *:5000');
});
