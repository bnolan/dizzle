var SimplePeer = require('simple-peer')

var peer1 = new SimplePeer({ initiator: true })

window.deets = [];

peer1.on('signal', function (data) {
  console.log(data);
  window.deets.push(data);
})