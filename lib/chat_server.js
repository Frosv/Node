var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function(server) {
  // console.log(server);
  io = socketio.listen(server);
  // console.log(io);
  // io.set('log level', 1);
  // console.log('ok');
  io.on('connection', function(socket) {
    //bug socket.io的版本更新之后写法改变，需要重新制作
    // console.log('ok');
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
    joinRoom(socket, 'Lobby');
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);
      // console.log(io.sockets.adapter.rooms);
      // console.log(socket);
      // socket.emit('aaa',{aaa :socket});
    socket.on('rooms', function() {
      // console.log('rooms');
      socket.emit('rooms',io.sockets.adapter.rooms);
    });
    handleClicentDisconnection(socket, nickNames, namesUsed);
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
  // console.log(name);
  return guestNumber + 1;
};

// 进入房间通知

function joinRoom(socket, room) {
  socket.join(room);
  currentRoom[socket.id] = room;
  io.emit('joinResult', { room: room });
  socket.to(room).emit('message', {
    text: nickNames[socket.id] + ' has joined ' + room + '.'
  });
  // console.log(io.sockets);
  // var usersInRoom = io.sockets.clients();
  // console.log(io.sockets.adapter.sids);
  var usersInRoom = room;
  // console.log(usersInRoom);
  // console.log(usersInRoom);
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
    socket.emit('message', { text: usersInRoomSummary });
  }
};

//更名

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', function(name) {
    if (name.indexOf('Guest') == 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Names cannot begin with "Guest".'
      });
    } else {
      if (namesUsed.indexOf(name) == -1) {
        var previousName = nickNames[socket.id];
        var previousNameIndex = namesUsed.indexOf(previousName);
        namesUsed.push(name);
        nickNames[socket.id] = name;
        delete namesUsed[previousNameIndex];
        socket.emit('nameResult', {
          success: true,
          name: name
        });
        socket.to(currentRoom[socket.id]).emit('messages', {
          text: previousName + 'is now known as ' + name + '.'
        });
      } else {
        socket.emit('nameResult', {
          success: false,
          message: 'That name is already in use.'
        });
      }
    }
  });
};

//消息发送

function handleMessageBroadcasting(socket) {
  socket.on('message', function(message) {
    // console.log(nickNames[socket.id]);
    // console.log(currentRoom[socket.id]);
    // socket.to(currentRoom[socket.id]).emit('messages',{
    //   text: 'fuck' + nickNames[socket.id]
    // })
    console.log('ok');
    socket.to(message.room).emit('message', {
      text: nickNames[socket.id] + ': ' + message.text
    });
  });
};

//创建房间

function handleRoomJoining(socket) {
  socket.on('join', function(room) {
    socket.leave(currentRoom[socket.id]);
    // console.log(room);
    joinRoom(socket, room.newRoom);
  });
};

//用户断开连接

function handleClicentDisconnection(socket) {
  socket.on('disconnecte', function() {
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  });
};
