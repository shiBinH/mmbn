const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

var hostname;

if (process.env.NODE_ENV === 'production') hostname = 'lit-hollows-49930.herokuapp.com';
else hostname =  process.env.HOSTNAME || '192.168.1.6';
const port = process.env.PORT || 4000;


var players = [];


const server = http.createServer(function(req, res) {
	let url = req.url;
	let method = req.method;

	fs.readFile(url.substring(1), function(err, contents) {
		if (err) res.end('err:' + err);
		res.statusCode = 200;
		res.end(contents);
	})
});


const io = socketio(server);
io.on('connection', function(c) {
	console.log('server: connection established to "/"!')

	c.on('test_event', function(data) {
		console.log('server: test_event fired')
		console.log(c.rooms)
		c.emit('return_event', data);
	});
})

const testNS = io.of('/');
testNS.on('connection', function(c) {
	console.log('server: connected to "/" namespace');
	
	c.on('new_player', function(data) {
		c.join(data.room);
		for (var plyr in io.nsps['/'].adapter.rooms[data.room].sockets) {
			if (plyr === c.id) continue;
			c.emit('add_player', players[plyr.substring(plyr.indexOf('#')+1)]);
		}
				 
		players[data.player] = data;
		players[data.player].score = {current: 0, total: 0, wins: 0};
		c.to(data.room).emit('add_player', data);
		console.log(io.nsps['/'].adapter.rooms)
	});
	c.on('update', function(data) {
		c.emit('update_user', data);
		c.to(players[c.id.substring(c.id.indexOf('#')+1)].room).emit('update_user', data);
	});
	c.on('chat_msg', function(msg) {
		c.emit('chat_update', msg);
		c.to(players[c.id.substring(c.id.indexOf('#')+1)].room).emit('chat_update', msg)
	})
	c.on('disconnect', function(data) {
		c.to(players[c.id.substring(c.id.indexOf('#')+1)].room).emit('player_disconnect', c.id.substring(c.id.indexOf('#')+1));
	})
	c.on('death_update', function(dmg_from) {
		players[dmg_from].score.total++;
		players[dmg_from].score.current++;
		if (players[dmg_from].score.current >= 5) {
			players[dmg_from].score.wins++;
			var data = {player: dmg_from, scores:players[dmg_from].score}
			c.emit('victory', data);
			c.to(players[c.id.substring(c.id.indexOf('#')+1)].room).emit('victory', data);
			for (var plyr in io.nsps['/'].adapter.rooms[players[c.id.substring(c.id.indexOf('#')+1)].room].sockets) {
				players[plyr].score.current = 0;
			}
		} else {
			var data = {player: dmg_from, scores:players[dmg_from].score}
			c.emit('scoreboard_update', data);
			c.to(players[c.id.substring(c.id.indexOf('#')+1)].room).emit('scoreboard_update', data);
		}
	});
	c.on('reset_round', function(){
		for (var plyr in io.nsps['/'].adapter.rooms[players[c.id.substring(c.id.indexOf('#')+1)].room].sockets) {
			players[plyr].score.current = 0;
		}
		c.to(players[c.id.substring(c.id.indexOf('#')+1)].room).emit('new_round');
	})

});


if (process.env.NODE_ENV === 'production') server.listen(port);
else {
	server.listen(port, hostname, function() {
		console.log('server running on: ' + hostname + ':' + port)
	})
}


