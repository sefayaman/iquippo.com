/**
 * 
 */

'use strict';

var socketIO;

module.exports = function (io) {
  socketIO = io;
};
function _sendAndUpdateViaSocket(evt, msg){
    console.log('socketCalled:- ',evt);
    socketIO.emit(evt, msg);    
}

module.exports._sendAndUpdateViaSocket = _sendAndUpdateViaSocket;