var express = require("express");
var app = express();
var socket = require('socket.io');
app.configure(function(){
  app.use(express.static(__dirname + '/'));
});


/**
 * A setting, just one
 */

var port = process.env.PORT || 4000;

var server = app.listen(port);
var io = socket.listen(server);






io.sockets.on ('connection', function(socket) {
	socket.on ('drawClick', function(data){
		socket.broadcast.emit ('draw',({ x : data.x, y : data.y, type: data.type}))
	return});
return});