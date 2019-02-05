var myVideoArea = document.querySelector("#myVideoTag");
var theirVideoArea = document.querySelector("#theirVideoTag");
var startChatBtn = document.querySelector('#start-chat');
var msgSection = document.querySelector('#msg-section');
var sendMsgButton = document.querySelector('#send-msg');
var msgInput = document.querySelector('#msg-input');
var videoBtn = document.querySelector('#start-video-btn');
var streamArea = document.querySelector('#stream-area');
var ROOM = "chat";
var SIGNAL_ROOM = "signal_room";
var configuration = {
    'iceServers': [{
        'url': 'stun:stun.l.google.com:19302'
    }]
};
var rtcPeerConn;

var socket = io();
socket.emit('ready');

socket.on('set-rooms', function (data) {
    ROOM = data.chatRoom;
    SIGNAL_ROOM = data.signalRoom
    socket.emit('signal', { type: 'initial-message', room: SIGNAL_ROOM });
})
socket.on('signaling_message', function (data) {
    if (!rtcPeerConn)
        startSignaling();
    if (data.type != "initial-message") {
        var message = JSON.parse(data.message);
        if (message.sdp) {
            rtcPeerConn.setRemoteDescription(new RTCSessionDescription(message.sdp), function () {
                if (rtcPeerConn.remoteDescription.type == 'offer') {
                    rtcPeerConn.createAnswer(sendLocalDesc, logError);
                }
            }, logError);
        }
        else {
            rtcPeerConn.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
    }

});

function startSignaling() {
    rtcPeerConn = new webkitRTCPeerConnection(configuration);
    // send any ice candidates to the other peer
    rtcPeerConn.onicecandidate = function (evt) {
        if (evt.candidate)
            socket.emit('signal', { "type": "ice candidate", "message": JSON.stringify({ 'candidate': evt.candidate }), "room": SIGNAL_ROOM });
        console.log('emitted ice candidate')
    };
    rtcPeerConn.onnegotiationneeded = function () {

        rtcPeerConn.createOffer(sendLocalDesc, logError);
    }
    // once remote stream arrives, show it in the remote video element
    rtcPeerConn.onaddstream = function (evt) {
        theirVideoArea.srcObject = evt.stream;
        if (!myVideoArea.srcObject) {
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
            navigator.getUserMedia({
                'audio': true,
                'video': {
                    width: { min: 320, max: 320 },
                    height: { min: 240, max: 240 }
                }
            }, function (stream) {
                console.log(stream);
                myVideoArea.srcObject = stream;
                rtcPeerConn.addStream(stream);
            }, logError);
        }
        videoBtn.style.display = "none";
        streamArea.style.display = "block";
    };
}

function sendLocalDesc(desc) {
    rtcPeerConn.setLocalDescription(desc, function () {
        socket.emit('signal', { "type": "SDP", "message": JSON.stringify({ 'sdp': rtcPeerConn.localDescription }), "room": SIGNAL_ROOM });
    }, logError);
}

socket.on('message', function (data) {
    addIncommingMessage(data.message)
})

function logError(error) {
    console.log(error.name + ': ' + error.message);
}

function addIncommingMessage(msg) {
    var newMessage = document.createElement('div');
    newMessage.className = 'incoming_msg';
    var messageContainer = document.createElement('div');
    messageContainer.className = 'received_msg';
    var message = document.createElement('p');
    message.innerHTML = msg;
    messageContainer.appendChild(message);
    newMessage.appendChild(messageContainer);
    msgSection.appendChild(newMessage);
}

function addOutgoingMessage(msg) {
    var newMessage = document.createElement('div');
    newMessage.className = 'outgoing_msg';
    var messageContainer = document.createElement('div');
    messageContainer.className = 'sent_msg';
    var message = document.createElement('p');
    message.innerHTML = msg;
    messageContainer.appendChild(message);
    newMessage.appendChild(messageContainer);
    msgSection.appendChild(newMessage);
}
sendMsgButton.addEventListener('click', function (event) {
    var msg = msgInput.value;
    socket.emit('send', { room: ROOM, message: msg })
    addOutgoingMessage(msg)
    msgInput.value = null;
    event.preventDefault();
})
msgInput.addEventListener('keyup', function (event) {
    if (event.keyCode == 13) {
        sendMsgButton.click();
    }
})
videoBtn.addEventListener('click', function (event) {
    videoBtn.style.display = "none";
    streamArea.style.display = "block";
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    navigator.getUserMedia({
        'audio': true,
        'video': {
            width: { min: 320, max: 320 },
            height: { min: 240, max: 240 }
        }
    }, function (stream) {
        myVideoArea.srcObject = stream;
        rtcPeerConn.addStream(stream);
    }, logError);


})


