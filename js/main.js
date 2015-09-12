'use strict';

var sendChannel = {};
var sendButton = document.getElementById("sendButton");
var sendTextarea = document.getElementById("dataChannelSend");
var receiveTextarea = document.getElementById("dataChannelReceive");

sendButton.onclick = sendData;

var allclientid = [];
var disclient;
var isChannelReady;
var isInitiator;
var isStarted;
var localStream;
var pc = {};
var remoteStream;
var turnReady;
var roominit;
var remotepeer;
var clientDetail = [];
var readyState = {};
var ClientConnect = false;


var pc_config = 
  {'iceServers': [{'url': 'stun:stun.l.google.com:19302'},
{
    url: 'turn:192.158.29.39:3478?transport=udp',
    credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    username: '28224511:1379330808'
}
  ]};
  
var pc_constraints = {
  'optional': [
    {'DtlsSrtpKeyAgreement': true},
    {'RtpDataChannels': true}
  ]};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {'mandatory': {
  'OfferToReceiveAudio':true,
  'OfferToReceiveVideo':true }};

/////////////////////////////////////////////

var room = location.pathname.substring(1);
if (room === '') {
room = prompt('Enter room name:');  
} 

var socket = io.connect();



if (room !== "") {
  console.log('Joining room ' + room);
  socket.emit('create or join', room);
  
}

socket.on('created', function (room, initiator){
  console.log('Created room ' + room);
  isInitiator = true;
  console.log('This peer is the initiator of room :' + room);
  roominit = initiator;
  console.log('room owner:' + roominit);
  isInitiator = true;
});

socket.on('full', function (room){
  console.log('Room ' + room + ' is full');
});


socket.on('join', function (room, peeremote){
  console.log('Another peer '+ peeremote+' made a request to join room ' + room);
   if (isInitiator) {
    socket.emit('initiator', roominit, room);
    isStarted = false;
  };
  remotepeer = peeremote;
  isChannelReady = true;
});

socket.on('initiator', function(initiator){
  console.log('client got initiator: ' + initiator);
  roominit = initiator;
});

socket.on('joined', function (room, yourid){
  console.log( yourid+'This peer has joined room ' + room);
  isChannelReady = true;
});

socket.on('log', function (array){
  console.log.apply(console, array);
});

socket.on('BecomeisInitiator', function(){ 
  isInitiator = true;
  console.log( socket.id+"is the Initiator");
  isStarted = false;
});



socket.on('totuser', function (totus){
  document.getElementById("totusers").innerHTML = totus + " User Online";
  
 }); 

socket.on('Disconnect peer', function(room, biru){
  //delete client(s) which disconnected from initiator's list
  if (isInitiator) {
    console.log(allclientid);
    disclient = biru;
    var i = allclientid.indexOf(disclient);
    if(i != -1) {
      allclientid.splice(i, 1);
    }
  
    handleRemoteHangup();
    $("#"+disclient).detach();
    socket.emit("numClient", room, (Object.keys(allclientid).length + 1));
    console.log(Object.keys(allclientid).length + 1);
    document.getElementById("totusers").innerHTML = (Object.keys(allclientid).length + 1) + " User Online";   
  };  
});

   

////////////////////////////////////////////////


socket.on('message', function (message){
if (!isInitiator && !ClientConnect){
    remotepeer = roominit;
    console.log("peeremote = roominit, room: " + remotepeer);
  };
  
  if (message === 'got user media' && !ClientConnect) {
	console.log('Received message:', message);
  	maybeStart();
  } else if (message.type === 'offer' && !ClientConnect) {
	console.log('Received message:', message);
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    pc[remotepeer].setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted && !ClientConnect ) {
	console.log('Received message:', message);
    pc[remotepeer].setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted && !ClientConnect) {
    var candidate = new RTCIceCandidate({sdpMLineIndex:message.label, candidate:message.candidate});
    pc[remotepeer].addIceCandidate(candidate);
	if (!isInitiator) {
      ClientConnect = true;
    }
  } /*else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }*/
});

////////////////////////////////////////////////////

var localVideo = document.querySelector('#localVideo');


function handleUserMedia(stream) {
  localStream = stream;
  attachMediaStream(localVideo, stream);
  console.log('Adding local stream.');
  sendMessage('got user media');
  if (isInitiator) {
    maybeStart();
  }
}

function handleUserMediaError(error){
  console.log('getUserMedia error: ', error);
}

var constraints = {video: true};

getUserMedia(constraints, handleUserMedia, handleUserMediaError);
console.log('Getting user media with constraints', constraints);


function sendMessage(message){
	console.log('Sending message: ', message);
  socket.emit('message', message, room);
}






function maybeStart() {
  if (!isStarted && localStream && isChannelReady) {
    console.log(isStarted + "," +isChannelReady);
  //if (!isStarted && isChannelReady) {
    console.log("maybestart tawwa untuk remotepeer :" + remotepeer);
    createPeerConnection();
    pc[remotepeer].addStream(localStream);
    isStarted = true;
    if (isInitiator) {
      doCall();
    }
  }
}

window.onbeforeunload = function(e){
	//sendMessage('bye');
	if (isInitiator){
		socket.emit('Disconnect peer',room,roominit);
	} else {
		socket.emit('Disconnect peer',room, socket.id);
	}
}

/////////////////////////////////////////////////////////

function sendData(data,typeSending,idDestination){
  console.log("delivery destination "+idDestination);
  switch (typeSending){
    case 'all':
      for (var i = 0; i < allclientid.length; i++) {
        if (allclientid[i] != idDestination) {
          sendChannel[allclientid[i]].send(data);  
        } 
      }
    break;
    case 'specific':
      sendChannel[idDestination].send(data); 
    break;
  }
};


function createPeerConnection() {
  console.log('createPeerConnection where the initiator is :'+ remotepeer );
  try {
    pc[remotepeer] = new RTCPeerConnection(pc_config, pc_constraints);
    pc[remotepeer].onicecandidate = handleIceCandidate;
    console.log('Created RTCPeerConnnection with:\n' +
      '  config: \'' + JSON.stringify(pc_config) + '\';\n' +
      '  constraints: \'' + JSON.stringify(pc_constraints) + '\'.');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
      return;
  }
  pc[remotepeer].onaddstream = handleRemoteStreamAdded;
  pc[remotepeer].onremovestream = handleRemoteStreamRemoved;

  if (isInitiator) {
    try {
      // Reliable Data Channels not yet supported in Chrome
      sendChannel[remotepeer] = pc[remotepeer].createDataChannel("sendDataChannel",
        {reliable: false});
      sendChannel[remotepeer].onmessage = handleMessage;
      trace('Created send data channel');
    } catch (e) {
      alert('Failed to create data channel. ' +
            'You need Chrome M25 or later with RtpDataChannel enabled');
      trace('createDataChannel() failed with exception: ' + e.message);
    }
    sendChannel[remotepeer].onopen = handleSendChannelStateChange;
    sendChannel[remotepeer].onclose = handleSendChannelStateChange;
  } else {
    pc[remotepeer].ondatachannel = gotReceiveChannel;
  }
}


function sendData() {
  var data = sendTextarea.value;
  sendChannel[remotepeer].send(data);
  trace('Sent data: ' + data);
}

// function closeDataChannels() {
//   trace('Closing data channels');
//   sendChannel.close();
//   trace('Closed data channel with label: ' + sendChannel.label);
//   receiveChannel.close();
//   trace('Closed data channel with label: ' + receiveChannel.label);
//   localPeerConnection.close();
//   remotePeerConnection.close();
//   localPeerConnection = null;
//   remotePeerConnection = null;
//   trace('Closed peer connections');
//   startButton.disabled = false;
//   sendButton.disabled = true;
//   closeButton.disabled = true;
//   dataChannelSend.value = "";
//   dataChannelReceive.value = "";
//   dataChannelSend.disabled = true;
//   dataChannelSend.placeholder = "Press Start, enter some text, then press Send.";
// }

function gotReceiveChannel(event) {
  trace('Receive Channel Callback');
  sendChannel[remotepeer] = event.channel;
  sendChannel[remotepeer].onmessage = handleMessage;
  sendChannel[remotepeer].onopen = handleReceiveChannelStateChange;
  sendChannel[remotepeer].onclose = handleReceiveChannelStateChange;
}

function handleMessage(event) {
  trace('Received message: ' + event.data);
  receiveTextarea.value = event.data;
}

function handleSendChannelStateChange() {
  readyState[remotepeer] = sendChannel[remotepeer].readyState;
  trace('Send channel state is: ' + readyState);
  enableMessageInterface(readyState == "open");
}

function handleReceiveChannelStateChange() {
  readyState[remotepeer] = sendChannel[remotepeer].readyState;
  trace('Receive channel ' +remotepeer+'state is: ' + readyState[remotepeer]);
  enableMessageInterface(readyState[remotepeer] == "open");
}

function enableMessageInterface(shouldEnable) {
    if (shouldEnable) {
    dataChannelSend.disabled = false;
    dataChannelSend.focus();
    dataChannelSend.placeholder = "";
    sendButton.disabled = false;
  } else {
    dataChannelSend.disabled = true;
    sendButton.disabled = true;
  }
}


////////////////////////////////////////////////////////////

function handleIceCandidate(event) {
  console.log('handleIceCandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate});
  } else {
    console.log('End of candidates.');
  }
}

function doCall() {
  var constraints = {'optional': [], 'mandatory': {'MozDontOfferDataChannel': true}};
  // temporary measure to remove Moz* constraints in Chrome
  if (webrtcDetectedBrowser === 'chrome') {
    for (var prop in constraints.mandatory) {
      if (prop.indexOf('Moz') !== -1) {
        delete constraints.mandatory[prop];
      }
     }
   }
  constraints = mergeConstraints(constraints, sdpConstraints);
  console.log('Sending offer to peer, with constraints: \n' +
    '  \'' + JSON.stringify(constraints) + '\'.');
  pc[remotepeer].createOffer(setLocalAndSendMessage, null, constraints);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc[remotepeer].createAnswer(setLocalAndSendMessage, null, sdpConstraints);
}

function mergeConstraints(cons1, cons2) {
  var merged = cons1;
  for (var name in cons2.mandatory) {
    merged.mandatory[name] = cons2.mandatory[name];
  }
  merged.optional.concat(cons2.optional);
  return merged;
}

function setLocalAndSendMessage(sessionDescription) {
  // Set Opus as the preferred codec in SDP if Opus is present.
  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
  pc[remotepeer].setLocalDescription(sessionDescription);
  sendMessage(sessionDescription);
}

function requestTurn(turn_url) {
  var turnExists = false;
  for (var i in pc_config.iceServers) {
    if (pc_config.iceServers[i].url.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turn_url);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
      	console.log('Got TURN server: ', turnServer);
        pc_config.iceServers.push({
          'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turn_url, true);
    xhr.send();
  }
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.' +remotepeer);
 if (isInitiator) {
    $("#remotev").append("<div id='"+remotepeer+"' class='remotex'><video id='client"+remotepeer+"' autoplay muted width='100%'></div>");
  } else {
    $("#remotev").append("<div id='"+remotepeer+"' class='remotex'><video id='client"+remotepeer+"' autoplay width='100%'></div>");
}

var remoteVideo = document.getElementById("client"+remotepeer);
 // reattachMediaStream(miniVideo, localVideo);
  attachMediaStream(remoteVideo, event.stream);
  remoteStream = event.stream;
//  waitForRemoteVideo();

}
function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log(disclient +'Session terminated.');
  stop();
  //isInitiator = false;
}

function stop() {
  //isStarted = false;
  // isAudioMuted = false;
  // isVideoMuted = false;
 console.log ('user_id yang keluar: ' +disclient);
  pc[disclient].close();
  pc[disclient] = null;
}

///////////////////////////////////////////

// Set Opus as the default audio codec if it's present.
function preferOpus(sdp) {
  var sdpLines = sdp.split('\r\n');
  var mLineIndex;
  // Search for m line.
  for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].search('m=audio') !== -1) {
        mLineIndex = i;
        break;
      }
  }
  if (mLineIndex === null) {
    return sdp;
  }

  // If Opus is available, set it as the default in m line.
  for (i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search('opus/48000') !== -1) {
      var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
      if (opusPayload) {
        sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
      }
      break;
    }
  }

  // Remove CN in m line and sdp.
  sdpLines = removeCN(sdpLines, mLineIndex);

  sdp = sdpLines.join('\r\n');
  return sdp;
}

function extractSdp(sdpLine, pattern) {
  var result = sdpLine.match(pattern);
  return result && result.length === 2 ? result[1] : null;
}

// Set the selected codec to the first in m line.
function setDefaultCodec(mLine, payload) {
  var elements = mLine.split(' ');
  var newLine = [];
  var index = 0;
  for (var i = 0; i < elements.length; i++) {
    if (index === 3) { // Format of media starts from the fourth.
      newLine[index++] = payload; // Put target payload to the first.
    }
    if (elements[i] !== payload) {
      newLine[index++] = elements[i];
    }
  }
  return newLine.join(' ');
}

// Strip CN from sdp before CN constraints is ready.
function removeCN(sdpLines, mLineIndex) {
  var mLineElements = sdpLines[mLineIndex].split(' ');
  // Scan from end for the convenience of removing an item.
  for (var i = sdpLines.length-1; i >= 0; i--) {
    var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
    if (payload) {
      var cnPos = mLineElements.indexOf(payload);
      if (cnPos !== -1) {
        // Remove CN payload from m line.
        mLineElements.splice(cnPos, 1);
      }
      // Remove CN line in sdp
      sdpLines.splice(i, 1);
    }
  }

  sdpLines[mLineIndex] = mLineElements.join(' ');
  return sdpLines;
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function DecodehtmlEntities(str) {
    return String(str).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}