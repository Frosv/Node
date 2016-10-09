var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function(server) {
  io = socketio.listen(server);
  io.set('log level', 1);
  io.sockets.on('connection', function(socket) {
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
    joinRoom(socket, 'Lobby');
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);
    socket.on('rooms', function() {
      socket.emit('rooms', io.sockets.manager.rooms);
    });
    handleClientDisconnection(socket, nickNames, namesUsed);
  });
};

// 随机赋予名字

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
  var name = 'Guest' + guestNumber;
  nickNames[socket.id] = name;
  socket.emit('nameResult', {
    success: true,
    name: name
  });
  namesUsed.push(name);
  return guestNumber + 1;
};

// 进入房间通知

function joinRoom(socket, room) {
  socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit('joinResult', { room: room });
  socket.broadcast.to(room).emit('messages', {
    text: nickNames[socket.id] + 'has joined' + room + '.'
  });
  var usersInRoom = io.socket.clients(room);
  if (usersInRoom.length > 1) {
    var usersInRoomSummary = 'Users currently in ' + room + ': ';
    for (var index in usersInRoom) {
      var userSocketId = usersInRoom[index].id;
      if (userSocketId != socket.id) {
        if (index > 0) {
          usersInRoomSummary += ', ';
        }
        usersInRoomSummary += nickNames[userSocketId];
      }
    }
    usersInRoomSummary += '.';
    socket.emit('messages',{text:usersInRoomSummary});
  }
};

//更名

function handleNameChangeAttempts(socket,nickNames,namesUsed){
  socket.on('nameAttempt',function(name){
    if(name.indexOf('Guest') == 0){
      socket.emit('nameResult',{
        success:false,
        messages:'Names cannot begin with "Guest".'
      });
    } else {
      if(namesUsed.indexOf(name) == -1){
        var previousName = nickNames[socket.id];
        var previousNameIndex = namesUsed.indexOf(previousName);
        namesUsed.push(name);
        nickNames[socket.id] = name;
        delete namesUsed[previousNameIndex];
        socket.emit('nameResult',{
          success:true,
          name:name
        });
        socket.broadcast.to(currentRoom[socket.id]).emit('messages',{
          text:previousName + 'is now known as ' + name +'.'
        });
      } else {
        socket.emit('nameResult',{
          success:false,
          messages: 'That name is already in use.'
        });
      }
    }
  });
};

//消息发送

function handleMessageBroadcasting(socket){
  socket.on('messages',function(messages){
    socket.boradcast.to(messages.room).emit('messages',{
      text:nickNames[socket.id]+': '+messages.text
    });
  });
};

//创建房间

function handleRoomJoining(socket){
  socket.on('join',function(room){
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket,room.newRoom);
  });
};

//用户断开连接

function handleClicentDisconnection(socket){
  socket.on('disconnecte',function(){
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  });
};
