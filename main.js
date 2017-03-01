const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

console.log(process.env)
const hostname = process.env.HOSTNAME || 'lit-hollows-49930' || '192.168.1.6';
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

const testNS = io.of('/a');
testNS.on('connection', function(c) {
	console.log('server: connected to /a namespace');

	c.join('1', function(err){});
	for (var plyr in io.nsps['/a'].adapter.rooms['1'].sockets) {
		if (plyr === c.id) continue;
		c.emit('add_player', players[plyr.substring(plyr.indexOf('#')+1)]);
	}
	c.on('new_player', function(data) {
		players[data.player] = data;
		testNS.emit('add_player', data);
	});
	c.on('update', function(data) {
		testNS.emit('update_user', data);
	});
	c.on('disconnect', function(data) {
		testNS.emit('player_disconnect', c.id.substring(c.id.indexOf('#')+1));
	})

});



server.listen(port, hostname, function() {
	console.log('server running on: ' + hostname + ':' + port)
})


