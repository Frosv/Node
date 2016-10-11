//可疑文本
function divEscapedContentElement(message){
  return $('<div></div>').text(message);
};

//可信文本

function divSystemContentElement(message){
  return $('<div></div>').html('<i>'+ message +'</i>');
};

//处理用户输入

function processUserInput(chatApp,socket){
  var message = $('#sendMessage').val();
  var systemMessage;
  if(message.charAt(0) == '/'){
    systemMessage = chatApp.processCommand(message);
    if(systemMessage){
      $('#messages').append(divSystemContentElement(systemMessage));
    }
  }else {
    chatApp.sendMessage($('#room').text(),message);
    $('#messages').append(divEscapedContentElement(message));
    $('#messages').scrollTop($('#messages').prop('scrollHeight'));
  }
  $('#sendMessage').val('');
};

//初始化

// console.log(io.connect);

var socket = io.connect();

$(document).ready(function(){
  // console.log(socket);
  var chatApp = new Chat(socket);
  socket.on('nameResult',function(result){
  // console.log(result);
    var message;
    //连接成功
    if(result.success){
      message = 'You are now known as ' + result.name + '.';
    }else {
      message = result.message;
    }
    $('#messages').append(divSystemContentElement(message));
  });
  socket.on('joinResult',function(result){
    // console.log(result);
    $('#room').text(result.room);
    $('#messages').append(divSystemContentElement('Room changed.'));
  });
  //接收消息
  socket.on('message',function(message){
    // console.log('ok');
    // console.log(message);
    var newElement = $('<div></div>').text(message.text);
    $('#messages').append(newElement);
  });
  //获取房间列表
  socket.on('rooms',function(rooms){
    // console.log('ok');
    $('#roomList').empty();
    for(var room in rooms){
      room = room.substring(0,room.length);
      // console.log(room);
      if(room != ''){
        $('#roomList').append(divEscapedContentElement(room));
      }
    }

    $('#roomList div').on('click',function(){
      chatApp.processCommand('/join ' + $(this).text());
      $('#sendMessage').focus();
    });
  });

  setInterval(function(){
    // console.log('post');
    socket.emit('rooms');
  },1000);

  // setInterval(function(){
  //   console.log('set');
  // },1000);

  $('#sendMessage').focus();

  // socket.on('aaa',function(socket){
  //   console.log(socket);
  // })
  // console.log(socket);
  $('#sendForm').submit(function(){
    processUserInput(chatApp,socket);
    return false;
  });
});
