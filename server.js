var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var chatServer = require('./lib/chat_server.js');
chatServer.listen(server);
var cache = {};


//辅助函数

function send404(response) {
  response.writeHead(404, { 'Content-Type': 'text/plain' });
  response.write('Error 404 : resource not found ');
  response.end();
};

function sendFile(response, filePath, fileContents) {
  response.writeHead(
    200, { "content-type": mime.lookup(path.basename(filePath)) }
  );
  response.end(fileContents);
};

function serveStatic(response, cache, absPath) {
  // console.log(absPath);
  if (cache[absPath]) {
    sendFile(response, absPath, cache[absPath]);
  } else {
    fs.exists(absPath, function(exists) {
      if (exists) {
        fs.readFile(absPath, function(err, data) {
          if (err) {
            send404(response);
          } else {
            cache[absPath] = data;
            sendFile(response, absPath, data);
          }
        });
      } else {
        // console.log(222);
        send404(response);
      }
    })
  }
};

//创建HTTP服务器

var server = http.createServer(function(request, response) {
  var filePath = false;
  if (request.url == '/') {
    filePath = 'public/index.html';
  } else {
    filePath = 'public' + request.url;
  }
  var absPath = './' + filePath;
  serveStatic(response, cache, absPath);
});

// listen

server.listen(3499, function() {
  console.log('ok');
})
