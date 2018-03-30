var socketIO;

module.exports = function (io) {
  socketIO = io;
};
function _sendMsgViaSocket(evt, msg){
    console.log('herrr4xxx');
    socketIO.emit(evt, msg);    
}

module.exports._sendMsgViaSocket = _sendMsgViaSocket;