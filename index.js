var path    = require('path');
var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);

var users = [];

var randomNickName = function() {
  name = "User" + Math.floor((Math.random() * 100) + 1);
  if (checkNickName(name)) {
    return name;
  }
  return randomNickName();
}

var checkNickName = function(nickName) {
  for (var i = users.length - 1; i >= 0; i--) {
    user = users[i];
    console.log('  check user nick name: ' + user.nickName);
    console.log('    same? ' + (user.nickName == nickName).toString());
    if (user.nickName == nickName) return false;
  };
  return true;
}

app.use("/js", express.static(__dirname + '/js'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.nickName = randomNickName();
  users.push(socket);
  console.log('new connection, random nick name is ' + socket.nickName + '.');
  socket.emit('temp nick name', socket.nickName);
  io.emit('chat message', socket.nickName + ' joined.');

  socket.on('disconnect', function(){
    console.log( socket.nickName + ' disconnected');
    users.splice(users.indexOf(socket), 1);
    io.emit('chat message', socket.nickName + ' leaved.');
  });

  socket.on('set nick name', function(newNickName){
    console.log(socket.nickName + ' want to change nick name to ' + newNickName);
    if (checkNickName(newNickName)) {
      io.emit('chat message', socket.nickName + ' changed nick name to: ' + newNickName);
      socket.nickName = newNickName;
      socket.emit('nick name changed');
      console.log('  change successed.');
    } else {
      socket.emit('nick name duplicated', '');
      console.log('  change failed.');
    }
  });

  socket.on('chat message', function(msg){
    socket.broadcast.emit('chat message', socket.nickName + ' say: ' + msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
