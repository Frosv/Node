// 初始化
var Chat = function(socket) {
  this.socket = socket;
};

//消息发送

Chat.prototype.sendMessage = function(room, text) {
  var message = {
    room: room,
    text: text
  };
  this.socket.emit('message', message);
};

//变更房间

Chat.prototype.changeRoom = function(room) {
  console.log(room);
  this.socket.emit('join', {
    newRoom: room
  });
};

//处理聊天命令

Chat.prototype.processCommand = function(command) {
  var words = command.split(' ');
  var command = words[0].substring(1, words[0].length).toLowerCase();
  var messages = false;
  switch (command) {
    case 'join':
      words.shift();
      var room = words.join(' ');
      this.changeRoom(room);
      break;
    case 'nick':
      words.shift();
      var name = words.join(' ');
      this.socket.emit('nameAttempt', name);
      break;
    default:
      messages = 'Unrecognized command.'
      break;
  }
  return messages;
}
