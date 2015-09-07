// RTC Peerconnection with signaling

// 1. Set a New Room :
	// 1.A Ask room name
var room = location.pathname.substring(1);
if (room === '') {
room = prompt('Enter room name:');
} 

var socket = io.connect();

if (room !== '') {
  console.log('Create or join room', room);
  socket.emit('create or join', room);
}
	// 1.B
	//Server Side Create Room
var socket = io.connect();

if (room !== '') {
  console.log('Create or join room', room);
  socket.emit('create or join', room);
}

if (numClients == 0){
			socket.join(room);
			socket.emit('created', room);
		}
 
   // Client Side create room
   
  socket.on('created', function (room){
  console.log('Created room ' + room);
  isInitiator = true;
});


//2. Adding Local Stream and Send Message

	//2.A Adding Local Stream
	
	