var SignalHub = require('signalhub');
var SimplePeer = require('simple-peer');
var myself = require('./myself')();
var postMessage = require('./post-message');

var hub = SignalHub(
  '192.155.85.161:9010',
  'universe'
);

// TODO - use actual pkf instead of name
var myPkf = myself.get('name');

var constructPeer = function (friend, initiator) {
  console.log('Constructing peer for', friend);
  var newPeer = new SimplePeer({ trickle: false, initiator: initiator });

  newPeer.on('error', function (err) { console.log(friend, 'error', err); });

  newPeer.on('connect', function () {
    console.log('Connected to', friend);
  });

  newPeer.on('data', function (data) {
    console.log('Got a message from', friend, ':', data);
    postMessage(data);
  });

  newPeer.on('signal', function (data) {
    console.log('Sending a', initiator ? 'initiator' : 'non-initiator', 'response to', friend);
    hub.broadcast('/' + friend, JSON.stringify({name: myPkf, data: data, initiator: initiator}));
  });

  return newPeer;
}

var registerPeer = function (data) {
  var friend = data.name;
  var signallingData = data.data;
  var initiator = data.initiator;
  var newPeer;

  if (friend == myPkf) {
    console.log('got a message from myself');
    return;
  }

  if (peers[friend]) {
    console.log("Found existing peer ", friend);
    if (initiator) {
      if (peers[friend].initiator) {
        console.log("Received intiator connection from", friend, ", cleaning up old initiator connection");
        delete peers[friend];
      }
    } else {
      if (peers[friend].initiator === false) {
        console.log("Received intiator connection from", friend, ", cleaning up old non-initiator connection");
        delete peers[friend];
      }
    }

    if (peers[friend]) {
      newPeer = peers[friend];
    }
  }

  if (!newPeer) {
    console.log("Created new peer for", friend);
    peers[friend] = newPeer = constructPeer(friend, !initiator)
  }

  newPeer.signal(signallingData);
};



var Signalling = {
  subscribe: function () {
    console.log('Subscribing to my own signalhub');
    console.log(myPkf);
    hub.subscribe('/' + myPkf)
      .on('data', function (data) {
        var initiator = JSON.parse(data).initiator;
        console.log(initiator ? 'Signal' : 'Response', 'in my channel from ' + JSON.parse(data).name);
        registerPeer(JSON.parse(data));
      });
  },

  registerWithFriends: function (friends) {
    console.log('Creating peers and publishing to signalhub for', friends.join(', '));
    friends.forEach(function (friend) {
      peers[friend] = constructPeer(friend, true);
    });
  }
};

module.exports = Signalling;
