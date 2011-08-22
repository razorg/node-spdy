var net = require('net');
var zlib = require('zlib');
var util = require('util');
var Parser = require('./parser').Parser;

var Server = exports.Server = function () {
	if (!(this instanceof Server))
		throw Error('not called with new');
	
	net.Server.call(this);
	this.allowHalfOpen = true;
	this.on('connection', function (sock) {
		sock.allowHalfOpen = true;
		var parser = new Parser(sock);
		parser.on('ping', function (frame) {
			console.log('i got pinged!');
			sock.write(frame.data());
			sock.end();
		});
	});
}

util.inherits(Server, net.Server);